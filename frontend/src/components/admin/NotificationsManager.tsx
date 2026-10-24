import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { BellRing, ExternalLink, MapPin, Pin, Share2, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import LocationPicker, { type PickedLocation } from "@/components/custom/LocationPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    deleteAnnouncement,
    publishAnnouncement,
    readAnnouncements,
    subscribeAnnouncements,
    toggleAnnouncementPin,
} from "@/lib/admin/announcements";
import { createAccessInfo, readClosures } from "@/lib/admin/closures";
import { readAllPremises } from "@/lib/admin/users";
import { useAuth } from "@/lib/auth/auth";
import { getStationAreas } from "@/lib/lrt/stations";
import { PATHS } from "@/routes";
import type { Announcement } from "@/types/announcement";
import { tone } from "@/lib/tones";

const typeLabels: Record<Announcement["type"], string> = {
    closure: "Road closure",
    construction: "Construction",
    general: "General",
};

const typeBadgeStyles: Record<Announcement["type"], string> = {
    closure: tone.danger,
    construction: tone.warning,
    general: tone.info,
};

const announcementForm = {
    title: "",
    body: "",
    type: "general" as Announcement["type"],
    area: "all",
    pinned: false,
};

/** Publish public announcements, manage/share bulletins, and share targeted access info with a business premise. */
export default function NotificationsManager() {
    const { user } = useAuth();
    const actor = user?.email ?? user?.name ?? "Admin";

    const [announcements, setAnnouncements] = useState(() => readAnnouncements());
    const [form, setForm] = useState(announcementForm);
    const stationAreas = getStationAreas();

    const premises = readAllPremises();
    const [notices, setNotices] = useState(() => readClosures().filter((closure) => closure.kind === "access"));
    const [notice, setNotice] = useState({
        business: "",
        area: "",
        affected: "",
        alternative: "",
        until: "",
    });
    const [noticeLocation, setNoticeLocation] = useState<PickedLocation | null>(null);

    useEffect(() => {
        return subscribeAnnouncements(() => {
            setAnnouncements(readAnnouncements());
        });
    }, []);

    function publish(event: FormEvent) {
        event.preventDefault();
        if (!form.title.trim() || !form.body.trim()) {
            toast.error("Add a title and a message.");
            return;
        }
        publishAnnouncement(
            {
                title: form.title.trim(),
                body: form.body.trim(),
                type: form.type,
                area: form.area === "all" ? undefined : form.area,
                pinned: form.pinned,
            },
            actor,
        );
        setForm(announcementForm);
        setAnnouncements(readAnnouncements());
        toast.success("Announcement published and broadcast to public feed.");
    }

    function handleTogglePin(item: Announcement) {
        toggleAnnouncementPin(item.id, actor);
        setAnnouncements(readAnnouncements());
        toast.success(item.pinned ? "Announcement unpinned." : "Announcement pinned to top of feed.");
    }

    function handleDelete(item: Announcement) {
        deleteAnnouncement(item.id, actor);
        setAnnouncements(readAnnouncements());
        toast.success("Announcement removed.");
    }

    async function handleShare(item: Announcement) {
        const shareUrl = `${window.location.origin}${PATHS.announcements}`;
        const shareText = `[MutiaraConnect ${typeLabels[item.type]}${item.area ? ` — ${item.area}` : ""}] ${item.title}\n\n${item.body}\n\nView corridor bulletins: ${shareUrl}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: item.title,
                    text: shareText,
                    url: shareUrl,
                });
                toast.success("Announcement shared.");
                return;
            }
        } catch {
            // Fall back to clipboard copy if native share sheet is dismissed or unsupported
        }

        try {
            await navigator.clipboard.writeText(shareText);
            toast.success("Announcement bulletin copied to clipboard for sharing.");
        } catch {
            toast.info("Share preview: " + item.title);
        }
    }

    function choosePremise(name: string) {
        const premise = premises.find((item) => item.name === name);
        setNotice((current) => ({ ...current, business: name }));
        if (premise) {
            setNoticeLocation({
                latitude: premise.latitude,
                longitude: premise.longitude,
                address: premise.address,
            });
        }
    }

    function sendNotice(event: FormEvent) {
        event.preventDefault();
        if (!notice.business.trim() || !notice.affected.trim() || !noticeLocation) {
            toast.error("Choose a business, describe the info and pin a location.");
            return;
        }
        const now = new Date().toISOString();
        createAccessInfo(
            {
                title: notice.affected.trim(),
                area: notice.area.trim(),
                alternative: notice.alternative.trim(),
                latitude: noticeLocation.latitude,
                longitude: noticeLocation.longitude,
                startAt: now,
                endAt: notice.until ? new Date(notice.until).toISOString() : now,
            },
            actor,
        );
        setNotice({ business: "", area: "", affected: "", alternative: "", until: "" });
        setNoticeLocation(null);
        setNotices(readClosures().filter((closure) => closure.kind === "access"));
        toast.success("Info shared with nearby business premises.");
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BellRing className="size-4 text-primary" /> Publish & Share Public Announcement
                            </CardTitle>
                            <CardDescription>
                                Broadcasts immediately to the navbar notification bell and public announcements centre.
                            </CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link to={PATHS.announcements}>
                                Public feed <ExternalLink className="ml-1.5 size-3.5" aria-hidden />
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={publish} className="space-y-4">
                        <div>
                            <Label htmlFor="announcement-title">Title</Label>
                            <Input
                                id="announcement-title"
                                className="mt-1.5"
                                placeholder="e.g. Weekend lane contraflow near Komtar (S19)"
                                value={form.title}
                                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="announcement-body">Message</Label>
                            <Textarea
                                id="announcement-body"
                                className="mt-1.5"
                                rows={3}
                                placeholder="Describe affected dates, times, station corridor, and commuter guidance..."
                                value={form.body}
                                onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label>Category</Label>
                                <Select
                                    value={form.type}
                                    onValueChange={(value) =>
                                        setForm((current) => ({ ...current, type: value as Announcement["type"] }))
                                    }
                                >
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(Object.keys(typeLabels) as Announcement["type"][]).map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {typeLabels[type]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Corridor / Station Area</Label>
                                <Select
                                    value={form.area}
                                    onValueChange={(value) => setForm((current) => ({ ...current, area: value }))}
                                >
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder="Corridor-wide (All areas)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Corridor-wide (All areas)</SelectItem>
                                        {stationAreas.map((area) => (
                                            <SelectItem key={area} value={area}>
                                                {area}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3.5 py-2.5">
                            <div className="space-y-0.5">
                                <Label htmlFor="announcement-pinned" className="text-sm font-medium">
                                    Pin as priority advisory
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Keeps this bulletin highlighted at the top of the public Announcements page.
                                </p>
                            </div>
                            <Switch
                                id="announcement-pinned"
                                checked={form.pinned}
                                onCheckedChange={(checked) => setForm((current) => ({ ...current, pinned: checked }))}
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            Publish Announcement
                        </Button>
                    </form>

                    <div className="mt-6 border-t pt-4">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Published Bulletins ({announcements.length})
                            </p>
                            <span className="text-xs text-muted-foreground">Pin, share, or remove</span>
                        </div>
                        <ul className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
                            {announcements.map((item) => (
                                <li
                                    key={item.id}
                                    className="rounded-lg border bg-card p-3 text-sm transition-colors hover:bg-muted/20"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {item.pinned && (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] ${tone.warning}`}
                                                >
                                                    <Pin className="mr-1 size-2.5" aria-hidden /> Pinned
                                                </Badge>
                                            )}
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] ${typeBadgeStyles[item.type]}`}
                                            >
                                                {typeLabels[item.type]}
                                            </Badge>
                                            {item.area && (
                                                <Badge variant="secondary" className="text-[10px]">
                                                    <MapPin className="mr-1 size-2.5" aria-hidden />
                                                    {item.area}
                                                </Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground">{item.time}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-7"
                                                title={item.pinned ? "Unpin announcement" : "Pin announcement"}
                                                aria-label={item.pinned ? "Unpin announcement" : "Pin announcement"}
                                                onClick={() => handleTogglePin(item)}
                                            >
                                                <Pin
                                                    className={`size-3.5 ${item.pinned ? "fill-hazard-text text-hazard-text" : "text-muted-foreground"}`}
                                                />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-7"
                                                title="Share or copy bulletin"
                                                aria-label={`Share ${item.title}`}
                                                onClick={() => handleShare(item)}
                                            >
                                                <Share2 className="size-3.5 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 text-destructive hover:text-destructive"
                                                title="Delete announcement"
                                                aria-label={`Delete ${item.title}`}
                                                onClick={() => handleDelete(item)}
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="mt-1.5 font-medium text-foreground">{item.title}</p>
                                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Store className="size-4 text-primary" /> Share info to a business premise
                    </CardTitle>
                    <CardDescription>Send targeted access information to a registered shop.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={sendNotice} className="space-y-4">
                        <div>
                            <Label>Business premise</Label>
                            <Select value={notice.business} onValueChange={choosePremise}>
                                <SelectTrigger className="mt-1.5">
                                    <SelectValue placeholder="Choose a premise" />
                                </SelectTrigger>
                                <SelectContent>
                                    {premises.map((premise) => (
                                        <SelectItem key={premise.id} value={premise.name}>
                                            {premise.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="notice-area">Area</Label>
                            <Input
                                id="notice-area"
                                className="mt-1.5"
                                value={notice.area}
                                onChange={(event) => setNotice((current) => ({ ...current, area: event.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="notice-affected">Information</Label>
                            <Textarea
                                id="notice-affected"
                                className="mt-1.5"
                                rows={2}
                                placeholder="e.g. Front entrance blocked by hoarding"
                                value={notice.affected}
                                onChange={(event) =>
                                    setNotice((current) => ({ ...current, affected: event.target.value }))
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="notice-alternative">Alternative</Label>
                            <Input
                                id="notice-alternative"
                                className="mt-1.5"
                                value={notice.alternative}
                                onChange={(event) =>
                                    setNotice((current) => ({ ...current, alternative: event.target.value }))
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="notice-until">Until</Label>
                            <Input
                                id="notice-until"
                                type="date"
                                className="mt-1.5"
                                value={notice.until}
                                onChange={(event) => setNotice((current) => ({ ...current, until: event.target.value }))}
                            />
                        </div>
                        <div>
                            <Label>Location</Label>
                            <LocationPicker value={noticeLocation} onChange={setNoticeLocation} />
                        </div>
                        <Button type="submit" className="w-full">
                            Share info
                        </Button>
                    </form>

                    <ul className="mt-6 space-y-2 border-t pt-4 text-sm">
                        {notices.slice(0, 5).map((item) => (
                            <li key={item.id}>
                                <span className="font-medium">{item.title}</span>
                                {item.area && <span className="ml-2 text-muted-foreground">{item.area}</span>}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
