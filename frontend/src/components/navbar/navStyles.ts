/** Shared class names for navbar links. */
export const navStyles = {
    desktopLink:
        "relative inline-flex h-16 items-center gap-1 px-3 text-sm font-medium text-foreground/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
    // Amber underline marks the current page.
    desktopActive:
        "text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-hazard",
    mobileLink:
        "block rounded-md px-3 py-2.5 text-base font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
    mobileActive: "bg-accent text-primary",
};
