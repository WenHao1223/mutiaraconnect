import { Link } from "react-router-dom";
import { ArrowRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findApplication } from "@/lib/business";
import { PATHS } from "@/routes";
import type { AppUser } from "@/types/user";

const statusLabels = {
    pending: "pending review",
    approved: "approved",
    rejected: "not approved",
} as const;

export default function BusinessAccountCard({ user }: { user: AppUser }) {
    // Admins don't apply for a business account.
    if (user.role === "admin" || user.role === "super_admin") return null;

    const application = findApplication(user.email ?? user.ic ?? user.name);
    const business = user.role === "business_premise" ? user.business : undefined;

    const description =
        user.role === "business_premise"
            ? "This account is registered as a business premise."
            : application
                ? `Your application is ${statusLabels[application.status]}.`
                : "Own a business in the area? Apply to upgrade this account to a business premise.";

    return (
        <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Store className="size-4 text-primary" /> Business account
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {business && (
                    <div className="text-sm">
                        <p className="font-medium">{business.name}</p>
                        <p className="text-muted-foreground">{business.address}</p>
                    </div>
                )}
                <Button asChild>
                    <Link to={PATHS.profileBusiness}>
                        {user.role === "business_premise"
                            ? "View business account"
                            : application
                                ? "View your application"
                                : "Apply for a business account"}
                        <ArrowRight className="size-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
