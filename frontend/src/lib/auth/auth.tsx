import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { demoUsers, type MockAccount } from "@/data/users";
import type { AppUser } from "@/types/user";

/**
 * MOCK AUTH (frontend only, no backend). Logic is real, storage is the browser:
 *  - Accounts = demo accounts in data/users.ts + accounts registered here
 *    (kept in localStorage, password stored as a SHA-256 hash).
 *  - Email login checks email + password against those accounts.
 *  - MyDigitalID login checks the MyKad IC against accounts that have one.
 * Replace the functions below with Supabase / MyDigitalID later; pages only use useAuth().
 */
// eslint-disable-next-line react-refresh/only-export-components
export class AuthError extends Error { }

interface AuthContextValue {
    user: AppUser | null;
    signInWithMyDigitalId: (ic: string) => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    registerWithEmail: (input: { name: string; email: string; password: string }) => Promise<void>;
    /** Changes the display name. Birth date and age come from the IC and cannot be edited. */
    updateName: (name: string) => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    signOut: () => void;
}

/** A registered account never holds a plain password. */
type StoredAccount = AppUser & { passwordHash: string };

const SESSION_KEY = "mutiaraconnect.session-email";
const REGISTERED_KEY = "mutiaraconnect.registered-users";
/** Profile edits (name, new password hash) for ANY account, including the read-only demo ones. */
const OVERRIDES_KEY = "mutiaraconnect.account-overrides";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeIc = (ic: string) => ic.replace(/\D/g, "");

async function sha256(text: string) {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readStorage<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function writeStorage(key: string, value: unknown) {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* storage unavailable: data just won't survive a refresh */
    }
}

const readRegistered = () => readStorage<StoredAccount[]>(REGISTERED_KEY, []);

type AccountOverride = { name?: string; passwordHash?: string };
const readOverrides = () => readStorage<Record<string, AccountOverride>>(OVERRIDES_KEY, {});

function saveOverride(email: string, patch: AccountOverride) {
    const key = normalizeEmail(email);
    const all = readOverrides();
    writeStorage(OVERRIDES_KEY, { ...all, [key]: { ...all[key], ...patch } });
}

/** Strip secrets so they never reach React state, and apply any saved profile edits. */
function toAppUser(account: MockAccount | StoredAccount): AppUser {
    const rest: Partial<MockAccount & StoredAccount> = { ...account };
    delete rest.password;
    delete rest.passwordHash;
    const override = account.email ? readOverrides()[normalizeEmail(account.email)] : undefined;
    if (override?.name) rest.name = override.name;
    return rest as AppUser;
}

/** A changed password (override) wins over the demo plain-text or the registered hash. */
async function passwordMatches(account: MockAccount | StoredAccount, password: string) {
    const override = account.email ? readOverrides()[normalizeEmail(account.email)] : undefined;
    if (override?.passwordHash) return override.passwordHash === (await sha256(password));
    if ("password" in account) return account.password === password;
    return account.passwordHash === (await sha256(password));
}

function findByEmail(email: string) {
    const target = normalizeEmail(email);
    return (
        Object.values(demoUsers).find((a) => a.email && normalizeEmail(a.email) === target) ??
        readRegistered().find((a) => a.email && normalizeEmail(a.email) === target)
    );
}

function restoreSession(): AppUser | null {
    const email = readStorage<string | null>(SESSION_KEY, null);
    const account = email ? findByEmail(email) : undefined;
    return account ? toAppUser(account) : null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<AppUser | null>(restoreSession);

    const startSession = useCallback((account: MockAccount | StoredAccount) => {
        setUserState(toAppUser(account));
        writeStorage(SESSION_KEY, account.email ?? null);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,

            async signInWithMyDigitalId(ic) {
                await wait(800); // stands in for the MyDigitalID redirect + callback
                const digits = normalizeIc(ic);
                if (digits.length !== 12) throw new AuthError("Enter a valid 12-digit MyKad IC number.");
                const account = Object.values(demoUsers).find((a) => a.ic && normalizeIc(a.ic) === digits);
                if (!account) throw new AuthError("No MyDigitalID account found for this IC number.");
                startSession(account);
            },

            async signInWithEmail(email, password) {
                await wait(500);
                const account = findByEmail(email);
                const ok = !!account && (await passwordMatches(account, password));
                if (!account || !ok) throw new AuthError("Incorrect email or password.");
                startSession(account);
            },

            async registerWithEmail({ name, email, password }) {
                await wait(500);
                if (findByEmail(email)) throw new AuthError("An account with this email already exists. Try signing in.");
                const account: StoredAccount = {
                    name,
                    email: email.trim(),
                    role: "resident", // self-registration is always a resident
                    passwordHash: await sha256(password),
                };
                writeStorage(REGISTERED_KEY, [...readRegistered(), account]);
                startSession(account);
            },

            async updateName(name) {
                await wait(400);
                const clean = name.trim();
                if (clean.length < 2) throw new AuthError("Enter your full name.");
                if (!user?.email) throw new AuthError("You need to be signed in to edit your profile.");
                saveOverride(user.email, { name: clean });
                setUserState({ ...user, name: clean });
            },

            async changePassword(currentPassword, newPassword) {
                await wait(500);
                if (!user?.email) throw new AuthError("You need to be signed in to change your password.");
                const account = findByEmail(user.email);
                if (!account || !(await passwordMatches(account, currentPassword))) {
                    throw new AuthError("Your current password is incorrect.");
                }
                saveOverride(user.email, { passwordHash: await sha256(newPassword) });
            },

            signOut() {
                setUserState(null);
                writeStorage(SESSION_KEY, null);
            },
        }),
        [user, startSession],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}