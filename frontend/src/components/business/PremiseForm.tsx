import { useState } from "react";
import { useForm } from "react-hook-form";
import { Store, type LucideIcon } from "lucide-react";
import FieldError from "@/components/custom/FieldError";
import LocationPicker, { type PickedLocation } from "@/components/custom/LocationPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PremiseFormValues {
    businessName: string;
    registrationNumber: string;
    location: PickedLocation;
}

interface PremiseFormProps {
    title: string;
    description: string;
    submitLabel: string;
    onSubmit: (values: PremiseFormValues) => void;
    icon?: LucideIcon;
}

/** Collects a business premise: name, SSM number and a pinned shop location. */
export default function PremiseForm({
    title,
    description,
    submitLabel,
    onSubmit,
    icon: Icon = Store,
}: PremiseFormProps) {
    const [location, setLocation] = useState<PickedLocation | null>(null);
    const [locationError, setLocationError] = useState<string>();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<{ businessName: string; registrationNumber: string }>();

    return (
        <Card>
            <form
                noValidate
                onSubmit={handleSubmit(({ businessName, registrationNumber }) => {
                    if (!location) {
                        setLocationError("Mark your shop location on the map.");
                        return;
                    }
                    setLocationError(undefined);
                    onSubmit({
                        businessName: businessName.trim(),
                        registrationNumber: registrationNumber.trim(),
                        location,
                    });
                    reset();
                    setLocation(null);
                })}
            >
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Icon className="size-4" /> {title}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
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
                    <Button type="submit">{submitLabel}</Button>
                </CardFooter>
            </form>
        </Card>
    );
}
