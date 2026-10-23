import { useState } from "react";
import { BellRing, CalendarClock, LayoutDashboard, ScrollText, Store, Ticket, Users, type LucideIcon } from "lucide-react";
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

type AdminTab = "overview" | "tickets" | "operations" | "notifications" | "businesses" | "users" | "audit";

interface AdminTabItem {
    value: AdminTab;
    label: string;
    icon: LucideIcon;
}

/** Admin & super admin console. Super admins additionally get Users and Audit log. */
export default function AdminDashboardPage() {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === "super_admin";
    const [tab, setTab] = useState<AdminTab>("overview");

    const tabs: AdminTabItem[] = [
        { value: "overview", label: "Overview", icon: LayoutDashboard },
        { value: "tickets", label: "Tickets", icon: Ticket },
        { value: "operations", label: "Closures & schedule", icon: CalendarClock },
        { value: "notifications", label: "Notifications", icon: BellRing },
        { value: "businesses", label: "Businesses", icon: Store },
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
                        Manage tickets, closures, the construction schedule and public notifications.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-8">
                <Tabs value={tab} onValueChange={(value) => setTab(value as AdminTab)}>
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
                    {tab === "businesses" && (
                        <TabsContent value="businesses" className="space-y-8">
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
