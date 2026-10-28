import { useState, type FormEvent } from "react";
import { MapPinned } from "lucide-react";
import { toast } from "sonner";
import RoadPathPicker from "@/components/road/RoadPathPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createClosure, readClosures, setClosureSchedule, setClosureStatus } from "@/lib/admin/closures";
import { readSchedule, scheduleStatusLabels } from "@/lib/admin/schedule";
import { readAllPremises } from "@/lib/admin/users";
import { useAuth } from "@/lib/auth/auth";
import { AFFECTED_RADIUS_KM } from "@/lib/maps/geo";
import { CLOSURE_STATUS_LABEL, CLOSURE_STATUSES } from "@/lib/maps/mapConfig";
import {
    closureTitle,
    distanceToClosure,
    EXTENT_LABEL,
    extentOf,
    hoursLabel,
    TIME_LABEL,
    TIME_TONE,
    timeStatus,
} from "@/lib/road/closureDisplay";
import { formatDate } from "@/lib/tickets/tickets";
// import { tone } from "@/lib/tones";
import type { ClosureExtent, ClosureStatus, RoadPoint } from "@/types/road-closure";

// @TjeEwe
// const statusLabels: Record<ClosureStatus, string> = {
//     planned: "Planned",
//     active: "Active",
//     ended: "Ended",
// };

// const statusTone: Record<ClosureStatus, string> = {
//     planned: tone.info,
//     active: tone.danger,
//     ended: "border-transparent bg-muted text-muted-foreground",
// };

const toIso = (local: string) => (local ? new Date(local).toISOString() : "");

const emptyForm = {
    scheduleId: "",
    road: "",
    /** Optional qualifier for the title, e.g. "near Komtar". */
    detail: "",
    area: "",
    reason: "",
    pedestrian: "",
    startAt: "",
    endAt: "",
    extent: "full" as ClosureExtent,
    /** Off = closed all day; on = only between `from` and `to` each day. */
    timed: false,
    from: "23:00",
    to: "05:00",
};

const onlyClosures = () => readClosures().filter((closure) => closure.kind === "closure");

/** Admin tool: set temporary road closures and move them through their lifecycle. */
export default function ClosureManager() {
    const { user } = useAuth();
    const actor = user?.email ?? user?.name ?? "Admin";

    const premises = readAllPremises();
    const [closures, setClosures] = useState(onlyClosures);
    const [form, setForm] = useState(emptyForm);
    const [path, setPath] = useState<RoadPoint[]>([]);
    const schedules = readSchedule();
    const scheduleOptions = (area: string) => [...schedules].sort((a, b) => {
        const matchesArea = (value: string) => Boolean(area.trim()) && value.trim().toLowerCase() === area.trim().toLowerCase();
        return Number(matchesArea(b.area)) - Number(matchesArea(a.area))
            || Number(a.status === "completed") - Number(b.status === "completed")
            || a.startsAt.localeCompare(b.startsAt);
    });

    const set = (patch: Partial<typeof emptyForm>) => setForm((current) => ({ ...current, ...patch }));
    // Built from the road so every closure title follows the same format.
    const title = closureTitle(form.road, form.detail, form.timed ? { from: form.from, to: form.to } : undefined);

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!schedules.some((schedule) => schedule.id === form.scheduleId)) {
            toast.error("Select the construction schedule this road closure belongs to.");
            return;
        }
        if (!form.road.trim() || path.length < 2 || !form.startAt || !form.endAt) {
            toast.error("Add the road, both dates and draw the closed road on the map.");
            return;
        }
        // The pin sits on the middle of the drawn road.
        const location = path[Math.floor(path.length / 2)];
        createClosure(
            {
                scheduleId: form.scheduleId,
                title,
                road: form.road.trim(),
                area: form.area.trim(),
                reason: form.reason.trim(),
                // Routes to shops are planned around the drawn road, so closures carry no fixed detour.
                alternative: "",
                pedestrian: form.pedestrian.trim() || undefined,
                extent: form.extent,
                hours: form.timed ? { from: form.from, to: form.to } : undefined,
                path,
                latitude: location.latitude,
                longitude: location.longitude,
                startAt: toIso(form.startAt),
                endAt: toIso(form.endAt),
                // New closures follow their dates: upcoming until they start, then closed, then reopened.
                status: "active",
            },
            actor,
        );
        setForm(emptyForm);
        setPath([]);
        setClosures(onlyClosures());
        toast.success("Road closure published.");
    }

    function changeStatus(id: string, status: ClosureStatus) {
        setClosureStatus(id, status, actor);
        setClosures(onlyClosures());
    }

    function changeSchedule(id: string, scheduleId: string) {
        setClosureSchedule(id, scheduleId, actor);
        setClosures(onlyClosures());
        toast.success("Construction schedule updated.");
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPinned className="size-4" /> Set a temporary road closure
                    </CardTitle>
                    <CardDescription>Publish a closure and draw the closed road on the map.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label htmlFor="closure-schedule">Construction schedule (required)</Label>
                            <Select required value={form.scheduleId} onValueChange={(scheduleId) => set({ scheduleId })}>
                                <SelectTrigger id="closure-schedule" className="mt-1.5 w-full" aria-describedby="closure-schedule-help">
                                    <SelectValue placeholder="Select a construction schedule" />
                                </SelectTrigger>
                                <SelectContent>
                                    {scheduleOptions(form.area).map((schedule) => (
                                        <SelectItem key={schedule.id} value={schedule.id} textValue={schedule.title}>
                                            <span className="flex flex-col gap-1">
                                                <span>{schedule.title}</span>
                                                <span className="text-xs text-muted-foreground">{schedule.area} · {formatDate(schedule.startsAt)} – {formatDate(schedule.endsAt)} · {scheduleStatusLabels[schedule.status]}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p id="closure-schedule-help" className="mt-1.5 text-xs text-muted-foreground">
                                {schedules.length === 0
                                    ? "Add a schedule in the Construction schedule tab before publishing a closure."
                                    : "Select the construction work that requires this road closure. Matching-area schedules appear first; closure dates remain independent."}
                            </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="closure-road">Road</Label>
                                <Input
                                    id="closure-road"
                                    className="mt-1.5"
                                    value={form.road}
                                    onChange={(event) => set({ road: event.target.value })}
                                    placeholder="e.g. Jalan Penang"
                                />
                            </div>
                            <div>
                                <Label htmlFor="closure-area">Area</Label>
                                <Input
                                    id="closure-area"
                                    className="mt-1.5"
                                    value={form.area}
                                    onChange={(event) => set({ area: event.target.value })}
                                    placeholder="e.g. Komtar"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="closure-detail">Which part of the road (optional)</Label>
                            <Input
                                id="closure-detail"
                                className="mt-1.5"
                                value={form.detail}
                                onChange={(event) => set({ detail: event.target.value })}
                                placeholder="e.g. near Komtar, slip road"
                            />
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                Shown as:{" "}
                                <span className="font-medium text-foreground">
                                    {form.road.trim() ? title : "enter the road first"}
                                </span>
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="closure-reason">Reason</Label>
                            <Textarea
                                id="closure-reason"
                                className="mt-1.5"
                                rows={2}
                                value={form.reason}
                                onChange={(event) => set({ reason: event.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="closure-pedestrian">Pedestrian access</Label>
                            <Input
                                id="closure-pedestrian"
                                className="mt-1.5"
                                value={form.pedestrian}
                                onChange={(event) => set({ pedestrian: event.target.value })}
                                placeholder="e.g. Covered walkway on the north side"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="closure-start">Starts</Label>
                                <Input
                                    id="closure-start"
                                    type="datetime-local"
                                    className="mt-1.5"
                                    value={form.startAt}
                                    onChange={(event) => set({ startAt: event.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="closure-end">Ends</Label>
                                <Input
                                    id="closure-end"
                                    type="datetime-local"
                                    className="mt-1.5"
                                    value={form.endAt}
                                    onChange={(event) => set({ endAt: event.target.value })}
                                />
                            </div>
                        </div>
                        <p className="-mt-2 text-xs text-muted-foreground">
                            Shown as Upcoming until it starts, then Closed now, and hidden once it ends.
                        </p>
                        <div>
                            <Label>How much is closed</Label>
                            <Select value={form.extent} onValueChange={(value) => set({ extent: value as ClosureExtent })}>
                                <SelectTrigger className="mt-1.5 w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full">{EXTENT_LABEL.full}</SelectItem>
                                    <SelectItem value="partial">{EXTENT_LABEL.partial}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="closure-timed">Only closed at certain hours</Label>
                                <Switch
                                    id="closure-timed"
                                    checked={form.timed}
                                    onCheckedChange={(checked) => set({ timed: checked })}
                                />
                            </div>
                            {form.timed ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="closure-from">Closes at</Label>
                                        <Input
                                            id="closure-from"
                                            type="time"
                                            className="mt-1.5"
                                            value={form.from}
                                            onChange={(event) => set({ from: event.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="closure-to">Reopens at</Label>
                                        <Input
                                            id="closure-to"
                                            type="time"
                                            className="mt-1.5"
                                            value={form.to}
                                            onChange={(event) => set({ to: event.target.value })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">Closed all day, every day, between the dates above.</p>
                            )}
                        </div>
                        <div>
                            <Label>Closed road</Label>
                            <RoadPathPicker path={path} onPathChange={setPath} extent={form.extent} />
                        </div>
                        <Button type="submit" className="w-full" disabled={schedules.length === 0}>
                            Publish closure
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg">Closures</CardTitle>
                    <CardDescription>{closures.length} on record</CardDescription>
                </CardHeader>
                {/*
                 * On wide screens the list is taken out of the layout (absolute) so the form alone sets
                 * the row height; the card stretches to match it and the list scrolls inside.
                 */}
                <div className="relative min-h-0 flex-1">
                    <CardContent className="space-y-3 lg:absolute lg:inset-0 lg:overflow-y-auto">
                        {closures.length === 0 && (
                            <p className="text-sm text-muted-foreground">No closures yet.</p>
                        )}
                        {closures.map((closure) => {
                            // Same rule as the public map: within range of any part of the closed road.
                            const { state } = timeStatus(closure);
                            const affected = premises.filter(
                                (premise) => distanceToClosure(premise, closure) <= AFFECTED_RADIUS_KM,
                            );
                            return (
                            <div key={closure.id} className="rounded-lg border bg-card p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-medium">{closure.title}</p>
                                        {closure.area && <p className="text-sm text-muted-foreground">{closure.area}</p>}
                                    </div>
                                    {/* Same date-based state the public map shows, so both sides always agree. */}
                                    <Badge variant="outline" className={TIME_TONE[state]}>
                                        {state === "ended" && closure.status === "ended" ? "Ended" : TIME_LABEL[state]}
                                    </Badge>
                                </div>
                                <p className="mt-1 text-xs font-medium">
                                    {EXTENT_LABEL[extentOf(closure)]} · {hoursLabel(closure.hours)}
                                </p>
                                {closure.reason && <p className="mt-2 text-sm">{closure.reason}</p>}
                                {closure.pedestrian && (
                                    <p className="mt-1 text-sm">
                                        <span className="font-semibold">Pedestrians:</span> {closure.pedestrian}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {formatDate(closure.startAt)} – {formatDate(closure.endAt)}
                                </p>
                                <div className="mt-3">
                                    <Label htmlFor={`closure-schedule-${closure.id}`}>Construction schedule</Label>
                                    <Select
                                        value={schedules.find((schedule) => schedule.closureIds?.includes(closure.id))?.id ?? ""}
                                        onValueChange={(scheduleId) => changeSchedule(closure.id, scheduleId)}
                                        disabled={schedules.length === 0}
                                    >
                                        <SelectTrigger id={`closure-schedule-${closure.id}`} className="mt-1.5 w-full">
                                            <SelectValue placeholder="No schedule linked — select one" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {scheduleOptions(closure.area).map((schedule) => (
                                                <SelectItem key={schedule.id} value={schedule.id} textValue={schedule.title}>
                                                    <span className="flex flex-col gap-1">
                                                        <span>{schedule.title}</span>
                                                        <span className="text-xs text-muted-foreground">{schedule.area} · {formatDate(schedule.startsAt)} – {formatDate(schedule.endsAt)} · {scheduleStatusLabels[schedule.status]}</span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {affected.length === 0
                                        ? `No business premises within ${Math.round(AFFECTED_RADIUS_KM * 1000)} m.`
                                        : `Affects: ${affected.map((premise) => premise.name).join(", ")}`}
                                </p>
                                <div className="mt-3">
                                    <Select
                                        value={closure.status}
                                        onValueChange={(value) => changeStatus(closure.id, value as ClosureStatus)}
                                    >
                                        <SelectTrigger className="h-8 w-56" aria-label={`Change status for ${closure.id}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CLOSURE_STATUSES.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {CLOSURE_STATUS_LABEL[status]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            );
                        })}
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
