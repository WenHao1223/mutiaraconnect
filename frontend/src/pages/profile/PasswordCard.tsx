import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import FieldError from "@/components/custom/FieldError";
import PasswordField from "@/components/custom/PasswordField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AuthError, useAuth } from "@/lib/auth/auth";

interface PasswordValues {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export default function PasswordCard() {
    const { changePassword } = useAuth();
    const {
        register,
        handleSubmit,
        reset,
        setError,
        getValues,
        trigger,
        formState: { errors, isSubmitting },
    } = useForm<PasswordValues>();

    return (
        <Card>
            <form
                noValidate
                onSubmit={handleSubmit(async ({ currentPassword, newPassword }) => {
                    try {
                        await changePassword(currentPassword, newPassword);
                        reset();
                        toast.success("Your password has been changed.");
                    } catch (err) {
                        if (err instanceof AuthError) setError("currentPassword", { message: err.message });
                        else setError("root", { message: "Could not change your password. Please try again." });
                    }
                })}
            >
                <CardHeader>
                    <CardTitle className="text-lg">Change password</CardTitle>
                    <CardDescription>Use at least 8 characters.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="currentPassword">Current password</Label>
                        <div className="mt-1.5">
                            <PasswordField
                                id="currentPassword"
                                autoComplete="current-password"
                                aria-invalid={!!errors.currentPassword}
                                {...register("currentPassword", { required: "Enter your current password." })}
                            />
                        </div>
                        <FieldError message={errors.currentPassword?.message} />
                    </div>

                    <div>
                        <Label htmlFor="newPassword">New password</Label>
                        <div className="mt-1.5">
                            <PasswordField
                                id="newPassword"
                                autoComplete="new-password"
                                aria-invalid={!!errors.newPassword}
                                {...register("newPassword", {
                                    required: "Create a new password.",
                                    minLength: { value: 8, message: "Use at least 8 characters." },
                                    validate: (v) =>
                                        v !== getValues("currentPassword") || "Choose a password you haven't used here before.",
                                    // Re-check the confirmation if it was already filled in.
                                    onChange: () => {
                                        if (getValues("confirmPassword")) void trigger("confirmPassword");
                                    },
                                })}
                            />
                        </div>
                        <FieldError message={errors.newPassword?.message} />
                    </div>

                    <div>
                        <Label htmlFor="confirmPassword">Confirm new password</Label>
                        <div className="mt-1.5">
                            <PasswordField
                                id="confirmPassword"
                                autoComplete="new-password"
                                aria-invalid={!!errors.confirmPassword}
                                {...register("confirmPassword", {
                                    required: "Confirm your new password.",
                                    validate: (v) => v === getValues("newPassword") || "Passwords do not match.",
                                })}
                            />
                        </div>
                        <FieldError message={errors.confirmPassword?.message} />
                    </div>

                    <FieldError message={errors.root?.message} />
                </CardContent>

                <CardFooter className="justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                        Update password
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
