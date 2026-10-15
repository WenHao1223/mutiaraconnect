import { Controller, useForm } from "react-hook-form";
import { ExternalLink, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import FieldError from "@/components/custom/FieldError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthError, useAuth } from "@/lib/auth/auth";
import { formatIc, parseIc } from "@/lib/auth/ic";
import type { AppUser, Gender } from "@/types/user";

interface DetailsValues {
    name: string;
    gender: Gender | "";
}

const formatDate = (date: Date) =>
    date.toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });

export default function PersonalDetailsCard({ user }: { user: AppUser }) {
    const { updateProfile } = useAuth();
    const {
        register,
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<DetailsValues>({ defaultValues: { name: user.name, gender: user.gender ?? "" } });

    // Birth date and age are read from the IC, so they are shown but never editable.
    const icDetails = parseIc(user.ic);

    return (
        <Card>
            <form
                noValidate
                onSubmit={handleSubmit(async ({ name, gender }) => {
                    try {
                        await updateProfile({ name, gender: gender || undefined });
                        reset({ name: name.trim(), gender });
                        toast.success("Your details have been updated.");
                    } catch (err) {
                        setError(err instanceof AuthError ? "name" : "root", {
                            message: err instanceof AuthError ? err.message : "Could not save your details. Please try again.",
                        });
                    }
                })}
            >
                <CardHeader>
                    <CardTitle className="text-lg">Personal details</CardTitle>
                    <CardDescription>Your name and gender can be edited. Date of birth and age come from your IC.</CardDescription>
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
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                className="mt-1.5"
                                value={user.email ?? "Not available"}
                                aria-describedby="email-note"
                                readOnly
                                disabled
                            />
                        </div>
                        <div>
                            <Label htmlFor="gender">Gender</Label>
                            <Controller
                                name="gender"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger id="gender" className="mt-1.5" aria-invalid={!!errors.gender}>
                                            <SelectValue placeholder="Not specified" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="ic">MyKad IC number</Label>
                        <Input
                            id="ic"
                            className="mt-1.5"
                            value={user.ic ? formatIc(user.ic) : "Not available"}
                            aria-describedby="ic-note"
                            readOnly
                            disabled
                        />
                        {user.myDigitalId && (
                            <a
                                href="https://www.digital-id.my"
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                            >
                                <ShieldCheck className="size-3.5" aria-hidden="true" />
                                Verified with MyDigitalID
                                <ExternalLink className="size-3" aria-hidden="true" />
                            </a>
                        )}
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

                    <p id="email-note" className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Lock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                        {user.email
                            ? "This is the email you sign in with, so it can't be changed here."
                            : "Email-only accounts don't have an email on file."}
                    </p>

                    <p id="ic-note" className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Lock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                        {icDetails
                            ? "Your IC, date of birth and age come from your MyKad, so they can't be changed here."
                            : "Your IC, date of birth and age come from your MyKad, which isn't on file for email-only accounts."}
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
