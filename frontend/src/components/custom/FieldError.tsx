export default function FieldError({ message }: { message?: string }) {
    return message ? (
        <p role="alert" className="mt-1 text-xs text-destructive">
            {message}
        </p>
    ) : null;
}