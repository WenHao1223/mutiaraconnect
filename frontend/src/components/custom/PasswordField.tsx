import { forwardRef, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

const PasswordField = forwardRef<HTMLInputElement, Omit<ComponentProps<"input">, "type">>((props, ref) => {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <Input ref={ref} type={visible ? "text" : "password"} className="pr-10" {...props} />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
        </div>
    );
});
PasswordField.displayName = "PasswordField";
export default PasswordField;