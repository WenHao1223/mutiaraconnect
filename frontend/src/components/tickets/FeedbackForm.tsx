import { useState } from "react";
import { useForm } from "react-hook-form";
import FieldError from "@/components/custom/FieldError";
import PhotoPicker from "@/components/custom/PhotoPicker";
import SubmitAnonymously from "@/components/tickets/SubmitAnonymously";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { feedbackLabels } from "@/lib/tickets/feedback";
import type { FeedbackCategory } from "@/types/feedback";

export interface FeedbackFormValues {
    category: FeedbackCategory;
    message: string;
    anonymous: boolean;
}

interface FeedbackFormProps {
    /** Show the anonymous toggle. Hidden when the reporter is not signed in. */
    showAnonymous?: boolean;
    onSubmit: (values: FeedbackFormValues) => void;
    onCancel?: () => void;
}

const categories = Object.entries(feedbackLabels) as [FeedbackCategory, string][];

/** A short, account-free way to tell the project team what is working and what is not. */
export default function FeedbackForm({ showAnonymous = true, onSubmit, onCancel }: FeedbackFormProps) {
    const [category, setCategory] = useState<FeedbackCategory>();
    const [categoryError, setCategoryError] = useState<string>();
    const [anonymous, setAnonymous] = useState(false);
    // Shown in the form only; feedback doesn't keep photos yet (no backend).
    const [photos, setPhotos] = useState<File[]>([]);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<{ message: string }>();

    return (
        <form
            noValidate
            className="space-y-4"
            onSubmit={handleSubmit(({ message }) => {
                if (!category) {
                    setCategoryError("Choose a category.");
                    return;
                }
                setCategoryError(undefined);
                onSubmit({ category, message: message.trim(), anonymous });
                reset();
                setCategory(undefined);
                setAnonymous(false);
                setPhotos([]);
            })}
        >
            <div>
                <Label>Category</Label>
                <Select
                    value={category}
                    onValueChange={(value) => {
                        setCategory(value as FeedbackCategory);
                        setCategoryError(undefined);
                    }}
                >
                    <SelectTrigger className="mt-1.5" aria-invalid={!!categoryError}>
                        <SelectValue placeholder="What kind of feedback is this?" />
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

            <div>
                <Label htmlFor="feedback-message">Message</Label>
                <Textarea
                    id="feedback-message"
                    rows={5}
                    maxLength={1000}
                    className="mt-1.5"
                    placeholder="Share your thoughts with the project team."
                    aria-invalid={!!errors.message}
                    {...register("message", {
                        required: "Write a message.",
                        validate: (v) => v.trim().length > 4 || "Add a little more detail.",
                    })}
                />
                <FieldError message={errors.message?.message} />
            </div>

            <div>
                <Label>Photos (optional)</Label>
                <PhotoPicker photos={photos} onChange={setPhotos} />
            </div>

            {showAnonymous && (
                <SubmitAnonymously
                    checked={anonymous}
                    onCheckedChange={setAnonymous}
                    description="Your account is not linked to this feedback."
                />
            )}

            <div className="flex justify-end gap-2">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit">Send feedback</Button>
            </div>
        </form>
    );
}
