import type { ReactElement } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import MapPage from "@/pages/MapPage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import Placeholder from "@/pages/Placeholder";
import RegisterPage from "@/pages/RegisterPage";

/** Every URL in the app. Use these instead of typing path strings anywhere else. */
export const PATHS = {
    home: "/",
    login: "/login",
    register: "/register",
    construction: "/construction",
    constructionInfo: "/construction/info",
    constructionUpdates: "/construction/updates",
    roadAccess: "/road-access",
    feedback: "/feedback",
    business: "/business",
    faqs: "/faqs",
    about: "/about",
    announcements: "/announcements",
    profile: "/profile",
    profileTickets: "/profile/tickets",
    profileBusiness: "/profile/business",
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

    { path: PATHS.constructionInfo, label: "Info", element: <Placeholder title="Construction Info" />, nav: "construction" },
    { path: PATHS.constructionUpdates, label: "Updates", element: <Placeholder title="Construction Updates" />, nav: "construction" },

    { path: PATHS.roadAccess, label: "Road & Access", element: <Placeholder title="Road & Access" />, nav: "main" },
    { path: PATHS.feedback, label: "Feedback", element: <Placeholder title="Feedback" />, nav: "main" },
    { path: PATHS.business, label: "Business", element: <Placeholder title="Business" />, nav: "main" },
    { path: PATHS.faqs, label: "FAQs", element: <Placeholder title="FAQs" />, nav: "main" },
    { path: PATHS.about, label: "About Us", element: <Placeholder title="About Us" />, nav: "main" },

    { path: PATHS.login, label: "Sign in", element: <LoginPage /> },
    { path: PATHS.register, label: "Register", element: <RegisterPage /> },

    { path: PATHS.announcements, label: "Announcements", element: <Placeholder title="Announcements" /> },

    { path: PATHS.profile, label: "My Dashboard", element: <Placeholder title="My Dashboard" /> },
    { path: PATHS.profileTickets, label: "My Tickets", element: <Placeholder title="My Tickets" /> },
    { path: PATHS.profileBusiness, label: "Business Applications", element: <Placeholder title="Business Applications" /> },
    { path: PATHS.admin, label: "Admin Dashboard", element: <Placeholder title="Admin Dashboard" /> },
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