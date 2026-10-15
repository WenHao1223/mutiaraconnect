export interface IcDetails {
    birthDate: Date;
    age: number;
}

/** Formats a MyKad IC as 000000-00-0000 (digits only, max 12). */
export function formatIc(ic?: string): string {
    const digits = (ic ?? "").replace(/\D/g, "").slice(0, 12);
    return [digits.slice(0, 6), digits.slice(6, 8), digits.slice(8)].filter(Boolean).join("-");
}

/**
 * Reads the birth date from a Malaysian MyKad IC number (YYMMDD-PB-###G).
 * The IC only has a 2-digit year, so we assume the 2000s unless that would
 * put the birth date in the future, in which case it is the 1900s.
 * Returns null when the IC is missing or not a real date.
 */
export function parseIc(ic?: string, today: Date = new Date()): IcDetails | null {
    const digits = (ic ?? "").replace(/\D/g, "");
    if (digits.length !== 12) return null;

    const yy = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));
    const day = Number(digits.slice(4, 6));

    const build = (year: number) => new Date(year, month - 1, day);
    let birthDate = build(2000 + yy);
    if (birthDate > today) birthDate = build(1900 + yy);

    // Reject impossible dates such as 31 Feb (Date would silently roll over).
    if (birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) return null;

    let age = today.getFullYear() - birthDate.getFullYear();
    const hadBirthday =
        today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
    if (!hadBirthday) age -= 1;

    return { birthDate, age };
}
