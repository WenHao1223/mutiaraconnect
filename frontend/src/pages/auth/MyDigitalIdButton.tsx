import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function MyDigitalIdButton({ onDone }: { onDone: () => void }) {
    const { signInWithMyDigitalId } = useAuth();
    const [busy, setBusy] = useState(false);

    async function handleClick() {
        setBusy(true);
        try {
            await signInWithMyDigitalId();
            onDone();
        } catch {
            toast.error("MyDigitalID sign-in failed. Please try again.");
            setBusy(false);
        }
    }

    return (
        <Button type="button" onClick={handleClick} disabled={busy} className="h-10 w-full">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            {busy ? "Connecting to MyDigitalID…" : "Continue with MyDigitalID"}
        </Button>
    );
}