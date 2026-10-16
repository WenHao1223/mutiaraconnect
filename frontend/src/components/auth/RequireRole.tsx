import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { dashboardPathFor } from "@/lib/auth/access";
import { useAuth } from "@/lib/auth/auth";
import { PATHS } from "@/routes";
import type { AppUser } from "@/types/user";

interface RequireRoleProps {
    /** Roles allowed to view the wrapped page. */
    allow: AppUser["role"][];
    children: ReactNode;
}

/**
 * Guards a page by role: guests are sent to sign in and anyone whose role isn't
 * allowed is redirected to the dashboard their own role owns.
 */
export default function RequireRole({ allow, children }: RequireRoleProps) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) return <Navigate to={PATHS.login} state={{ from: location.pathname }} replace />;
    if (!allow.includes(user.role)) return <Navigate to={dashboardPathFor(user.role)} replace />;

    return <>{children}</>;
}
