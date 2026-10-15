import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TicketLookupProps {
    value: string;
    onChange: (value: string) => void;
}

/** Filters the "Your tickets" list as you type — by ticket ID, category, status, premise or location. */
export default function TicketLookup({ value, onChange }: TicketLookupProps) {
    return (
        <div>
            <Label htmlFor="ticket-id">Track ticket</Label>
            <div className="relative mt-1.5">
                <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                />
                <Input
                    id="ticket-id"
                    value={value}
                    placeholder="ID, category, status or location"
                    autoComplete="off"
                    className="pl-8"
                    onChange={(event) => onChange(event.target.value)}
                />
            </div>
        </div>
    );
}
