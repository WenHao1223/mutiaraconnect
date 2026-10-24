import { useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    CircleCheck,
    LifeBuoy,
    MessageSquarePlus,
    Ticket as TicketIcon,
    X,
    type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import FeedbackForm, { type FeedbackFormValues } from "@/components/tickets/FeedbackForm";
import PublicResolvedTickets from "@/components/tickets/PublicResolvedTickets";
import RecentTickets from "@/components/tickets/RecentTickets";
import TicketForm, { type TicketFormValues } from "@/components/tickets/TicketForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth";
import { readPremises, readRemovedPremiseIds } from "@/lib/business/business";
import { submitFeedback } from "@/lib/tickets/feedback";
import {
    applyTicketChange,
    getResolvedTickets,
    getTicketsForUser,
    submitTicket,
} from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";
import { PATHS } from "@/routes";
import type { Ticket } from "@/types/ticket";

/** Which panel sits below the action cards: a form, or (by default) the recent tickets. */
type Panel = "tickets" | "ticket-form" | "feedback-form";

/** The two things people come here to do. Each card keeps its own colour: blue for tickets, amber for feedback. */
const actions: {
    panel: Exclude<Panel, "tickets">;
    title: string;
    hint: string;
    icon: LucideIcon;
    card: string;
    active: string;
    tile: string;
    arrow: string;
}[] = [
    {
        panel: "ticket-form",
        title: "Send a ticket",
        hint: "Report a construction issue — noise, dust, access and more.",
        icon: LifeBuoy,
        card: "border-primary/20 bg-primary/5 hover:border-primary/50",
        active: "border-primary ring-1 ring-primary",
        tile: "bg-primary text-primary-foreground",
        arrow: "text-primary",
    },
    {
        panel: "feedback-form",
        title: "Send feedback",
        hint: "Tell us what is working and what is not.",
        icon: MessageSquarePlus,
        card: "border-hazard/30 bg-hazard/10 hover:border-hazard/70",
        active: "border-hazard ring-1 ring-hazard",
        tile: "bg-hazard text-hazard-foreground",
        arrow: "text-amber-700 dark:text-hazard",
    },
];

/** How many tickets the recent card shows; the full list lives on My Tickets. */
const RECENT_LIMIT = 3;

/**
 * Public "Tickets & feedback" hub: send a ticket or feedback, and see what has been resolved.
 * Tracking lives on My Tickets; this page only shows the latest few and links there.
 */
export default function PublicTicketsPage() {
    const { user } = useAuth();

    const [myTickets, setMyTickets] = useState<Ticket[]>(() => getTicketsForUser(user?.email));
    const [panel, setPanel] = useState<Panel>("tickets");
    // The ticket just sent, so its ID and next step stay on screen after the form closes.
    const [submitted, setSubmitted] = useState<Ticket>();

    const removed = new Set(user ? readRemovedPremiseIds(user.email) : []);
    const premises =
        user && user.role === "business_premise"
            ? [...(user.businesses ?? []), ...readPremises(user.email)].filter(
                  (premise) => !removed.has(premise.id),
              )
            : [];

    const recent = myTickets.slice(0, RECENT_LIMIT);
    const resolved = getResolvedTickets();

    function openTicket(values: TicketFormValues) {
        const ticket = submitTicket({
            email: values.anonymous ? undefined : user?.email,
            category: values.category,
            description: values.description,
            location: values.location.address,
            latitude: values.location.latitude,
            longitude: values.location.longitude,
            premise: values.premise,
            hasPhoto: values.hasPhoto,
        });
        // Anonymous tickets carry no email, so they never show up in the account's list.
        if (ticket.submittedByEmail) setMyTickets((current) => [ticket, ...current]);
        setSubmitted(ticket);
        setPanel("tickets");
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
                <div className="mx-auto max-w-6xl px-4 pt-8 pb-6">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="size-2 rounded-full bg-hazard" aria-hidden />
                        Community
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-primary">
                        Tickets &amp; Feedback
                    </h1>

                    <div className="mt-8">
                        <PublicResolvedTickets tickets={resolved} />
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
                <div className="grid gap-4 sm:grid-cols-2">
                    {actions.map((action) => (
                        <button
                            key={action.panel}
                            type="button"
                            aria-pressed={panel === action.panel}
                            onClick={() => setPanel(panel === action.panel ? "tickets" : action.panel)}
                            className={cn(
                                "group flex items-start gap-3 rounded-xl border p-5 text-left shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none motion-reduce:transition-none",
                                action.card,
                                panel === action.panel && action.active,
                            )}
                        >
                            <span className={cn("rounded-lg p-2", action.tile)}>
                                <action.icon className="size-5" aria-hidden />
                            </span>
                            <span className="flex-1">
                                <span className="block font-semibold">{action.title}</span>
                                <span className="mt-0.5 block text-sm text-muted-foreground">
                                    {action.hint}
                                </span>
                            </span>
                            <ArrowRight
                                className={cn(
                                    "size-5 shrink-0 self-center opacity-0 -translate-x-1 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none",
                                    action.arrow,
                                )}
                                aria-hidden
                            />
                        </button>
                    ))}
                </div>

                {/* Recent tickets span the full width under the action cards; forms and the guest note stay narrow. */}
                <div className="space-y-4">
                    {panel === "tickets" && submitted && (
                        <div
                            role="status"
                            className={cn(
                                "flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4",
                                !user && "mx-auto max-w-3xl",
                            )}
                        >
                            <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold">Ticket {submitted.id} sent</p>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {submitted.submittedByEmail
                                        ? "The team will review it and reply. You can follow its progress in My Tickets."
                                        : user
                                          ? "You sent it anonymously, so it isn't linked to your account. Keep this ID if you contact the team about it."
                                          : "You sent it without an account. Keep this ID if you contact the team about it."}
                                </p>
                                {submitted.submittedByEmail && (
                                    <Button className="mt-3" size="sm" asChild>
                                        <Link to={PATHS.profileTickets}>Track it in My Tickets</Link>
                                    </Button>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0"
                                aria-label="Dismiss"
                                onClick={() => setSubmitted(undefined)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    )}

                    {panel === "tickets" && user ? (
                        <RecentTickets
                            tickets={recent}
                            onChange={(id, ticket) =>
                                setMyTickets((current) => applyTicketChange(current, id, ticket))
                            }
                        />
                    ) : (
                        <div className="mx-auto max-w-3xl rounded-xl border bg-card p-5 shadow-sm">
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
                    )}
                </div>
            </div>
        </div>
    );
}
