import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BadgeCheck, Clock, ExternalLink, LifeBuoy, MapPin, Navigation, Signpost, Store, Ticket as TicketIcon, Truck } from "lucide-react";
import SummaryCard from "@/components/admin/SummaryCard";
import AccessNotices from "@/components/business/AccessNotices";
import MapsLink from "@/components/custom/MapsLink";
import TicketDetail from "@/components/tickets/TicketDetail";
import TicketList from "@/components/tickets/TicketList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { readClosures } from "@/lib/admin/closures";
import { useAuth } from "@/lib/auth/auth";
import { premisesFor } from "@/lib/business/business";
import { AFFECTED_RADIUS_KM, isWithinRadius } from "@/lib/maps/geo";
import { getTicketsForUser, isOpen } from "@/lib/tickets/tickets";
import { PATHS } from "@/routes";

/** What the support desk offers affected businesses. */
const supportServices = [
    { icon: Signpost, title: "Free signage for alternative entrances" },
    { icon: Truck, title: "Delivery window coordination" },
];

/** Business Dashboard: home for business premise accounts (route is guarded by RequireRole). */
export default function BusinessDashboardPage() {
    const { user } = useAuth();
    const [selectedId, setSelectedId] = useState<string>();

    if (!user) return null;

    const premises = premisesFor(user.email ?? user.ic ?? user.name, user.businesses);
    const origins = premises.map(({ name, latitude, longitude }) => ({ name, latitude, longitude }));
    // Same rule AccessNotices uses to decide what to list.
    const nearby = readClosures().filter((closure) =>
        origins.some((origin) => isWithinRadius(origin, closure, AFFECTED_RADIUS_KM)),
    );
    const tickets = getTicketsForUser(user.email);
    const selected = tickets.find((ticket) => ticket.id === selectedId);

    return (
        <div className="flex-1 bg-background">
            <section className="border-b bg-muted/50">
                <div className="mx-auto max-w-6xl px-4 py-8">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="size-2 rounded-full bg-hazard" aria-hidden />
                        Business
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">Business Dashboard</h1>
                    <p className="mt-1 text-muted-foreground">
                        Works and closures near your premises, notices from the project team and your tickets.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
                <div className="grid gap-4 sm:grid-cols-3">
                    <SummaryCard label="Premises" value={premises.length} icon={Store} hint="Registered to you" />
                    <SummaryCard
                        label="Notices nearby"
                        value={nearby.length}
                        icon={AlertTriangle}
                        tone="bg-hazard/15 text-amber-700"
                        hint={`Within ${Math.round(AFFECTED_RADIUS_KM * 1000)} m`}
                    />
                    <SummaryCard
                        label="Open tickets"
                        value={tickets.filter(isOpen).length}
                        icon={TicketIcon}
                        tone="bg-info/10 text-info"
                        hint="Awaiting resolution"
                    />
                </div>

                <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <BadgeCheck className="size-4" /> Your premises
                                </CardTitle>
                                <CardDescription>
                                    {premises.length === 1
                                        ? "1 premise registered to this account."
                                        : `${premises.length} premises registered to this account.`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {premises.map((premise, index) => (
                                    <div key={premise.id} className="text-sm">
                                        {index > 0 && <Separator className="mb-4" />}
                                        <p className="font-medium">{premise.name}</p>
                                        <p className="text-muted-foreground">{premise.address || "Pinned on the map"}</p>
                                        <MapsLink location={premise} className="mt-1 text-xs">
                                            Open in Google Maps <ExternalLink className="size-3" aria-hidden />
                                        </MapsLink>
                                    </div>
                                ))}
                            </CardContent>
                            <CardFooter>
                                <Button asChild variant="outline">
                                    <Link to={PATHS.profileBusiness}>Manage premises</Link>
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <TicketIcon className="size-4" /> Your tickets
                                </CardTitle>
                                <CardDescription>Access issues and other tickets about your premises.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {tickets.length === 0 ? (
                                    <p className="rounded-lg bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
                                        No tickets yet.
                                    </p>
                                ) : (
                                    <TicketList
                                        tickets={tickets}
                                        selectedId={selected?.id}
                                        // Clicking the open ticket again closes it.
                                        onSelect={(id) => setSelectedId((current) => (current === id ? undefined : id))}
                                    />
                                )}
                                {selected && (
                                    <div>
                                        <button
                                            type="button"
                                            className="mb-3 text-xs font-medium text-primary hover:underline"
                                            onClick={() => setSelectedId(undefined)}
                                        >
                                            ✕ Close details
                                        </button>
                                        <TicketDetail ticket={selected} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Same shape as the "Is your shop affected?" box, in LRT Teal. */}
                        <section className="rounded-lg bg-secondary p-6 text-white" aria-labelledby="support-desk">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <h3 id="support-desk" className="flex items-center gap-2 text-xl font-semibold">
                                        <LifeBuoy className="size-5" aria-hidden /> Need help during the works?
                                    </h3>
                                    <p className="mt-2 text-sm opacity-90">
                                        Our support desk is here for businesses affected by the construction.
                                    </p>
                                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium">
                                        <span className="inline-flex items-center gap-1.5">
                                            <MapPin className="size-4" aria-hidden /> Komtar Level 1
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Clock className="size-4" aria-hidden /> Mon–Fri, 9am–5pm
                                        </span>
                                    </p>
                                    <ul className="mt-4 flex flex-wrap gap-2">
                                        {supportServices.map(({ icon: Icon, title }) => (
                                            <li
                                                key={title}
                                                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium"
                                            >
                                                <Icon className="size-4" aria-hidden /> {title}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <MapsLink
                                    location="Komtar, George Town, Penang"
                                    mode="directions"
                                    className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-foreground hover:no-underline hover:opacity-90"
                                >
                                    <Navigation className="size-4" aria-hidden /> Visit the desk
                                </MapsLink>
                            </div>
                        </section>
                    </div>

                    <aside className="space-y-4">
                        <div className="rounded-lg bg-primary p-6 text-primary-foreground">
                            <h3 className="text-xl font-semibold">Is your shop affected?</h3>
                            <p className="mt-2 text-sm opacity-90">
                                Report blocked entrances, loading restrictions or lost parking. We'll forward it to
                                the site team.
                            </p>
                            <Link
                                to={PATHS.profileTickets}
                                className="mt-4 inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
                            >
                                Report access issue
                            </Link>
                        </div>

                        <AccessNotices closures={nearby} origins={origins} />
                    </aside>
                </div>
            </div>
        </div>
    );
}
