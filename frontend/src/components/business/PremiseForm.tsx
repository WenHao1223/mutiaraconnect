import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FileText, Store, X, type LucideIcon } from "lucide-react";
import FieldError from "@/components/custom/FieldError";
import LocationPicker, { type PickedLocation } from "@/components/custom/LocationPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { businessTypeLabels } from "@/lib/business/business";
import type { BusinessType } from "@/types/business";

export interface PremiseFormValues {
    businessName: string;
    registrationNumber: string;
    location: PickedLocation;
    businessType?: BusinessType;
    contactPhone?: string;
    documents?: string[];
}

interface PremiseFormProps {
    title: string;
    description: string;
    submitLabel: string;
    onSubmit: (values: PremiseFormValues) => void;
    icon?: LucideIcon;
    withApplicationDetails?: boolean;
}

const businessTypes = Object.entries(businessTypeLabels) as [BusinessType, string][];
const MAX_DOCUMENTS = 5;
/** Malaysian mobile or landline, e.g. 012-345 6789, 04-226 1234 or +6012 345 6789. */
const PHONE_PATTERN = /^(\+?60|0)\d{8,10}$/;

/** Collects a business premise: name, SSM number and a pinned shop location. */
export default function PremiseForm({
    title,
    description,
    submitLabel,
    onSubmit,
    icon: Icon = Store,
    withApplicationDetails = false,
}: PremiseFormProps) {
    const [location, setLocation] = useState<PickedLocation | null>(null);
    const [locationError, setLocationError] = useState<string>();
    const [businessType, setBusinessType] = useState<BusinessType>();
    const [typeError, setTypeError] = useState<string>();
    const [documents, setDocuments] = useState<string[]>([]);
    const [documentsError, setDocumentsError] = useState<string>();
    const fileInput = useRef<HTMLInputElement>(null);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<{ businessName: string; registrationNumber: string; contactPhone: string }>();

    /**
     * Checks the fields react-hook-form doesn't manage (location, type, documents). Also runs
     * when the text fields are invalid, so every error shows at once.
     */
    function checkOtherFields(): boolean {
        let valid = true;
        if (!location) {
            setLocationError("Mark your shop location on the map.");
            valid = false;
        } else {
            setLocationError(undefined);
        }
        if (withApplicationDetails && !businessType) {
            setTypeError("Choose a business type.");
            valid = false;
        }
        if (withApplicationDetails && documents.length === 0) {
            setDocumentsError("Attach your SSM certificate or another proof of business.");
            valid = false;
        }
        return valid;
    }

    function addDocuments(files: FileList | null) {
        const names = Array.from(files ?? []).map((file) => file.name);
        const next = [...documents, ...names.filter((name) => !documents.includes(name))];
        if (next.length > MAX_DOCUMENTS) {
            setDocumentsError(`Attach up to ${MAX_DOCUMENTS} documents.`);
        } else {
            setDocumentsError(undefined);
        }
        setDocuments(next.slice(0, MAX_DOCUMENTS));
        if (fileInput.current) fileInput.current.value = "";
    }

    return (
        <Card>
            <form
                noValidate
                onSubmit={handleSubmit(({ businessName, registrationNumber, contactPhone }) => {
                    if (!checkOtherFields() || !location) return;

                    onSubmit({
                        businessName: businessName.trim(),
                        registrationNumber: registrationNumber.trim(),
                        location,
                        ...(withApplicationDetails && {
                            businessType,
                            contactPhone: contactPhone.trim(),
                            documents,
                        }),
                    });
                    reset();
                    setLocation(null);
                    setBusinessType(undefined);
                    setDocuments([]);
                }, checkOtherFields)}
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

                    {withApplicationDetails && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label>Business type</Label>
                                <Select
                                    value={businessType ?? ""}
                                    onValueChange={(value) => {
                                        setBusinessType(value as BusinessType);
                                        setTypeError(undefined);
                                    }}
                                >
                                    <SelectTrigger className="mt-1.5" aria-invalid={!!typeError}>
                                        <SelectValue placeholder="What does the shop do?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {businessTypes.map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError message={typeError} />
                            </div>

                            <div>
                                <Label htmlFor="contactPhone">Contact number</Label>
                                <Input
                                    id="contactPhone"
                                    type="tel"
                                    autoComplete="tel"
                                    maxLength={20}
                                    placeholder="e.g. 04-226 1234"
                                    className="mt-1.5"
                                    aria-invalid={!!errors.contactPhone}
                                    {...register("contactPhone", {
                                        validate: (v) =>
                                            PHONE_PATTERN.test(v.replace(/[\s-]/g, "")) ||
                                            "Enter a Malaysian phone number.",
                                    })}
                                />
                                <FieldError message={errors.contactPhone?.message} />
                            </div>
                        </div>
                    )}

                    {withApplicationDetails && (
                        <div>
                            <Label htmlFor="documents">Supporting documents</Label>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                SSM certificate, business licence or a utility bill for the premise (PDF or image).
                            </p>
                            <Input
                                id="documents"
                                ref={fileInput}
                                type="file"
                                multiple
                                accept=".pdf,image/*"
                                className="mt-1.5 cursor-pointer"
                                aria-invalid={!!documentsError}
                                onChange={(event) => addDocuments(event.target.files)}
                            />
                            {documents.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                    {documents.map((name) => (
                                        <li
                                            key={name}
                                            className="flex items-center gap-2 rounded-md bg-muted px-2 py-1 text-sm"
                                        >
                                            <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                                            <span className="min-w-0 flex-1 truncate">{name}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-6"
                                                aria-label={`Remove ${name}`}
                                                onClick={() => {
                                                    setDocuments((current) => current.filter((item) => item !== name));
                                                    setDocumentsError(undefined);
                                                }}
                                            >
                                                <X className="size-3.5" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <FieldError message={documentsError} />
                        </div>
                    )}

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
