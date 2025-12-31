"use client";

import { useRef } from "react";

type Props = {
  onUpload: (file: File) => void | Promise<void>;
  disabled?: boolean;
};

export default function DocumentUploadCard({ onUpload, disabled }: Props) {
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted p-4">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={disabled}
        className="w-full rounded-2xl border border-dashed border-border bg-card p-5 text-center hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-muted">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 16V4m0 0 4 4M12 4 8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p className="text-sm font-extrabold text-primary">Click to Upload</p>
        <p className="mt-1 text-xs text-muted-foreground">SLIK OJK or Payslips (PDF, JPG)</p>
      </button>

      <input
        ref={ref}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
