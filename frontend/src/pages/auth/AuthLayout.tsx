import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PATHS } from "@/routes";

interface AuthLayoutProps {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer: ReactNode;
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
    return (
        <div className="flex flex-1 items-center justify-center bg-background px-4 py-10">
            <div className="w-full max-w-md">
                <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-primary">{title}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                    <div className="mt-6">{children}</div>
                </div>
                <p className="mt-4 text-center text-sm text-muted-foreground">{footer}</p>
                <p className="mt-2 text-center text-sm">
                    <Link to={PATHS.home} className="text-muted-foreground underline-offset-4 hover:underline">
                        Continue as guest
                    </Link>
                </p>
            </div>
        </div>
    );
}