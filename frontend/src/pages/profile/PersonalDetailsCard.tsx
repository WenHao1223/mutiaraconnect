import { useForm } from "react-hook-form";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import FieldError from "@/components/custom/FieldError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthError, useAuth } from "@/lib/auth/auth";
import { parseIc } from "@/lib/auth/ic";
import type { AppUser } from "@/types/user";

interface NameValues {
    name: string;
}

const formatDate = (date: Date) =>
    date.toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });

export default function PersonalDetailsCard({ user }: { user: AppUser }) {
    const { updateName } = useAuth();
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<NameValues>({ defaultValues: { name: user.name } });

    // Birth date and age are read from the IC, so they are shown but never editable.
    const icDetails = parseIc(user.ic);

    return (
        <Card>
            <form
                noValidate
                onSubmit={handleSubmit(async ({ name }) => {
                    try {
                        await updateName(name);
                        reset({ name: name.trim() });
                        toast.success("Your name has been updated.");
                    } catch (err) {
                        setError(err instanceof AuthError ? "name" : "root", {
                            message: err instanceof AuthError ? err.message : "Could not save your name. Please try again.",
                        });
                    }
                })}
            >
                <CardHeader>
                    <CardTitle className="text-lg">Personal details</CardTitle>
                    <CardDescription>Your name can be edited. Date of birth and age come from your IC.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="name">Full name</Label>
                        <Input
                            id="name"
                            autoComplete="name"
                            maxLength={100}
                            className="mt-1.5"
                            aria-invalid={!!errors.name}
                            {...register("name", {
                                required: "Enter your full name.",
                                validate: (v) => v.trim().length > 1 || "Enter your full name.",
                            })}
                        />
                        <FieldError message={errors.name?.message} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="birthDate">Date of birth</Label>
                            <Input
                                id="birthDate"
                                className="mt-1.5"
                                disabled
                                value={icDetails ? formatDate(icDetails.birthDate) : "Not available"}
                                aria-describedby="ic-note"
                                readOnly
                            />
                        </div>
                        <div>
                            <Label htmlFor="age">Age</Label>
                            <Input
                                id="age"
                                className="mt-1.5"
                                disabled
                                value={icDetails ? String(icDetails.age) : "Not available"}
                                aria-describedby="ic-note"
                                readOnly
                            />
                        </div>
                    </div>

                    <p id="ic-note" className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Lock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                        {icDetails
                            ? "Taken from your MyKad IC, so it can't be changed here."
                            : "These come from your MyKad IC, which isn't on file for email-only accounts."}
                    </p>

                    <FieldError message={errors.root?.message} />
                </CardContent>

                <CardFooter className="justify-end">
                    <Button type="submit" disabled={!isDirty || isSubmitting}>
                        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                        Save changes
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
