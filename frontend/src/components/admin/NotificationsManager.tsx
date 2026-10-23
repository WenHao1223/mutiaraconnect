import { useState, type FormEvent } from "react";
import { BellRing, Store } from "lucide-react";
import { toast } from "sonner";
import LocationPicker, { type PickedLocation } from "@/components/custom/LocationPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { publishAnnouncement, readAnnouncements } from "@/lib/admin/announcements";
import { createAccessInfo, readClosures } from "@/lib/admin/closures";
import { readAllPremises } from "@/lib/admin/users";
import { useAuth } from "@/lib/auth/auth";
import type { Announcement } from "@/types/announcement";

const typeLabels: Record<Announcement["type"], string> = {
    closure: "Road closure",
    construction: "Construction",
    general: "General",
};

const announcementForm = { title: "", body: "", type: "general" as Announcement["type"] };

/** Publish public announcements and share targeted access info with a business premise. */
export default function NotificationsManager() {
    const { user } = useAuth();
    const actor = user?.email ?? user?.name ?? "Admin";

    const [announcements, setAnnouncements] = useState(() => readAnnouncements());
    const [form, setForm] = useState(announcementForm);

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

    function publish(event: FormEvent) {
        event.preventDefault();
        if (!form.title.trim() || !form.body.trim()) {
            toast.error("Add a title and a message.");
            return;
        }
        publishAnnouncement({ title: form.title.trim(), body: form.body.trim(), type: form.type }, actor);
        setForm(announcementForm);
        setAnnouncements(readAnnouncements());
        toast.success("Announcement published.");
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
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BellRing className="size-4" /> Publish a notification
                    </CardTitle>
                    <CardDescription>Shows up in the announcements bell.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={publish} className="space-y-4">
                        <div>
                            <Label htmlFor="announcement-title">Title</Label>
                            <Input
                                id="announcement-title"
                                className="mt-1.5"
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
                                value={form.body}
                                onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                            />
                        </div>
                        <div>
                            <Label>Type</Label>
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
                        <Button type="submit" className="w-full">
                            Publish
                        </Button>
                    </form>

                    <ul className="mt-6 space-y-2 border-t pt-4">
                        {announcements.slice(0, 5).map((item) => (
                            <li key={item.id} className="text-sm">
                                <span className="font-medium">{item.title}</span>
                                <span className="ml-2 text-xs text-muted-foreground">{item.time}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Store className="size-4" /> Share info to a business premise
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
