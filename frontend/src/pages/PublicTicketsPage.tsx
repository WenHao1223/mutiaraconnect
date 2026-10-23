import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LifeBuoy, MessageSquarePlus, Plus, SearchX, Ticket as TicketIcon } from "lucide-react";
import { toast } from "sonner";
import FeedbackForm, { type FeedbackFormValues } from "@/components/tickets/FeedbackForm";
import PublicResolvedTickets from "@/components/tickets/PublicResolvedTickets";
import TicketDetail from "@/components/tickets/TicketDetail";
import TicketForm, { type TicketFormValues } from "@/components/tickets/TicketForm";
import TicketList from "@/components/tickets/TicketList";
import TicketLookup from "@/components/tickets/TicketLookup";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth";
import { readPremises, readRemovedPremiseIds } from "@/lib/business/business";
import { submitFeedback } from "@/lib/tickets/feedback";
import {
    getResolvedTickets,
    getTicketsForUser,
    matchesTicketQuery,
    submitTicket,
} from "@/lib/tickets/tickets";
import { PATHS } from "@/routes";
import type { Ticket } from "@/types/ticket";

/** Which panel the left column is showing. */
type Panel = "tickets" | "ticket-form" | "feedback-form";

/** Public "Tickets & feedback" hub: file a report or feedback, and browse resolved reports. */
export default function PublicTicketsPage() {
    const { user } = useAuth();
    const detailRef = useRef<HTMLDivElement>(null);

    const [myTickets, setMyTickets] = useState<Ticket[]>(() => getTicketsForUser(user?.email));
    const [selectedId, setSelectedId] = useState<string>();
    const [query, setQuery] = useState("");
    const [panel, setPanel] = useState<Panel>("tickets");

    const removed = new Set(user ? readRemovedPremiseIds(user.email) : []);
    const premises =
        user && user.role === "business_premise"
            ? [...(user.businesses ?? []), ...readPremises(user.email)].filter(
                  (premise) => !removed.has(premise.id),
              )
            : [];

    const visible = myTickets.filter((ticket) => matchesTicketQuery(ticket, query));
    const selected = visible.find((ticket) => ticket.id === selectedId);
    const resolved = getResolvedTickets();

    function select(id: string) {
        setSelectedId(id);
        if (!window.matchMedia("(min-width: 1024px)").matches) {
            detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function openTicket(values: TicketFormValues) {
        const ticket = submitTicket({
            email: values.anonymous ? undefined : user?.email,
            category: values.category,
            description: values.description,
            location: values.location.address,
            latitude: values.location.latitude,
            longitude: values.location.longitude,
            premise: values.premise,
        });
        setMyTickets((current) => [ticket, ...current]);
        setSelectedId(ticket.id);
        setQuery("");
        setPanel("tickets");
        toast.success(`Ticket ${ticket.id} submitted.`);
    }

    function openFeedback(values: FeedbackFormValues) {
        const feedback = submitFeedback({
            email: values.anonymous ? undefined : user?.email,
            category: values.category,
            message: values.message,
        });
        setPanel("tickets");
        toast.success(`Thanks — feedback ${feedback.id} received.`);
    }

    return (
        <div className="flex-1 bg-background">
            <section className="border-b bg-muted/50">
                <div className="mx-auto max-w-6xl px-4 py-8">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="size-2 rounded-full bg-hazard" aria-hidden />
                        Community
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">
                        Tickets &amp; feedback
                    </h1>
                    <p className="mt-1 max-w-2xl text-muted-foreground">
                        Report an issue along the Mutiara LRT corridor, tell us how we are doing, or
                        see what has already been resolved. Tickets can be submitted without an account.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
                <div className="grid gap-4 sm:grid-cols-2">
                    <button
                        type="button"
                        aria-pressed={panel === "ticket-form"}
                        onClick={() => setPanel(panel === "ticket-form" ? "tickets" : "ticket-form")}
                        className={`flex items-start gap-3 rounded-xl border bg-card p-5 text-left shadow-sm transition hover:border-primary/50 ${
                            panel === "ticket-form" ? "border-primary ring-1 ring-primary" : ""
                        }`}
                    >
                        <span className="rounded-lg bg-primary/10 p-2 text-primary">
                            <LifeBuoy className="size-5" aria-hidden />
                        </span>
                        <span className="flex-1">
                            <span className="block font-semibold">Send a ticket</span>
                            <span className="mt-0.5 block text-sm text-muted-foreground">
                                Report a construction issue — noise, dust, access and more.
                            </span>
                        </span>
                    </button>

                    <button
                        type="button"
                        aria-pressed={panel === "feedback-form"}
                        onClick={() =>
                            setPanel(panel === "feedback-form" ? "tickets" : "feedback-form")
                        }
                        className={`flex items-start gap-3 rounded-xl border bg-card p-5 text-left shadow-sm transition hover:border-primary/50 ${
                            panel === "feedback-form" ? "border-primary ring-1 ring-primary" : ""
                        }`}
                    >
                        <span className="rounded-lg bg-accent/15 p-2 text-accent-foreground">
                            <MessageSquarePlus className="size-5" aria-hidden />
                        </span>
                        <span className="flex-1">
                            <span className="block font-semibold">Send feedback</span>
                            <span className="mt-0.5 block text-sm text-muted-foreground">
                                Tell us what is working and what is not.
                            </span>
                        </span>
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        {panel === "ticket-form" ? (
                            <>
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-lg font-semibold">Send a ticket</h2>
                                    <Button variant="outline" size="sm" onClick={() => setPanel("tickets")}>
                                        Close
                                    </Button>
                                </div>
                                <div className="mt-4">
                                    <TicketForm
                                        premises={premises}
                                        showAnonymous={!!user}
                                        onSubmit={openTicket}
                                        onCancel={() => setPanel("tickets")}
                                    />
                                </div>
                            </>
                        ) : panel === "feedback-form" ? (
                            <>
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-lg font-semibold">Send feedback</h2>
                                    <Button variant="outline" size="sm" onClick={() => setPanel("tickets")}>
                                        Close
                                    </Button>
                                </div>
                                <div className="mt-4">
                                    <FeedbackForm
                                        showAnonymous={!!user}
                                        onSubmit={openFeedback}
                                        onCancel={() => setPanel("tickets")}
                                    />
                                </div>
                            </>
                        ) : user ? (
                            <>
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-lg font-semibold">Your tickets</h2>
                                    <Button size="sm" onClick={() => setPanel("ticket-form")}>
                                        <Plus className="size-4" />
                                        New ticket
                                    </Button>
                                </div>

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
                                            <Button
                                                className="mt-4"
                                                size="sm"
                                                onClick={() => setPanel("ticket-form")}
                                            >
                                                Submit a ticket
                                            </Button>
                                        </div>
                                    ) : visible.length === 0 ? (
                                        <div className="rounded-lg bg-muted px-4 py-8 text-center">
                                            <SearchX
                                                className="mx-auto size-8 text-muted-foreground"
                                                aria-hidden
                                            />
                                            <p className="mt-2 text-sm font-medium">
                                                No ticket found
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
                                            selectedId={selectedId}
                                            onSelect={select}
                                        />
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="py-6 text-center">
                                <TicketIcon className="mx-auto size-8 text-muted-foreground" aria-hidden />
                                <p className="mt-2 text-sm font-medium">Track your tickets</p>
                                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                                    Sign in to follow the progress of every ticket you have submitted.
                                    You can still send a ticket without an account.
                                </p>
                                <Button className="mt-4" size="sm" asChild>
                                    <Link to={PATHS.login} state={{ from: PATHS.ticket }}>
                                        Sign in
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    <div
                        ref={detailRef}
                        aria-live="polite"
                        className="scroll-mt-20 rounded-xl border bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-24"
                    >
                        {selected ? (
                            <>
                                <button
                                    type="button"
                                    className="mb-3 text-xs font-medium text-primary hover:underline"
                                    onClick={() => setSelectedId(undefined)}
                                >
                                    ← Back to resolved tickets
                                </button>
                                <TicketDetail ticket={selected} />
                            </>
                        ) : (
                            <PublicResolvedTickets tickets={resolved} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
