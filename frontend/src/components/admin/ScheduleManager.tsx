import { useState, type FormEvent } from "react";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createScheduleItem, readSchedule, updateScheduleItem } from "@/lib/admin/schedule";
import { useAuth } from "@/lib/auth/auth";
import type { ScheduleStatus } from "@/types/schedule";
import { tone } from "@/lib/tones";

const statusLabels: Record<ScheduleStatus, string> = {
    upcoming: "Upcoming",
    ongoing: "Ongoing",
    completed: "Completed",
};

const statusTone: Record<ScheduleStatus, string> = {
    upcoming: tone.info,
    ongoing: tone.warning,
    completed: tone.success,
};

const toIso = (local: string) => (local ? new Date(local).toISOString() : "");

const emptyForm = {
    title: "",
    description: "",
    area: "",
    startsAt: "",
    endsAt: "",
    status: "upcoming" as ScheduleStatus,
};

/** Admin tool: add and update the public construction schedule. */
export default function ScheduleManager() {
    const { user } = useAuth();
    const actor = user?.email ?? user?.name ?? "Admin";

    const [items, setItems] = useState(() => readSchedule());
    const [form, setForm] = useState(emptyForm);

    const set = (patch: Partial<typeof emptyForm>) => setForm((current) => ({ ...current, ...patch }));

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!form.title.trim() || !form.startsAt || !form.endsAt) {
            toast.error("Add a title and both dates.");
            return;
        }
        createScheduleItem(
            {
                title: form.title.trim(),
                description: form.description.trim(),
                area: form.area.trim(),
                startsAt: toIso(form.startsAt),
                endsAt: toIso(form.endsAt),
                status: form.status,
            },
            actor,
        );
        setForm(emptyForm);
        setItems(readSchedule());
        toast.success("Schedule item added.");
    }

    function changeStatus(id: string, status: ScheduleStatus) {
        updateScheduleItem(id, { status }, actor);
        setItems(readSchedule());
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CalendarClock className="size-4" /> Update construction schedule
                    </CardTitle>
                    <CardDescription>Add a work package and set its progress.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label htmlFor="schedule-title">Title</Label>
                            <Input
                                id="schedule-title"
                                className="mt-1.5"
                                value={form.title}
                                onChange={(event) => set({ title: event.target.value })}
                                placeholder="e.g. Komtar station diaphragm walls"
                            />
                        </div>
                        <div>
                            <Label htmlFor="schedule-area">Area</Label>
                            <Input
                                id="schedule-area"
                                className="mt-1.5"
                                value={form.area}
                                onChange={(event) => set({ area: event.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="schedule-description">Description</Label>
                            <Textarea
                                id="schedule-description"
                                className="mt-1.5"
                                rows={3}
                                value={form.description}
                                onChange={(event) => set({ description: event.target.value })}
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="schedule-start">Starts</Label>
                                <Input
                                    id="schedule-start"
                                    type="date"
                                    className="mt-1.5"
                                    value={form.startsAt}
                                    onChange={(event) => set({ startsAt: event.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="schedule-end">Ends</Label>
                                <Input
                                    id="schedule-end"
                                    type="date"
                                    className="mt-1.5"
                                    value={form.endsAt}
                                    onChange={(event) => set({ endsAt: event.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Status</Label>
                            <Select
                                value={form.status}
                                onValueChange={(value) => set({ status: value as ScheduleStatus })}
                            >
                                <SelectTrigger className="mt-1.5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(["upcoming", "ongoing", "completed"] as ScheduleStatus[]).map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {statusLabels[status]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full">
                            Add schedule item
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Schedule</CardTitle>
                    <CardDescription>{items.length} work packages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {items.length === 0 && <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>}
                    {items.map((item) => (
                        <div key={item.id} className="rounded-lg border bg-card p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-medium">{item.title}</p>
                                    {item.area && <p className="text-sm text-muted-foreground">{item.area}</p>}
                                </div>
                                <Badge variant="outline" className={statusTone[item.status]}>
                                    {statusLabels[item.status]}
                                </Badge>
                            </div>
                            {item.description && <p className="mt-2 text-sm">{item.description}</p>}
                            <p className="mt-1 text-xs text-muted-foreground">
                                {new Date(item.startsAt).toLocaleDateString("en-MY")} →{" "}
                                {new Date(item.endsAt).toLocaleDateString("en-MY")}
                            </p>
                            <div className="mt-3">
                                <Select
                                    value={item.status}
                                    onValueChange={(value) => changeStatus(item.id, value as ScheduleStatus)}
                                >
                                    <SelectTrigger className="h-8 w-40" aria-label={`Change status for ${item.title}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(["upcoming", "ongoing", "completed"] as ScheduleStatus[]).map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {statusLabels[status]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
