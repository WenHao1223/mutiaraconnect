import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Store } from "lucide-react";
import { toast } from "sonner";
import FieldError from "@/components/custom/FieldError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth";
import { findApplication, submitApplication, type BusinessApplication } from "@/lib/business";
import { PATHS } from "@/routes";

interface ApplicationValues {
    businessName: string;
    registrationNumber: string;
    premiseAddress: string;
}

const statusLabels: Record<BusinessApplication["status"], string> = {
    pending: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
};

export default function BusinessApplicationPage() {
    const { user } = useAuth();
    const applicantKey = user ? user.email ?? user.ic ?? user.name : "";
    const [application, setApplication] = useState<BusinessApplication | undefined>(() => findApplication(applicantKey));
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ApplicationValues>();

    // Applying needs an account, so guests are sent to sign in and then brought back.
    if (!user) return <Navigate to={PATHS.login} state={{ from: PATHS.profileBusiness }} replace />;

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
                Own a business in the area? Apply to upgrade this account to a business premise.
            </p>
        </header>
    );

    let content;

    if (user.role === "business_premise") {
        content = (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BadgeCheck className="size-4" /> You already have a business account
                    </CardTitle>
                    <CardDescription>This account is registered as a business premise.</CardDescription>
                </CardHeader>
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
                <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={application.status === "approved" ? "default" : "secondary"}>
                            {statusLabels[application.status]}
                        </Badge>
                    </div>
                    <dl className="space-y-1">
                        <div>
                            <dt className="text-muted-foreground">Business name</dt>
                            <dd>{application.businessName}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Registration number</dt>
                            <dd>{application.registrationNumber}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Premise address</dt>
                            <dd>{application.premiseAddress}</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>
        );
    } else {
        content = (
            <Card>
                <form
                    noValidate
                    onSubmit={handleSubmit(({ businessName, registrationNumber, premiseAddress }) => {
                        const applied = submitApplication({
                            applicant: applicantKey,
                            email: user.email,
                            businessName: businessName.trim(),
                            registrationNumber: registrationNumber.trim(),
                            premiseAddress: premiseAddress.trim(),
                        });
                        setApplication(applied);
                        reset();
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
                            <Label htmlFor="premiseAddress">Premise address</Label>
                            <Textarea
                                id="premiseAddress"
                                rows={3}
                                maxLength={200}
                                className="mt-1.5"
                                aria-invalid={!!errors.premiseAddress}
                                {...register("premiseAddress", {
                                    required: "Enter your premise address.",
                                    validate: (v) => v.trim().length > 4 || "Enter your premise address.",
                                })}
                            />
                            <FieldError message={errors.premiseAddress?.message} />
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
        <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
            {backLink}
            {header}
            {content}
        </div>
    );
}
