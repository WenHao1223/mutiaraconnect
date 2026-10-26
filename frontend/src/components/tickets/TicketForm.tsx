import { useState } from "react";
import { useForm } from "react-hook-form";
import FieldError from "@/components/custom/FieldError";
import LocationPicker, { type PickedLocation } from "@/components/custom/LocationPicker";
import PhotoPicker from "@/components/custom/PhotoPicker";
import NearestStation from "@/components/tickets/NearestStation";
import SubmitAnonymously from "@/components/tickets/SubmitAnonymously";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { shrinkPhoto } from "@/lib/tickets/photos";
import { categoryLabels } from "@/lib/tickets/tickets";
import type { TicketCategory } from "@/types/ticket";
import type { BusinessProfile } from "@/types/user";

export interface TicketFormValues {
    category: TicketCategory;
    description: string;
    location: PickedLocation;
    premise?: string;
    /** Photos were added. */
    hasPhoto: boolean;
    /** The added photos, shrunk to data URLs (see shrinkPhoto). */
    photos: string[];
    /** File without linking the account; hides the owner's verified badge. */
    anonymous: boolean;
}

interface TicketFormProps {
    /** The reporter's premises; picking one also fills in the location. */
    premises?: BusinessProfile[];
    /** Show the anonymous toggle. Hidden when the reporter is not signed in. */
    showAnonymous?: boolean;
    onSubmit: (values: TicketFormValues) => void;
    onCancel?: () => void;
    /**
     * Editing an existing ticket: fills the form in, locks the category (it decides which team
     * handles it), hides the anonymous toggle and saves instead of submitting.
     */
    initialValues?: Pick<TicketFormValues, "category" | "description" | "hasPhoto"> & {
        /** Null when the ticket was never pinned; the reporter is asked to pin it. */
        location: PickedLocation | null;
    };
}

const categories = Object.entries(categoryLabels) as [TicketCategory, string][];
/** Sentinel select value for "a premise that isn't in the list". */
const OTHER = "__other__";

/** Collects a report: category, description and a pinned location. Also edits an existing one. */
export default function TicketForm({
    premises = [],
    showAnonymous = true,
    onSubmit,
    onCancel,
    initialValues,
}: TicketFormProps) {
    const editing = !!initialValues;
    const [category, setCategory] = useState<TicketCategory | undefined>(initialValues?.category);
    const [categoryError, setCategoryError] = useState<string>();
    const [location, setLocation] = useState<PickedLocation | null>(
        initialValues?.location ?? null,
    );
    const [locationError, setLocationError] = useState<string>();
    const [premiseId, setPremiseId] = useState<string>();
    const [otherPremise, setOtherPremise] = useState("");
    const [premiseError, setPremiseError] = useState<string>();
    const [anonymous, setAnonymous] = useState(false);
    const [photos, setPhotos] = useState<File[]>([]);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<{ description: string }>({
        defaultValues: { description: initialValues?.description ?? "" },
    });

    // Picking a listed premise fills the location from it; "Other" leaves it to the map.
    function choosePremise(value: string) {
        setPremiseId(value);
        setPremiseError(undefined);
        if (value === OTHER) return;
        const chosen = premises.find((premise) => premise.id === value);
        if (chosen) {
            setLocation({ latitude: chosen.latitude, longitude: chosen.longitude, address: chosen.address });
            setLocationError(undefined);
        }
    }

    return (
        <form
            noValidate
            className="space-y-4"
            onSubmit={handleSubmit(async ({ description }) => {
                let valid = true;
                if (!category) {
                    setCategoryError("Choose a category.");
                    valid = false;
                } else {
                    setCategoryError(undefined);
                }
                if (!location) {
                    setLocationError("Mark the location on the map.");
                    valid = false;
                } else {
                    setLocationError(undefined);
                }
                if (premiseId === OTHER && otherPremise.trim().length < 2) {
                    setPremiseError("Enter the premise name.");
                    valid = false;
                } else {
                    setPremiseError(undefined);
                }
                if (!valid || !category || !location) return;

                const premise =
                    premiseId === OTHER
                        ? otherPremise.trim()
                        : premises.find((p) => p.id === premiseId)?.name;

                onSubmit({
                    category,
                    description: description.trim(),
                    location,
                    premise,
                    hasPhoto: photos.length > 0,
                    // A photo the browser can't read (e.g. some HEIC files) is skipped, not fatal.
                    photos: (await Promise.allSettled(photos.map(shrinkPhoto))).flatMap((result) =>
                        result.status === "fulfilled" ? [result.value] : [],
                    ),
                    anonymous,
                });
                if (editing) return;
                reset();
                setCategory(undefined);
                setLocation(null);
                setPremiseId(undefined);
                setOtherPremise("");
                setAnonymous(false);
                setPhotos([]);
            })}
        >
            <div>
                <Label>Category</Label>
                <Select
                    value={category}
                    disabled={editing}
                    onValueChange={(value) => {
                        setCategory(value as TicketCategory);
                        setCategoryError(undefined);
                    }}
                >
                    <SelectTrigger className="mt-1.5" aria-invalid={!!categoryError}>
                        <SelectValue placeholder="What is the ticket about?" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FieldError message={categoryError} />
            </div>

            {premises.length > 0 && (
                <div>
                    <Label>Related premise (optional)</Label>
                    <Select value={premiseId} onValueChange={choosePremise}>
                        <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Which premise is this about?" />
                        </SelectTrigger>
                        <SelectContent>
                            {premises.map((premise) => (
                                <SelectItem key={premise.id} value={premise.id}>
                                    {premise.name}
                                </SelectItem>
                            ))}
                            <SelectItem value={OTHER}>Other…</SelectItem>
                        </SelectContent>
                    </Select>
                    {premiseId === OTHER && (
                        <Input
                            className="mt-2"
                            maxLength={100}
                            placeholder="Type the premise name"
                            value={otherPremise}
                            aria-invalid={!!premiseError}
                            onChange={(event) => {
                                setOtherPremise(event.target.value);
                                setPremiseError(undefined);
                            }}
                        />
                    )}
                    <FieldError message={premiseError} />
                </div>
            )}

            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    rows={4}
                    maxLength={1000}
                    className="mt-1.5"
                    placeholder="Describe what you saw and when."
                    aria-invalid={!!errors.description}
                    {...register("description", {
                        required: "Describe the issue.",
                        validate: (v) => v.trim().length > 4 || "Add a little more detail.",
                    })}
                />
                <FieldError message={errors.description?.message} />
            </div>

            <div>
                <Label>Photos (optional)</Label>
                {initialValues?.hasPhoto && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        This ticket already has photos attached. You can add more.
                    </p>
                )}
                <PhotoPicker photos={photos} onChange={setPhotos} />
            </div>

            <div>
                <Label>Location</Label>
                <LocationPicker
                    value={location}
                    onChange={(next) => {
                        setLocation(next);
                        if (next) setLocationError(undefined);
                    }}
                />
                {/* Extra context for the reporter: the LRT station nearest their pin. */}
                {location && <NearestStation point={location} className="mt-1.5" />}
                <FieldError message={locationError} />
            </div>

            {showAnonymous && !editing && (
                <SubmitAnonymously
                    checked={anonymous}
                    onCheckedChange={setAnonymous}
                    description={
                        premises.length > 0
                            ? "Your account is not linked to this ticket. Your business name is hidden and it will not show a verified badge."
                            : "Your account is not linked to this ticket."
                    }
                />
            )}

            <div className="flex justify-end gap-2">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit">{editing ? "Save changes" : "Submit ticket"}</Button>
            </div>
        </form>
    );
}
