import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navStyles } from "@/components/navbar/navStyles";
import { navRoutes } from "@/routes";

export default function MobileMenu() {
    const [open, setOpen] = useState(false);
    const [constructionOpen, setConstructionOpen] = useState(false);
    const { pathname } = useLocation();
    const constructionActive = navRoutes.construction.some((item) =>
        pathname === item.path || pathname.startsWith(`${item.path}/`),
    );

    function changeOpen(next: boolean) {
        setOpen(next);
        if (!next) setConstructionOpen(false);
    }

    const close = () => changeOpen(false);

    // A mobile drawer must not keep covering the page after switching to desktop navigation.
    useEffect(() => {
        const desktop = window.matchMedia("(min-width: 1024px)");
        const onResize = (event: MediaQueryListEvent) => {
            if (!event.matches) return;
            setOpen(false);
            setConstructionOpen(false);
        };
        desktop.addEventListener("change", onResize);
        return () => desktop.removeEventListener("change", onResize);
    }, []);

    return (
        <Sheet open={open} onOpenChange={changeOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="Open menu">
                    <Menu className="size-5" aria-hidden />
                </Button>
            </SheetTrigger>
            <SheetContent side="left"
                className="flex h-dvh w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden bg-background p-0 [&>button]:top-3 [&>button]:right-3 [&>button]:grid [&>button]:size-9 [&>button]:place-items-center"
            >
                <div className="shrink-0 border-b py-4 pr-14 pl-5">
                    <SheetTitle className="text-lg font-semibold text-primary">MutiaraConnect</SheetTitle>
                    <SheetDescription className="sr-only">Browse the site navigation.</SheetDescription>
                </div>
                <nav aria-label="Mobile" className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
                    <Collapsible open={constructionOpen} onOpenChange={setConstructionOpen}>
                        <CollapsibleTrigger asChild>
                            <button type="button" className={cn(
                                navStyles.mobileLink,
                                "flex w-full items-center justify-between gap-2 text-left",
                                constructionActive && navStyles.mobileActive,
                            )}>
                                Construction
                                <ChevronDown aria-hidden className={cn(
                                    "size-4 shrink-0 transition-transform motion-reduce:transition-none",
                                    constructionOpen && "rotate-180",
                                )} />
                            </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-1 ml-3 space-y-1 border-l pl-3">
                            {navRoutes.construction.map((item) => (
                                <NavLink key={item.path} to={item.path} onClick={close}
                                    className={({ isActive }) => cn(
                                        navStyles.mobileLink,
                                        "min-h-11 text-sm",
                                        isActive && navStyles.mobileActive,
                                    )}
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </CollapsibleContent>
                    </Collapsible>

                    <div className="my-2 border-t" />
                    {navRoutes.main.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end
                            onClick={close}
                            className={({ isActive }) =>
                                cn(navStyles.mobileLink, isActive && navStyles.mobileActive)
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
