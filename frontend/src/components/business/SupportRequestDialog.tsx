import { useState } from "react";
import FieldError from "@/components/custom/FieldError";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitSupportRequest, supportTypeLabels } from "@/lib/business/support";
import type { SupportRequest, SupportRequestType } from "@/types/business";
import type { BusinessProfile } from "@/types/user";

interface SupportRequestDialogProps {
    owner: string;
    ownerName: string;
    premises: BusinessProfile[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmitted: (request: SupportRequest) => void;
}

const types = Object.entries(supportTypeLabels) as [SupportRequestType, string][];

/** Lets a business owner ask the support desk for signage, a delivery window or parking. */
export default function SupportRequestDialog({
    owner,
    ownerName,
    premises,
    open,
    onOpenChange,
    onSubmitted,
}: SupportRequestDialogProps) {
    const [type, setType] = useState<SupportRequestType>("signage");
    const [premiseId, setPremiseId] = useState(premises[0]?.id ?? "");
    const [note, setNote] = useState("");
    const [error, setError] = useState<string>();

    function save() {
        const premise = premises.find((item) => item.id === premiseId);
        if (!premise) {
            setError("Choose a premise.");
            return;
        }
        if (note.trim().length < 5) {
            setError("Tell us what you need, in a sentence or two.");
            return;
        }
        const request = submitSupportRequest({
            owner,
            ownerName,
            premiseId: premise.id,
            premiseName: premise.name,
            type,
            note: note.trim(),
        });
        onSubmitted(request);
        setNote("");
        setError(undefined);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request support</DialogTitle>
                    <DialogDescription>The support desk will arrange it and reply here.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="support-type">What do you need?</Label>
                        <Select value={type} onValueChange={(value) => setType(value as SupportRequestType)}>
                            <SelectTrigger id="support-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {types.map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="support-premise">Premise</Label>
                        <Select value={premiseId} onValueChange={setPremiseId}>
                            <SelectTrigger id="support-premise">
                                <SelectValue placeholder="Choose a premise" />
                            </SelectTrigger>
                            <SelectContent>
                                {premises.map((premise) => (
                                    <SelectItem key={premise.id} value={premise.id}>
                                        {premise.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="support-note">Details</Label>
                        <Textarea
                            id="support-note"
                            value={note}
                            maxLength={500}
                            aria-invalid={!!error}
                            onChange={(event) => {
                                setNote(event.target.value);
                                setError(undefined);
                            }}
                            placeholder="e.g. A sign at the back lane entrance pointing customers to our shop."
                            rows={3}
                        />
                        <FieldError message={error} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={save}>Send request</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
