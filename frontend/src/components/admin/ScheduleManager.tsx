import { useId, useRef, useState, type FormEvent } from "react";
import { CalendarClock, ChevronDown, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { readAnnouncements } from "@/lib/admin/announcements";
import { readClosures } from "@/lib/admin/closures";
import {
    createScheduleItem,
    readSchedule,
    scheduleStatusLabels,
    scheduleStatusTone,
    updateScheduleItem,
    type NewScheduleInput,
} from "@/lib/admin/schedule";
import { useAuth } from "@/lib/auth/auth";
import { readLrtStations } from "@/lib/lrt/stations";
import { cn } from "@/lib/utils";
import type { ConstructionSchedule, ScheduleStatus } from "@/types/schedule";

type ScheduleForm = Required<NewScheduleInput>;

const emptyForm: ScheduleForm = {
    title: "",
    description: "",
    area: "",
    startsAt: "",
    endsAt: "",
    status: "upcoming",
    stationIds: [],
    closureIds: [],
    announcementIds: [],
};

const relationshipFields = ["stationIds", "closureIds", "announcementIds"] as const;

// The form explicitly uses Malaysia time, independently of the administrator's device timezone.
const toIso = (local: string) => new Date(`${local}+08:00`).toISOString();
const toLocalInput = (iso: string) =>
    new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 19);
const formatDate = (iso: string) => new Date(iso).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
});

interface RelationshipOption {
    id: string;
    label: string;
    detail: string;
}

/** Admin tool: create and edit schedules and their explicitly selected relationships. */
export default function ScheduleManager() {
    const { user } = useAuth();
    const actor = user?.email ?? user?.name ?? "Admin";
    const [items, setItems] = useState(() => readSchedule());
    const [form, setForm] = useState<ScheduleForm>(emptyForm);
    const [editingId, setEditingId] = useState<string>();
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<ScheduleStatus | "all">("all");
    const [areaFilter, setAreaFilter] = useState("all");
    const titleRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const formScrollRef = useRef<HTMLDivElement>(null);
    const listScrollRef = useRef<HTMLDivElement>(null);

    const options = {
        stationIds: readLrtStations().map((station): RelationshipOption => ({
            id: station.id,
            label: `${station.code} ${station.name}`,
            detail: station.area,
        })),
        closureIds: readClosures().map((notice): RelationshipOption => ({
            id: notice.id,
            label: notice.title,
            detail: `${notice.kind === "closure" ? "Road closure" : "Access notice"} · ${notice.area} · ${notice.id}`,
        })),
        announcementIds: readAnnouncements().map((announcement): RelationshipOption => ({
            id: announcement.id,
            label: announcement.title,
            detail: `${announcement.area || "All areas"} · ${announcement.id}`,
        })),
    };

    const areas = [...new Set([
        ...items.map((item) => item.area).filter(Boolean),
        ...(areaFilter === "all" ? [] : [areaFilter]),
    ])].sort();
    const search = query.trim().toLowerCase();
    const filteredItems = items.filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        if (areaFilter !== "all" && item.area !== areaFilter) return false;
        const stationNames = (item.stationIds ?? []).map((id) =>
            options.stationIds.find((station) => station.id === id)?.label ?? id,
        );
        return !search || [item.id, item.title, item.description, item.area, ...stationNames]
            .some((value) => value.toLowerCase().includes(search));
    });
    const hasFilters = Boolean(query || statusFilter !== "all" || areaFilter !== "all");
    const editingHidden = editingId && !filteredItems.some((item) => item.id === editingId);

    const set = (patch: Partial<ScheduleForm>) => setForm((current) => ({ ...current, ...patch }));

    function resetListScroll() {
        listScrollRef.current?.scrollTo({ top: 0 });
    }

    function clearFilters() {
        setQuery("");
        setStatusFilter("all");
        setAreaFilter("all");
        resetListScroll();
    }

    function resetForm() {
        setForm(emptyForm);
        setEditingId(undefined);
        formScrollRef.current?.scrollTo({ top: 0 });
        titleRef.current?.focus({ preventScroll: true });
    }

    function editSchedule(item: ConstructionSchedule) {
        setEditingId(item.id);
        setForm({
            title: item.title,
            description: item.description,
            area: item.area,
            startsAt: toLocalInput(item.startsAt),
            endsAt: toLocalInput(item.endsAt),
            status: item.status,
            stationIds: [...new Set(item.stationIds ?? [])],
            closureIds: [...new Set(item.closureIds ?? [])],
            announcementIds: [...new Set(item.announcementIds ?? [])],
        });
        formScrollRef.current?.scrollTo({ top: 0 });
        titleRef.current?.focus({ preventScroll: true });
        editorRef.current?.scrollIntoView({
            block: "start",
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        });
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!form.title.trim() || !form.area.trim() || !form.startsAt || !form.endsAt) {
            toast.error("Add a title, area, and both dates.");
            return;
        }
        const start = new Date(`${form.startsAt}+08:00`).getTime();
        const end = new Date(`${form.endsAt}+08:00`).getTime();
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
            toast.error("The end date and time must be after the start.");
            return;
        }
        // Re-read the available records so deleted links cannot be saved from a stale form.
        const available = {
            stationIds: new Set(readLrtStations().map((item) => item.id)),
            closureIds: new Set(readClosures().map((item) => item.id)),
            announcementIds: new Set(readAnnouncements().map((item) => item.id)),
        };
        if (relationshipFields.some((field) => form[field].some((id) => !available[field].has(id)))) {
            toast.error("Some linked records are unavailable. Remove those selections before saving.");
            return;
        }
        const existing = editingId ? readSchedule().find((item) => item.id === editingId) : undefined;
        if (editingId && !existing) {
            toast.error("This schedule is no longer available. Refresh the list before editing.");
            return;
        }
        const input: NewScheduleInput = {
            title: form.title.trim(),
            description: form.description.trim(),
            area: form.area.trim(),
            startsAt: existing && form.startsAt === toLocalInput(existing.startsAt)
                ? existing.startsAt : toIso(form.startsAt),
            endsAt: existing && form.endsAt === toLocalInput(existing.endsAt)
                ? existing.endsAt : toIso(form.endsAt),
            status: form.status,
            stationIds: [...new Set(form.stationIds)],
            closureIds: [...new Set(form.closureIds)],
            announcementIds: [...new Set(form.announcementIds)],
        };
        if (editingId) {
            updateScheduleItem(editingId, input, actor);
            toast.success("Schedule updated.");
        } else {
            createScheduleItem(input, actor);
            toast.success("Schedule added.");
        }
        resetForm();
        setItems(readSchedule());
    }

    return (
        <div className="grid min-w-0 gap-6 lg:h-[clamp(36rem,calc(100dvh-10rem),48rem)] lg:grid-cols-2">
            <Card ref={editorRef} className="flex min-h-0 min-w-0 scroll-mt-24 flex-col overflow-hidden">
                <CardHeader className="shrink-0 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CalendarClock className="size-4" aria-hidden />
                        {editingId ? "Edit construction schedule" : "Add construction schedule"}
                    </CardTitle>
                    <CardDescription>
                        {editingId ? `Editing ${editingId}. Update the work details and linked records.`
                            : "Set the work period and choose the records related to this schedule."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 lg:min-h-0 lg:flex-1">
                    <form onSubmit={submit} className="flex flex-col lg:h-full lg:min-h-0">
                        <div ref={formScrollRef} className="space-y-4 p-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain [scrollbar-gutter:stable]">
                            <div>
                                <Label htmlFor="schedule-title">Title</Label>
                                <Input ref={titleRef} id="schedule-title" className="mt-1.5"
                                    value={form.title} onChange={(event) => set({ title: event.target.value })}
                                    placeholder="Work package title" required />
                            </div>
                            <div>
                                <Label htmlFor="schedule-area">Area / corridor</Label>
                                <Input id="schedule-area" className="mt-1.5" value={form.area}
                                    onChange={(event) => set({ area: event.target.value })} required />
                            </div>
                            <div>
                                <Label htmlFor="schedule-description">Description</Label>
                                <Textarea id="schedule-description" className="mt-1.5" rows={3}
                                    value={form.description}
                                    onChange={(event) => set({ description: event.target.value })} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="min-w-0">
                                    <Label htmlFor="schedule-start">Starts (Malaysia time)</Label>
                                    <Input id="schedule-start" type="datetime-local" step="1"
                                        className="mt-1.5 w-full min-w-0" value={form.startsAt}
                                        onChange={(event) => set({ startsAt: event.target.value })} required />
                                </div>
                                <div className="min-w-0">
                                    <Label htmlFor="schedule-end">Ends (Malaysia time)</Label>
                                    <Input id="schedule-end" type="datetime-local" step="1"
                                        className="mt-1.5 w-full min-w-0" value={form.endsAt}
                                        onChange={(event) => set({ endsAt: event.target.value })} required />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="schedule-status">Status</Label>
                                <Select value={form.status}
                                    onValueChange={(value) => set({ status: value as ScheduleStatus })}>
                                    <SelectTrigger id="schedule-status" className="mt-1.5"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(["upcoming", "ongoing", "completed"] as const).map((status) => (
                                            <SelectItem key={status} value={status}>{scheduleStatusLabels[status]}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <fieldset className="space-y-3 border-t pt-4">
                                <legend className="px-1 text-sm font-semibold">Linked records</legend>
                                <p className="text-xs text-muted-foreground">
                                    Select only records related to this work. All links are optional.
                                </p>
                                <RelationshipPicker key={`${editingId ?? "new"}-stations`}
                                    title="Affected stations" options={options.stationIds}
                                    selected={form.stationIds} onChange={(stationIds) => set({ stationIds })} />
                                <RelationshipPicker key={`${editingId ?? "new"}-closures`}
                                    title="Road closures & access notices" options={options.closureIds}
                                    selected={form.closureIds} onChange={(closureIds) => set({ closureIds })} />
                                <RelationshipPicker key={`${editingId ?? "new"}-announcements`}
                                    title="Announcements" options={options.announcementIds}
                                    selected={form.announcementIds} onChange={(announcementIds) => set({ announcementIds })} />
                            </fieldset>
                        </div>
                        <div className="flex shrink-0 gap-2 border-t bg-card p-6">
                            {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
                            <Button type="submit" className="flex-1">{editingId ? "Save changes" : "Add schedule"}</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="flex h-[min(42rem,85dvh)] min-h-0 min-w-0 flex-col overflow-hidden lg:h-auto">
                <CardHeader className="shrink-0 space-y-4 border-b">
                    <div className="space-y-1.5">
                        <CardTitle className="text-lg">Construction schedules</CardTitle>
                        <CardDescription>Find a work package and select Edit to update its details or links.</CardDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="relative col-span-2">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                            <Input value={query} className="pl-9"
                                placeholder="Title, reference, area, or station"
                                aria-label="Search construction schedules"
                                onChange={(event) => { setQuery(event.target.value); resetListScroll(); }} />
                        </div>
                        <Select value={statusFilter} onValueChange={(value) => {
                            setStatusFilter(value as typeof statusFilter);
                            resetListScroll();
                        }}>
                            <SelectTrigger aria-label="Filter schedules by status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                {(["upcoming", "ongoing", "completed"] as const).map((status) => (
                                    <SelectItem key={status} value={status}>{scheduleStatusLabels[status]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={areaFilter} onValueChange={(value) => {
                            setAreaFilter(value);
                            resetListScroll();
                        }}>
                            <SelectTrigger aria-label="Filter schedules by area"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All areas</SelectItem>
                                {areas.map((area) => <SelectItem key={area} value={area}>{area}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <p role="status">Showing {filteredItems.length} of {items.length} schedules</p>
                        {hasFilters && <button type="button" onClick={clearFilters}
                            className="rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Clear filters</button>}
                    </div>
                    {editingHidden && <p className="text-xs text-primary">Editing {editingId}. This schedule is outside the current filters.</p>}
                </CardHeader>
                <CardContent ref={listScrollRef} role="region" aria-label="Construction schedule results"
                    tabIndex={0}
                    className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-6 [scrollbar-gutter:stable] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                    {filteredItems.length === 0 && (
                        <div className="rounded-lg border border-dashed px-4 py-8 text-center">
                            <p className="text-sm font-medium">{items.length ? "No schedules found" : "Nothing scheduled yet"}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{items.length
                                ? "Try another title, station, status, or area."
                                : "Use the form to add your first construction schedule."}</p>
                            {hasFilters && <Button type="button" variant="outline" size="sm" onClick={clearFilters} className="mt-3">Reset filters</Button>}
                        </div>
                    )}
                    {filteredItems.map((item) => (
                        <article key={item.id} aria-current={editingId === item.id ? "true" : undefined}
                            className={cn("space-y-3 rounded-lg border bg-card p-4 transition-colors",
                                editingId === item.id && "border-primary bg-muted/30 ring-1 ring-primary/20")}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">{item.id} · {item.area}</span>
                                <Badge variant="outline" className={scheduleStatusTone[item.status]}>{scheduleStatusLabels[item.status]}</Badge>
                            </div>
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="text-xs leading-relaxed text-muted-foreground">{formatDate(item.startsAt)} – {formatDate(item.endsAt)} (MYT)</p>
                            <div className="flex flex-wrap gap-1.5">
                                {(item.stationIds ?? []).map((id) => (
                                    <Badge key={id} variant="secondary" className="text-[11px]">
                                        {options.stationIds.find((station) => station.id === id)?.label ?? `Unavailable station: ${id}`}
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                                <span className="text-xs text-muted-foreground">
                                    {item.closureIds?.length ?? 0} closure/access links · {item.announcementIds?.length ?? 0} announcement links
                                </span>
                                <Button type="button" variant="outline" size="sm"
                                    aria-label={`Edit ${item.title}`} disabled={editingId === item.id}
                                    onClick={() => editSchedule(item)}>
                                    <Pencil className="size-3.5" aria-hidden /> {editingId === item.id ? "Editing" : "Edit"}
                                </Button>
                            </div>
                        </article>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

/** Reused within this form so all three relationship types share the same selection behaviour. */
function RelationshipPicker({ title, options, selected, onChange }: {
    title: string;
    options: RelationshipOption[];
    selected: string[];
    onChange: (ids: string[]) => void;
}) {
    const id = useId();
    const [query, setQuery] = useState("");
    const availableIds = new Set(options.map((option) => option.id));
    const missing = selected.filter((value) => !availableIds.has(value)).map((value) => ({
        id: value, label: `Unavailable record: ${value}`, detail: "Remove this link before saving.",
    }));
    const allOptions = [...missing, ...options];
    const search = query.trim().toLowerCase();
    const filtered = allOptions.filter((option) =>
        [option.id, option.label, option.detail].some((value) => value.toLowerCase().includes(search)),
    );
    const selectedLabels = selected.map((value) =>
        allOptions.find((option) => option.id === value)?.label ?? value,
    );

    return (
        <details className="group rounded-lg border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                    <span className="block text-sm font-medium">{title} ({selected.length})</span>
                    <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                        {selectedLabels.length ? selectedLabels.join(", ") : "No records linked"}
                    </span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="space-y-2 border-t p-3">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input value={query} onChange={(event) => setQuery(event.target.value)}
                        aria-label={`Search ${title.toLowerCase()}`} placeholder="Search available records" className="pl-8" />
                </div>
                <div className="max-h-48 space-y-1 overflow-y-auto">
                    {filtered.length === 0 && <p className="py-3 text-xs text-muted-foreground">No matching records.</p>}
                    {filtered.map((option) => (
                        <label key={option.id} htmlFor={`${id}-${option.id}`}
                            className="flex cursor-pointer items-start gap-2.5 rounded-md p-2 hover:bg-muted/50">
                            <Checkbox id={`${id}-${option.id}`} className="mt-0.5"
                                checked={selected.includes(option.id)}
                                onCheckedChange={(checked) => onChange(checked === true
                                    ? [...new Set([...selected, option.id])]
                                    : selected.filter((value) => value !== option.id))} />
                            <span className="min-w-0 text-xs">
                                <span className="block font-medium leading-relaxed">{option.label}</span>
                                <span className="mt-0.5 block text-muted-foreground">{option.detail}</span>
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </details>
    );
}
