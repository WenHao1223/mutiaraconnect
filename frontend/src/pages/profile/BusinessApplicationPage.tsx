import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, BadgeCheck, ExternalLink, Store } from "lucide-react";
import { toast } from "sonner";
import AccessNotices from "@/components/business/AccessNotices";
import FieldError from "@/components/custom/FieldError";
import LocationPicker, { type PickedLocation } from "@/components/custom/LocationPicker";
import MapsLink from "@/components/custom/MapsLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth";
import { findApplication, submitApplication, type BusinessApplication } from "@/lib/business";
import { cn } from "@/lib/utils";
import { PATHS } from "@/routes";

interface ApplicationValues {
    businessName: string;
    registrationNumber: string;
}

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
function BusinessDetails({ business }: { business: BusinessDetailsData }) {
    const hasLocation = typeof business.latitude === "number" && typeof business.longitude === "number";

    return (
        <div className="space-y-3 text-sm">
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
    const [location, setLocation] = useState<PickedLocation | null>(null);
    const [locationError, setLocationError] = useState<string>();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ApplicationValues>();

    // Applying needs an account, so guests are sent to sign in and then brought back.
    if (!user) return <Navigate to={PATHS.login} state={{ from: PATHS.profileBusiness }} replace />;

    const isBusiness = user.role === "business_premise";
    const shop = user.business;
    const shopOrigin = shop ? { latitude: shop.latitude, longitude: shop.longitude } : undefined;

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
                    ? "Your registered shop, plus access notices for businesses in the area."
                    : "Own a business in the area? Apply to upgrade this account to a business premise."}
            </p>
        </header>
    );

    let content;

    if (user.role === "business_premise") {
        const business = user.business ?? (application && {
            name: application.businessName,
            registrationNumber: application.registrationNumber,
            address: application.premiseAddress,
            latitude: application.latitude,
            longitude: application.longitude,
        });
        content = (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BadgeCheck className="size-4" /> Your business account
                    </CardTitle>
                    <CardDescription>This account is registered as a business premise.</CardDescription>
                </CardHeader>
                <CardContent>
                    {business ? (
                        <BusinessDetails business={business} />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No shop details have been saved for this account yet.
                        </p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline">
                        <Link to={PATHS.business}>Go to business tools</Link>
                    </Button>
                </CardFooter>
            </Card>
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
            <Card>
                <form
                    noValidate
                    onSubmit={handleSubmit(({ businessName, registrationNumber }) => {
                        if (!location) {
                            setLocationError("Mark your shop location on the map.");
                            return;
                        }
                        setLocationError(undefined);
                        const applied = submitApplication({
                            applicant: applicantKey,
                            email: user.email,
                            businessName: businessName.trim(),
                            registrationNumber: registrationNumber.trim(),
                            premiseAddress: location.address,
                            latitude: location.latitude,
                            longitude: location.longitude,
                        });
                        setApplication(applied);
                        reset();
                        setLocation(null);
                        toast.success("Your business account application has been submitted.");
                    })}
                >
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Store className="size-4" /> Apply for a business account
                        </CardTitle>
                        <CardDescription>Tell us about the business you'd like to register.</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="businessName">Business name</Label>
                            <Input
                                id="businessName"
                                autoComplete="organization"
                                maxLength={100}
                                className="mt-1.5"
                                aria-invalid={!!errors.businessName}
                                {...register("businessName", {
                                    required: "Enter your business name.",
                                    validate: (v) => v.trim().length > 1 || "Enter your business name.",
                                })}
                            />
                            <FieldError message={errors.businessName?.message} />
                        </div>

                        <div>
                            <Label htmlFor="registrationNumber">Business registration number (SSM)</Label>
                            <Input
                                id="registrationNumber"
                                maxLength={40}
                                placeholder="e.g. 202301234567 (0012345-X)"
                                className="mt-1.5"
                                aria-invalid={!!errors.registrationNumber}
                                {...register("registrationNumber", {
                                    required: "Enter your business registration number.",
                                    validate: (v) => v.trim().length > 2 || "Enter your business registration number.",
                                })}
                            />
                            <FieldError message={errors.registrationNumber?.message} />
                        </div>

                        <div>
                            <Label>Shop location</Label>
                            <LocationPicker
                                value={location}
                                onChange={(next) => {
                                    setLocation(next);
                                    if (next) setLocationError(undefined);
                                }}
                            />
                            <FieldError message={locationError} />
                        </div>
                    </CardContent>

                    <CardFooter className="justify-end">
                        <Button type="submit">Submit application</Button>
                    </CardFooter>
                </form>
            </Card>
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
                                to={PATHS.ticket}
                                className="mt-4 inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
                            >
                                Report access issue
                            </Link>
                        </div>

                        <AccessNotices origin={shopOrigin} />
                    </aside>
                </div>
            ) : (
                content
            )}
        </div>
    );
}
