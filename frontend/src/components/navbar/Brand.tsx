import { Link } from "react-router-dom";
import { PATHS } from "@/routes";

export default function Brand() {
    return (
        <Link
            to={PATHS.home}
            className="flex min-w-0 items-center gap-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-2"
        >
            {/* The logo mark (public/favicon.png, cropped from the full logo in public/logo.png); the name stays as live text. */}
            <img src="/favicon.png" alt="" aria-hidden="true" className="size-8 shrink-0 object-contain sm:size-11" />
            <span className="truncate text-sm font-semibold tracking-tight text-primary min-[360px]:text-base sm:text-lg">MutiaraConnect</span>
        </Link>
    );
}
