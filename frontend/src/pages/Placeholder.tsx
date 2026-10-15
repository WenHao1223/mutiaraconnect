/** Temporary page body. Replace the element in routes.tsx once a module page exists. */
export default function Placeholder({ title }: { title: string }) {
    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-10">
            <h1 className="text-2xl font-semibold text-primary">{title}</h1>
            <p className="mt-2 text-muted-foreground">This page is not built yet.</p>
        </div>
    );
}