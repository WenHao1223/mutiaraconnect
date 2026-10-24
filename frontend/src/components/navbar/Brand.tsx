import { Link } from "react-router-dom";
import { PATHS } from "@/routes";

export default function Brand() {
    return (
        <Link
            to={PATHS.home}
            className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            {/* The logo mark (public/favicon.png, cropped from the full logo in public/logo.png); the name stays as live text. */}
            <img src="/favicon.png" alt="" aria-hidden="true" className="size-11 object-contain" />
            <span className="text-lg font-semibold tracking-tight text-primary">MutiaraConnect</span>
        </Link>
    );
}