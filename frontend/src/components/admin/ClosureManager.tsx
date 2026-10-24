import { useState, type FormEvent } from "react";
import { MapPinned } from "lucide-react";
import { toast } from "sonner";
import LocationPicker, { type PickedLocation } from "@/components/custom/LocationPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClosure, readClosures, setClosureStatus } from "@/lib/admin/closures";
import { readAllPremises } from "@/lib/admin/users";
import { useAuth } from "@/lib/auth/auth";
import { AFFECTED_RADIUS_KM, isWithinRadius } from "@/lib/maps/geo";
import { CLOSURE_STATUS_LABEL, CLOSURE_STATUS_TONE, CLOSURE_STATUSES } from "@/lib/maps/mapConfig";
import type { ClosureStatus } from "@/types/road-closure";

const toIso = (local: string) => (local ? new Date(local).toISOString() : "");

const emptyForm = {
    title: "",
    road: "",
    area: "",
    reason: "",
    alternative: "",
    startAt: "",
    endAt: "",
    status: "active" as ClosureStatus,
};

const onlyClosures = () => readClosures().filter((closure) => closure.kind === "closure");

/** Admin tool: set temporary road closures and move them through their lifecycle. */
export default function ClosureManager() {
    const { user } = useAuth();
    const actor = user?.email ?? user?.name ?? "Admin";

    const premises = readAllPremises();
    const [closures, setClosures] = useState(onlyClosures);
    const [form, setForm] = useState(emptyForm);
    const [location, setLocation] = useState<PickedLocation | null>(null);

    const set = (patch: Partial<typeof emptyForm>) => setForm((current) => ({ ...current, ...patch }));

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!form.title.trim() || !form.road.trim() || !location || !form.startAt || !form.endAt) {
            toast.error("Add a title, road, both dates and a pinned location.");
            return;
        }
        createClosure(
            {
                title: form.title.trim(),
                road: form.road.trim(),
                area: form.area.trim(),
                reason: form.reason.trim(),
                alternative: form.alternative.trim(),
                latitude: location.latitude,
                longitude: location.longitude,
                startAt: toIso(form.startAt),
                endAt: toIso(form.endAt),
                status: form.status,
            },
            actor,
        );
        setForm(emptyForm);
        setLocation(null);
        setClosures(onlyClosures());
        toast.success("Road closure published.");
    }

    function changeStatus(id: string, status: ClosureStatus) {
        setClosureStatus(id, status, actor);
        setClosures(onlyClosures());
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPinned className="size-4" /> Set a temporary road closure
                    </CardTitle>
                    <CardDescription>Publish a closure and pin where it applies.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label htmlFor="closure-title">Title</Label>
                            <Input
                                id="closure-title"
                                className="mt-1.5"
                                value={form.title}
                                onChange={(event) => set({ title: event.target.value })}
                                placeholder="e.g. Jalan Macallum lane closure"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="closure-road">Road</Label>
                                <Input
                                    id="closure-road"
                                    className="mt-1.5"
                                    value={form.road}
                                    onChange={(event) => set({ road: event.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="closure-area">Area</Label>
                                <Input
                                    id="closure-area"
                                    className="mt-1.5"
                                    value={form.area}
                                    onChange={(event) => set({ area: event.target.value })}
                                />
                            </div>
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
                            <Label htmlFor="closure-alternative">Alternative route</Label>
                            <Input
                                id="closure-alternative"
                                className="mt-1.5"
                                value={form.alternative}
                                onChange={(event) => set({ alternative: event.target.value })}
                                placeholder="e.g. Follow the signposted diversion via Jalan Perak"
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
                        <div>
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(value) => set({ status: value as ClosureStatus })}>
                                <SelectTrigger className="mt-1.5">
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
                        <div>
                            <Label>Location</Label>
                            <LocationPicker value={location} onChange={setLocation} />
                        </div>
                        <Button type="submit" className="w-full">
                            Publish closure
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Closures</CardTitle>
                    <CardDescription>{closures.length} on record</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {closures.length === 0 && (
                        <p className="text-sm text-muted-foreground">No closures yet.</p>
                    )}
                    {closures.map((closure) => {
                        const affected = premises.filter((premise) =>
                            isWithinRadius(premise, closure, AFFECTED_RADIUS_KM),
                        );
                        return (
                        <div key={closure.id} className="rounded-lg border bg-card p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-medium">{closure.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {closure.road}
                                        {closure.area && ` · ${closure.area}`}
                                    </p>
                                </div>
                                <Badge variant="outline" className={CLOSURE_STATUS_TONE[closure.status]}>
                                    {CLOSURE_STATUS_LABEL[closure.status]}
                                </Badge>
                            </div>
                            {closure.reason && <p className="mt-2 text-sm">{closure.reason}</p>}
                            {closure.alternative && (
                                <p className="mt-1 text-sm">
                                    <span className="font-semibold">Alternative:</span> {closure.alternative}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                                {new Date(closure.startAt).toLocaleString("en-MY")} →{" "}
                                {new Date(closure.endAt).toLocaleString("en-MY")}
                            </p>
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
                                    <SelectTrigger className="h-8 w-40" aria-label={`Change status for ${closure.id}`}>
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
            </Card>
        </div>
    );
}
