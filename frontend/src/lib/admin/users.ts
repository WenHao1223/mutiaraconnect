import usersData from "@/data/users.json";
import { recordAudit } from "@/lib/admin/audit";
import { readJson, writeJson } from "@/lib/admin/store";
import { premisesFor } from "@/lib/business/business";
import type { AppUser, BusinessProfile, MockAccount } from "@/types/user";

/**
 * MOCK USER DIRECTORY (frontend only, no backend). Combines the demo accounts in
 * data/users.json with accounts registered in this browser, and layers super-admin
 * edits (role, active) on top. Replace with Supabase later.
 */
const REGISTERED_KEY = "mutiaraconnect.registered-users";
const OVERRIDES_KEY = "mutiaraconnect.admin-user-overrides";

type RegisteredAccount = AppUser & { passwordHash: string };
interface UserOverride {
    role?: AppUser["role"];
    active?: boolean;
}

export interface ManagedUser {
    email: string;
    name: string;
    role: AppUser["role"];
    active: boolean;
    source: "demo" | "registered";
    ic?: string;
}

const normalize = (email: string) => email.trim().toLowerCase();
const readOverrides = () => readJson<Record<string, UserOverride>>(OVERRIDES_KEY, {});

function allAccounts(): { account: ManagedUser; override: UserOverride | undefined }[] {
    const overrides = readOverrides();
    const demo = Object.values(usersData as Record<string, MockAccount>);
    const registered = readJson<RegisteredAccount[]>(REGISTERED_KEY, []);
    return [...demo, ...registered]
        .filter((account) => account.email)
        .map((account) => {
            const override = overrides[normalize(account.email as string)];
            return {
                account: {
                    email: account.email as string,
                    name: account.name,
                    role: override?.role ?? account.role,
                    active: override?.active ?? true,
                    source: demo.includes(account as MockAccount) ? "demo" : "registered",
                    ic: account.ic,
                },
                override,
            };
        });
}

/** Every known account, demo first then registered, each with any admin edits applied. */
export function readUsers(): ManagedUser[] {
    return allAccounts().map(({ account }) => account);
}

/** Business premises across every account, used to target a shared notice. */
export function readAllPremises(): BusinessProfile[] {
    const accounts = [
        ...Object.values(usersData as Record<string, MockAccount>),
        ...readJson<RegisteredAccount[]>(REGISTERED_KEY, []),
    ];
    // Includes premises added in this browser, e.g. from an approved business application.
    return accounts.flatMap((account) =>
        premisesFor(account.email ?? account.ic ?? account.name, account.businesses),
    );
}

function saveOverride(email: string, patch: UserOverride): void {
    const key = normalize(email);
    const all = readOverrides();
    writeJson(OVERRIDES_KEY, { ...all, [key]: { ...all[key], ...patch } });
}

export function updateUserRole(email: string, role: AppUser["role"], actor: string): void {
    saveOverride(email, { role });
    recordAudit({ actor, action: "role_change", detail: `Changed ${email} role to ${role}.` });
}

export function setUserActive(email: string, active: boolean, actor: string): void {
    saveOverride(email, { active });
    recordAudit({ actor, action: "user_status", detail: `${active ? "Activated" : "Deactivated"} ${email}.` });
}
