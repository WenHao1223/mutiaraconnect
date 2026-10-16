import type { ReactNode } from "react";
import { Bell, BellOff, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/lib/settings/settings";

interface SettingRowProps {
    id: string;
    icon: ReactNode;
    title: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

function SettingRow({ id, icon, title, description, checked, onCheckedChange }: SettingRowProps) {
    return (
        <div className="flex items-center gap-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
                    {title}
                </Label>
                <p id={`${id}-description`} className="text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
            <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-describedby={`${id}-description`} />
        </div>
    );
}

export default function PreferencesCard() {
    const { theme, setTheme, notificationsEnabled, setNotificationsEnabled } = useSettings();
    const dark = theme === "dark";

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Preferences</CardTitle>
                <CardDescription>Changes apply straight away.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <SettingRow
                    id="dark-mode"
                    icon={dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
                    title="Dark mode"
                    description={dark ? "Dark theme is on." : "Use a darker theme that is easier on the eyes at night."}
                    checked={dark}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
                <SettingRow
                    id="notifications"
                    icon={notificationsEnabled ? <Bell className="size-4" /> : <BellOff className="size-4" />}
                    title="Notifications"
                    description={
                        notificationsEnabled
                            ? "You will be notified about announcements and updates."
                            : "All notifications are paused. Switch on to resume."
                    }
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                />
            </CardContent>
        </Card>
    );
}
