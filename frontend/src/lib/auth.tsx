import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { demoUsers } from "@/data/users";
import type { AppUser } from "@/types/user";

/**
 * MOCK AUTH (no backend yet). Nothing is verified and no password is stored.
 * Replace the three functions below with Supabase / MyDigitalID calls later;
 * the pages only talk to useAuth(), so they will not need to change.
 */
interface AuthContextValue {
    user: AppUser | null;
    signInWithMyDigitalId: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    registerWithEmail: (input: { name: string; email: string; password: string }) => Promise<void>;
    signOut: () => void;
}

const STORAGE_KEY = "mutiaraconnect.mock-user";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function loadUser(): AppUser | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as AppUser) : null;
    } catch {
        return null;
    }
}

function saveUser(user: AppUser | null) {
    try {
        if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        else localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* storage unavailable: session just won't survive a refresh */
    }
}

function nameFromEmail(email: string) {
    return email
        .split("@")[0]
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" ");
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<AppUser | null>(loadUser);

    const setUser = useCallback((next: AppUser | null) => {
        setUserState(next);
        saveUser(next);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            async signInWithMyDigitalId() {
                await wait(900); // stands in for the MyDigitalID redirect + callback
                setUser(demoUsers.resident);
            },
            async signInWithEmail(email) {
                await wait(600);
                const demo = Object.values(demoUsers).find((u) => u.email === email.toLowerCase());
                setUser(demo ?? { name: nameFromEmail(email), email, role: "resident" });
            },
            async registerWithEmail({ name, email }) {
                await wait(600);
                setUser({ name, email, role: "resident" });
            },
            signOut: () => setUser(null),
        }),
        [user, setUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}