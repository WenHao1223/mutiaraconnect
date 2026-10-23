import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/routes";

export default function NotFoundPage() {
    return (
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
            <p className="text-6xl font-bold text-primary">404</p>
            <h1 className="mt-4 text-2xl font-semibold">Page Not Found</h1>
            <p className="mt-2 text-muted-foreground">
                The page you are looking for does not exist or may have been moved.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild>
                    <Link to={PATHS.home}>Back to map</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link to={PATHS.ticket}>Report a problem</Link>
                </Button>
            </div>
        </div>
    );
}