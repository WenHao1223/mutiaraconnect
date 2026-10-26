import { Link } from "react-router-dom";
import { Bell, CircleUser, LayoutDashboard, LogIn, LogOut, Settings, ShieldCheck, Store, Ticket, UserPlus, type LucideIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dashboardLabels, dashboardPathFor } from "@/lib/auth/access";
import { initials, roleLabels } from "@/lib/settings/user-display";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PATHS } from "@/routes";
import type { AppUser } from "@/types/user";

const dashboardIcons: Record<AppUser["role"], LucideIcon> = {
    resident: LayoutDashboard,
    business_premise: Store,
    admin: ShieldCheck,
    super_admin: ShieldCheck,
};

interface ProfileMenuProps {
    user: AppUser | null;
    onSignOut?: () => void;
}

export default function ProfileMenu({ user, onSignOut }: ProfileMenuProps) {
    const DashboardIcon = user ? dashboardIcons[user.role] : LayoutDashboard;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Profile menu" className="rounded-full">
                    {user ? (
                        <Avatar className="size-8">
                            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                                {initials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <CircleUser className="size-6" />
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60">
                {user ? (
                    <>
                        <div className="flex items-start justify-between gap-2 px-2 py-1.5">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold">{user.name}</p>
                                {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
                                <p className="mt-1 text-xs font-medium text-primary">{roleLabels[user.role]}</p>
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            to={PATHS.profileSettings}
                                            aria-label="Account Settings"
                                            className="cursor-pointer flex size-7 shrink-0 items-center justify-center rounded-md p-0 text-muted-foreground"
                                        >
                                            <Settings className="size-4" />
                                        </Link>
                                    </DropdownMenuItem>
                                </TooltipTrigger>
                                <TooltipContent side="right">Account Settings</TooltipContent>
                            </Tooltip>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link to={PATHS.profileNotifications}>
                                <Bell className="size-4" /> My Notifications
                            </Link>
                        </DropdownMenuItem>
                        {user.role !== "resident" && <DropdownMenuItem asChild>
                            <Link to={dashboardPathFor(user.role)}>
                                <DashboardIcon className="size-4" /> {dashboardLabels[user.role]}
                            </Link>
                        </DropdownMenuItem>}
                        <DropdownMenuItem asChild>
                            <Link to={PATHS.profileTickets}>
                                <Ticket className="size-4" /> My Tickets
                            </Link>
                        </DropdownMenuItem>
                        {user.role === "business_premise" && (
                            <DropdownMenuItem asChild>
                                <Link to={PATHS.profileBusiness}>
                                    <Store className="size-4" /> Business Applications
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => onSignOut?.()}>
                            <LogOut className="size-4" /> Sign out
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                            Browsing as a guest
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link to={PATHS.login}>
                                <LogIn className="size-4" /> Sign in
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link to={PATHS.register}>
                                <UserPlus className="size-4" /> Create account
                            </Link>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
