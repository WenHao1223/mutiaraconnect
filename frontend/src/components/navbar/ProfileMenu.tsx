import { Link } from "react-router-dom";
import { CircleUser, LayoutDashboard, LogIn, LogOut, ShieldCheck, Store, Ticket, UserPlus } from "lucide-react";

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
import { PATHS } from "@/routes";
import type { AppUser } from "@/types/user";

interface ProfileMenuProps {
    user: AppUser | null;
    onSignOut?: () => void;
}

const roleLabels: Record<AppUser["role"], string> = {
    resident: "Resident",
    business_premise: "Business Premise",
    admin: "Admin",
    super_admin: "Super Admin",
};

function initials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

export default function ProfileMenu({ user, onSignOut }: ProfileMenuProps) {
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
                        <DropdownMenuLabel className="font-normal">
                            <p className="text-sm font-semibold">{user.name}</p>
                            {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                            <p className="mt-1 text-xs font-medium text-primary">{roleLabels[user.role]}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link to={PATHS.profile}>
                                <LayoutDashboard className="size-4" /> My Dashboard
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link to={PATHS.profileTickets}>
                                <Ticket className="size-4" /> My Tickets
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link to={PATHS.profileBusiness}>
                                <Store className="size-4" /> Business Applications
                            </Link>
                        </DropdownMenuItem>
                        {(user.role === "admin" || user.role === "super_admin") && (
                            <DropdownMenuItem asChild>
                                <Link to={PATHS.admin}>
                                    <ShieldCheck className="size-4" /> Admin Dashboard
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