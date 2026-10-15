import { Link } from "react-router-dom";
import { PATHS } from "@/routes";

export default function Brand() {
    return (
        <Link
            to={PATHS.home}
            className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            {/* Placeholder mark until the real logo is in public/favicon.svg */}
            <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
                <span className="size-3 rounded-full bg-white/90" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-primary">MutiaraConnect</span>
        </Link>
    );
}