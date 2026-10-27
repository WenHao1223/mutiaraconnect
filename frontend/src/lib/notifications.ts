import notificationData from "@/data/notifications.json";
import { newId, readJson, writeJson } from "@/lib/admin/store";
import type { AccountNotification } from "@/types/notification";

/**
 * MOCK ACCOUNT NOTIFICATIONS (frontend only, no backend).
 * Keep the bundled examples and locally created events together, with separate read state
 * for each account. A future backend must enforce recipient access; this filtering only
 * supports the demo UI because bundled JSON and localStorage are accessible in the browser.
 */
const NOTIFICATIONS_KEY = "mutiaraconnect.notifications";
const READ_KEY_PREFIX = "mutiaraconnect.notifications.read.";
const NOTIFICATIONS_EVENT = "mutiaraconnect:notifications-changed";
const seed: AccountNotification[] = notificationData as AccountNotification[];
const normalize = (recipient: string) => recipient.trim().toLowerCase();
const readKey = (recipient: string) => `${READ_KEY_PREFIX}${encodeURIComponent(normalize(recipient))}`;

function notifyNotificationsChanged(): void {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT));
    }
}

/** Notifications belonging to one account, newest first. Guests receive an empty list. */
export function notificationsFor(recipient?: string): AccountNotification[] {
    const key = recipient ? normalize(recipient) : "";
    if (!key) return [];
    const created = readJson<AccountNotification[]>(NOTIFICATIONS_KEY, []);
    return [...seed, ...created]
        .filter((item) => normalize(item.recipient) === key)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export type NewNotificationInput = Omit<AccountNotification, "id" | "createdAt" | "example">;

/** Record an event snapshot; later edits to its source record do not rewrite the message. */
export function createNotification(input: NewNotificationInput): AccountNotification | undefined {
    const recipient = normalize(input.recipient);
    if (!recipient) return undefined;
    const notification: AccountNotification = {
        ...input,
        recipient,
        id: newId("NT"),
        createdAt: new Date().toISOString(),
    };
    const created = readJson<AccountNotification[]>(NOTIFICATIONS_KEY, []);
    writeJson(NOTIFICATIONS_KEY, [...created, notification]);
    notifyNotificationsChanged();
    return notification;
}

/** Each account has its own storage key, including on devices shared by demo users. */
export function readNotificationIds(recipient?: string): string[] {
    if (!recipient?.trim()) return [];
    return readJson<string[]>(readKey(recipient), []);
}

/** Only IDs belonging to this recipient can be marked as read. */
function saveReadIds(recipient: string, ids: string[]): string[] {
    if (!recipient.trim()) return [];
    const ownedIds = new Set(notificationsFor(recipient).map((item) => item.id));
    const next = [...new Set(ids.filter((id) => ownedIds.has(id)))];
    writeJson(readKey(recipient), next);
    notifyNotificationsChanged();
    return next;
}

export function markNotificationRead(recipient: string, id: string): string[] {
    return saveReadIds(recipient, [...readNotificationIds(recipient), id]);
}

export function markNotificationUnread(recipient: string, id: string): string[] {
    return saveReadIds(recipient, readNotificationIds(recipient).filter((item) => item !== id));
}

/** Marks this account's current inbox read without affecting any other account. */
export function markAllNotificationsRead(recipient: string): string[] {
    return saveReadIds(recipient, notificationsFor(recipient).map((item) => item.id));
}

/** Refresh subscribers after inbox/read-state changes in this tab or other browser tabs. */
export function subscribeNotifications(listener: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handleStorage = (event: StorageEvent) => {
        if (!event.key || event.key === NOTIFICATIONS_KEY || event.key.startsWith(READ_KEY_PREFIX)) {
            listener();
        }
    };
    window.addEventListener(NOTIFICATIONS_EVENT, listener);
    window.addEventListener("storage", handleStorage);
    return () => {
        window.removeEventListener(NOTIFICATIONS_EVENT, listener);
        window.removeEventListener("storage", handleStorage);
    };
}
