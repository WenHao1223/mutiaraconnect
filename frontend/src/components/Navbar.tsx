import { useConstructionData } from "@/hooks/use-construction-data";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import AnnouncementsBell from "@/components/navbar/AnnouncementsBell";
import NotificationsBell from "@/components/navbar/NotificationsBell";
import Brand from "@/components/navbar/Brand";
import ConstructionMenu from "@/components/navbar/ConstructionMenu";
import MobileMenu from "@/components/navbar/MobileMenu";
import ProfileMenu from "@/components/navbar/ProfileMenu";
import { navStyles } from "@/components/navbar/navStyles";
import { navRoutes } from "@/routes";
import type { Announcement } from "@/types/announcement";
import type { AppUser } from "@/types/user";

interface NavbarProps {
    /** null or undefined means an anonymous visitor. */
    user?: AppUser | null;
    onSignOut?: () => void;
    /** Pass real data from Supabase later. Falls back to stored announcements. */
    announcements?: Announcement[];
}

export default function Navbar({
    user = null,
    onSignOut,
    announcements,
}: NavbarProps) {
    const { announcements: storedAnnouncements } = useConstructionData();

    const items = announcements ?? storedAnnouncements;

    return (
        <header className="sticky top-0 z-40 border-b bg-card">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4">
                <MobileMenu />
                <Brand />

                <nav aria-label="Main" className="ml-6 hidden items-center lg:flex">
                    <ConstructionMenu />
                    {navRoutes.main.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end
                            className={({ isActive }) =>
                                cn(navStyles.desktopLink, isActive && navStyles.desktopActive)
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="ml-auto flex shrink-0 items-center gap-1">
                    <AnnouncementsBell items={items} />
                    {user && <NotificationsBell key={user.email ?? user.ic ?? user.name} user={user} />}
                    <ProfileMenu user={user} onSignOut={onSignOut} />
                </div>
            </div>
        </header>
    );
}
