import { Link } from "react-router-dom";
import { ArrowUpRight, FileCheck2, ShieldCheck, Store, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markNotificationRead, markNotificationUnread } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { PATHS } from "@/routes";
import type { AccountNotification } from "@/types/notification";
import type { AppUser } from "@/types/user";

const categories = {
    tickets: { label: "Ticket", icon: Ticket },
    application: { label: "Business application", icon: FileCheck2 },
    business: { label: "Business premise", icon: Store },
    settings: { label: "Account security", icon: ShieldCheck },
};

function destinationFor(notification: AccountNotification, user: AppUser) {
    switch (notification.destination) {
        case "tickets": return notification.referenceId
            ? { path: `${PATHS.profileTickets}?ticket=${encodeURIComponent(notification.referenceId)}`, label: "View ticket" }
            : { path: PATHS.profileTickets, label: "View my tickets" };
        case "application": return { path: PATHS.profileBusiness, label: "View applications" };
        case "business": {
            if (user.role !== "business_premise") return { path: PATHS.profileBusiness, label: "View my premises" };
            if (notification.type.startsWith("support_") && notification.referenceId) {
                return { path: `${PATHS.businessDashboard}?request=${encodeURIComponent(notification.referenceId)}`, label: "View support request" };
            }
            return { path: PATHS.businessDashboard, label: "View business dashboard" };
        }
        case "settings": return { path: PATHS.profileSettings, label: "View account settings" };
    }
}

interface NotificationItemProps {
    notification: AccountNotification;
    user: AppUser;
    isUnread: boolean;
    compact?: boolean;
    onOpen?: () => void;
}

/** Shared by the navbar preview and the full account inbox. */
export default function NotificationItem({ notification, user, isUnread, compact = false, onOpen }: NotificationItemProps) {
    const recipient = user.email ?? user.ic ?? user.name;
    const category = categories[notification.destination];
    const Icon = category.icon;
    const destination = destinationFor(notification, user);

    return (
        <article className={cn("flex gap-3 px-4 py-4 transition-colors", isUnread && "bg-primary/5", !compact && "sm:gap-4 sm:px-6 sm:py-5")}>
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{category.label}</span>
                    {notification.example && <span className="rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">Example scenario</span>}
                    {isUnread && <span className="ml-auto size-2 shrink-0 rounded-full bg-hazard" aria-label="Unread" />}
                </div>
                <h3 className={cn("mt-1 text-sm leading-snug", isUnread ? "font-semibold" : "font-medium")}>{notification.title}</h3>
                <p className={cn("mt-1 break-words text-sm leading-relaxed text-muted-foreground", compact && "line-clamp-2 text-xs")}>{notification.body}</p>
                <time dateTime={notification.createdAt} className="mt-2 block text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" })} MYT
                </time>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <Link
                        to={destination.path}
                        className="inline-flex min-h-8 items-center gap-1 rounded text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`${destination.label}: ${notification.title}`}
                        onClick={() => { markNotificationRead(recipient, notification.id); onOpen?.(); }}
                    >
                        {destination.label}<ArrowUpRight className="size-3" aria-hidden />
                    </Link>
                    <Button
                        type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground"
                        aria-label={`Mark as ${isUnread ? "read" : "unread"}: ${notification.title}`}
                        onClick={() => isUnread ? markNotificationRead(recipient, notification.id) : markNotificationUnread(recipient, notification.id)}
                    >
                        Mark as {isUnread ? "read" : "unread"}
                    </Button>
                </div>
            </div>
        </article>
    );
}
