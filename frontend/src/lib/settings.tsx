import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/auth";

/**
 * Per-browser preferences (frontend only, kept in localStorage):
 *  - Theme is saved per device, so it also applies on the login page and to guests.
 *  - "Pause notifications" is saved per signed-in account.
 * Swap the storage calls for Supabase later; pages only use useSettings().
 */
export type Theme = "light" | "dark";

interface SettingsContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    /** false = every notification is paused. */
    notificationsEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => void;
}

const THEME_KEY = "mutiaraconnect.theme";
const NOTIFICATIONS_KEY = "mutiaraconnect.notifications-paused";

function readTheme(): Theme {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === "light" || saved === "dark") return saved;
    } catch {
        /* storage unavailable: fall through to the default (light) */
    }
    return "light";
}

/** Emails of accounts that paused notifications. */
function readPaused(): string[] {
    try {
        const raw = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) ?? "[]");
        return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
    } catch {
        return [];
    }
}

function writePaused(emails: string[]) {
    try {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(emails));
    } catch {
        /* storage unavailable: the choice just won't survive a refresh */
    }
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const accountKey = user?.email?.trim().toLowerCase() ?? null;

    const [theme, setThemeState] = useState<Theme>(readTheme);
    const [pausedAccounts, setPausedAccounts] = useState<string[]>(readPaused);

    // Keeps <html class="dark"> in sync (index.html sets it first to avoid a flash).
    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
    }, [theme]);

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
        try {
            localStorage.setItem(THEME_KEY, next);
        } catch {
            /* ignore */
        }
    }, []);

    const setNotificationsEnabled = useCallback(
        (enabled: boolean) => {
            if (!accountKey) return;
            const rest = pausedAccounts.filter((email) => email !== accountKey);
            const next = enabled ? rest : [...rest, accountKey];
            writePaused(next);
            setPausedAccounts(next);
        },
        [accountKey, pausedAccounts],
    );

    const value = useMemo<SettingsContextValue>(
        () => ({
            theme,
            setTheme,
            notificationsEnabled: accountKey ? !pausedAccounts.includes(accountKey) : true,
            setNotificationsEnabled,
        }),
        [theme, setTheme, accountKey, pausedAccounts, setNotificationsEnabled],
    );

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
    return ctx;
}
