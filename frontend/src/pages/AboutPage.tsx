import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Building2,
    ChevronRight,
    HardHat,
    LifeBuoy,
    MessageCircleQuestion,
    TrafficCone,
    type LucideIcon,
} from "lucide-react";
import HelpPanel from "@/components/custom/HelpPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PATHS } from "@/routes";

/**
 * The parts of the app people come for, each linking to its page. A function rather than a
 * constant: routes.tsx imports this page, so PATHS isn't ready yet when this module first loads.
 */
const features = (): { title: string; description: string; icon: LucideIcon; to: string }[] => [
    {
        title: "Construction updates",
        description: "Follow each work package, what's happening now and what's next.",
        icon: HardHat,
        to: PATHS.constructionUpdates,
    },
    {
        title: "Road & access",
        description: "See closures on the map and get a route around them.",
        icon: TrafficCone,
        to: PATHS.roadAccess,
    },
    {
        title: "Support",
        description: "Report an issue or send feedback, and follow it until it's resolved.",
        icon: LifeBuoy,
        to: PATHS.ticket,
    },
    {
        title: "Local businesses",
        description: "Find shops near the works and the help available to them.",
        icon: Building2,
        to: PATHS.business,
    },
];

/** About Us: the animated logo up top, then what the app is for and where to go next. */
export default function AboutPage() {
    // The stop being hovered or focused; the line lights up in gold as far as it. -1: none.
    const [active, setActive] = useState(-1);
    const stops = features();

    return (
        <div className="flex-1 bg-background">
            {/* The band uses the GIF's own navy so the animation blends into it edge to edge. */}
            <section className="bg-logo-backdrop">
                <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-4 pb-8 text-center">
                    {/* Visitors who ask for reduced motion get a still frame instead of the loop. The GIF's grainy
                        edges fade out (oval mask) so it has no hard box against the band. */}
                    <picture>
                        <source srcSet="/logo-still.png" media="(prefers-reduced-motion: reduce)" />
                        <img
                            src="/Gemini_Generated_Gif_jbttqzjbttqzjbtt.gif"
                            alt="MutiaraConnect logo: a train running along the M"
                            width={640}
                            height={360}
                            className="w-full max-w-[400px] [mask-image:radial-gradient(ellipse_closest-side,black_85%,transparent)]"
                        />
                    </picture>
                    <h1 className="-mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:whitespace-nowrap">
                        Keeping Penang moving while the Mutiara LRT is built
                    </h1>
                    <p className="mt-3 max-w-xl text-white/75">
                        One place for residents and businesses to follow the works, find road and
                        access changes, and get help when something goes wrong.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-5xl space-y-12 px-4 py-12">
                <section aria-labelledby="features-heading">
                    <h2 id="features-heading" className="text-2xl font-bold text-primary">
                        What you can do here?
                    </h2>
                    {/* Each feature is a stop on a line, like the Recently resolved strip: across on wide
                        screens, down the side on phones. Hovering (or focusing) a stop fills the line in
                        gold up to it, stop by stop, and lifts its card. */}
                    <ul
                        className="mt-6 flex flex-col gap-3 lg:grid lg:grid-cols-4 lg:gap-4"
                        onMouseLeave={() => setActive(-1)}
                    >
                        {stops.map((feature, index) => {
                            const reached = index <= active;
                            const isActive = index === active;
                            // Light each segment a moment after the one before, as if travelling along.
                            const delay = { transitionDelay: `${index * 60}ms` };
                            return (
                                <li
                                    key={feature.title}
                                    className="relative flex gap-4 lg:flex-col lg:gap-3"
                                    onMouseEnter={() => setActive(index)}
                                    onFocus={() => setActive(index)}
                                    onBlur={() => setActive(-1)}
                                >
                                    {/* The line and this stop's station. Vertical by default, across from lg up. */}
                                    <div
                                        className="relative flex w-5 shrink-0 justify-center lg:h-5 lg:w-full lg:items-center"
                                        aria-hidden
                                    >
                                        {index > 0 && (
                                            <span
                                                className={cn(
                                                    "absolute -top-1.5 left-1/2 h-10 w-1 -translate-x-1/2 transition-colors duration-300 lg:top-1/2 lg:right-1/2 lg:left-[-0.5rem] lg:h-1 lg:w-auto lg:translate-x-0 lg:-translate-y-1/2 motion-reduce:transition-none",
                                                    reached ? "bg-hazard" : "bg-primary",
                                                )}
                                                style={delay}
                                            />
                                        )}
                                        {index < stops.length - 1 && (
                                            <span
                                                className={cn(
                                                    "absolute top-[34px] -bottom-1.5 left-1/2 w-1 -translate-x-1/2 transition-colors duration-300 lg:top-1/2 lg:right-[-0.5rem] lg:bottom-auto lg:left-1/2 lg:h-1 lg:w-auto lg:translate-x-0 lg:-translate-y-1/2 motion-reduce:transition-none",
                                                    index < active ? "bg-hazard" : "bg-primary",
                                                )}
                                                style={{ transitionDelay: `${(index + 1) * 60}ms` }}
                                            />
                                        )}
                                        <span
                                            className={cn(
                                                "relative mt-6 block size-5 rounded-full border-4 transition-colors duration-300 lg:mt-0 motion-reduce:transition-none",
                                                isActive
                                                    ? "border-hazard bg-card ring-4 ring-hazard/25"
                                                    : reached
                                                      ? "border-hazard bg-hazard"
                                                      : "border-primary bg-card",
                                            )}
                                            style={delay}
                                        />
                                    </div>
                                    <Link
                                        to={feature.to}
                                        className={cn(
                                            "group flex min-w-0 flex-1 items-start gap-3 rounded-xl border bg-card p-5 shadow-sm transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex-col motion-reduce:transform-none motion-reduce:transition-none",
                                            // The reached stop's card turns gold with the line, text in the gold's ink colour.
                                            isActive &&
                                                "-translate-y-1 border-hazard bg-hazard text-hazard-foreground shadow-md",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "rounded-lg p-2 transition-colors duration-200",
                                                isActive
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-primary/10 text-primary",
                                            )}
                                        >
                                            <feature.icon className="size-5" aria-hidden />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            {/* Inline arrow, so it follows the last word when the title wraps. */}
                                            <span className="block font-semibold">
                                                {feature.title}
                                                <ChevronRight
                                                    className={cn(
                                                        "ml-1 inline size-4 align-[-2px] transition-transform group-hover:translate-x-0.5",
                                                        isActive
                                                            ? "text-hazard-foreground"
                                                            : "text-muted-foreground",
                                                    )}
                                                    aria-hidden
                                                />
                                            </span>
                                            <span
                                                className={cn(
                                                    "mt-1 block text-sm transition-colors duration-200",
                                                    isActive
                                                        ? "text-hazard-foreground/80"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                {feature.description}
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                <section aria-labelledby="why-heading" className="max-w-2xl">
                    <h2 id="why-heading" className="text-2xl font-bold text-primary">
                        Why we built it?
                    </h2>
                    <p className="mt-3 text-muted-foreground">
                        Building the Mutiara Line changes roads, footpaths and shopfronts along the
                        route. MutiaraConnect gathers construction updates, closures and support in
                        one place, so people can plan around the works and tell the team when
                        something needs fixing.
                    </p>
                </section>

                <HelpPanel
                    id="contact-heading"
                    title="Get in touch"
                    description="Questions, issues or feedback about the works? Send a ticket and the team will reply."
                >
                    <Button asChild>
                        <Link to={PATHS.ticket}>
                            <LifeBuoy aria-hidden />
                            Go to Support
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link to={PATHS.faqs}>
                            <MessageCircleQuestion aria-hidden />
                            Read the FAQs
                        </Link>
                    </Button>
                </HelpPanel>
            </div>
        </div>
    );
}
