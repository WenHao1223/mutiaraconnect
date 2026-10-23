import { BellRing, CalendarClock, LayoutDashboard, ScrollText, Ticket, Users, type LucideIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminOverview from "@/components/admin/AdminOverview";
import AuditLog from "@/components/admin/AuditLog";
import ClosureManager from "@/components/admin/ClosureManager";
import NotificationsManager from "@/components/admin/NotificationsManager";
import ScheduleManager from "@/components/admin/ScheduleManager";
import TicketAdmin from "@/components/admin/TicketAdmin";
import UserManagement from "@/components/admin/UserManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth/auth";
import { roleLabels } from "@/lib/settings/user-display";

type AdminTab = "overview" | "tickets" | "operations" | "notifications" | "users" | "audit";

const ADMIN_TABS: AdminTab[] = ["overview", "tickets", "operations", "notifications", "users", "audit"];
const SUPER_ADMIN_TABS: AdminTab[] = ["users", "audit"];

/** Resolve a tab id from the URL hash (e.g. /admin#notifications) with role-aware fallbacks. */
function readTabFromHash(hash: string, isSuperAdmin: boolean): AdminTab {
    const value = hash.replace(/^#/, "") as AdminTab;
    if (!ADMIN_TABS.includes(value)) return "overview";
    if (!isSuperAdmin && SUPER_ADMIN_TABS.includes(value)) return "overview";
    return value;
}

interface AdminTabItem {
    value: AdminTab;
    label: string;
    icon: LucideIcon;
}

/** Admin & super admin console. Super admins additionally get Users and Audit log. */
export default function AdminDashboardPage() {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === "super_admin";
    const location = useLocation();
    const navigate = useNavigate();

    // The hash is the single source of truth so tabs can be opened directly,
    // e.g. /admin#notifications, and browser back/forward stays in sync.
    const tab = readTabFromHash(location.hash, Boolean(isSuperAdmin));

    function handleTabChange(value: string) {
        navigate({ hash: `#${value}` }, { replace: true });
    }

    const tabs: AdminTabItem[] = [
        { value: "overview", label: "Overview", icon: LayoutDashboard },
        { value: "tickets", label: "Tickets", icon: Ticket },
        { value: "operations", label: "Closures & schedule", icon: CalendarClock },
        { value: "notifications", label: "Notifications", icon: BellRing },
        ...(isSuperAdmin
            ? [
                  { value: "users" as const, label: "Users", icon: Users },
                  { value: "audit" as const, label: "Audit log", icon: ScrollText },
              ]
            : []),
    ];

    if (!user) return null;

    return (
        <div className="flex-1 bg-background">
            <section className="border-b bg-muted/50">
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {roleLabels[user.role]}
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">Admin Dashboard</h1>
                    <p className="mt-1 text-muted-foreground">
                        Manage reports, closures, the construction schedule and public notifications.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-8">
                <Tabs value={tab} onValueChange={handleTabChange}>
                    <TabsList className="flex h-auto flex-wrap justify-start gap-1">
                        {tabs.map(({ value, label, icon: Icon }) => (
                            <TabsTrigger key={value} value={value}>
                                <Icon className="mr-1.5 size-4" aria-hidden />
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {tab === "overview" && (
                        <TabsContent value="overview">
                            <AdminOverview />
                        </TabsContent>
                    )}
                    {tab === "tickets" && (
                        <TabsContent value="tickets">
                            <TicketAdmin />
                        </TabsContent>
                    )}
                    {tab === "operations" && (
                        <TabsContent value="operations" className="space-y-8">
                            <ClosureManager />
                            <ScheduleManager />
                        </TabsContent>
                    )}
                    {tab === "notifications" && (
                        <TabsContent value="notifications">
                            <NotificationsManager />
                        </TabsContent>
                    )}
                    {isSuperAdmin && tab === "users" && (
                        <TabsContent value="users">
                            <UserManagement />
                        </TabsContent>
                    )}
                    {isSuperAdmin && tab === "audit" && (
                        <TabsContent value="audit">
                            <AuditLog />
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </div>
    );
}
