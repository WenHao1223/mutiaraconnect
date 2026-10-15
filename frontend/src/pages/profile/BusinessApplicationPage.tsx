import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, BadgeCheck, ExternalLink, Minus } from "lucide-react";
import { toast } from "sonner";
import AccessNotices from "@/components/business/AccessNotices";
import PremiseForm from "@/components/business/PremiseForm";
import LocationPicker from "@/components/custom/LocationPicker";
import MapsLink from "@/components/custom/MapsLink";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth/auth";
import { addPremise, findApplication, readPremises, readRemovedPremiseIds, removePremise, submitApplication, type BusinessApplication } from "@/lib/business";
import { cn } from "@/lib/utils";
import { PATHS } from "@/routes";
import type { BusinessProfile } from "@/types/user";

const statusLabels: Record<BusinessApplication["status"], string> = {
    pending: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
};

interface BusinessDetailsData {
    name: string;
    registrationNumber: string;
    address: string;
    latitude?: number;
    longitude?: number;
}

const ignoreLocationChange = () => undefined;

/** Read-only summary of a registered business, including the pinned shop location. */
function BusinessDetails({ business, onRemove }: { business: BusinessDetailsData; onRemove?: () => void }) {
    const hasLocation = typeof business.latitude === "number" && typeof business.longitude === "number";

    return (
        <div className="relative space-y-3 text-sm">
            {onRemove && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 size-7 text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${business.name}`}
                        >
                            <Minus className="size-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove this premise?</AlertDialogTitle>
                            <AlertDialogDescription>
                                "{business.name}" will be removed from your account. This can't be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={onRemove}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Remove
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <dl className="space-y-1">
                <div>
                    <dt className="text-muted-foreground">Business name</dt>
                    <dd>{business.name}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Registration number</dt>
                    <dd>{business.registrationNumber}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Shop address</dt>
                    <dd>{business.address || "Pinned on the map"}</dd>
                </div>
                {hasLocation && (
                    <div>
                        <dt className="text-muted-foreground">Coordinates</dt>
                        <dd className="font-mono text-xs">
                            {business.latitude?.toFixed(5)}, {business.longitude?.toFixed(5)}
                        </dd>
                    </div>
                )}
            </dl>
            {hasLocation && (
                <div className="space-y-1">
                    <LocationPicker
                        readOnly
                        hideCaption
                        value={{
                            latitude: business.latitude as number,
                            longitude: business.longitude as number,
                            address: business.address,
                        }}
                        onChange={ignoreLocationChange}
                    />
                    <dd className="text-sm text-muted-foreground italic *:**:mt-1 font-light">
                        <MapsLink
                            location={{
                                latitude: business.latitude as number,
                                longitude: business.longitude as number,
                            }}
                        >
                            Open in Google Maps <ExternalLink className="size-3" aria-hidden />
                        </MapsLink>
                    </dd>
                </div>
            )}
        </div>
    );
}

export default function BusinessApplicationPage() {
    const { user } = useAuth();
    const applicantKey = user ? user.email ?? user.ic ?? user.name : "";
    const [application, setApplication] = useState<BusinessApplication | undefined>(() => findApplication(applicantKey));
    const [extraPremises, setExtraPremises] = useState<BusinessProfile[]>(() => readPremises(applicantKey));
    const [removedIds, setRemovedIds] = useState<string[]>(() => readRemovedPremiseIds(applicantKey));

    // Applying needs an account, so guests are sent to sign in and then brought back.
    if (!user) return <Navigate to={PATHS.login} state={{ from: PATHS.profileBusiness }} replace />;

    const isBusiness = user.role === "business_premise";
    const premises: BusinessProfile[] = [...(user.businesses ?? []), ...extraPremises].filter(
        (premise) => !removedIds.includes(premise.id),
    );
    const noticeOrigins = premises.map(({ name, latitude, longitude }) => ({ name, latitude, longitude }));

    const backLink = (
        <Link
            to={PATHS.profileSettings}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
            <ArrowLeft className="size-4" /> Back to profile
        </Link>
    );

    const header = (
        <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-primary">Business account</h1>
            <p className="text-sm text-muted-foreground">
                {isBusiness
                    ? "Your registered premises, plus access notices for businesses in the area."
                    : "Own a business in the area? Apply to upgrade this account to a business premise."}
            </p>
        </header>
    );

    let content;

    if (isBusiness) {
        content = (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BadgeCheck className="size-4" /> Your business premises
                        </CardTitle>
                        <CardDescription>
                            {premises.length === 1
                                ? "1 premise registered to this account."
                                : `${premises.length} premises registered to this account.`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {premises.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No shop details have been saved for this account yet.
                            </p>
                        ) : (
                            premises.map((premise, index) => (
                                <div key={premise.id}>
                                    {index > 0 && <Separator className="mb-6" />}
                                    <BusinessDetails
                                        business={premise}
                                        onRemove={() => {
                                            removePremise(applicantKey, premise.id);
                                            setRemovedIds((current) => [...current, premise.id]);
                                            toast.success(`${premise.name} was removed from your account.`);
                                        }}
                                    />
                                </div>
                            ))
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="outline">
                            <Link to={PATHS.business}>Go to business tools</Link>
                        </Button>
                    </CardFooter>
                </Card>

                <PremiseForm
                    title="Add a premise"
                    description="Register another shop location to this account."
                    submitLabel="Add premise"
                    onSubmit={({ businessName, registrationNumber, location }) => {
                        const premise = addPremise(applicantKey, {
                            name: businessName,
                            registrationNumber,
                            address: location.address,
                            latitude: location.latitude,
                            longitude: location.longitude,
                        });
                        setExtraPremises((current) => [...current, premise]);
                        toast.success(`${premise.name} was added to your account.`);
                    }}
                />
            </div>
        );
    } else if (application) {
        content = (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Your application</CardTitle>
                    <CardDescription>We'll email you once a decision has been made.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={application.status === "approved" ? "default" : "secondary"}>
                            {statusLabels[application.status]}
                        </Badge>
                    </div>
                    <BusinessDetails
                        business={{
                            name: application.businessName,
                            registrationNumber: application.registrationNumber,
                            address: application.premiseAddress,
                            latitude: application.latitude,
                            longitude: application.longitude,
                        }}
                    />
                </CardContent>
            </Card>
        );
    } else {
        content = (
            <PremiseForm
                title="Apply for a business account"
                description="Tell us about the business you'd like to register."
                submitLabel="Submit application"
                onSubmit={({ businessName, registrationNumber, location }) => {
                    const applied = submitApplication({
                        applicant: applicantKey,
                        email: user.email,
                        businessName,
                        registrationNumber,
                        premiseAddress: location.address,
                        latitude: location.latitude,
                        longitude: location.longitude,
                    });
                    setApplication(applied);
                    toast.success("Your business account application has been submitted.");
                }}
            />
        );
    }

    return (
        <div className={cn("mx-auto w-full space-y-6 px-4 py-10", isBusiness ? "max-w-6xl" : "max-w-2xl")}>
            {backLink}
            {header}
            {isBusiness ? (
                <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
                    <div className="space-y-6 lg:col-span-2">
                        {content}

                        <div className="space-y-2 rounded-lg border bg-card p-6 text-sm">
                            <h3 className="text-lg font-semibold">Support desk</h3>
                            <p>Komtar Level 1, Mon–Fri 9am–5pm</p>
                            <p>Free signage for alternative entrances</p>
                            <p>Delivery window coordination</p>
                        </div>
                    </div>
                    <aside className="space-y-4">
                        <div className="rounded-lg bg-primary p-6 text-primary-foreground">
                            <h3 className="text-xl font-semibold">Is your shop affected?</h3>
                            <p className="mt-2 text-sm opacity-90">
                                Report blocked entrances, loading restrictions or lost parking. We'll forward it to
                                the site team.
                            </p>
                            <Link
                                to={PATHS.profileTickets}
                                className="mt-4 inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
                            >
                                Report access issue
                            </Link>
                        </div>

                        <AccessNotices origins={noticeOrigins} />
                    </aside>
                </div>
            ) : (
                content
            )}
        </div>
    );
}
