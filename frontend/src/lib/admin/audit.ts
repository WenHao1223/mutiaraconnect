import { newId, readJson, writeJson } from "@/lib/admin/store";
import type { AuditAction, AuditLogEntry } from "@/types/audit";

/**
 * MOCK AUDIT LOG (frontend only, no backend). Records who did what and when so the
 * super admin page has something real to show. Replace with Supabase later.
 */
const AUDIT_KEY = "mutiaraconnect.audit-log";
const MAX_ENTRIES = 500;

/** Newest first. */
export function readAuditLog(): AuditLogEntry[] {
    return readJson<AuditLogEntry[]>(AUDIT_KEY, []).sort((a, b) => b.at.localeCompare(a.at));
}

export function recordAudit(entry: { actor: string; action: AuditAction; detail: string }): void {
    const all = readJson<AuditLogEntry[]>(AUDIT_KEY, []);
    const next: AuditLogEntry = {
        id: newId("LOG"),
        at: new Date().toISOString(),
        ...entry,
    };
    writeJson(AUDIT_KEY, [next, ...all].slice(0, MAX_ENTRIES));
}
