import {
    BellRing,
    CalendarClock,
    LayoutDashboard,
    ScrollText,
    Store,
    Ticket,
    TrafficCone,
    Users,
    type LucideIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminOverview from "@/components/admin/AdminOverview";
import AuditLog from "@/components/admin/AuditLog";
import ClosureManager from "@/components/admin/ClosureManager";
import NotificationsManager from "@/components/admin/NotificationsManager";
import ScheduleManager from "@/components/admin/ScheduleManager";
import TicketAdmin from "@/components/admin/TicketAdmin";
import UserManagement from "@/components/admin/UserManagement";
import ApplicationReview from "@/components/business/ApplicationReview";
import SupportRequestAdmin from "@/components/business/SupportRequestAdmin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth/auth";
import { roleLabels } from "@/lib/settings/user-display";

interface AdminTabItem {
    value: string;
    label: string;
    icon: LucideIcon;
    superAdminOnly?: boolean;
}

/** Single source of truth for the admin tabs: ids, labels, icons and access level. */
const ADMIN_TABS = [
    { value: "overview", label: "Overview", icon: LayoutDashboard, superAdminOnly: false },
    { value: "tickets", label: "Tickets", icon: Ticket, superAdminOnly: false },
    { value: "closures", label: "Road closures", icon: TrafficCone, superAdminOnly: false },
    { value: "schedule", label: "Construction schedule", icon: CalendarClock, superAdminOnly: false },
    { value: "notifications", label: "Announcements & access", icon: BellRing, superAdminOnly: false },
    { value: "businesses", label: "Business", icon: Store, superAdminOnly: false },
    { value: "users", label: "Users", icon: Users, superAdminOnly: true },
    { value: "audit", label: "Audit log", icon: ScrollText, superAdminOnly: true },
] as const satisfies readonly AdminTabItem[];

type AdminTab = (typeof ADMIN_TABS)[number]["value"];

/** Resolve a tab id from the URL hash (e.g. /admin#notifications) with role-aware fallbacks. */
function readTabFromHash(hash: string, isSuperAdmin: boolean): AdminTab {
    const value = hash.replace(/^#/, "");
    const match = ADMIN_TABS.find((item) => item.value === value);
    if (!match) return "overview";
    if (match.superAdminOnly && !isSuperAdmin) return "overview";
    return match.value;
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

    const tabs = ADMIN_TABS.filter((item) => isSuperAdmin || !item.superAdminOnly);

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
                        Manage tickets, closures, the construction schedule, public announcements and business access notices.
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
                    {tab === "closures" && (
                        <TabsContent value="closures">
                            <ClosureManager />
                        </TabsContent>
                    )}
                    {tab === "schedule" && (
                        <TabsContent value="schedule">
                            <ScheduleManager />
                        </TabsContent>
                    )}
                    {tab === "notifications" && (
                        <TabsContent value="notifications">
                            <NotificationsManager />
                        </TabsContent>
                    )}
                    {tab === "businesses" && (
                        <TabsContent value="businesses" className="grid gap-6 lg:grid-cols-2 lg:items-start">
                            <ApplicationReview />
                            <SupportRequestAdmin />
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
