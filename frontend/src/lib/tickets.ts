import ticketData from "@/data/tickets.json";
import usersData from "@/data/users.json";
import type { Ticket, TicketCategory, TicketStatus } from "@/types/ticket";
import type { BusinessProfile, MockAccount } from "@/types/user";

// Mock data lives in data/tickets.json. Replace these two functions with Supabase queries later.
// Tickets belong to the demo accounts in data/users.ts by email: resident@example.com and
// business@example.com. FB-2030 and FB-2027 belong to other people and only show up by ID lookup.
const tickets = ticketData as Ticket[];

/** The business premises each account owns, keyed by lower-cased email. */
const businessByEmail = new Map<string, BusinessProfile[]>();
for (const account of Object.values(usersData) as MockAccount[]) {
    if (account.email && account.businesses?.length) {
        businessByEmail.set(account.email.toLowerCase(), account.businesses);
    }
}

/** Roughly 50 m of latitude/longitude slack, enough for GPS drift and imprecise pins. */
const COORD_TOLERANCE = 0.0005;

const withinTolerance = (a?: number, b?: number) =>
    typeof a === "number" && typeof b === "number" && Math.abs(a - b) <= COORD_TOLERANCE;

/**
 * True when the ticket was raised by the owner of the premise it is about, i.e. the reporter's
 * business name matches the ticket's premise and their pinned locations are within tolerance.
 */
export function isBusinessOwner(ticket: Ticket): boolean {
    const premises = ticket.submittedByEmail
        ? businessByEmail.get(ticket.submittedByEmail.toLowerCase())
        : undefined;
    if (!premises || !ticket.premise) return false;
    return premises.some(
        (premise) =>
            premise.name === ticket.premise &&
            withinTolerance(premise.latitude, ticket.latitude) &&
            withinTolerance(premise.longitude, ticket.longitude),
    );
}

/** Tickets raised by one account, most recently updated first. */
export function getTicketsForUser(email: string | undefined): Ticket[] {
    if (!email) return [];
    const target = email.trim().toLowerCase();
    return tickets
        .filter((t) => t.submittedByEmail?.toLowerCase() === target)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Look a ticket up by its public tracking ID, e.g. "FB-2041". */
export function findTicket(id: string): Ticket | undefined {
    return tickets.find((t) => t.id === id);
}

/** Left-to-right order of the progress bar. */
export const STATUS_ORDER: TicketStatus[] = ["received", "under_review", "in_progress", "resolved"];

export const statusMeta: Record<TicketStatus, { label: string; badge: string }> = {
    received: { label: "Received", badge: "border-transparent bg-muted text-muted-foreground" },
    under_review: { label: "Under Review", badge: "border-info/30 bg-info/10 text-sky-800" },
    in_progress: { label: "In Progress", badge: "border-hazard/40 bg-hazard/15 text-amber-800" },
    resolved: { label: "Resolved", badge: "border-success/30 bg-success/10 text-green-800" },
};

export const categoryLabels: Record<TicketCategory, string> = {
    noise: "Noise",
    dust: "Dust",
    traffic: "Traffic",
    pedestrian_access: "Pedestrian access",
    business_access: "Business access",
    safety: "Safety",
    other: "Other",
};

export const isOpen = (ticket: Ticket) => ticket.status !== "resolved";

/** "fb2041", " FB-2041 " and "2041" all become "FB-2041". Anything else is just upper-cased. */
export function normalizeTicketId(raw: string) {
    const text = raw.trim().toUpperCase().replace(/\s+/g, "");
    const digits = text.match(/^(?:FB-?)?(\d+)$/)?.[1];
    return digits ? `FB-${digits}` : text;
}

export function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function formatDateTime(iso: string) {
    const date = new Date(iso);
    const time = date.toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" });
    return `${formatDate(iso)}, ${time}`;
}
