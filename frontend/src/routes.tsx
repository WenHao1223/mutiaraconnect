import type { ReactElement } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import RequireRole from "@/components/auth/RequireRole";
import HomePage from "@/pages/HomePage";
import MapPage from "@/pages/MapPage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ProfileSettingsPage from "@/pages/auth/ProfileSettingsPage";
import RegisterPage from "@/pages/RegisterPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AboutPage from "@/pages/AboutPage";
import FaqPage from "@/pages/FaqPage";
import AnnouncementsPage from "@/pages/AnnouncementsPage";
import BusinessApplicationPage from "@/pages/BusinessApplicationPage";
import BusinessDashboardPage from "@/pages/BusinessDashboardPage";
import BusinessNoticesPage from "@/pages/BusinessNoticesPage";
import ConstructionInfoPage from "@/pages/ConstructionInfoPage";
import ConstructionUpdatesPage from "@/pages/ConstructionUpdatesPage";
import PublicTicketsPage from "@/pages/PublicTicketsPage";
import TicketsPage from "@/pages/ProfileTicketsPage";
import ProfileNotificationsPage from "@/pages/ProfileNotificationsPage";

/** Every URL in the app. Use these instead of typing path strings anywhere else. */
export const PATHS = {
    home: "/",
    login: "/login",
    register: "/register",
    construction: "/construction",
    constructionInfo: "/construction/info",
    constructionUpdates: "/construction/updates",
    roadAccess: "/road-access",
    ticket: "/tickets",
    business: "/business",
    faqs: "/faqs",
    about: "/about",
    announcements: "/announcements",
    profile: "/profile",
    profileSettings: "/profile/settings",
    profileTickets: "/profile/tickets",
    profileNotifications: "/profile/notifications",
    profileBusiness: "/profile/business",
    businessDashboard: "/business/dashboard",
    admin: "/admin",
} as const;

interface PageRoute {
    path: string;
    label: string;
    element: ReactElement;
    /** Where the page appears in the navbar. Leave out to keep it off the navbar. */
    nav?: "construction" | "main";
}

/**
 * Add or change pages here only. To use a real page, swap the element,
 * for example: element: <ConstructionInfoPage />
 * Order below is the order shown in the navbar.
 */
const pages: PageRoute[] = [
    // Off the navbar: the logo leads home.
    { path: PATHS.home, label: "Home", element: <HomePage /> },

    { path: PATHS.constructionInfo, label: "Stations & Alignment", element: <ConstructionInfoPage />, nav: "construction" },
    { path: PATHS.constructionUpdates, label: "Construction Updates", element: <ConstructionUpdatesPage />, nav: "construction" },
    { path: PATHS.announcements, label: "Announcements", element: <AnnouncementsPage />, nav: "construction" },

    // Road closures and local businesses share this one map page.
    { path: PATHS.roadAccess, label: "Road & Access", element: <MapPage />, nav: "main" },
    { path: PATHS.ticket, label: "Support", element: <PublicTicketsPage />, nav: "main" },
    { path: PATHS.business, label: "Local Businesses", element: <BusinessNoticesPage />, nav: "main" },
    { path: PATHS.faqs, label: "FAQs", element: <FaqPage />, nav: "main" },
    { path: PATHS.about, label: "About Us", element: <AboutPage />, nav: "main" },

    { path: PATHS.login, label: "Sign in", element: <LoginPage /> },
    { path: PATHS.register, label: "Register", element: <RegisterPage /> },

    { path: PATHS.profile, label: "Profile", element: (
        <RequireRole allow={["resident"]}>
            <Navigate to={PATHS.profileTickets} replace />
        </RequireRole>
    ) },
    { path: PATHS.profileSettings, label: "Account Settings", element: <ProfileSettingsPage /> },
    { path: PATHS.profileTickets, label: "My Tickets", element: <TicketsPage /> },
    { path: PATHS.profileNotifications, label: "My Notifications", element: <ProfileNotificationsPage /> },
    { path: PATHS.profileBusiness, label: "Business Applications", element: (
        <RequireRole allow={["resident", "business_premise"]}>
            <BusinessApplicationPage />
        </RequireRole>
    ) },
    { path: PATHS.businessDashboard, label: "Business Dashboard", element: (
        <RequireRole allow={["business_premise"]}>
            <BusinessDashboardPage />
        </RequireRole>
    ) },
    { path: PATHS.admin, label: "Admin Dashboard", element: (
        <RequireRole allow={["admin", "super_admin"]}>
            <AdminDashboardPage />
        </RequireRole>
    ) },
];

/** Passed to useRoutes() in App.tsx. */
export const appRoutes: RouteObject[] = [
    ...pages.map(({ path, element }) => ({ path, element })),
    { path: PATHS.construction, element: <Navigate to={PATHS.constructionInfo} replace /> },
    { path: "*", element: <NotFoundPage /> },
];

type NavItem = Pick<PageRoute, "path" | "label">;

/** Link lists the navbar renders. Derived from `pages`, so nothing is typed twice. */
export const navRoutes: { construction: NavItem[]; main: NavItem[] } = {
    construction: pages.filter((page) => page.nav === "construction"),
    main: pages.filter((page) => page.nav === "main"),
};
