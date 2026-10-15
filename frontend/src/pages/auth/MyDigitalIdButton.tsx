import { useState, type FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthError, useAuth } from "@/lib/auth/auth";
import FieldError from "@/components/custom/FieldError";

/** Formats digits as 000000-00-0000 while typing. */
function formatIc(value: string) {
    const d = value.replace(/\D/g, "").slice(0, 12);
    return [d.slice(0, 6), d.slice(6, 8), d.slice(8)].filter(Boolean).join("-");
}

/**
 * Stand-in for the MyDigitalID redirect. The dialog plays the role of the MyDigitalID
 * app: you identify with your MyKad IC and it is checked against the mock accounts.
 */
export default function MyDigitalIdButton({ onDone }: { onDone: () => void }) {
    const { signInWithMyDigitalId } = useAuth();
    const [open, setOpen] = useState(false);
    const [ic, setIc] = useState("");
    const [error, setError] = useState<string>();
    const [busy, setBusy] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(undefined);
        setBusy(true);
        try {
            await signInWithMyDigitalId(ic);
            onDone();
        } catch (err) {
            setError(err instanceof AuthError ? err.message : "MyDigitalID sign-in failed. Please try again.");
            setBusy(false);
        }
    }

    return (
        <>
            <Button type="button" onClick={() => setOpen(true)} className="h-10 w-full">
                <ShieldCheck className="size-4" />
                Continue with MyDigitalID
            </Button>

            <Dialog
                open={open}
                onOpenChange={(next) => {
                    if (busy) return;
                    setOpen(next);
                    if (!next) {
                        setError(undefined);
                        setIc("");
                    }
                }}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>MyDigitalID</DialogTitle>
                        <DialogDescription>Enter your MyKad IC number to verify your identity.</DialogDescription>
                    </DialogHeader>
                    <form noValidate onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="mdid-ic">MyKad IC number</Label>
                            <Input
                                id="mdid-ic"
                                inputMode="numeric"
                                autoComplete="off"
                                autoFocus
                                placeholder="900101-07-0001"
                                className="mt-1.5"
                                value={ic}
                                aria-invalid={!!error}
                                onChange={(e) => setIc(formatIc(e.target.value))}
                            />
                            <FieldError message={error} />
                        </div>
                        <Button type="submit" className="h-10 w-full" disabled={busy}>
                            {busy && <Loader2 className="size-4 animate-spin" />}
                            {busy ? "Verifying…" : "Verify and continue"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}