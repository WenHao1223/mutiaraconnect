import { useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { readUsers, setUserActive, updateUserRole } from "@/lib/admin/users";
import { useAuth } from "@/lib/auth/auth";
import { roleLabels } from "@/lib/settings/user-display";
import type { AppUser } from "@/types/user";

const roles = Object.keys(roleLabels) as AppUser["role"][];

/** Super admin tool: search, filter, re-role and activate/deactivate accounts. */
export default function UserManagement() {
    const { user: current } = useAuth();
    const actor = current?.email ?? current?.name ?? "Super admin";

    const [users, setUsers] = useState(() => readUsers());
    const [query, setQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<AppUser["role"] | "all">("all");

    const visible = users.filter((user) => {
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const text = query.trim().toLowerCase();
        const matchesText =
            !text || user.name.toLowerCase().includes(text) || user.email.toLowerCase().includes(text);
        return matchesRole && matchesText;
    });

    function changeRole(email: string, role: AppUser["role"]) {
        updateUserRole(email, role, actor);
        setUsers(readUsers());
        toast.success(`${email} is now ${roleLabels[role]}.`);
    }

    function toggleActive(email: string, active: boolean) {
        setUserActive(email, active, actor);
        setUsers(readUsers());
        toast.success(`${email} ${active ? "activated" : "deactivated"}.`);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">User management</CardTitle>
                <CardDescription>{visible.length} accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-56 flex-1">
                        <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search name or email…"
                            className="pl-8"
                            aria-label="Search users"
                        />
                    </div>
                    <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as AppUser["role"] | "all")}>
                        <SelectTrigger className="w-48" aria-label="Filter by role">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            {roles.map((role) => (
                                <SelectItem key={role} value={role}>
                                    {roleLabels[role]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead className="text-right">Active</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.map((row) => {
                                const isSelf = row.email.toLowerCase() === actor.toLowerCase();
                                return (
                                    <TableRow key={row.email}>
                                        <TableCell className="font-medium">{row.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{row.email}</TableCell>
                                        <TableCell>
                                            <Select
                                                value={row.role}
                                                disabled={isSelf}
                                                onValueChange={(value) => changeRole(row.email, value as AppUser["role"])}
                                            >
                                                <SelectTrigger className="h-8 w-40" aria-label={`Role for ${row.email}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role} value={role}>
                                                            {roleLabels[role]}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {row.source}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end">
                                                <Switch
                                                    checked={row.active}
                                                    disabled={isSelf}
                                                    onCheckedChange={(checked) => toggleActive(row.email, checked)}
                                                    aria-label={`${row.active ? "Deactivate" : "Activate"} ${row.email}`}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {visible.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                                        No accounts match these filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
