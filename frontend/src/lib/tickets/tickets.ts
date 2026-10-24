import {
    Car,
    Check,
    CircleHelp,
    Footprints,
    HardHat,
    Inbox,
    Search,
    ShieldAlert,
    Store,
    Volume2,
    Wind,
    type LucideIcon,
} from "lucide-react";
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
 * Admin status changes, and the reporter's own edits or withdrawal, are layered on top of the
 * seed/submitted tickets rather than editing them, so the original report stays intact.
 * Replace with Supabase later.
 */
const ADMIN_UPDATES_KEY = "mutiaraconnect.ticket-updates";

/** The parts of a report its owner can change while it is still "received". */
export type TicketEdit = Pick<Ticket, "description" | "location" | "latitude" | "longitude" | "hasPhoto">;

interface TicketPatch {
    status: TicketStatus;
    updates: TicketUpdate[];
    /** The reporter's latest edits, laid over the original report. */
    edits?: TicketEdit;
    /** Withdrawn by the reporter: hidden everywhere, as if never sent. */
    withdrawn?: boolean;
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

/** The ticket with any edits and admin updates applied and its status brought up to date. */
function withPatch(ticket: Ticket): Ticket {
    const patch = readPatches()[ticket.id];
    if (!patch) return ticket;
    const updates = [...ticket.updates, ...patch.updates];
    return {
        ...ticket,
        ...patch.edits,
        status: patch.status,
        updates,
        updatedAt: updates[updates.length - 1]?.at ?? ticket.updatedAt,
    };
}

function allBaseTickets(): Ticket[] {
    return [...tickets, ...readSubmittedTickets()];
}

/** Every ticket, seed and submitted, with admin updates applied. Newest first. Withdrawn ones are left out. */
export function getAllTickets(): Ticket[] {
    const patches = readPatches();
    return allBaseTickets()
        .filter((ticket) => !patches[ticket.id]?.withdrawn)
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
    // Keep any reporter edits already layered on this ticket.
    patches[id] = { ...patches[id], status, updates: [...(patches[id]?.updates ?? []), update] };
    writePatches(patches);
    return withPatch(base);
}

/** Reporters can edit or withdraw their ticket until the team starts reviewing it. */
export const isEditable = (ticket: Ticket) => ticket.status === "received";

/** Saves the reporter's changes and notes the edit in the ticket's history. */
export function editTicket(id: string, edit: TicketEdit): Ticket | undefined {
    const current = findTicket(id);
    if (!current || !isEditable(current)) return undefined;
    const patches = readPatches();
    const update: TicketUpdate = {
        status: current.status,
        message: "Updated the ticket details.",
        by: "Reporter",
        at: new Date().toISOString(),
    };
    patches[id] = {
        ...patches[id],
        status: current.status,
        updates: [...(patches[id]?.updates ?? []), update],
        edits: edit,
    };
    writePatches(patches);
    return findTicket(id);
}

/** A list with one ticket swapped for its edited version, or dropped once withdrawn. */
export function applyTicketChange(list: Ticket[], id: string, ticket: Ticket | undefined): Ticket[] {
    return ticket ? list.map((t) => (t.id === id ? ticket : t)) : list.filter((t) => t.id !== id);
}

/** Withdraws a ticket the team hasn't started on; it disappears from every list. */
export function withdrawTicket(id: string): void {
    const current = findTicket(id);
    if (!current || !isEditable(current)) return;
    const patches = readPatches();
    patches[id] = {
        ...patches[id],
        status: current.status,
        updates: patches[id]?.updates ?? [],
        withdrawn: true,
    };
    writePatches(patches);
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

/**
 * How each status looks, everywhere: `icon` and `fill` (solid colour with matching text) are shared
 * by StatusBadge, StatusIcon and progress lines; `ring` and `text` (readable label colour) are for
 * StatusIcon and progress lines.
 */
export const statusMeta: Record<
    TicketStatus,
    { label: string; icon: LucideIcon; fill: string; ring: string; text: string }
> = {
    received: {
        label: "Received",
        icon: Inbox,
        fill: "bg-neutral text-neutral-foreground",
        ring: "ring-neutral/20",
        text: "text-neutral-text",
    },
    under_review: {
        label: "Under Review",
        icon: Search,
        fill: "bg-info text-info-foreground",
        ring: "ring-info/20",
        text: "text-info-text",
    },
    in_progress: {
        label: "In Progress",
        icon: HardHat,
        fill: "bg-hazard text-hazard-foreground",
        ring: "ring-hazard/25",
        text: "text-hazard-text",
    },
    resolved: {
        label: "Resolved",
        icon: Check,
        fill: "bg-success text-success-foreground",
        ring: "ring-success/20",
        text: "text-success-text",
    },
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

/** One icon per category, so tickets can be told apart at a glance wherever they appear. */
export const categoryIcons: Record<TicketCategory, LucideIcon> = {
    noise: Volume2,
    dust: Wind,
    traffic: Car,
    pedestrian_access: Footprints,
    business_access: Store,
    safety: ShieldAlert,
    other: CircleHelp,
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
