import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { compare as compareHash, hash as hashPassword } from "bcryptjs";
import demoUsersData from "@/data/users.json";
import { recordAudit } from "@/lib/admin/audit";
import { readUsers } from "@/lib/admin/users";
import type { AppUser, Gender, MockAccount } from "@/types/user";

// @TODO: Replace with real data from Supabase
/** Demo accounts from data/users.json, typed and keyed by role. */
const demoUsers = demoUsersData as Record<AppUser["role"], MockAccount>;

/**
 * MOCK AUTH (frontend only, no backend). Logic is real, storage is the browser:
 *  - Accounts = demo accounts in data/users.json + accounts registered here
 *    (kept in localStorage, password stored as a bcrypt hash).
 *  - Email login checks email + password against those accounts using bcrypt.compare.
 *  - MyDigitalID login checks the MyKad IC against accounts that have one.
 * Replace the functions below with Supabase / MyDigitalID later; pages only use useAuth().
 */
// eslint-disable-next-line react-refresh/only-export-components
export class AuthError extends Error { }

const BCRYPT_COST = 10;

interface AuthContextValue {
    user: AppUser | null;
    signInWithMyDigitalId: (ic: string) => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    registerWithEmail: (input: { name: string; email: string; password: string; ic: string }) => Promise<void>;
    /** Updates editable profile fields. Birth date and age come from the IC and cannot be edited. */
    updateProfile: (input: { name?: string; gender?: Gender }) => Promise<void>;
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

type AccountOverride = { name?: string; gender?: Gender; passwordHash?: string };
const readOverrides = () => readStorage<Record<string, AccountOverride>>(OVERRIDES_KEY, {});

function saveOverride(email: string, patch: AccountOverride) {
    const key = normalizeEmail(email);
    const all = readOverrides();
    writeStorage(OVERRIDES_KEY, { ...all, [key]: { ...all[key], ...patch } });
}

/** Strip secrets so they never reach React state, and apply any saved profile edits. */
function toAppUser(account: MockAccount | StoredAccount): AppUser {
    const rest: Partial<MockAccount & StoredAccount> = { ...account };
    delete rest.passwordHash;
    const override = account.email ? readOverrides()[normalizeEmail(account.email)] : undefined;
    if (override?.name) rest.name = override.name;
    if (override?.gender) rest.gender = override.gender;
    // Super-admin edits (role, active) win over the account's own details.
    const email = account.email;
    const managed = email
        ? readUsers().find((user) => user.email.toLowerCase() === normalizeEmail(email))
        : undefined;
    if (managed) {
        rest.role = managed.role;
        rest.active = managed.active;
    }
    return rest as AppUser;
}

/** False when a super admin has deactivated the account. */
function isDeactivated(account: MockAccount | StoredAccount): boolean {
    const email = account.email;
    if (!email) return false;
    const managed = readUsers().find((user) => user.email.toLowerCase() === normalizeEmail(email));
    return managed ? !managed.active : false;
}

/**
 * A changed password (override) wins over the demo or registered hash.
 * bcrypt.compare is constant-time and re-hashes the input with the stored salt.
 */
async function passwordMatches(account: MockAccount | StoredAccount, password: string) {
    const override = account.email ? readOverrides()[normalizeEmail(account.email)] : undefined;
    return compareHash(password, override?.passwordHash ?? account.passwordHash);
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
        recordAudit({
            actor: account.email ?? account.name,
            action: "sign_in",
            detail: `Signed in (${account.role}).`,
        });
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,

            async signInWithMyDigitalId(ic) {
                await wait(800); // stands in for the MyDigitalID redirect + callback
                const digits = normalizeIc(ic);
                if (digits.length !== 12) throw new AuthError("Enter a valid 12-digit MyKad IC number.");
                const account = Object.values(demoUsers).find((a) => a.ic && normalizeIc(a.ic) === digits)
                    ?? readRegistered().find((a) => a.ic && normalizeIc(a.ic) === digits);
                if (!account) throw new AuthError("No MyDigitalID account found for this IC number.");
                if (isDeactivated(account)) throw new AuthError("This account has been deactivated.");
                startSession(account);
            },

            async signInWithEmail(email, password) {
                await wait(500);
                const account = findByEmail(email);
                const ok = !!account && (await passwordMatches(account, password));
                if (!account || !ok) throw new AuthError("Incorrect email or password.");
                if (isDeactivated(account)) throw new AuthError("This account has been deactivated.");
                startSession(account);
            },

            async registerWithEmail({ name, email, password, ic }) {
                await wait(500);
                if (findByEmail(email)) throw new AuthError("An account with this email already exists. Try signing in.");
                const account: StoredAccount = {
                    name,
                    email: email.trim(),
                    role: "resident", // self-registration is always a resident
                    ic,
                    passwordHash: await hashPassword(password, BCRYPT_COST),
                };
                writeStorage(REGISTERED_KEY, [...readRegistered(), account]);
                startSession(account);
            },

            async updateProfile({ name, gender }) {
                await wait(400);
                if (!user?.email) throw new AuthError("You need to be signed in to edit your profile.");
                const patch: AccountOverride = {};
                const next: AppUser = { ...user };
                if (name !== undefined) {
                    const clean = name.trim();
                    if (clean.length < 2) throw new AuthError("Enter your full name.");
                    patch.name = clean;
                    next.name = clean;
                }
                if (gender !== undefined) {
                    patch.gender = gender;
                    next.gender = gender;
                }
                saveOverride(user.email, patch);
                setUserState(next);
            },

            async changePassword(currentPassword, newPassword) {
                await wait(500);
                if (!user?.email) throw new AuthError("You need to be signed in to change your password.");
                const account = findByEmail(user.email);
                if (!account || !(await passwordMatches(account, currentPassword))) {
                    throw new AuthError("Your current password is incorrect.");
                }
                saveOverride(user.email, { passwordHash: await hashPassword(newPassword, BCRYPT_COST) });
            },

            signOut() {
                if (user) {
                    recordAudit({
                        actor: user.email ?? user.name,
                        action: "sign_out",
                        detail: "Signed out.",
                    });
                }
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