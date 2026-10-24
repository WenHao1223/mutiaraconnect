import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
    ChevronRight,
    ExternalLink,
    HardHat,
    LayoutGrid,
    LifeBuoy,
    MapPin,
    Search,
    SearchX,
    Store,
    ThumbsDown,
    ThumbsUp,
    Ticket,
    TrafficCone,
    UserRound,
    type LucideIcon,
} from "lucide-react";
import MapsLink from "@/components/custom/MapsLink";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PATHS } from "@/routes";

type Topic = "tickets" | "road" | "construction" | "business" | "account";

/**
 * Each topic's colour, from the theme: `fill` for the selected tile, `soft` for icon bubbles, and
 * `edge` for the left edge of an opened question. Class strings are written out in full so
 * Tailwind finds them.
 */
const topics: {
    value: Topic;
    label: string;
    icon: LucideIcon;
    fill: string;
    soft: string;
    edge: string;
}[] = [
    {
        value: "tickets",
        label: "Tickets & feedback",
        icon: Ticket,
        fill: "border-primary bg-primary text-primary-foreground",
        soft: "bg-primary/10 text-primary",
        edge: "data-[state=open]:border-l-primary",
    },
    {
        value: "road",
        label: "Road & access",
        icon: TrafficCone,
        fill: "border-destructive bg-destructive text-destructive-foreground",
        soft: "bg-destructive/10 text-destructive",
        edge: "data-[state=open]:border-l-destructive",
    },
    {
        value: "construction",
        label: "Construction",
        icon: HardHat,
        fill: "border-hazard bg-hazard text-hazard-foreground",
        soft: "bg-hazard/15 text-hazard-text",
        edge: "data-[state=open]:border-l-hazard",
    },
    {
        value: "business",
        label: "Businesses",
        icon: Store,
        fill: "border-success bg-success text-success-foreground",
        soft: "bg-success/10 text-success-text",
        edge: "data-[state=open]:border-l-success",
    },
    {
        value: "account",
        label: "Your account",
        icon: UserRound,
        // Neutral slate, the same colour as the Received status.
        fill: "border-neutral bg-neutral text-neutral-foreground",
        soft: "bg-neutral/10 text-neutral-text",
        edge: "data-[state=open]:border-l-neutral",
    },
];

const topicOf = (value: Topic) => topics.find((topic) => topic.value === value)!;

interface Faq {
    topic: Topic;
    question: string;
    answer: string;
    /** Where to go to do what the answer describes. */
    link?: { label: string; to: string };
}

/**
 * The questions, answered only from how MutiaraConnect itself works (no project facts it can't
 * back up). A function rather than a constant: routes.tsx imports this page, so PATHS isn't
 * ready yet when this module first loads.
 */
const faqs = (): Faq[] => [
    {
        topic: "tickets",
        question: "How do I report a problem near the works?",
        answer: "Go to Support and choose Send a ticket. Pick a category, describe what you saw and mark the spot on the map. The nearest LRT station is shown for you.",
        link: { label: "Go to Support", to: PATHS.ticket },
    },
    {
        topic: "tickets",
        question: "Do I need an account to send a ticket?",
        answer: "No. Anyone can send a ticket or feedback. Sign in if you want to follow its progress in My Tickets.",
    },
    {
        topic: "tickets",
        question: "Can I send a ticket anonymously?",
        answer: "Yes. When you're signed in, turn on Submit anonymously in the form. The ticket isn't linked to your account, so it won't appear in My Tickets.",
    },
    {
        topic: "tickets",
        question: "What do Received, Under Review, In Progress and Resolved mean?",
        answer: "Received: the team has your ticket. Under Review: someone is looking into it. In Progress: work to fix it has started. Resolved: it's been fixed, and the team's reply explains what was done.",
    },
    {
        topic: "tickets",
        question: "Can I edit or withdraw my ticket?",
        answer: "Yes, until the team starts reviewing it. Open the ticket, press the ⋯ button and choose Edit ticket or Withdraw ticket. After that it's locked, so the team's replies always match what you sent.",
        link: { label: "Open My Tickets", to: PATHS.profileTickets },
    },
    {
        topic: "tickets",
        question: "Can I add photos?",
        answer: "Yes. Use Upload photo in the ticket or feedback form. On a phone you can also take a photo with your camera.",
    },
    {
        topic: "road",
        question: "Where can I see road closures and diversions?",
        answer: "Closures and diversions are posted as announcements. Open Announcements, or check the bell at the top of any page.",
        link: { label: "See announcements", to: PATHS.announcements },
    },
    {
        topic: "road",
        question: "How do I know if a closure is near me?",
        answer: "Each announcement names the area it affects. Local Businesses also lists what's affected around each shop along the line.",
        link: { label: "Open Local Businesses", to: PATHS.business },
    },
    {
        topic: "construction",
        question: "Where can I see what's being built near me?",
        answer: "Construction updates lists every work package with its station, dates and progress. Stations & alignment shows each station along the line.",
        link: { label: "See construction updates", to: PATHS.constructionUpdates },
    },
    {
        topic: "construction",
        question: "What do Ongoing, Upcoming and Completed mean?",
        answer: "Ongoing: work is happening now. Upcoming: it's scheduled to start. Completed: it's finished.",
    },
    {
        topic: "construction",
        question: "How is the nearest station worked out?",
        answer: "When you mark a spot on the map, MutiaraConnect finds the LRT station closest to it and shows how far away it is.",
    },
    {
        topic: "business",
        question: "My shop is affected by the works. Where can I get help?",
        answer: "Use Request support on the Business Dashboard to ask the support desk for free signage, delivery-window coordination or alternative parking. The desk is at Komtar Level 1, Monday to Friday, 9am to 5pm.",
        link: { label: "Open Business Dashboard", to: PATHS.businessDashboard },
    },
    {
        topic: "business",
        question: "How do I register my premise?",
        answer: "Sign in, open Business Account from your profile and apply with your premise details and a supporting document, such as an SSM certificate, business licence or utility bill.",
        link: { label: "Open Business Account", to: PATHS.profileBusiness },
    },
    {
        topic: "account",
        question: "How do I sign in or create an account?",
        answer: "Use Sign in at the top right. You can sign in with your email or with MyDigital ID, or create a new account with Register.",
        link: { label: "Sign in", to: PATHS.login },
    },
    {
        topic: "account",
        question: "Where can I track the tickets I've sent?",
        answer: "Open My Tickets from your profile menu. It lists every ticket linked to your account with its latest status and the team's replies.",
        link: { label: "Open My Tickets", to: PATHS.profileTickets },
    },
];

/** "Was this helpful?" votes, kept only in this browser (no backend yet). */
const HELPFUL_KEY = "mutiaraconnect.faq-helpful";
type Vote = "yes" | "no";

function readVotes(): Record<string, Vote> {
    try {
        return JSON.parse(localStorage.getItem(HELPFUL_KEY) ?? "{}") as Record<string, Vote>;
    } catch {
        return {};
    }
}

/** The text with every match of the search highlighted. */
function highlight(text: string, words: string): ReactNode {
    if (!words) return text;
    const escaped = words.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.split(new RegExp(`(${escaped})`, "gi")).map((part, index) =>
        part.toLowerCase() === words ? (
            <mark key={index} className="rounded bg-hazard/30 px-0.5 text-inherit">
                {part}
            </mark>
        ) : (
            part
        ),
    );
}

/**
 * FAQs: colour-coded topic tiles and a search filter one accordion of questions (matches
 * highlighted); each answer links to where to act and asks if it helped; then three ways to get
 * more help.
 */
export default function FaqPage() {
    const [query, setQuery] = useState("");
    const [topic, setTopic] = useState<Topic | "all">("all");
    const [votes, setVotes] = useState<Record<string, Vote>>(readVotes);

    const all = faqs();
    const words = query.trim().toLowerCase();
    const shown = all.filter(
        (faq) =>
            (topic === "all" || faq.topic === topic) &&
            (!words || `${faq.question} ${faq.answer}`.toLowerCase().includes(words)),
    );
    const filtering = topic !== "all" || !!words;

    function vote(question: string, value: Vote) {
        const next = { ...votes, [question]: value };
        setVotes(next);
        try {
            localStorage.setItem(HELPFUL_KEY, JSON.stringify(next));
        } catch {
            /* storage unavailable: the thanks still shows for this visit */
        }
    }

    const tiles = [
        {
            value: "all" as const,
            label: "All questions",
            icon: LayoutGrid,
            count: all.length,
            fill: "border-secondary bg-secondary text-secondary-foreground",
            soft: "bg-muted text-foreground",
        },
        ...topics.map((item) => ({
            ...item,
            count: all.filter((faq) => faq.topic === item.value).length,
        })),
    ];

    return (
        <div className="flex-1 bg-background">
            <section className="border-b bg-muted/50">
                <div className="mx-auto max-w-5xl px-4 py-8">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="size-2 rounded-full bg-hazard" aria-hidden />
                        Help
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-primary">
                        Frequently asked questions
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Quick answers about tickets, closures, the works and your account.
                    </p>
                    <div className="relative mt-5 max-w-xl">
                        <Search
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden
                        />
                        <Input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search questions, e.g. withdraw, photo, closure"
                            aria-label="Search questions"
                            className="h-11 bg-card pl-9"
                        />
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
                {/* Topic tiles: the chosen one fills with its colour; the rest show it on their icon. */}
                <div
                    role="group"
                    aria-label="Filter by topic"
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
                >
                    {tiles.map((tile) => {
                        const selected = topic === tile.value;
                        return (
                            <button
                                key={tile.value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setTopic(tile.value)}
                                className={cn(
                                    "flex flex-col items-start gap-2 rounded-xl border bg-card p-3 text-left shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none motion-reduce:transition-none",
                                    selected && tile.fill,
                                )}
                            >
                                <span
                                    className={cn(
                                        "rounded-lg p-1.5 transition-colors duration-200",
                                        selected ? "bg-white/20" : tile.soft,
                                    )}
                                >
                                    <tile.icon className="size-4" aria-hidden />
                                </span>
                                <span className="text-sm leading-tight font-semibold">
                                    {tile.label}
                                </span>
                                <span
                                    className={cn(
                                        "text-xs",
                                        selected ? "opacity-80" : "text-muted-foreground",
                                    )}
                                >
                                    {tile.count} {tile.count === 1 ? "question" : "questions"}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <section aria-label="Questions">
                    {filtering && shown.length > 0 && (
                        <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
                            {shown.length} {shown.length === 1 ? "question" : "questions"}
                        </p>
                    )}
                    {shown.length === 0 ? (
                        <div className="rounded-xl border bg-card px-6 py-10 text-center shadow-sm">
                            <SearchX className="mx-auto size-8 text-muted-foreground" aria-hidden />
                            <p className="mt-2 font-medium">No questions match "{query.trim()}"</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Try another word or topic, or send a ticket and the team will
                                answer.
                            </p>
                            <Button
                                className="mt-4"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setQuery("");
                                    setTopic("all");
                                }}
                            >
                                Show all questions
                            </Button>
                        </div>
                    ) : (
                        <Accordion
                            type="single"
                            collapsible
                            className="overflow-hidden rounded-xl border bg-card shadow-sm"
                        >
                            {shown.map((faq) => {
                                const style = topicOf(faq.topic);
                                const voted = votes[faq.question];
                                return (
                                    <AccordionItem
                                        key={faq.question}
                                        value={faq.question}
                                        // An opened question gets its topic's colour on the left edge.
                                        className={cn(
                                            "border-l-4 border-l-transparent px-4 transition-colors last:border-b-0 hover:bg-muted/40 data-[state=open]:bg-muted/40",
                                            style.edge,
                                        )}
                                    >
                                        <AccordionTrigger className="gap-3 text-left text-base font-semibold hover:no-underline">
                                            <span className="flex items-center gap-3">
                                                <span
                                                    className={cn(
                                                        "shrink-0 rounded-lg p-1.5",
                                                        style.soft,
                                                    )}
                                                >
                                                    <style.icon className="size-4" aria-hidden />
                                                </span>
                                                <span>{highlight(faq.question, words)}</span>
                                            </span>
                                        </AccordionTrigger>
                                        <AccordionContent className="pl-10">
                                            <p className="text-muted-foreground">
                                                {highlight(faq.answer, words)}
                                            </p>
                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                                {faq.link ? (
                                                    <Link
                                                        to={faq.link.to}
                                                        className="group inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                                                    >
                                                        {faq.link.label}
                                                        <ChevronRight
                                                            className="size-4 transition-transform group-hover:translate-x-0.5"
                                                            aria-hidden
                                                        />
                                                    </Link>
                                                ) : (
                                                    <span />
                                                )}
                                                {voted ? (
                                                    <p
                                                        className="text-xs text-muted-foreground"
                                                        aria-live="polite"
                                                    >
                                                        Thanks for letting us know.
                                                    </p>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        Was this helpful?
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7"
                                                            aria-label="Yes, this helped"
                                                            onClick={() =>
                                                                vote(faq.question, "yes")
                                                            }
                                                        >
                                                            <ThumbsUp className="size-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7"
                                                            aria-label="No, this didn't help"
                                                            onClick={() => vote(faq.question, "no")}
                                                        >
                                                            <ThumbsDown className="size-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    )}
                </section>

                {/* Three clear ways to get more help, each a card that leads somewhere. */}
                <section aria-labelledby="faq-help-heading">
                    <h2 id="faq-help-heading" className="text-2xl font-bold text-primary">
                        Still need help?
                    </h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <HelpOption
                            icon={LifeBuoy}
                            title="Send a ticket"
                            text="Report an issue or ask a question, and the team will reply."
                        >
                            <Link to={PATHS.ticket} className={helpLink}>
                                Go to Support
                                <ChevronRight className="size-4" aria-hidden />
                            </Link>
                        </HelpOption>
                        <HelpOption
                            icon={Ticket}
                            title="Track your tickets"
                            text="See the status of tickets you've sent and the team's replies."
                        >
                            <Link to={PATHS.profileTickets} className={helpLink}>
                                Open My Tickets
                                <ChevronRight className="size-4" aria-hidden />
                            </Link>
                        </HelpOption>
                        <HelpOption
                            icon={MapPin}
                            title="Visit the support desk"
                            text="Komtar Level 1, Monday to Friday, 9am to 5pm."
                        >
                            <MapsLink
                                location="Komtar, George Town, Penang"
                                mode="directions"
                                className={helpLink}
                            >
                                Open in Google Maps
                                <ExternalLink className="size-3.5" aria-hidden />
                            </MapsLink>
                        </HelpOption>
                    </div>
                </section>
            </div>
        </div>
    );
}

const helpLink =
    "mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-primary hover:underline";

/** One way to get more help: icon, title, a line of text, and its link at the bottom. */
function HelpOption({
    icon: Icon,
    title,
    text,
    children,
}: {
    icon: LucideIcon;
    title: string;
    text: string;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col rounded-xl border bg-card p-5 shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none">
            <span className="w-fit rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            {children}
        </div>
    );
}
