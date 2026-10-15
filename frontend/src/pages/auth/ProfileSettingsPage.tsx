import { Navigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/auth";
import { initials, roleLabels } from "@/lib/user-display";
import BusinessAccountCard from "@/pages/profile/BusinessAccountCard";
import PasswordCard from "@/pages/profile/PasswordCard";
import PersonalDetailsCard from "@/pages/profile/PersonalDetailsCard";
import PreferencesCard from "@/pages/profile/PreferencesCard";
import { PATHS } from "@/routes";

export default function ProfileSettingsPage() {
    const { user } = useAuth();

    // Settings belong to an account, so guests are sent to sign in and then brought back.
    if (!user) return <Navigate to={PATHS.login} state={{ from: PATHS.profileSettings }} replace />;

    return (
        <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
            <header className="flex items-center gap-4">
                <Avatar className="size-14">
                    <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                        {initials(user.name)}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <h1 className="truncate text-2xl font-semibold tracking-tight text-primary">Account Settings</h1>
                    <p className="truncate text-sm text-muted-foreground">
                        {user.name}
                        {user.email && ` · ${user.email}`} · {roleLabels[user.role]}
                    </p>
                </div>
            </header>

            <BusinessAccountCard key={user.email ?? user.name} user={user} />

            <div className="grid items-start gap-6 md:grid-cols-2">
                <PersonalDetailsCard key={user.email ?? user.name} user={user} />
                <div className="space-y-6">
                    <PreferencesCard />
                    <PasswordCard />
                </div>
            </div>
        </div>
    );
}
