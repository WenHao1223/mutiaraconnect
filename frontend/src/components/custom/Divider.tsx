export default function Divider({ children }: { children: string }) {
    return (
        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {children}
            <span className="h-px flex-1 bg-border" />
        </div>
    );
}