import { Controller, useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Divider from "@/components/custom/Divider";
import FieldError from "@/components/custom/FieldError";
import PasswordField from "@/components/custom/PasswordField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthError, useAuth } from "@/lib/auth/auth";
import { PATHS } from "@/routes";
import AuthLayout from "@/pages/auth/AuthLayout";
import MyDigitalIdButton from "@/pages/auth/MyDigitalIdButton";

interface RegisterValues {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    agree: boolean;
}

export default function RegisterPage() {
    const { user, registerWithEmail } = useAuth();
    const navigate = useNavigate();
    const from = (useLocation().state as { from?: string } | null)?.from ?? PATHS.home;
    const {
        register,
        control,
        handleSubmit,
        setError,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<RegisterValues>({ defaultValues: { agree: false } });

    if (user) return <Navigate to={from} replace />;

    const goBack = () => navigate(from, { replace: true });

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Report issues, follow construction updates and apply for business support."
            footer={
                <>
                    Already have an account?{" "}
                    <Link to={PATHS.login} state={{ from }} className="font-medium text-primary hover:underline">
                        Sign in
                    </Link>
                </>
            }
        >
            <MyDigitalIdButton onDone={goBack} />
            <p className="mt-2 text-center text-xs text-muted-foreground">
                For residents with a MyDigitalID account.
            </p>
            <Divider>or register with email</Divider>

            <form
                noValidate
                className="space-y-4"
                onSubmit={handleSubmit(async ({ name, email, password }) => {
                    try {
                        await registerWithEmail({ name: name.trim(), email, password });
                        goBack();
                    } catch (err) {
                        if (err instanceof AuthError) setError("email", { message: err.message });
                        else setError("root", { message: "Registration failed. Please try again." });
                    }
                })}
            >
                <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input
                        id="name"
                        autoComplete="name"
                        className="mt-1.5"
                        aria-invalid={!!errors.name}
                        {...register("name", { required: "Enter your full name.", validate: (v) => v.trim().length > 1 || "Enter your full name." })}
                    />
                    <FieldError message={errors.name?.message} />
                </div>

                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="mt-1.5"
                        aria-invalid={!!errors.email}
                        {...register("email", {
                            required: "Enter your email address.",
                            pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address." },
                        })}
                    />
                    <FieldError message={errors.email?.message} />
                </div>

                <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="mt-1.5">
                        <PasswordField
                            id="password"
                            autoComplete="new-password"
                            aria-invalid={!!errors.password}
                            {...register("password", {
                                required: "Create a password.",
                                minLength: { value: 8, message: "Use at least 8 characters." },
                            })}
                        />
                    </div>
                    <FieldError message={errors.password?.message} />
                </div>

                <div>
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="mt-1.5">
                        <PasswordField
                            id="confirmPassword"
                            autoComplete="new-password"
                            aria-invalid={!!errors.confirmPassword}
                            {...register("confirmPassword", {
                                required: "Confirm your password.",
                                validate: (v) => v === getValues("password") || "Passwords do not match.",
                            })}
                        />
                    </div>
                    <FieldError message={errors.confirmPassword?.message} />
                </div>

                <div>
                    <div className="flex items-start gap-2">
                        <Controller
                            name="agree"
                            control={control}
                            rules={{ validate: (v) => v || "You need to accept the terms to continue." }}
                            render={({ field }) => (
                                <Checkbox
                                    id="agree"
                                    className="mt-0.5"
                                    checked={field.value}
                                    onCheckedChange={(checked) => field.onChange(checked === true)}
                                />
                            )}
                        />
                        <Label htmlFor="agree" className="cursor-pointer text-sm font-normal leading-snug">
                            I agree to the Terms of Use and Privacy Policy.
                        </Label>
                    </div>
                    <FieldError message={errors.agree?.message} />
                </div>

                <FieldError message={errors.root?.message} />

                <Button type="submit" variant="outline" className="h-10 w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                    Create account
                </Button>
            </form>
        </AuthLayout>
    );
}