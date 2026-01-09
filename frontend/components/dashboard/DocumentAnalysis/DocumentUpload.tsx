"use client";

import { useMemo, useRef, useState } from "react";

type Props = {
  onUpload: (file: File) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  maxSizeMB?: number; // optional
};

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const ALLOWED_EXT = new Set(["pdf", "jpg", "jpeg", "png"]);

function getExt(name: string) {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

function prettyAllowed() {
  return "PDF, JPG/JPEG, PNG";
}

export default function DocumentUploadCard({
  onUpload,
  disabled,
  label = "Click to Upload",
  helperText = "Upload SLIK OJK atau Payslip",
  maxSizeMB = 5,
}: Props) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const accept = useMemo(() => ".pdf,.jpg,.jpeg,.png", []);

  function validate(file: File) {
    const ext = getExt(file.name);
    const mimeOk = ALLOWED_MIMES.has(file.type);
    const extOk = ALLOWED_EXT.has(ext);

    // beberapa browser kadang kosongin file.type untuk file tertentu
    if (!mimeOk && !extOk) {
      return `Invalid file type. Use ${prettyAllowed()}.`;
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File too large. Max ${maxSizeMB}MB.`;
    }

    return null;
  }

  async function handleFile(file: File) {
    setError(null);

    const msg = validate(file);
    if (msg) {
      setFileName(null);
      setError(msg);
      return;
    }

    setFileName(file.name);
    try {
      await onUpload(file);
    } catch (e: unknown) {
      // kalau parent lempar error, tampilkan dengan sopan
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted p-4">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={disabled}
        className={[
          "w-full rounded-2xl border border-dashed border-border bg-card p-5 text-center transition",
          "hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
          isDragOver ? "ring-2 ring-primary/40" : "",
          error ? "border-red-300" : "",
        ].join(" ")}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setIsDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          if (disabled) return;

          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
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

        <p className="text-sm font-extrabold text-primary">
            <span
              className="
                relative inline-block cursor-pointer
                transition-all duration-200
                hover:translate-x-0.5 hover:text-primary
                after:absolute after:left-0 after:-bottom-0.5
                after:h-0.5 after:w-0 after:bg-current
                after:transition-all after:duration-200
                hover:after:w-full
              "
            >
              {isDragOver ? "Drop file here" : label}
            </span>
          </p>


        <p className="mt-1 text-xs text-muted-foreground">
          {helperText} — <span className="font-medium">{prettyAllowed()}</span> (max {maxSizeMB}MB)
        </p>

        {fileName ? (
          <p className="mt-3 text-xs font-semibold text-foreground">
            Selected: <span className="break-all">{fileName}</span>
          </p>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left">
            <p className="text-xs font-semibold text-red-700">Upload error</p>
            <p className="mt-0.5 text-xs text-red-700">{error}</p>
          </div>
        ) : null}
      </button>

      <input
        ref={ref}
        type="file"
        className="hidden"
        accept={accept}
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
