import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navStyles } from "@/components/navbar/navStyles";
import { navRoutes } from "@/routes";

export default function MobileMenu() {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                    <Menu className="size-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto bg-background p-4">
                <SheetTitle className="mb-4 text-lg font-semibold text-primary">MutiaraConnect</SheetTitle>
                <nav aria-label="Mobile" className="flex flex-col gap-1">
                    <p className="px-3 text-xs font-medium text-muted-foreground">Construction</p>
                    {navRoutes.construction.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={close}
                            className={({ isActive }) =>
                                cn(navStyles.mobileLink, "pl-6", isActive && navStyles.mobileActive)
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}

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