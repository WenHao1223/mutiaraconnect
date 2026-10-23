import { ExternalLink, MapPin, Store } from "lucide-react";
import AccessNotices from "@/components/business/AccessNotices";
import MapsLink from "@/components/custom/MapsLink";
import { badgeVariants } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readAllPremises } from "@/lib/admin/users";
import { currentNotices, noticeTypeStyles, worksNear } from "@/lib/business/business";
import { AFFECTED_RADIUS_KM, isWithinRadius } from "@/lib/maps/geo";
import { formatDate } from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";

/** Public page: shops affected by the works, what changed, how to reach them, and that they're open. */
export default function BusinessNoticesPage() {
    const closures = currentNotices();
    const affected = readAllPremises()
        .map((premise) => ({
            premise,
            notices: closures.filter((closure) => isWithinRadius(premise, closure, AFFECTED_RADIUS_KM)),
            works: worksNear(premise),
        }))
        .filter(({ notices, works }) => notices.length > 0 || works.length > 0);

    return (
        <div className="flex-1 bg-background">
            <section className="border-b bg-muted/50">
                <div className="mx-auto max-w-6xl px-4 py-8">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="size-2 rounded-full bg-hazard" aria-hidden />
                        Community
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">Local Businesses</h1>
                    <p className="mt-1 max-w-2xl text-muted-foreground">
                        Shops near the LRT works are still open. Here's what has changed around them and how to
                        reach them while roads and entrances are affected.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
                {affected.length === 0 ? (
                    <div className="rounded-lg bg-muted px-4 py-8 text-center">
                        <Store className="mx-auto size-8 text-muted-foreground" aria-hidden />
                        <p className="mt-2 text-sm font-medium">No shops are affected by current works</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Notices appear here when a closure or access change is near a registered shop.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">
                                {affected.length === 1
                                    ? "1 shop is affected by current works."
                                    : `${affected.length} shops are affected by current works.`}
                            </p>
                            <ul className="flex flex-wrap gap-2" aria-label="Colour key">
                                {Object.values(noticeTypeStyles).map(({ label, tag }) => (
                                    <li key={label} className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", tag)}>
                                        {label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                            {affected.map(({ premise, notices, works }) => (
                                <Card key={premise.id}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-3">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Store className="size-4" /> {premise.name}
                                            </CardTitle>
                                            <span
                                                className={cn(
                                                    badgeVariants({ variant: "outline" }),
                                                    "whitespace-nowrap rounded-full border-success/30 bg-success/10 text-green-800",
                                                )}
                                            >
                                                Still open for business
                                            </span>
                                        </div>
                                        <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="inline-flex items-center gap-1.5">
                                                <MapPin className="size-4" aria-hidden />
                                                {premise.address || "Pinned on the map"}
                                            </span>
                                            <MapsLink location={premise}>
                                                Open in Google Maps <ExternalLink className="size-3" aria-hidden />
                                            </MapsLink>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {notices.length > 0 && <AccessNotices closures={notices} title="What's affected" />}
                                        {works.map((item) => (
                                            <article
                                                key={item.id}
                                                className={cn(
                                                    "rounded-lg border border-l-4 bg-card p-5",
                                                    noticeTypeStyles.construction.edge,
                                                )}
                                            >
                                                <div className="flex justify-between gap-3">
                                                    <div>
                                                        <span
                                                            className={cn(
                                                                "rounded px-1.5 py-0.5 text-[11px] font-medium",
                                                                noticeTypeStyles.construction.tag,
                                                            )}
                                                        >
                                                            {noticeTypeStyles.construction.label}
                                                        </span>
                                                        <h3 className="mt-1.5 text-lg font-semibold">{item.title}</h3>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{item.area}</span>
                                                </div>
                                                <p className="mt-2 text-sm">{item.description}</p>
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    {formatDate(item.startsAt)} – {formatDate(item.endsAt)}
                                                </p>
                                            </article>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
