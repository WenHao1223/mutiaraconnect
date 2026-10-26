import { Fragment, useState, type ReactNode } from "react";
import {
    BadgeCheck,
    Ellipsis,
    ExternalLink,
    FileText,
    ListChecks,
    Lock,
    MapIcon,
    MapPin,
    Paperclip,
    Pencil,
    Store,
    Trash2,
    Users,
    type LucideIcon,
} from "lucide-react";
import LocationPicker from "@/components/custom/LocationPicker";
import MapsLink from "@/components/custom/MapsLink";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    editTicket,
    formatDate,
    isBusinessOwner,
    isEditable,
    STATUS_ORDER,
    statusMeta,
    withdrawTicket,
} from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";
import CategoryBadge from "@/components/tickets/CategoryBadge";
import NearestStation from "@/components/tickets/NearestStation";
import StatusIcon from "@/components/tickets/StatusIcon";
import TicketForm, { type TicketFormValues } from "@/components/tickets/TicketForm";
import type { Ticket } from "@/types/ticket";

const ignoreLocationChange = () => undefined;

/** One block of the ticket details: a divider, a small grey title, then the content in full colour. */
function Section({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: LucideIcon;
    children: ReactNode;
}) {
    return (
        <section aria-label={title} className="border-t pt-5">
            <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Icon className="size-3.5" aria-hidden />
                {title}
            </h3>
            <div className="mt-2.5">{children}</div>
        </section>
    );
}

/** Who posted an update, as a small grey tag so it reads as "who", not as part of the message. */
function TeamTag({ team }: { team: string }) {
    return (
        <Badge
            variant="outline"
            className="gap-1 rounded-full px-2 font-normal text-muted-foreground"
        >
            <Users className="size-3" aria-hidden />
            {team}
        </Badge>
    );
}

/**
 * Everything about one ticket, in sections: the report, location and progress. Progress is one
 * timeline of all four stages, newest at the top: stages reached show the team's updates, the
 * current one is highlighted and the ones still to come are faded.
 * `anonymous` is for showing other people's tickets in public: it leaves out the reporter's own
 * words, premise, photo, business badge and exact map pin, keeping the area name and the team's replies.
 * `onChange` is for the reporter's own views: it adds Edit and Withdraw while the ticket is still
 * "received", and reports the edited ticket (or undefined once withdrawn) back to the list.
 * `onEditingChange` lets a container react to edit mode (the popup hides its Close footer).
 */
export default function TicketDetail({
    ticket,
    anonymous = false,
    onChange,
    onEditingChange,
}: {
    ticket: Ticket;
    anonymous?: boolean;
    onChange?: (ticket: Ticket | undefined) => void;
    onEditingChange?: (editing: boolean) => void;
}) {
    // Keyed by id, so switching to another ticket leaves edit mode.
    const [editingId, setEditing] = useState<string>();
    const [confirmWithdraw, setConfirmWithdraw] = useState(false);
    // Phones show the owner actions as an inline row under the header instead of a dropdown.
    // Keyed by id, so it closes when another ticket opens.
    const [actionsFor, setActionsFor] = useState<string>();
    function setEditingId(id: string | undefined) {
        setEditing(id);
        onEditingChange?.(!!id);
    }
    const owner = !!onChange && !anonymous && !!ticket.submittedByEmail;

    function save(values: TicketFormValues) {
        const updated = editTicket(ticket.id, {
            description: values.description,
            location: values.location.address,
            latitude: values.location.latitude,
            longitude: values.location.longitude,
            // Edit can only add photos, so once attached it stays true.
            hasPhoto: ticket.hasPhoto || values.hasPhoto,
            photos: [...(ticket.photos ?? []), ...values.photos],
        });
        setEditingId(undefined);
        toast.success(`Ticket ${ticket.id} updated.`);
        onChange?.(updated);
    }

    function withdraw() {
        withdrawTicket(ticket.id);
        toast.success(`Ticket ${ticket.id} withdrawn.`);
        onChange?.(undefined);
    }

    const hasPin = typeof ticket.latitude === "number" && typeof ticket.longitude === "number";

    if (owner && editingId === ticket.id) {
        return (
            <article>
                <h2 className="text-lg font-semibold">Edit {ticket.id}</h2>
                <div className="mt-4">
                    <TicketForm
                        initialValues={{
                            category: ticket.category,
                            description: ticket.description,
                            hasPhoto: !!ticket.hasPhoto,
                            location: hasPin
                                ? {
                                      latitude: ticket.latitude as number,
                                      longitude: ticket.longitude as number,
                                      address: ticket.location,
                                  }
                                : null,
                        }}
                        onSubmit={save}
                        onCancel={() => setEditingId(undefined)}
                    />
                </div>
            </article>
        );
    }

    const editable = isEditable(ticket);
    const actionsOpen = actionsFor === ticket.id;
    // The same hint and ⋯ icon on both layouts.
    const actionsHint = editable ? (
        "You can change this ticket until the team starts reviewing it."
    ) : (
        <>
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            The team has started on this ticket, so it can no longer be changed.
        </>
    );
    const moreIcon = (
        <Ellipsis className="size-4 transition-transform duration-300 group-data-[state=open]/more:rotate-90 motion-reduce:transition-none" />
    );

    const current = STATUS_ORDER.indexOf(ticket.status);
    const style = statusMeta[ticket.status];
    const stages = [...STATUS_ORDER].reverse();

    const hasCoords = !anonymous && hasPin;
    // Directions when we have a pin; otherwise fall back to searching the area by name.
    const mapsLocation = hasCoords
        ? { latitude: ticket.latitude as number, longitude: ticket.longitude as number }
        : ticket.location;

    return (
        <article className="space-y-5">
            <header>
                <div className="flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-1.5 text-lg font-semibold">
                        <span>{ticket.id}</span>
                        {!anonymous && isBusinessOwner(ticket) && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        className="inline-flex text-primary"
                                        tabIndex={0}
                                        aria-label="Business owner verified"
                                    >
                                        <BadgeCheck className="size-4" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>Business owner verified</TooltipContent>
                            </Tooltip>
                        )}
                    </h2>
                    <div className="flex items-center gap-3">
                        {/* The reporter's own controls behind one ⋯ button, which turns as it opens: a dropdown
                            on wider screens, an inline row under the header on phones. Once the team has
                            started, the same hint explains why both are greyed out. */}
                        {owner && (
                            <>
                                <div className="hidden sm:block">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="group/more size-8 rounded-full"
                                                aria-label="Manage ticket"
                                            >
                                                {moreIcon}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        {/* The app's standard menu; only the hint text is toned down and wraps. */}
                                        <DropdownMenuContent align="end" className="w-60">
                                            <DropdownMenuLabel className="flex items-start gap-2 text-xs font-normal text-muted-foreground">
                                                {actionsHint}
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                disabled={!editable}
                                                onSelect={() => setEditingId(ticket.id)}
                                            >
                                                <Pencil aria-hidden />
                                                Edit ticket
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                disabled={!editable}
                                                className="text-destructive focus:text-destructive"
                                                onSelect={() => setConfirmWithdraw(true)}
                                            >
                                                <Trash2 aria-hidden />
                                                Withdraw ticket
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="group/more size-8 rounded-full sm:hidden"
                                    aria-label="Manage ticket"
                                    aria-expanded={actionsOpen}
                                    data-state={actionsOpen ? "open" : "closed"}
                                    onClick={() =>
                                        setActionsFor(actionsOpen ? undefined : ticket.id)
                                    }
                                >
                                    {moreIcon}
                                </Button>
                            </>
                        )}
                        {/* The one status icon in the details; the timeline below uses plain dots. */}
                        <StatusIcon status={ticket.status} size="lg" />
                    </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                    <CategoryBadge category={ticket.category} />
                    <p className="text-xs text-muted-foreground">
                        <span className="sr-only">Submitted </span>
                        {formatDate(ticket.submittedAt)}
                    </p>
                </div>
                {owner && actionsOpen && (
                    <div className="mt-3 rounded-lg border p-3 animate-in fade-in-0 slide-in-from-top-1 sm:hidden">
                        <p className="flex items-start gap-2 text-xs text-muted-foreground">
                            {actionsHint}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!editable}
                                onClick={() => setEditingId(ticket.id)}
                            >
                                <Pencil aria-hidden />
                                Edit ticket
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!editable}
                                className="text-destructive hover:text-destructive"
                                onClick={() => setConfirmWithdraw(true)}
                            >
                                <Trash2 aria-hidden />
                                Withdraw
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            {!anonymous && (
                <Section title="Your report" icon={FileText}>
                    <p className="text-sm">{ticket.description}</p>
                    {(ticket.premise || ticket.hasPhoto) && (
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {ticket.premise && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Store className="size-4" aria-hidden /> {ticket.premise}
                                </span>
                            )}
                            {ticket.hasPhoto && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Paperclip className="size-4" aria-hidden /> Photo attached
                                </span>
                            )}
                        </div>
                    )}
                </Section>
            )}

            <Section title="Location" icon={MapIcon}>
                {/* A place card: the map (own tickets only) above a row with the place and the Maps link. */}
                <div className="overflow-hidden rounded-lg border">
                    {hasCoords && (
                        <LocationPicker
                            readOnly
                            hideCaption
                            embedded
                            recenterKey={ticket.id}
                            value={{
                                latitude: ticket.latitude as number,
                                longitude: ticket.longitude as number,
                                address: ticket.location,
                            }}
                            onChange={ignoreLocationChange}
                        />
                    )}
                    <div
                        className={cn(
                            "flex items-center gap-3 bg-card p-3",
                            hasCoords && "border-t",
                        )}
                    >
                        <span className="rounded-lg bg-primary/10 p-2 text-primary">
                            <MapPin className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{ticket.location}</p>
                            {hasPin && (
                                <NearestStation
                                    point={{
                                        latitude: ticket.latitude as number,
                                        longitude: ticket.longitude as number,
                                    }}
                                    className="mt-0.5 text-xs"
                                />
                            )}
                        </div>
                        <MapsLink
                            location={mapsLocation}
                            mode={hasCoords ? "directions" : "search"}
                            className="shrink-0 rounded-full border px-2 py-1.5 text-xs hover:bg-accent hover:no-underline sm:px-3"
                        >
                            {/* Phones get just the icon; the words stay for screen readers. */}
                            <span className="sr-only sm:not-sr-only">Open in Google Maps</span>
                            <ExternalLink className="size-3.5 sm:size-3" aria-hidden />
                        </MapsLink>
                    </div>
                </div>
            </Section>

            <Section title="Progress" icon={ListChecks}>
                <ol>
                    {stages.map((step, index) => {
                        const stage = STATUS_ORDER.indexOf(step);
                        const reached = stage <= current;
                        const isCurrent = stage === current;
                        const isLast = index === stages.length - 1;
                        const updates = ticket.updates.filter((u) => u.status === step).reverse();
                        return (
                            <li
                                key={step}
                                aria-current={isCurrent ? "step" : undefined}
                                className="relative flex gap-3 pb-4 last:pb-0"
                            >
                                {/* Line down to the next (earlier) stage. */}
                                {!isLast && (
                                    <span
                                        className={cn(
                                            "absolute top-4 bottom-0 left-2 w-0.5 -translate-x-1/2",
                                            reached ? style.fill : "bg-border",
                                        )}
                                        aria-hidden
                                    />
                                )}
                                <span className="relative flex size-4 shrink-0 items-center justify-center pt-1">
                                    <span
                                        className={cn(
                                            "block rounded-full",
                                            isCurrent
                                                ? cn("size-4 ring-4", style.fill, style.ring)
                                                : reached
                                                  ? cn("size-2.5", style.fill)
                                                  : "size-2.5 border-2 border-muted-foreground/30 bg-card",
                                        )}
                                    />
                                </span>
                                <div
                                    className={cn(
                                        "min-w-0 flex-1",
                                        // The highlight grows outwards (negative margin, matching padding), so the
                                        // text and date stay in line with the other stages.
                                        isCurrent &&
                                            "-my-2 -mr-3 -ml-1.5 rounded-lg bg-muted py-2 pr-3 pl-1.5",
                                        !reached && "text-muted-foreground",
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                                            <p
                                                className={cn(
                                                    "text-sm font-semibold",
                                                    isCurrent && style.text,
                                                )}
                                            >
                                                {statusMeta[step].label}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-xs text-muted-foreground">
                                            {/* A stage can be skipped (e.g. straight to In Progress): passed, so no "Waiting", just no update. */}
                                            {updates[0]
                                                ? formatDate(updates[0].at)
                                                : !reached && "Waiting"}
                                        </span>
                                    </div>
                                    {/* Each message is the main text, tagged with who sent it. On wider screens a two-column
                                        grid (tag column as wide as the widest tag) lines the messages up; on phones the
                                        message sits below its tag. */}
                                    {updates.length > 0 && (
                                        <div className="mt-1.5 grid grid-cols-1 items-start justify-items-start gap-x-2 gap-y-1.5 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
                                            {updates.map((update) => (
                                                <Fragment key={update.at}>
                                                    <TeamTag team={update.by} />
                                                    <p className="pt-px">{update.message}</p>
                                                </Fragment>
                                            ))}
                                        </div>
                                    )}
                                    {/* Right after submitting, say what happens next. */}
                                    {ticket.status === "received" && stage === current + 1 && (
                                        <p className="mt-1 text-sm">
                                            A team member will review your ticket soon.
                                        </p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </Section>

            <AlertDialog open={confirmWithdraw} onOpenChange={setConfirmWithdraw}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Withdraw {ticket.id}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The team won't review this ticket. This can't be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep ticket</AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={withdraw}
                        >
                            Withdraw
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </article>
    );
}
