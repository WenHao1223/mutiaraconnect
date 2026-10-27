import { useState, type ReactNode } from "react";
import { CalendarDays, ImageOff, MapPin, Store, UserRound } from "lucide-react";
import CategoryBadge from "@/components/tickets/CategoryBadge";
import StatusBadge from "@/components/tickets/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { formatDateTime, statusMeta } from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";

/**
 * One ticket in full beside the admin table: the reporter's photos (click one to enlarge), what
 * they wrote, where and who, then the history, with the Update button at the bottom.
 */
export default function TicketSheet({
    ticket,
    onClose,
    onUpdate,
}: {
    ticket?: Ticket;
    onClose: () => void;
    onUpdate: (ticket: Ticket) => void;
}) {
    const [enlarged, setEnlarged] = useState<number>();
    const photos = ticket?.photos ?? [];

    return (
        <Sheet open={!!ticket} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
                {ticket && (
                    <>
                        <SheetHeader className="border-b px-6 py-5 text-left">
                            <div className="flex flex-wrap items-center gap-2">
                                <SheetTitle>{ticket.id}</SheetTitle>
                                <StatusBadge status={ticket.status} />
                            </div>
                            <SheetDescription asChild>
                                <div className="flex flex-wrap items-center gap-2">
                                    <CategoryBadge category={ticket.category} />
                                    <span>Sent {formatDateTime(ticket.submittedAt)}</span>
                                </div>
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
                            {photos.length > 0 ? (
                                <ul
                                    className={cn(
                                        "grid gap-2",
                                        photos.length === 1 ? "grid-cols-1" : "grid-cols-2",
                                    )}
                                    aria-label="Photos"
                                >
                                    {photos.map((src, index) => (
                                        <li key={index}>
                                            <button
                                                type="button"
                                                onClick={() => setEnlarged(index)}
                                                className="block w-full overflow-hidden rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                aria-label={`Enlarge photo ${index + 1}`}
                                            >
                                                <img
                                                    src={src}
                                                    alt=""
                                                    className="aspect-[4/3] w-full object-cover transition-transform duration-200 hover:scale-105 motion-reduce:transition-none"
                                                />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                ticket.hasPhoto && (
                                    <p className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                                        <ImageOff className="mt-0.5 size-4 shrink-0" aria-hidden />
                                        The reporter attached a photo, but it was sent before photos
                                        were kept, so it can't be shown.
                                    </p>
                                )
                            )}

                            <section>
                                <h3 className="text-sm font-semibold">Report</h3>
                                <p className="mt-1 text-sm whitespace-pre-line">
                                    {ticket.description}
                                </p>
                                <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2">
                                    <Detail icon={MapPin} label="Location">
                                        {ticket.location}
                                    </Detail>
                                    {ticket.premise && (
                                        <Detail icon={Store} label="Premise">
                                            {ticket.premise}
                                        </Detail>
                                    )}
                                    <Detail icon={UserRound} label="Reporter">
                                        {ticket.submittedByEmail ?? "Anonymous"}
                                    </Detail>
                                    <Detail icon={CalendarDays} label="Last update">
                                        {formatDateTime(ticket.updatedAt)}
                                    </Detail>
                                </dl>
                            </section>

                            <section>
                                <h3 className="text-sm font-semibold">History</h3>
                                {/* Newest first, each dot in its status colour. */}
                                <ol className="mt-3 space-y-4 border-l pl-4">
                                    {[...ticket.updates].reverse().map((update, index) => (
                                        <li key={index} className="relative">
                                            <span
                                                className={cn(
                                                    "absolute top-1 -left-[21px] size-2.5 rounded-full ring-2 ring-background",
                                                    statusMeta[update.status].fill,
                                                )}
                                                aria-hidden
                                            />
                                            <p className="text-sm font-medium">
                                                {statusMeta[update.status].label}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {update.message}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {update.by} · {formatDateTime(update.at)}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        </div>

                        <div className="border-t px-6 py-4">
                            <Button className="w-full" onClick={() => onUpdate(ticket)}>
                                Update status
                            </Button>
                        </div>
                    </>
                )}

                {/* A photo at full size, over the panel. Inside the panel so clicking it doesn't close the panel. */}
                <Dialog
                    open={enlarged !== undefined}
                    onOpenChange={(open) => !open && setEnlarged(undefined)}
                >
                    <DialogContent className="max-w-3xl p-2">
                        <DialogTitle className="sr-only">
                            Photo {(enlarged ?? 0) + 1} of {photos.length}
                        </DialogTitle>
                        {enlarged !== undefined && (
                            <img
                                src={photos[enlarged]}
                                alt={`Photo ${enlarged + 1} attached to ${ticket?.id}`}
                                className="max-h-[80vh] w-full rounded-md object-contain"
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </SheetContent>
        </Sheet>
    );
}

/** One fact about the ticket, with its icon. */
function Detail({
    icon: Icon,
    label,
    children,
}: {
    icon: typeof MapPin;
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex items-start gap-2">
            <dt className="sr-only">{label}</dt>
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <dd className="min-w-0 break-words text-foreground">{children}</dd>
        </div>
    );
}
