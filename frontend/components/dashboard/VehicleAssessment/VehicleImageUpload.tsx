"use client";

import { useMemo, useState } from "react";

type Props = {
  onUpload: (files: File[]) => void | Promise<void>;
  disabled?: boolean;
  maxFiles?: number;          // default 5
  minFiles?: number;          // default 1
  maxSizeMB?: number;         // default 10 (per file)
};

type PreviewItem = {
  id: string;
  name: string;
  size: number;
  url: string;
  file: File;
};

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function VehicleImageUpload({
  onUpload,
  disabled,
  maxFiles = 5,
  minFiles = 1,
  maxSizeMB = 10,
}: Props) {
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const totalSize = useMemo(() => previews.reduce((sum, p) => sum + p.size, 0), [previews]);

  function revokeAll(prev: PreviewItem[]) {
    prev.forEach((p) => URL.revokeObjectURL(p.url));
  }

  function validateAndBuild(files: File[]) {
    const maxBytes = maxSizeMB * 1024 * 1024;

    const imagesOnly = files.filter((f) => f.type.startsWith("image/"));
    if (imagesOnly.length === 0) {
      return { ok: false as const, error: "File harus gambar (JPG/PNG/WebP/HEIC tergantung device)." };
    }

    const limited = imagesOnly.slice(0, maxFiles);

    const tooBig = limited.find((f) => f.size > maxBytes);
    if (tooBig) {
      return {
        ok: false as const,
        error: `Ukuran file terlalu besar: ${tooBig.name} (${formatBytes(tooBig.size)}). Max ${maxSizeMB}MB per foto.`,
      };
    }

    if (limited.length < minFiles) {
      return { ok: false as const, error: `Minimal ${minFiles} foto.` };
    }

    const next: PreviewItem[] = limited.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f),
      file: f,
    }));

    return { ok: true as const, items: next };
  }

  async function commitFiles(files: File[]) {
    if (disabled) return;

    setErrorMsg(null);

    const result = validateAndBuild(files);
    if (!result.ok) {
      setErrorMsg(result.error);
      return;
    }

    // replace previews
    setPreviews((prev) => {
      revokeAll(prev);
      return result.items;
    });

    // send to parent
    await onUpload(result.items.map((x) => x.file));
  }

  function clear() {
    setPreviews((prev) => {
      revokeAll(prev);
      return [];
    });
    setErrorMsg(null);
  }

  return (
    <div className="rounded-2xl border border-dashed bg-gray-50 p-4">
      {/* Drop zone */}
      <div
        className={[
          "rounded-2xl border bg-white p-5 transition",
          dragOver ? "border-blue-300 bg-blue-50/30" : "border-dashed",
          disabled ? "opacity-60" : "hover:bg-gray-50",
        ].join(" ")}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          if (disabled) return;
          const dropped = Array.from(e.dataTransfer.files || []);
          commitFiles(dropped);
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <label
            htmlFor="vehicle-upload-input"
            className={`flex-1 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-100">
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

              <div className="min-w-0">
                <p className="text-sm font-extrabold text-blue-600">
                  Upload / Ambil Foto Motor
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Drag & drop atau klik • {minFiles}-{maxFiles} foto • max {maxSizeMB}MB/foto
                </p>
              </div>
            </div>
          </label>

          <div className="flex items-center gap-2">
            {previews.length > 0 ? (
              <button
                type="button"
                onClick={clear}
                disabled={disabled}
                className="rounded-xl border bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <input
          id="vehicle-upload-input"
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            const list = e.currentTarget.files ? Array.from(e.currentTarget.files) : [];
            e.currentTarget.value = "";
            commitFiles(list);
          }}
        />

        {/* Status line */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-gray-50 px-4 py-3 text-xs text-gray-700">
          <span className="font-semibold">
            {previews.length === 0 ? "Belum ada foto dipilih." : `${previews.length} foto dipilih.`}
          </span>
          <span className="text-gray-500">Total: {formatBytes(totalSize)}</span>
        </div>

        {/* Error */}
        {errorMsg ? (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMsg}
          </div>
        ) : null}

        {/* Thumbnails */}
        {previews.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {previews.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.name} className="h-20 w-full object-cover" />
                <div className="p-2">
                  <p className="truncate text-[11px] font-bold text-gray-800" title={p.name}>
                    {p.name}
                  </p>
                  <p className="text-[10px] text-gray-500">{formatBytes(p.size)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
