import { useState } from "react";
import { ExternalLink, Inbox, MapPin, Phone, Search, Store } from "lucide-react";
import LocationPicker from "@/components/custom/LocationPicker";
import MapsLink from "@/components/custom/MapsLink";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { readBusinessAccounts } from "@/lib/admin/users";
import { applicationForPremise, businessTypeLabels } from "@/lib/business/business";
import { cn } from "@/lib/utils";

const ignoreLocationChange = () => undefined;

/** Admin list of business accounts; clicking one shows every premise it owns. */
export default function BusinessAccountsList() {
    const [accounts] = useState(() => readBusinessAccounts());
    const [query, setQuery] = useState("");
    const [selectedEmail, setSelectedEmail] = useState<string>();

    const text = query.trim().toLowerCase();
    const visible = accounts.filter((account) =>
        [account.name, account.email, ...account.premises.map((premise) => premise.name)]
            .join(" ")
            .toLowerCase()
            .includes(text),
    );
    const selected = accounts.find((account) => account.email === selectedEmail);

    return (
        <div>
            <p className="text-sm text-muted-foreground">
                {accounts.length === 1 ? "1 business account." : `${accounts.length} business accounts.`}
            </p>

            <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search owner, email or premise…"
                    className="pl-8"
                    aria-label="Search business accounts"
                />
            </div>

            {visible.length === 0 ? (
                <div className="mt-4 rounded-lg bg-muted px-4 py-8 text-center">
                    <Inbox className="mx-auto size-8 text-muted-foreground" aria-hidden />
                    <p className="mt-2 text-sm font-medium">No business accounts here</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Accounts appear here once their business application is approved.
                    </p>
                </div>
            ) : (
                <ul className="mt-3 space-y-2">
                    {visible.map((account) => (
                        <li key={account.email}>
                            <button
                                type="button"
                                onClick={() => setSelectedEmail(account.email)}
                                className={cn(
                                    "w-full cursor-pointer rounded-lg border p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    account.email === selectedEmail && "border-primary bg-accent",
                                )}
                            >
                                <span className="flex items-start justify-between gap-2">
                                    <span className="text-sm font-semibold">{account.name}</span>
                                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                        <Store className="size-3.5" aria-hidden />
                                        {account.premises.length === 1 ? "1 premise" : `${account.premises.length} premises`}
                                    </span>
                                </span>
                                <span className="mt-1 block text-sm text-muted-foreground">{account.email}</span>
                                <span className="mt-1 block truncate text-xs text-muted-foreground">
                                    {account.premises.map((premise) => premise.name).join(" · ") || "No premises"}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <Dialog open={!!selected} onOpenChange={(isOpen) => !isOpen && setSelectedEmail(undefined)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selected.name}</DialogTitle>
                                <DialogDescription>
                                    {selected.email} ·{" "}
                                    {selected.premises.length === 1
                                        ? "1 premise"
                                        : `${selected.premises.length} premises`}
                                </DialogDescription>
                            </DialogHeader>

                            {selected.premises.length === 0 ? (
                                <p className="rounded-lg bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
                                    This account has no premises.
                                </p>
                            ) : (
                                <Accordion type="single" collapsible>
                                    {selected.premises.map((premise) => {
                                        const application = applicationForPremise(selected.email, premise);
                                        return (
                                            <AccordionItem key={premise.id} value={premise.id}>
                                                <AccordionTrigger className="gap-3">
                                                    <span className="flex-1">
                                                        {premise.name}
                                                        <span className="block text-xs font-normal text-muted-foreground">
                                                            SSM {premise.registrationNumber}
                                                        </span>
                                                    </span>
                                                </AccordionTrigger>
                                                <AccordionContent className="space-y-2">
                                                    {application && (
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <Store className="size-4" aria-hidden />{" "}
                                                                {businessTypeLabels[application.businessType]}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <Phone className="size-4" aria-hidden /> {application.contactPhone}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                        <span className="inline-flex items-center gap-1.5 font-medium">
                                                            <MapPin className="size-4 text-muted-foreground" aria-hidden />
                                                            {premise.address || "Pinned on the map"}
                                                        </span>
                                                        <MapsLink location={premise}>
                                                            Open in Google Maps <ExternalLink className="size-3" aria-hidden />
                                                        </MapsLink>
                                                    </div>
                                                    <LocationPicker
                                                        readOnly
                                                        hideCaption
                                                        recenterKey={premise.id}
                                                        value={{
                                                            latitude: premise.latitude,
                                                            longitude: premise.longitude,
                                                            address: premise.address,
                                                        }}
                                                        onChange={ignoreLocationChange}
                                                    />
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
