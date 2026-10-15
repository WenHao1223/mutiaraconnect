import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import FieldError from "@/components/custom/FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findTicket, normalizeTicketId } from "@/lib/tickets";

/** "Track by ticket ID" box. Calls onFound with the normalized ID when a ticket exists. */
export default function TicketLookup({ onFound }: { onFound: (id: string) => void }) {
    const [value, setValue] = useState("");
    const [error, setError] = useState<string>();

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (!value.trim()) {
            setError("Enter a ticket ID, for example FB-2041.");
            return;
        }
        const id = normalizeTicketId(value);
        if (!findTicket(id)) {
            setError(`No ticket found for ${id}. Check the ID and try again.`);
            return;
        }
        setError(undefined);
        setValue("");
        onFound(id);
    }

    return (
        <form noValidate onSubmit={handleSubmit}>
            <Label htmlFor="ticket-id">Track by ticket ID</Label>
            <div className="mt-1.5 flex gap-2">
                <Input
                    id="ticket-id"
                    value={value}
                    placeholder="e.g. FB-2041"
                    autoComplete="off"
                    aria-invalid={!!error}
                    aria-describedby={error ? "ticket-id-error" : undefined}
                    onChange={(e) => {
                        setValue(e.target.value);
                        if (error) setError(undefined);
                    }}
                />
                <Button type="submit">
                    <Search /> Track
                </Button>
            </div>
            <div id="ticket-id-error">
                <FieldError message={error} />
            </div>
        </form>
    );
}