import { useState } from "react";
import { useForm } from "react-hook-form";
import FieldError from "@/components/custom/FieldError";
import LocationPicker, { type PickedLocation } from "@/components/custom/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categoryLabels } from "@/lib/tickets";
import type { TicketCategory } from "@/types/ticket";
import type { BusinessProfile } from "@/types/user";

export interface TicketFormValues {
    category: TicketCategory;
    description: string;
    location: PickedLocation;
    premise?: string;
}

interface TicketFormProps {
    /** The reporter's premises; picking one also fills in the location. */
    premises?: BusinessProfile[];
    onSubmit: (values: TicketFormValues) => void;
    onCancel?: () => void;
}

const categories = Object.entries(categoryLabels) as [TicketCategory, string][];
/** Sentinel select value for "a premise that isn't in the list". */
const OTHER = "__other__";

/** Collects a report: category, description and a pinned location. */
export default function TicketForm({ premises = [], onSubmit, onCancel }: TicketFormProps) {
    const [category, setCategory] = useState<TicketCategory>();
    const [categoryError, setCategoryError] = useState<string>();
    const [location, setLocation] = useState<PickedLocation | null>(null);
    const [locationError, setLocationError] = useState<string>();
    const [premiseId, setPremiseId] = useState<string>();
    const [otherPremise, setOtherPremise] = useState("");
    const [premiseError, setPremiseError] = useState<string>();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<{ description: string }>();

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
            onSubmit={handleSubmit(({ description }) => {
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

                onSubmit({ category, description: description.trim(), location, premise });
                reset();
                setCategory(undefined);
                setLocation(null);
                setPremiseId(undefined);
                setOtherPremise("");
            })}
        >
            <div>
                <Label>Category</Label>
                <Select
                    value={category}
                    onValueChange={(value) => {
                        setCategory(value as TicketCategory);
                        setCategoryError(undefined);
                    }}
                >
                    <SelectTrigger className="mt-1.5" aria-invalid={!!categoryError}>
                        <SelectValue placeholder="What is the report about?" />
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
                <Label>Location</Label>
                <LocationPicker
                    value={location}
                    onChange={(next) => {
                        setLocation(next);
                        if (next) setLocationError(undefined);
                    }}
                />
                <FieldError message={locationError} />
            </div>

            <div className="flex justify-end gap-2">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit">Submit report</Button>
            </div>
        </form>
    );
}
