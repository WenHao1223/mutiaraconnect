import type { ReactElement } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import RequireRole from "@/components/auth/RequireRole";
import MapPage from "@/pages/MapPage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import Placeholder from "@/pages/Placeholder";
import ProfileSettingsPage from "@/pages/auth/ProfileSettingsPage";
import RegisterPage from "@/pages/RegisterPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import BusinessApplicationPage from "@/pages/BusinessApplicationPage";
import BusinessDashboardPage from "@/pages/BusinessDashboardPage";
import ConstructionInfoPage from "@/pages/ConstructionInfoPage";
import ConstructionUpdatesPage from "@/pages/ConstructionUpdatesPage";
import PublicTicketsPage from "@/pages/PublicTicketsPage";
import TicketsPage from "@/pages/ProfileTicketsPage";

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
    { path: PATHS.home, label: "Map", element: <MapPage /> },

    { path: PATHS.constructionInfo, label: "Stations & Alignment", element: <ConstructionInfoPage />, nav: "construction" },
    { path: PATHS.constructionUpdates, label: "Construction Updates", element: <ConstructionUpdatesPage />, nav: "construction" },

    { path: PATHS.roadAccess, label: "Road & Access", element: <Placeholder title="Road & Access" />, nav: "main" },
    { path: PATHS.ticket, label: "Ticket", element: <PublicTicketsPage />, nav: "main" },
    { path: PATHS.business, label: "Business", element: <Placeholder title="Business" />, nav: "main" },
    { path: PATHS.faqs, label: "FAQs", element: <Placeholder title="FAQs" />, nav: "main" },
    { path: PATHS.about, label: "About Us", element: <Placeholder title="About Us" />, nav: "main" },

    { path: PATHS.login, label: "Sign in", element: <LoginPage /> },
    { path: PATHS.register, label: "Register", element: <RegisterPage /> },

    { path: PATHS.announcements, label: "Announcements", element: <Placeholder title="Announcements" /> },

    { path: PATHS.profile, label: "My Dashboard", element: (
        <RequireRole allow={["resident"]}>
            <Placeholder title="My Dashboard" />
        </RequireRole>
    ) },
    { path: PATHS.profileSettings, label: "Account Settings", element: <ProfileSettingsPage /> },
    { path: PATHS.profileTickets, label: "My Tickets", element: <TicketsPage /> },
    { path: PATHS.profileBusiness, label: "Business Applications", element: <BusinessApplicationPage /> },
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
