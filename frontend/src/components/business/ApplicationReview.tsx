import { useState } from "react";
import { Check, Inbox, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import ApplicationDetail from "@/components/business/ApplicationDetail";
import ApplicationStatusBadge from "@/components/business/ApplicationStatusBadge";
import FieldError from "@/components/custom/FieldError";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth";
import { applicationStatusMeta, businessTypeLabels, readApplications } from "@/lib/business/business";
import { approveApplication, rejectApplication, ReviewError } from "@/lib/business/review";
import { formatDate } from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, BusinessApplication } from "@/types/business";

type Filter = ApplicationStatus | "all";

const filters: Filter[] = ["pending", "approved", "rejected", "all"];

/** Newest first; applications are stored in the order they were submitted. */
const newestFirst = () => [...readApplications()].reverse();

/** Admin tool: review business account applications and approve or reject them. */
export default function ApplicationReview() {
    const { user } = useAuth();
    const actor = user?.email ?? user?.name ?? "Admin";

    const [applications, setApplications] = useState(newestFirst);
    const [filter, setFilter] = useState<Filter>("pending");
    const [selectedId, setSelectedId] = useState<string>();
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState("");
    const [reasonError, setReasonError] = useState<string>();

    const count = (value: Filter) =>
        value === "all" ? applications.length : applications.filter((a) => a.status === value).length;
    const visible = applications.filter((a) => filter === "all" || a.status === filter);
    const selected = visible.find((a) => a.id === selectedId) ?? visible[0];

    function decided(updated: BusinessApplication) {
        setApplications(newestFirst());
        setSelectedId(updated.id);
    }

    function approve(application: BusinessApplication) {
        try {
            decided(approveApplication(application, actor));
            toast.success(`${application.businessName} approved. ${application.applicantName} is now a business premise.`);
        } catch (error) {
            toast.error(error instanceof ReviewError ? error.message : "Couldn't approve this application.");
        }
    }

    function reject(application: BusinessApplication) {
        try {
            decided(rejectApplication(application, reason, actor));
            setRejecting(false);
            setReason("");
            toast.success(`${application.businessName} rejected.`);
        } catch (error) {
            setReasonError(error instanceof ReviewError ? error.message : "Couldn't reject this application.");
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Business applications</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {count("pending") === 0 ? "Nothing waiting for review." : `${count("pending")} waiting for review.`}
                </p>

                <div role="group" aria-label="Filter applications" className="mt-3 flex flex-wrap gap-1.5">
                    {filters.map((value) => (
                        <Button
                            key={value}
                            type="button"
                            size="sm"
                            variant={filter === value ? "default" : "outline"}
                            aria-pressed={filter === value}
                            onClick={() => setFilter(value)}
                        >
                            {value === "all" ? "All" : applicationStatusMeta[value].label} ({count(value)})
                        </Button>
                    ))}
                </div>

                {visible.length === 0 ? (
                    <div className="mt-4 rounded-lg bg-muted px-4 py-8 text-center">
                        <Inbox className="mx-auto size-8 text-muted-foreground" aria-hidden />
                        <p className="mt-2 text-sm font-medium">No applications here</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Residents apply from Account Settings → Business account.
                        </p>
                    </div>
                ) : (
                    <ul className="mt-3 space-y-2">
                        {visible.map((application) => {
                            const isSelected = application.id === selected?.id;
                            return (
                                <li key={application.id}>
                                    <button
                                        type="button"
                                        aria-current={isSelected ? "true" : undefined}
                                        onClick={() => {
                                            setSelectedId(application.id);
                                            setRejecting(false);
                                        }}
                                        className={cn(
                                            "w-full cursor-pointer rounded-lg border p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                            isSelected && "border-primary bg-accent",
                                        )}
                                    >
                                        <span className="flex items-start justify-between gap-2">
                                            <span className="text-sm font-semibold">{application.businessName}</span>
                                            <ApplicationStatusBadge status={application.status} />
                                        </span>
                                        <span className="mt-1 block text-sm text-muted-foreground">
                                            {application.applicantName} · {businessTypeLabels[application.businessType]}
                                        </span>
                                        <span className="mt-1 block text-xs text-muted-foreground">
                                            {application.id} · Submitted {formatDate(application.submittedAt)}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {selected && (
                <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <UserRound className="size-4" aria-hidden />
                        Applicant: <span className="font-medium text-foreground">{selected.applicantName}</span>
                        {selected.email && ` · ${selected.email}`}
                    </p>

                    <ApplicationDetail application={selected} />

                    {selected.status === "pending" && (
                        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setReasonError(undefined);
                                    setRejecting(true);
                                }}
                            >
                                <X className="size-4" /> Reject
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button>
                                        <Check className="size-4" /> Approve
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Approve {selected.businessName}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {selected.applicantName}'s account becomes a business premise account and
                                            this shop is registered to it.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => approve(selected)}>Approve</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}

                    <Dialog open={rejecting} onOpenChange={setRejecting}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reject {selected.businessName}?</DialogTitle>
                                <DialogDescription>The applicant sees this reason and can apply again.</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-1.5">
                                <Label htmlFor="rejection-reason">Reason</Label>
                                <Textarea
                                    id="rejection-reason"
                                    rows={3}
                                    maxLength={500}
                                    value={reason}
                                    aria-invalid={!!reasonError}
                                    placeholder="e.g. The SSM number doesn't match the business name. Please attach your SSM certificate."
                                    onChange={(event) => {
                                        setReason(event.target.value);
                                        setReasonError(undefined);
                                    }}
                                />
                                <FieldError message={reasonError} />
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setRejecting(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => reject(selected)}
                                >
                                    Reject application
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    );
}
