"use client";

import { useEffect, useMemo, useState } from "react";
import { persistFile, metaToObjectUrl, getBlob, delBlob, type StoredFileMeta } from "@/lib/idFiles";

const VEHICLE_IMG_KEY = "pegadaian.dashboard.vehicleImages.v1";
export async function clearVehicleUploadCache() {
  // hapus meta list dari sessionStorage
  let metas: StoredFileMeta[] = [];
  try {
    const raw = sessionStorage.getItem(VEHICLE_IMG_KEY);
    metas = raw ? (JSON.parse(raw) as StoredFileMeta[]) : [];
    sessionStorage.removeItem(VEHICLE_IMG_KEY);
  } catch {}

  // hapus blob dari IndexedDB
  await Promise.all(metas.map((m) => delBlob(m.id)));
}

function loadMetas(): StoredFileMeta[] {
  try {
    const raw = sessionStorage.getItem(VEHICLE_IMG_KEY);
    return raw ? (JSON.parse(raw) as StoredFileMeta[]) : [];
  } catch {
    return [];
  }
}

function saveMetas(metas: StoredFileMeta[]) {
  try {
    sessionStorage.setItem(VEHICLE_IMG_KEY, JSON.stringify(metas));
  } catch {}
}



type Props = {
  onUpload: (files: File[]) => void | Promise<void>;
  disabled?: boolean;
  maxFiles?: number;          // default 5
  minFiles?: number;          // default 1
  maxSizeMB?: number;         // default 10 (per file)
};

type PreviewItem = {
  id: string;     // INI = id IndexedDB (bukan random lagi)
  name: string;
  size: number;
  url: string;
  file?: File;    // optional (habis refresh akan undefined)
  type?: string;
  lastModified?: number;
};

const ALLOWED_MIMES = new Set(["image/jpeg", "image/png"]);
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png"]);

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

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
  maxSizeMB = 5,
}: Props) {


  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const canAnalyze = previews.length >= minFiles && !disabled;

  const totalSize = useMemo(() => previews.reduce((sum, p) => sum + p.size, 0), [previews]);
useEffect(() => {
  let cancelled = false;

  (async () => {
    const metas = loadMetas();
    if (!metas.length) return;

    const urls = await Promise.all(metas.map(metaToObjectUrl));
    if (cancelled) return;

    const hydrated: PreviewItem[] = metas
      .map((m, i) => ({
        id: m.id,
        name: m.name,
        size: m.size,
        url: urls[i] || "",
        type: m.type,
        lastModified: m.lastModified,
      }))
      .filter((x) => !!x.url);

    setPreviews(hydrated);
  })();

  return () => {
    cancelled = true;
    setPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return prev;
    });
  };
}, []);

function revokeAll(prev: PreviewItem[]) {
    prev.forEach((p) => URL.revokeObjectURL(p.url));
}

function validate(files: File[]) {
  const maxBytes = maxSizeMB * 1024 * 1024;

  const imageCandidates = files.filter((f) => {
    const ext = extOf(f.name);
    const mimeOk = ALLOWED_MIMES.has(f.type);
    const extOk = ALLOWED_EXT.has(ext);
    return mimeOk || extOk;
  });

  if (imageCandidates.length === 0) {
    return { ok: false as const, error: "Format tidak didukung. Gunakan JPG/JPEG atau PNG (WEBP/HEIC tidak didukung)." };
  }

  const rejected = files.filter((f) => !imageCandidates.includes(f));
  if (rejected.length > 0) {
    return { ok: false as const, error: `File "${rejected[0].name}" ditolak. Gunakan hanya JPG/JPEG atau PNG.` };
  }

  const tooBig = imageCandidates.find((f) => f.size > maxBytes);
  if (tooBig) {
    return {
      ok: false as const,
      error: `Ukuran file terlalu besar: ${tooBig.name} (${formatBytes(tooBig.size)}). Max ${maxSizeMB}MB per foto.`,
    };
  }

  return { ok: true as const, files: imageCandidates };
}



async function addFiles(files: File[]) {
  if (disabled) return;
  setErrorMsg(null);

  const result = validate(files);
  if (!result.ok) {
    setErrorMsg(result.error);
    return;
  }

  const existingMetas = loadMetas();
  const roomLeft = Math.max(0, maxFiles - existingMetas.length);
  const batch = result.files.slice(0, roomLeft);

  if (batch.length === 0) {
    setErrorMsg(`Maksimal ${maxFiles} foto.`);
    return;
  }

  const newMetas: StoredFileMeta[] = [];
  for (const f of batch) {
    newMetas.push(await persistFile(f)); // <-- ini yg bikin tahan refresh
  }

  const combinedMetas = [...existingMetas, ...newMetas].slice(0, maxFiles);
  saveMetas(combinedMetas);

  const newUrls = await Promise.all(newMetas.map(metaToObjectUrl));
  const newPreviews: PreviewItem[] = newMetas
    .map((m, i) => ({
      id: m.id,
      name: m.name,
      size: m.size,
      url: newUrls[i] || "",
      type: m.type,
      lastModified: m.lastModified,
      file: batch[i], // optional buat analyze cepat sebelum refresh
    }))
    .filter((x) => !!x.url);

  setPreviews((prev) => {
    const merged = [...prev, ...newPreviews].slice(0, maxFiles);

    // revoke url yang kepotong (defensif)
    const keep = new Set(merged.map((x) => x.id));
    prev.forEach((x) => {
      if (!keep.has(x.id)) URL.revokeObjectURL(x.url);
    });

    return merged;
  });
}




async function analyzeNow() {
  if (!canAnalyze) {
    setErrorMsg(`Minimal ${minFiles} foto.`);
    return;
  }
  setErrorMsg(null);

  const files: File[] = [];

  for (const p of previews) {
    if (p.file) {
      files.push(p.file);
      continue;
    }

    const blob = await getBlob(p.id);
    if (!blob) continue;

    files.push(
      new File([blob], p.name || "vehicle.jpg", {
        type: p.type || blob.type || "image/jpeg",
        lastModified: p.lastModified || Date.now(),
      })
    );
  }

  if (files.length < minFiles) {
    setErrorMsg("File cache tidak ditemukan. Silakan upload ulang fotonya.");
    return;
  }

  await onUpload(files);
}


  function clear() {
    setPreviews((prev) => {
      revokeAll(prev);
      return [];
    });
    setErrorMsg(null);
  }

  

  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted p-4">
      {/* Drop zone */}
      <div
        className={[
          "rounded-2xl border border-border bg-card p-5 transition",
          dragOver ? "border-primary/50 bg-primary/10" : "border-dashed",
          disabled ? "opacity-60" : "hover:bg-accent",
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
          addFiles(dropped);
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <label
            htmlFor="vehicle-upload-input"
            className={`flex-1 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-muted">
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
                <p className="text-sm font-extrabold text-primary">
                  <span
                    className="
                      relative inline-block cursor-pointer
                      transition-all duration-200
                      hover:translate-x-0.5
                      after:absolute after:left-0 after:-bottom-0.5
                      after:h-0.5 after:w-0 after:bg-current
                      after:transition-all after:duration-200
                      hover:after:w-full
                    "
                  >
                    Upload / Ambil Foto Motor
                  </span>
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Drag & drop atau klik • {minFiles}-{maxFiles} foto • max {maxSizeMB}MB/foto
                </p>
              </div>
            </div>
          </label>
          <button
            type="button"
            onClick={analyzeNow}
            disabled={!canAnalyze}
            className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            Analisa
          </button>


          <div className="flex items-center gap-2">
            {previews.length > 0 ? (
              <button
                type="button"
                onClick={clear}
                disabled={disabled}
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-accent disabled:opacity-50"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <input
          id="vehicle-upload-input"
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"

          multiple
          // capture="environment"
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            const list = e.currentTarget.files ? Array.from(e.currentTarget.files) : [];
            e.currentTarget.value = "";
            addFiles(list);
          }}
        />

        {/* Status line */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-xs text-foreground">
          <span className="font-semibold">
            {previews.length === 0 ? "Belum ada foto dipilih." : `${previews.length} foto dipilih.`}
          </span>
          <span className="text-muted-foreground">Total: {formatBytes(totalSize)}</span>
        </div>

        {/* Error */}
        {errorMsg ? (
          <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {errorMsg}
          </div>
        ) : null}

        {/* Thumbnails */}
        {previews.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {previews.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.name} className="h-20 w-full object-cover" />
                <div className="p-2">
                  <p className="truncate text-[11px] font-bold text-foreground" title={p.name}>
                    {p.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{formatBytes(p.size)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
