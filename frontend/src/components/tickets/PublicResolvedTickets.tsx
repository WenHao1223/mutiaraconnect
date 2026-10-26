import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CircleCheck, TrainFront } from "lucide-react";
import { categoryIcons, categoryLabels, formatDate, statusMeta } from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";
import TicketDialog from "@/components/tickets/TicketDialog";
import type { Ticket } from "@/types/ticket";

/** Seconds each ticket spends crossing the strip; keeps the speed steady as the list grows. */
const SECONDS_PER_TICKET = 12;

const DAY_MS = 24 * 60 * 60 * 1000;

/** How long the strip and train take to ease to a stop on hover, and back up to speed after. */
const EASE_MS = 500;

/** How long after a swipe or drag settles before the strip starts drifting again. */
const RESUME_MS = 1500;

/** How far the mouse must move, in px, before a press on the strip counts as a drag rather than a click. */
const DRAG_PX = 5;

/** "Resolved same day", "Resolved in 1 day", "Resolved in 3 days". */
function timeToResolve(ticket: Ticket) {
    const days = Math.round(
        (Date.parse(ticket.updatedAt) - Date.parse(ticket.submittedAt)) / DAY_MS,
    );
    if (days < 1) return "Resolved same day";
    return `Resolved in ${days} ${days === 1 ? "day" : "days"}`;
}

/**
 * One resolved ticket: a station on the line with a ticket stub hanging below it. Hovering
 * fills the station dot and lifts the stub; clicking opens the full outcome. The duplicate copy
 * passes `focusable={false}` so keyboard users only tab through each ticket once.
 */
function Stop({
    ticket,
    onOpen,
    focusable = true,
}: {
    ticket: Ticket;
    onOpen: (ticket: Ticket) => void;
    focusable?: boolean;
}) {
    const outcome = ticket.updates[ticket.updates.length - 1];
    const CategoryIcon = categoryIcons[ticket.category];

    return (
        <li className="group/stop w-68 shrink-0">
            {/* A transit-map station: a white circle with a thick green (fixed) ring, centred on the line (the line's
                centre is 8px into the stop, so the 20px ring is raised 2px), filling green on hover. Ring and
                station name share the card's px-4 so everything lines up. */}
            <span
                className="relative -mt-0.5 ml-4 block size-5 rounded-full border-4 border-success bg-card transition-colors duration-200 group-hover/stop:bg-success motion-reduce:transition-none"
                aria-hidden
            />
            <p className="mt-2 truncate px-4 text-sm font-bold text-primary">{ticket.location}</p>
            <button
                type="button"
                onClick={() => onOpen(ticket)}
                tabIndex={focusable ? undefined : -1}
                aria-label={`${categoryLabels[ticket.category]} at ${ticket.location}: see details`}
                className="ticket-stub mt-3 block w-full cursor-pointer rounded-2xl border bg-card text-left transition duration-200 ease-out group-hover/stop:-translate-y-1 group-hover/stop:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-primary/25 dark:bg-accent dark:group-hover/stop:border-primary/60 motion-reduce:transition-none"
            >
                {/* The category is the card's title, with the team's message on how it was fixed below.
                    In dark mode the card takes the lighter accent navy and a soft blue edge, so it
                    stands out from the header band behind it. */}
                <span className="block px-4 pt-5 pb-4">
                    <span className="flex items-center gap-2 text-base font-bold">
                        <CategoryIcon
                            className="size-5 shrink-0 text-muted-foreground"
                            aria-hidden
                        />
                        {categoryLabels[ticket.category]}
                    </span>
                    <span className="mt-3.5 line-clamp-3 min-h-[4.5rem] text-sm leading-relaxed">
                        {outcome.message}
                    </span>
                </span>
                {/* Tear line; .ticket-stub cuts the matching notches into both edges. */}
                <span className="mx-3 block border-t border-dashed" aria-hidden />
                <span className="flex h-11 items-center justify-between gap-2 px-4 text-xs">
                    <span
                        className={cn(
                            "flex items-center gap-1.5 font-semibold",
                            statusMeta.resolved.text,
                        )}
                    >
                        <CircleCheck className="size-3.5" aria-hidden />
                        {timeToResolve(ticket)}
                    </span>
                    <span className="text-muted-foreground">{formatDate(ticket.updatedAt)}</span>
                </span>
            </button>
        </li>
    );
}

/**
 * Public, anonymised strip of resolved tickets that drifts along like a train on the line.
 * Reporter and premise are never shown. It only moves when the tickets don't fit, eases to a stop
 * on hover, can be swiped on touch screens or dragged with the mouse, and holds still for people
 * who ask for reduced motion (it scrolls by hand instead).
 */
export default function PublicResolvedTickets({ tickets }: { tickets: Ticket[] }) {
    const [overflowing, setOverflowing] = useState(false);
    // Seconds for the train to cross the strip at the cards' own speed (set once measured).
    const [trainSeconds, setTrainSeconds] = useState<number>();
    const [open, setOpen] = useState<Ticket>();
    const frameRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    // The strip drifts on its own when the cards don't fit. It scrolls from code, on every screen size,
    // so a finger or the mouse can take over and move it by hand, and the drift carries on from there.
    const looping = overflowing && tickets.length > 1;
    // Whether the pointer is over the strip: the drift eases to a stop meanwhile.
    const hovered = useRef(false);

    // Re-check on resize: the same list can fit on a desktop and overflow on a phone.
    useEffect(() => {
        const viewport = viewportRef.current;
        const list = listRef.current;
        if (!viewport || !list) return;
        const measure = () => {
            setOverflowing(list.scrollWidth > viewport.clientWidth);
            // The cards slide one list-width per loop; match the train to that speed.
            const cardSpeed = list.scrollWidth / (tickets.length * SECONDS_PER_TICKET);
            setTrainSeconds(viewport.clientWidth / cardSpeed);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(viewport);
        return () => observer.disconnect();
    }, [tickets.length]);

    // Nudge the scroll position each frame at the cards' speed, wrapping after one copy of the list so
    // it loops. A touch, wheel or mouse drag hands control to the user; drifting resumes once it settles.
    useEffect(() => {
        const viewport = viewportRef.current;
        const list = listRef.current;
        if (!looping || !viewport || !list) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const loop = () => list.scrollWidth;
        const speed = () => loop() / (tickets.length * SECONDS_PER_TICKET);
        let position = viewport.scrollLeft;
        let last = performance.now();
        let held = false;
        let touching = false;
        let frame = 0;
        let resume: number | undefined;
        // 1 at full drift, easing to 0 while hovered and back up after.
        let rate = 1;
        // A mouse press that may turn into a drag, and whether it has.
        let press: { x: number; left: number } | undefined;
        let dragged = false;

        const tick = (now: number) => {
            const seconds = (now - last) / 1000;
            last = now;
            rate += ((hovered.current ? 0 : 1) - rate) * Math.min(1, seconds / (EASE_MS / 3000));
            if (!held) {
                position += speed() * seconds * rate;
                if (position >= loop()) position -= loop();
                viewport.scrollLeft = position;
            }
            frame = requestAnimationFrame(tick);
        };
        const hold = () => {
            held = true;
            window.clearTimeout(resume);
        };
        // Pick up from wherever the user left it, folded back into the first copy.
        const release = () => {
            window.clearTimeout(resume);
            resume = window.setTimeout(() => {
                if (dragged && press) return; // still dragging: wait for the mouse to let go
                position = viewport.scrollLeft % loop();
                viewport.scrollLeft = position;
                held = false;
            }, RESUME_MS);
        };
        const onTouchStart = () => {
            touching = true;
            hold();
        };
        const onTouchEnd = () => {
            touching = false;
            release();
        };
        // A flick keeps scrolling after the finger lifts; wait for it to settle.
        const onScroll = () => {
            if (held && !touching) release();
        };
        const onWheel = () => {
            hold();
            release();
        };
        // Mouse: press and move past DRAG_PX to drag the strip. Touch and pen scroll it natively.
        const onPointerDown = (event: PointerEvent) => {
            if (event.pointerType !== "mouse" || event.button !== 0) return;
            press = { x: event.clientX, left: viewport.scrollLeft };
            dragged = false;
        };
        const onPointerMove = (event: PointerEvent) => {
            if (!press) return;
            const distance = event.clientX - press.x;
            if (!dragged) {
                if (Math.abs(distance) < DRAG_PX) return;
                dragged = true;
                hold();
                viewport.setPointerCapture(event.pointerId);
            }
            viewport.scrollLeft = press.left - distance;
        };
        const onPointerUp = () => {
            const wasDragging = dragged && press;
            press = undefined;
            if (wasDragging) release();
        };
        // The click that ends a drag must not open the card under the mouse.
        const onClick = (event: MouseEvent) => {
            if (!dragged) return;
            dragged = false;
            event.stopPropagation();
            event.preventDefault();
        };

        viewport.addEventListener("touchstart", onTouchStart, { passive: true });
        viewport.addEventListener("touchend", onTouchEnd, { passive: true });
        viewport.addEventListener("touchcancel", onTouchEnd, { passive: true });
        viewport.addEventListener("scroll", onScroll, { passive: true });
        viewport.addEventListener("wheel", onWheel, { passive: true });
        viewport.addEventListener("pointerdown", onPointerDown);
        viewport.addEventListener("pointermove", onPointerMove);
        viewport.addEventListener("pointerup", onPointerUp);
        viewport.addEventListener("pointercancel", onPointerUp);
        viewport.addEventListener("click", onClick, true);
        frame = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(frame);
            window.clearTimeout(resume);
            viewport.removeEventListener("touchstart", onTouchStart);
            viewport.removeEventListener("touchend", onTouchEnd);
            viewport.removeEventListener("touchcancel", onTouchEnd);
            viewport.removeEventListener("scroll", onScroll);
            viewport.removeEventListener("wheel", onWheel);
            viewport.removeEventListener("pointerdown", onPointerDown);
            viewport.removeEventListener("pointermove", onPointerMove);
            viewport.removeEventListener("pointerup", onPointerUp);
            viewport.removeEventListener("pointercancel", onPointerUp);
            viewport.removeEventListener("click", onClick, true);
        };
    }, [looping, tickets.length]);

    // Hovering eases the train to a stop instead of freezing it, and eases it back up after (the cards
    // ease themselves in the drift above). CSS can only pause outright, so this ramps the animation's
    // playback rate.
    const easing = useRef<number>(undefined);
    useEffect(() => () => cancelAnimationFrame(easing.current ?? 0), []);
    function easeTo(target: number) {
        const animations = (frameRef.current?.getAnimations({ subtree: true }) ?? []).filter(
            (animation) => animation instanceof CSSAnimation && animation.animationName === "train",
        );
        if (animations.length === 0) return;
        cancelAnimationFrame(easing.current ?? 0);
        const from = animations[0].playbackRate;
        const start = performance.now();
        const step = (now: number) => {
            const t = Math.min((now - start) / EASE_MS, 1);
            const rate = from + (target - from) * (1 - (1 - t) ** 3); // ease-out
            animations.forEach((animation) => (animation.playbackRate = rate));
            if (t < 1) easing.current = requestAnimationFrame(step);
        };
        easing.current = requestAnimationFrame(step);
    }

    return (
        <section aria-labelledby="resolved-heading">
            <div>
                <h2
                    id="resolved-heading"
                    className="flex items-center gap-2 text-xl font-bold text-primary"
                >
                    <CircleCheck className="size-5 text-success" aria-hidden />
                    Recently resolved
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Issues reported near the works that the team has fixed. Open a ticket to see
                    how.
                </p>
            </div>

            {tickets.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                    Resolved tickets will appear here once the team closes them.
                </p>
            ) : (
                // The frame holds the line and the train, which stay put; only the stations and cards
                // inside the viewport move (drifting, or moved by hand: swiped on touch, dragged with the mouse).
                <div
                    ref={frameRef}
                    onMouseEnter={() => {
                        hovered.current = true;
                        easeTo(0);
                    }}
                    onMouseLeave={() => {
                        hovered.current = false;
                        easeTo(1);
                    }}
                    className={cn(
                        "relative mt-2",
                        looping &&
                            "[mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] motion-reduce:[mask-image:none]",
                    )}
                >
                    {/* The line the stations sit on: its centre is 24px down (16px top padding + 8px), where the
                        pins' tips and the train's middle meet it. */}
                    <div
                        className="absolute inset-x-0 top-[21px] h-1.5 rounded-full bg-primary"
                        aria-hidden
                    />

                    <div
                        ref={viewportRef}
                        className={cn(
                            // Side padding (pulled back with a negative margin) keeps the first pin clear of the edge fade.
                            "relative cursor-grab select-none overflow-x-auto px-3 pt-4 pb-4 [scrollbar-width:none] active:cursor-grabbing motion-reduce:[scrollbar-width:auto]",
                        )}
                    >
                        <div className="relative flex w-max">
                            <ul ref={listRef} className="flex gap-6 pr-6">
                                {tickets.map((ticket) => (
                                    <Stop key={ticket.id} ticket={ticket} onOpen={setOpen} />
                                ))}
                            </ul>
                            {/* Second copy fills the gap as the first slides away. Hidden from assistive tech;
                                not inert, so its cards still respond to hover. */}
                            {looping && (
                                <ul className="flex gap-6 pr-6 motion-reduce:hidden" aria-hidden>
                                    {tickets.map((ticket) => (
                                        <Stop
                                            key={ticket.id}
                                            ticket={ticket}
                                            onOpen={setOpen}
                                            focusable={false}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* The train runs along the line on top of the stations. While the cards drift, it moves at
                        the cards' speed (in the opposite direction, so it visibly passes the stations); otherwise
                        it runs its own loop. */}
                    <span
                        className={cn(
                            "absolute top-3 left-0 z-10 flex h-6 items-center rounded-full bg-primary px-2.5 text-primary-foreground shadow-md ring-2 ring-card motion-reduce:left-3 motion-reduce:animate-none",
                            looping && trainSeconds
                                ? "animate-[train_var(--train-duration)_linear_infinite]"
                                : "animate-[train_16s_linear_infinite]",
                        )}
                        style={{ "--train-duration": `${trainSeconds}s` } as CSSProperties}
                        aria-hidden
                    >
                        <TrainFront className="size-3.5" />
                    </span>
                </div>
            )}

            {/* Other people's tickets, so the shared popup hides anything about the reporter. */}
            <TicketDialog ticket={open} onClose={() => setOpen(undefined)} anonymous flipIn />
        </section>
    );
}
