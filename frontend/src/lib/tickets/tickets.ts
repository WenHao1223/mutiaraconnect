import ticketData from "@/data/tickets.json";
import usersData from "@/data/users.json";
import type { Ticket, TicketCategory, TicketStatus, TicketUpdate } from "@/types/ticket";
import type { BusinessProfile, MockAccount } from "@/types/user";

// Mock data lives in data/tickets.json. Replace these two functions with Supabase queries later.
// Tickets belong to the demo accounts in data/users.ts by email: resident@example.com and
// business@example.com. FB-2030 and FB-2027 belong to other people and only show up by ID lookup.
const tickets = ticketData as Ticket[];

/**
 * Reports submitted through the app (frontend only, no backend). Kept in localStorage and
 * merged with the seed data above. Replace with Supabase later.
 */
const SUBMITTED_KEY = "mutiaraconnect.submitted-tickets";

function readSubmittedTickets(): Ticket[] {
    try {
        const raw = localStorage.getItem(SUBMITTED_KEY);
        return raw ? (JSON.parse(raw) as Ticket[]) : [];
    } catch {
        return [];
    }
}

function writeSubmittedTickets(list: Ticket[]) {
    try {
        localStorage.setItem(SUBMITTED_KEY, JSON.stringify(list));
    } catch {
        /* storage unavailable: the report just won't survive a refresh */
    }
}

/**
 * Admin status changes are layered on top of the seed/submitted tickets rather than editing
 * them, so the original report stays intact. Replace with Supabase later.
 */
const ADMIN_UPDATES_KEY = "mutiaraconnect.ticket-updates";

interface TicketPatch {
    status: TicketStatus;
    updates: TicketUpdate[];
}

function readPatches(): Record<string, TicketPatch> {
    try {
        const raw = localStorage.getItem(ADMIN_UPDATES_KEY);
        return raw ? (JSON.parse(raw) as Record<string, TicketPatch>) : {};
    } catch {
        return {};
    }
}

function writePatches(patches: Record<string, TicketPatch>) {
    try {
        localStorage.setItem(ADMIN_UPDATES_KEY, JSON.stringify(patches));
    } catch {
        /* storage unavailable: the change just won't survive a refresh */
    }
}

/** The ticket with any admin updates appended and its status brought up to date. */
function withPatch(ticket: Ticket): Ticket {
    const patch = readPatches()[ticket.id];
    if (!patch) return ticket;
    const updates = [...ticket.updates, ...patch.updates];
    return {
        ...ticket,
        status: patch.status,
        updates,
        updatedAt: updates[updates.length - 1]?.at ?? ticket.updatedAt,
    };
}

function allBaseTickets(): Ticket[] {
    return [...tickets, ...readSubmittedTickets()];
}

/** Every ticket, seed and submitted, with admin updates applied. Newest first. */
export function getAllTickets(): Ticket[] {
    return allBaseTickets()
        .map(withPatch)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Applies an admin status change and records it in the ticket's history. */
export function updateTicketStatus(
    id: string,
    status: TicketStatus,
    message: string,
    by: string,
): Ticket | undefined {
    const base = allBaseTickets().find((ticket) => ticket.id === id);
    if (!base) return undefined;
    const patches = readPatches();
    const update: TicketUpdate = { status, message, by, at: new Date().toISOString() };
    patches[id] = { status, updates: [...(patches[id]?.updates ?? []), update] };
    writePatches(patches);
    return withPatch(base);
}

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
    return getAllTickets().filter((t) => t.submittedByEmail?.toLowerCase() === target);
}

/** Resolved reports, newest first, for the public "recently resolved" board. */
export function getResolvedTickets(): Ticket[] {
    return getAllTickets().filter((ticket) => ticket.status === "resolved");
}

export interface NewTicketInput {
    email?: string;
    category: TicketCategory;
    description: string;
    location: string;
    latitude: number;
    longitude: number;
    premise?: string;
    hasPhoto?: boolean;
}

/** Creates a report owned by the signed-in account and stores it locally. */
export function submitTicket(input: NewTicketInput): Ticket {
    const now = new Date().toISOString();
    const ticket: Ticket = {
        id: `FB-${3001 + readSubmittedTickets().length}`,
        category: input.category,
        location: input.location,
        latitude: input.latitude,
        longitude: input.longitude,
        description: input.description,
        status: "received",
        submittedAt: now,
        updatedAt: now,
        submittedByEmail: input.email,
        premise: input.premise,
        hasPhoto: input.hasPhoto,
        updates: [
            {
                status: "received",
                message: "Ticket received. We'll assign it to the site team shortly.",
                by: "System",
                at: now,
            },
        ],
    };
    writeSubmittedTickets([...readSubmittedTickets(), ticket]);
    return ticket;
}

/** Look a ticket up by its public tracking ID, e.g. "FB-2041". */
export function findTicket(id: string): Ticket | undefined {
    return getAllTickets().find((t) => t.id === id);
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

/** Free-text match across the fields a reporter would recognise ("2041", "noise", "Komtar"). */
export function matchesTicketQuery(ticket: Ticket, query: string) {
    const text = query.trim().toLowerCase();
    if (!text) return true;
    const haystack = [
        ticket.id,
        categoryLabels[ticket.category],
        statusMeta[ticket.status].label,
        ticket.location,
        ticket.premise ?? "",
    ]
        .join(" ")
        .toLowerCase();
    return haystack.includes(text) || ticket.id.toUpperCase().includes(normalizeTicketId(query));
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
