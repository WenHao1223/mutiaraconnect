/**
 * Tiny localStorage helpers shared by the admin modules (frontend only, no backend).
 * Replace these with Supabase calls later; they all live behind the admin lib functions.
 */
export function readJson<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

export function writeJson(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* storage unavailable: the change just won't survive a refresh */
    }
}

/** Unique-enough id for mock records, e.g. newId("RC") -> "RC-1042-x7k1". */
export function newId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
