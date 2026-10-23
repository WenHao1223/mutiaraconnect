import { useState } from "react";
import { Check, CircleParking, Clock, Inbox, Signpost, Store, Truck, UserRound, X, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import SupportStatusBadge from "@/components/business/SupportStatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth";
import {
    readSupportRequests,
    respondToSupportRequest,
    supportStatusMeta,
    supportTypeLabels,
} from "@/lib/business/support";
import { formatDate, formatDateTime } from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";
import type { SupportRequestStatus, SupportRequestType } from "@/types/business";

type Filter = SupportRequestStatus | "all";
type Decision = Exclude<SupportRequestStatus, "pending">;

const filters: Filter[] = ["pending", "arranged", "declined", "all"];

const typeIcons: Record<SupportRequestType, LucideIcon> = {
    signage: Signpost,
    delivery: Truck,
    parking: CircleParking,
};

/** Admin tool, laid out like ApplicationReview: support requests on the left, the selected one on the right. */
export default function SupportRequestAdmin() {
    const { user } = useAuth();
    const actor = user?.email ?? user?.name ?? "Admin";

    const [requests, setRequests] = useState(() => readSupportRequests());
    const [filter, setFilter] = useState<Filter>("pending");
    const [selectedId, setSelectedId] = useState<string>();
    const [editing, setEditing] = useState(false);
    const [reply, setReply] = useState("");

    const count = (value: Filter) =>
        value === "all" ? requests.length : requests.filter((request) => request.status === value).length;
    const visible = requests.filter((request) => filter === "all" || request.status === filter);
    const selected = visible.find((request) => request.id === selectedId) ?? visible[0];
    // Pending requests always show the reply form; answered ones only after "Edit response".
    const showForm = !!selected && (selected.status === "pending" || editing);

    function select(id: string) {
        setSelectedId(id);
        setEditing(false);
        setReply("");
    }

    function respond(decision: Decision) {
        if (!selected) return;
        const message = reply.trim() || `Request ${supportStatusMeta[decision].label.toLowerCase()}.`;
        respondToSupportRequest(selected.id, decision, message, actor);
        setRequests(readSupportRequests());
        setSelectedId(selected.id);
        setFilter("all");
        setEditing(false);
        setReply("");
        toast.success(`${selected.id} marked ${supportStatusMeta[decision].label.toLowerCase()}.`);
    }

    const TypeIcon = selected ? typeIcons[selected.type] : Inbox;

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Support requests</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {count("pending") === 0 ? "Nothing waiting for a reply." : `${count("pending")} waiting for a reply.`}
                </p>

                <div role="group" aria-label="Filter support requests" className="mt-3 flex flex-wrap gap-1.5">
                    {filters.map((value) => (
                        <Button
                            key={value}
                            type="button"
                            size="sm"
                            variant={filter === value ? "default" : "outline"}
                            aria-pressed={filter === value}
                            onClick={() => setFilter(value)}
                        >
                            {value === "all" ? "All" : supportStatusMeta[value].label} ({count(value)})
                        </Button>
                    ))}
                </div>

                {visible.length === 0 ? (
                    <div className="mt-4 rounded-lg bg-muted px-4 py-8 text-center">
                        <Inbox className="mx-auto size-8 text-muted-foreground" aria-hidden />
                        <p className="mt-2 text-sm font-medium">No support requests here</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Businesses ask from the support desk on their dashboard.
                        </p>
                    </div>
                ) : (
                    <ul className="mt-3 space-y-2">
                        {visible.map((request) => {
                            const isSelected = request.id === selected?.id;
                            return (
                                <li key={request.id}>
                                    <button
                                        type="button"
                                        aria-current={isSelected ? "true" : undefined}
                                        onClick={() => select(request.id)}
                                        className={cn(
                                            "w-full cursor-pointer rounded-lg border p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                            isSelected && "border-primary bg-accent",
                                        )}
                                    >
                                        <span className="flex items-start justify-between gap-2">
                                            <span className="text-sm font-semibold">
                                                {request.id} · {supportTypeLabels[request.type]}
                                            </span>
                                            <SupportStatusBadge status={request.status} />
                                        </span>
                                        <span className="mt-1 block text-sm text-muted-foreground">
                                            {request.premiseName} · {request.ownerName}
                                        </span>
                                        <span className="mt-1 block text-xs text-muted-foreground">
                                            Requested {formatDate(request.submittedAt)}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {selected && (
                <article className="rounded-xl border bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
                    <header className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <span className="rounded-lg bg-secondary/15 p-2.5 text-secondary">
                                <TypeIcon className="size-5" aria-hidden />
                            </span>
                            <div>
                                <h2 className="text-lg font-semibold">{supportTypeLabels[selected.type]}</h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {selected.id} · Requested {formatDate(selected.submittedAt)}
                                </p>
                            </div>
                        </div>
                        <SupportStatusBadge status={selected.status} />
                    </header>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <Store className="size-4" aria-hidden /> {selected.premiseName}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <UserRound className="size-4" aria-hidden /> {selected.ownerName}
                        </span>
                    </div>

                    <p className="mt-4 text-sm">{selected.note}</p>

                    {selected.reply && !editing && (
                        <div className="mt-5 rounded-lg bg-muted px-4 py-3 text-sm">
                            <p>
                                <span className="font-semibold">Response:</span> {selected.reply}
                            </p>
                            {selected.repliedAt && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {selected.repliedBy} · {formatDateTime(selected.repliedAt)}
                                </p>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={() => {
                                    setReply(selected.reply ?? "");
                                    setEditing(true);
                                }}
                            >
                                Edit response
                            </Button>
                        </div>
                    )}

                    {selected.status === "pending" && (
                        <p className="mt-5 flex items-start gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                            <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
                            No reply yet. Arrange or decline it below.
                        </p>
                    )}

                    {showForm && (
                        <div className="mt-5 space-y-3 border-t pt-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="support-reply">Message to the business</Label>
                                <Textarea
                                    id="support-reply"
                                    rows={3}
                                    maxLength={500}
                                    value={reply}
                                    onChange={(event) => setReply(event.target.value)}
                                    placeholder="e.g. Two signs will be put up at the back lane by Friday."
                                />
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                                {editing && (
                                    <Button variant="ghost" onClick={() => setEditing(false)}>
                                        Cancel
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => respond("declined")}>
                                    <X className="size-4" /> Decline
                                </Button>
                                <Button onClick={() => respond("arranged")}>
                                    <Check className="size-4" /> Arrange
                                </Button>
                            </div>
                        </div>
                    )}
                </article>
            )}
        </div>
    );
}
