import type { HTMLAttributes } from "react";
import { clsx } from "clsx";

export function GlassCard({ className, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-lg border p-6 backdrop-blur-glass", className)}
      style={{
        background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.58)",
        borderColor: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)",
        boxShadow: "0 8px 32px rgba(120,120,180,0.09)",
        ...style,
      }}
      {...props}
    />
  );
}
