import { Clock, ExternalLink, FileText, Hash, MapPin, Phone, Store } from "lucide-react";
import ApplicationProgress from "@/components/business/ApplicationProgress";
import ApplicationStatusBadge from "@/components/business/ApplicationStatusBadge";
import LocationPicker from "@/components/custom/LocationPicker";
import MapsLink from "@/components/custom/MapsLink";
import { businessTypeLabels } from "@/lib/business/business";
import { formatDate, formatDateTime } from "@/lib/tickets/tickets";
import type { BusinessApplication } from "@/types/business";

const ignoreLocationChange = () => undefined;

/** One business application, laid out like TicketDetail: summary, location, documents, decision. */
export default function ApplicationDetail({ application }: { application: BusinessApplication }) {
    return (
        <article>
            <header className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">{application.businessName}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {application.id} · Submitted {formatDate(application.submittedAt)}
                    </p>
                </div>
                <ApplicationStatusBadge status={application.status} />
            </header>

            <div className="mt-4">
                <ApplicationProgress status={application.status} />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                    <Store className="size-4" aria-hidden /> {businessTypeLabels[application.businessType]}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <Hash className="size-4" aria-hidden /> SSM {application.registrationNumber}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-4" aria-hidden /> {application.contactPhone}
                </span>
            </div>

            <section className="mt-4" aria-label="Shop location">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                        <MapPin className="size-4 text-muted-foreground" aria-hidden />
                        {application.premiseAddress || "Pinned on the map"}
                    </span>
                    <MapsLink location={application}>
                        Open in Google Maps <ExternalLink className="size-3" aria-hidden />
                    </MapsLink>
                </div>
                <LocationPicker
                    readOnly
                    hideCaption
                    recenterKey={application.id}
                    value={{
                        latitude: application.latitude,
                        longitude: application.longitude,
                        address: application.premiseAddress,
                    }}
                    onChange={ignoreLocationChange}
                />
            </section>

            <section className="mt-4" aria-label="Supporting documents">
                <ul className="flex flex-wrap gap-2">
                    {application.documents.map((name) => (
                        <li
                            key={name}
                            className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-sm"
                        >
                            <FileText className="size-4 text-muted-foreground" aria-hidden /> {name}
                        </li>
                    ))}
                </ul>
            </section>

            {application.status === "pending" ? (
                <p className="mt-5 flex items-start gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                    <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
                    No decision yet. An admin will review your application and we'll email you once it's decided.
                </p>
            ) : (
                <div className="mt-5 rounded-lg bg-muted px-4 py-3 text-sm">
                    <p>
                        {application.status === "approved" ? (
                            "Approved. Sign out and back in to switch to your business account."
                        ) : (
                            <>
                                <span className="font-semibold">Reason:</span> {application.rejectionReason}
                            </>
                        )}
                    </p>
                    {application.reviewedAt && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {application.reviewedBy} · {formatDateTime(application.reviewedAt)}
                        </p>
                    )}
                </div>
            )}
        </article>
    );
}
