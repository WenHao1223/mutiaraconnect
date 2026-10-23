import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navStyles } from "@/components/navbar/navStyles";
import { navRoutes, PATHS } from "@/routes";

export default function ConstructionMenu() {
    const { pathname } = useLocation();
    const active = pathname.startsWith(PATHS.construction);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(navStyles.desktopLink, active && navStyles.desktopActive)}
                >
                    Construction
                    <ChevronDown className="size-4" aria-hidden="true" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
                {navRoutes.construction.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                        <Link to={item.path}>{item.label}</Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}