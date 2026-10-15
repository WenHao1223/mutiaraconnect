import { useRef } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { SearchX, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import TicketDetail from "@/components/tickets/TicketDetail";
import TicketList from "@/components/tickets/TicketList";
import TicketLookup from "@/components/tickets/TicketLookup";
import { useAuth } from "@/lib/auth/auth";
import { findTicket, getTicketsForUser } from "@/lib/tickets";
import { PATHS } from "@/routes";
import type { AppUser } from "@/types/user";

const subtitles: Partial<Record<AppUser["role"], string>> = {
    resident: "Follow the reports you have raised until the responsible team responds.",
    business_premise: "Follow reports about your premise until the responsible team responds.",
};

/** My Tickets: shared by residents and business premises. Admins manage tickets elsewhere. */
export default function TicketsPage() {
    const { user } = useAuth();

    if (!user) return <Navigate to={PATHS.login} state={{ from: PATHS.profileTickets }} replace />;
    if (user.role === "admin" || user.role === "super_admin") {
        return <Navigate to={PATHS.admin} replace />;
    }
    return <TicketsView user={user} />;
}

function TicketsView({ user }: { user: AppUser }) {
    const [params, setParams] = useSearchParams();
    const detailRef = useRef<HTMLDivElement>(null);

    const myTickets = getTicketsForUser(user.email);
    // The selected ticket lives in the URL (?id=FB-2041) so it can be linked to and survives refresh.
    const requestedId = params.get("id");
    const selected = requestedId ? findTicket(requestedId) : myTickets[0];

    function select(id: string) {
        setParams({ id });
        // On small screens the detail sits below the list, so bring it into view.
        if (!window.matchMedia("(min-width: 1024px)").matches) {
            detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
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
                <div className="space-y-6">
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        <TicketLookup onFound={select} />
                    </div>

                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        <h2 className="mb-3 text-lg font-semibold">Your tickets</h2>
                        {myTickets.length === 0 ? (
                            <div className="rounded-lg bg-muted px-4 py-8 text-center">
                                <TicketIcon
                                    className="mx-auto size-8 text-muted-foreground"
                                    aria-hidden
                                />
                                <p className="mt-2 text-sm font-medium">No tickets yet</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Reports you submit will show up here.
                                </p>
                                <Button asChild className="mt-4" size="sm">
                                    <Link to={PATHS.feedback}>Submit a report</Link>
                                </Button>
                            </div>
                        ) : (
                            <TicketList
                                tickets={myTickets}
                                selectedId={selected?.id}
                                onSelect={select}
                            />
                        )}
                    </div>
                </div>

                <div
                    ref={detailRef}
                    aria-live="polite"
                    className="scroll-mt-20 rounded-xl border bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-24"
                >
                    {selected ? (
                        <TicketDetail ticket={selected} />
                    ) : (
                        <div className="py-10 text-center">
                            <SearchX className="mx-auto size-8 text-muted-foreground" aria-hidden />
                            <p className="mt-2 text-sm font-medium">
                                {requestedId
                                    ? `No ticket found for ${requestedId}.`
                                    : "Select a ticket to see its progress."}
                            </p>
                            {requestedId && myTickets.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => setParams({})}
                                >
                                    Back to my tickets
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}