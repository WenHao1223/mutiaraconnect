import { useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Plus, SearchX, Ticket as TicketIcon } from "lucide-react";
import { toast } from "sonner";
import TicketDetail from "@/components/tickets/TicketDetail";
import TicketForm, { type TicketFormValues } from "@/components/tickets/TicketForm";
import TicketList from "@/components/tickets/TicketList";
import TicketLookup from "@/components/tickets/TicketLookup";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth";
import { readPremises, readRemovedPremiseIds } from "@/lib/business/business";
import {
    applyTicketChange,
    getTicketsForUser,
    matchesTicketQuery,
    normalizeTicketId,
    submitTicket,
} from "@/lib/tickets/tickets";
import { PATHS } from "@/routes";
import type { Ticket } from "@/types/ticket";
import type { AppUser } from "@/types/user";

const subtitles: Partial<Record<AppUser["role"], string>> = {
    resident: "Follow the tickets you have raised until the responsible team responds.",
    business_premise: "Follow tickets about your premise until the responsible team responds.",
};

/** My Tickets: shared by residents and business premises. Admins manage tickets elsewhere. */
export default function TicketsPage() {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) return <Navigate to={PATHS.login} state={{ from: `${location.pathname}${location.search}` }} replace />;
    if (user.role === "admin" || user.role === "super_admin") {
        return <Navigate to={PATHS.admin} replace />;
    }
    const requestedId = new URLSearchParams(location.search).get("ticket");
    // A notification can target a different ticket while this page is already open.
    // Remount for that navigation to refresh owned tickets and clear stale searches/forms.
    return <TicketsView key={`${user.email ?? user.name}:${location.key}`} user={user}
        requestedId={requestedId ? normalizeTicketId(requestedId) : undefined} />;
}

function TicketsView({ user, requestedId }: { user: AppUser; requestedId?: string }) {
    const detailRef = useRef<HTMLDivElement>(null);

    const [myTickets, setMyTickets] = useState<Ticket[]>(() => getTicketsForUser(user.email));
    const [selectedId, setSelectedId] = useState<string | undefined>(() => requestedId ?? myTickets[0]?.id);
    const [query, setQuery] = useState("");
    // With no tickets yet, open the form straight away.
    const [showForm, setShowForm] = useState(() => myTickets.length === 0 && !requestedId);

    const removed = new Set(readRemovedPremiseIds(user.email));
    const premises =
        user.role === "business_premise"
            ? [...(user.businesses ?? []), ...readPremises(user.email)].filter(
                  (premise) => !removed.has(premise.id),
              )
            : [];

    // Tracking filters the list in place instead of changing the URL.
    const visible = myTickets.filter((ticket) => matchesTicketQuery(ticket, query));
    // Resolve links only against this account's list, never the public ticket lookup.
    const requestedUnavailable = Boolean(requestedId && selectedId === requestedId && !myTickets.some((ticket) => ticket.id === requestedId));
    const selected = requestedUnavailable ? undefined : visible.find((t) => t.id === selectedId) ?? visible[0];

    function select(id: string) {
        setSelectedId(id);
        // On small screens the detail sits below the list, so bring it into view.
        if (!window.matchMedia("(min-width: 1024px)").matches) {
            detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function openTicket(values: TicketFormValues) {
        const ticket = submitTicket({
            email: values.anonymous ? undefined : user.email,
            category: values.category,
            description: values.description,
            location: values.location.address,
            latitude: values.location.latitude,
            longitude: values.location.longitude,
            premise: values.premise,
            hasPhoto: values.hasPhoto,
            photos: values.photos,
        });
        setMyTickets((current) => [ticket, ...current]);
        setSelectedId(ticket.id);
        setQuery("");
        setShowForm(false);
        toast.success(`Ticket ${ticket.id} submitted.`);
    }

    return (
        <div className="flex-1 bg-background">
            <section className="border-b bg-muted/50">
                <div className="mx-auto max-w-6xl px-4 py-8">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="size-2 rounded-full bg-hazard" aria-hidden />
                        {user.role === "business_premise" ? "Business" : "Resident"}
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">
                        My Tickets
                    </h1>
                    <p className="mt-1 text-muted-foreground">{subtitles[user.role]}</p>
                </div>
            </section>

            <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold">Your tickets</h2>
                        {myTickets.length > 0 && (
                            <Button
                                size="sm"
                                variant={showForm ? "outline" : "default"}
                                onClick={() => setShowForm((open) => !open)}
                            >
                                {!showForm && <Plus className="size-4" />}
                                {/* Phones get just the + icon; the words stay for screen readers. */}
                                {showForm ? (
                                    "Close"
                                ) : (
                                    <span className="sr-only sm:not-sr-only">New ticket</span>
                                )}
                            </Button>
                        )}
                    </div>

                    {showForm ? (
                        <div className="mt-4">
                            <TicketForm
                                premises={premises}
                                onSubmit={openTicket}
                                onCancel={() => setShowForm(false)}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="mt-3">
                                <TicketLookup value={query} onChange={setQuery} />
                            </div>

                            <div className="mt-4">
                                {myTickets.length === 0 ? (
                                    <div className="rounded-lg bg-muted px-4 py-8 text-center">
                                        <TicketIcon
                                            className="mx-auto size-8 text-muted-foreground"
                                            aria-hidden
                                        />
                                        <p className="mt-2 text-sm font-medium">No tickets yet</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Tickets you submit will show up here.
                                        </p>
                                        <Button className="mt-4" size="sm" onClick={() => setShowForm(true)}>
                                            Submit a ticket
                                        </Button>
                                    </div>
                                ) : visible.length === 0 ? (
                                    <div className="rounded-lg bg-muted px-4 py-8 text-center">
                                        <SearchX className="mx-auto size-8 text-muted-foreground" aria-hidden />
                                        <p className="mt-2 text-sm font-medium">No ticket found</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            None of your tickets match “{query.trim()}”.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-4"
                                            onClick={() => setQuery("")}
                                        >
                                            Clear search
                                        </Button>
                                    </div>
                                ) : (
                                    <TicketList
                                        tickets={visible}
                                        selectedId={selected?.id}
                                        onSelect={select}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div
                    ref={detailRef}
                    aria-live="polite"
                    className="scroll-mt-20 rounded-xl border bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-24"
                >
                    {selected ? (
                        <TicketDetail
                            ticket={selected}
                            onChange={(ticket) =>
                                setMyTickets((current) => applyTicketChange(current, selected.id, ticket))
                            }
                        />
                    ) : (
                        <div className="py-10 text-center">
                            <SearchX className="mx-auto size-8 text-muted-foreground" aria-hidden />
                            <p className="mt-2 text-sm font-medium">
                                {requestedUnavailable ? "This ticket is unavailable in your account." : "Select a ticket to see its progress."}
                            </p>
                            {requestedUnavailable && <p className="mt-2 text-sm text-muted-foreground">It may have been withdrawn or belong to a different account. Select one of your tickets to continue.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
