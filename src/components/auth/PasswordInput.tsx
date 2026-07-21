import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Icon } from "@/components/ui/Icon";

export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type={visible ? "text" : "password"}
          className={`w-full pr-10 ${className ?? ""}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <Icon i={visible ? "eye-off" : "eye"} size={16} />
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
