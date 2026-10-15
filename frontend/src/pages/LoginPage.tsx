import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Divider from "@/components/custom/Divider";
import FieldError from "@/components/custom/FieldError";
import PasswordField from "@/components/custom/PasswordField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthError, useAuth } from "@/lib/auth";
import { PATHS } from "@/routes";
import AuthLayout from "@/pages/auth/AuthLayout";
import MyDigitalIdButton from "@/pages/auth/MyDigitalIdButton";

interface LoginValues {
    email: string;
    password: string;
}

export default function LoginPage() {
    const { user, signInWithEmail } = useAuth();
    const navigate = useNavigate();
    const from = (useLocation().state as { from?: string } | null)?.from ?? PATHS.home;
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>();

    if (user) return <Navigate to={from} replace />;

    const goBack = () => navigate(from, { replace: true });

    return (
        <AuthLayout
            title="Sign in"
            subtitle="Welcome back to MutiaraConnect."
            footer={
                <>
                    New here?{" "}
                    <Link to={PATHS.register} state={{ from }} className="font-medium text-primary hover:underline">
                        Create an account
                    </Link>
                </>
            }
        >
            <MyDigitalIdButton onDone={goBack} />
            <Divider>or sign in with email</Divider>

            <form
                noValidate
                className="space-y-4"
                onSubmit={handleSubmit(async ({ email, password }) => {
                    try {
                        await signInWithEmail(email, password);
                        goBack();
                    } catch (err) {
                        setError("root", {
                            message: err instanceof AuthError ? err.message : "Sign in failed. Please try again.",
                        });
                    }
                })}
            >
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
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() => alert("Password reset isn't available yet.")}
                        >
                            Forgot password?
                        </button>
                    </div>
                    <div className="mt-1.5">
                        <PasswordField
                            id="password"
                            autoComplete="current-password"
                            aria-invalid={!!errors.password}
                            {...register("password", { required: "Enter your password." })}
                        />
                    </div>
                    <FieldError message={errors.password?.message} />
                </div>

                <FieldError message={errors.root?.message} />

                <Button type="submit" variant="outline" className="h-10 w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                    Sign in
                </Button>
            </form>
        </AuthLayout>
    );
}