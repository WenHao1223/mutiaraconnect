import { useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import TicketDetail from "@/components/tickets/TicketDetail";
import type { Ticket } from "@/types/ticket";

/**
 * The one popup for a ticket's details, shared by the public resolved strip and the signed-in
 * user's recent tickets. Open while `ticket` is set. `anonymous` hides anything that could
 * identify the reporter (see TicketDetail). `flipIn` turns the popup in like a card being
 * flipped over and turns it back out on close, used by the resolved strip. `onChange` turns on
 * the owner's Edit and Withdraw (see TicketDetail).
 */
export default function TicketDialog({
    ticket,
    onClose,
    anonymous = false,
    flipIn = false,
    onChange,
}: {
    ticket?: Ticket;
    onClose: () => void;
    anonymous?: boolean;
    flipIn?: boolean;
    onChange?: (ticket: Ticket | undefined) => void;
}) {
    // Keep showing the last ticket after `ticket` clears, so the closing animation isn't an empty box.
    const [shown, setShown] = useState(ticket);
    const closeRef = useRef<HTMLButtonElement>(null);
    // While the owner edits, the form's own Cancel / Save replace the Close footer.
    const [editing, setEditing] = useState(false);
    if (ticket && ticket !== shown) {
        setShown(ticket);
        if (ticket.id !== shown?.id) setEditing(false);
    }

    return (
        <Dialog
            open={!!ticket}
            onOpenChange={(isOpen) => {
                if (isOpen) return;
                setEditing(false);
                onClose();
            }}
        >
            {/* The details scroll while the full-width Close stays pinned at the bottom. The built-in
                corner X (DialogContent's last child) is hidden so the status icon has that corner. */}
            <DialogContent
                className={cn(
                    // Phones get the same rounded corners as web (the shared dialog squares them off there)
                    // and a 1rem gap from the screen edges.
                    "flex max-h-[85vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-w-2xl [&>button:last-child]:hidden",
                    flipIn &&
                        // `both` holds the last frame, so the closing flip doesn't snap back before the popup unmounts.
                        "data-[state=open]:animate-[card-flip-in_350ms_ease-out_both]! data-[state=closed]:animate-[card-flip-out_200ms_ease-in_both]! motion-reduce:animate-none!",
                )}
                aria-describedby={undefined}
                // Start on Close rather than the first button, which may be the owner's Withdraw.
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    closeRef.current?.focus();
                }}
            >
                {shown && (
                    <>
                        <DialogTitle className="sr-only">Ticket {shown.id}</DialogTitle>
                        <div className="overflow-y-auto p-6">
                            <TicketDetail
                                ticket={shown}
                                anonymous={anonymous}
                                onChange={onChange}
                                onEditingChange={setEditing}
                            />
                        </div>
                        <div className={cn("border-t p-4", editing && "hidden")}>
                            <DialogClose asChild>
                                <Button
                                    ref={closeRef}
                                    variant="outline"
                                    className="group w-full transition duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-[0.98] motion-reduce:transition-none"
                                >
                                    <X
                                        className="size-4 transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none"
                                        aria-hidden
                                    />
                                    Close
                                </Button>
                            </DialogClose>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
