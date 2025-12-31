// components/ui/Spinner.tsx
import React from "react";

type SpinnerProps = {
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
  inline?: boolean;
  className?: string;
};

const SIZE_MAP: Record<NonNullable<SpinnerProps["size"]>, string> = {
  xs: "h-3 w-3 border-2",
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-6 w-6 border-[3px]",
};

export default function Spinner({
  label,
  size = "sm",
  inline = true,
  className = "",
}: SpinnerProps) {
  return (
    <span className={[inline ? "inline-flex" : "flex", "items-center gap-2", className].join(" ")}>
      <span
        aria-hidden="true"
        className={[
          "animate-spin rounded-full border-muted-foreground border-t-foreground",
          SIZE_MAP[size],
        ].join(" ")}
      />
      {label ? <span className="text-xs font-semibold text-foreground">{label}</span> : null}

      {/* A11y */}
      <span className="sr-only">{label || "Loading"}</span>
    </span>
  );
}
