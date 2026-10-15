import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import AnnouncementsBell from "@/components/navbar/AnnouncementsBell";
import Brand from "@/components/navbar/Brand";
import ConstructionMenu from "@/components/navbar/ConstructionMenu";
import MobileMenu from "@/components/navbar/MobileMenu";
import ProfileMenu from "@/components/navbar/ProfileMenu";
import { navStyles } from "@/components/navbar/navStyles";
import { sampleAnnouncements } from "@/data/announcements";
import { navRoutes } from "@/routes";
import type { Announcement } from "@/types/announcement";
import type { AppUser } from "@/types/user";

interface NavbarProps {
    /** null or undefined means an anonymous visitor. */
    user?: AppUser | null;
    onSignIn?: () => void;
    onSignOut?: () => void;
    /** Pass real data from Supabase later. Falls back to sample data. */
    announcements?: Announcement[];
}

export default function Navbar({
    user = null,
    onSignIn,
    onSignOut,
    announcements = sampleAnnouncements,
}: NavbarProps) {
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
                            className={({ isActive }) =>
                                cn(navStyles.desktopLink, isActive && navStyles.desktopActive)
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-1">
                    <AnnouncementsBell items={announcements} />
                    <ProfileMenu user={user} onSignIn={onSignIn} onSignOut={onSignOut} />
                </div>
            </div>
        </header>
    );
}