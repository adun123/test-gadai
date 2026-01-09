"use client";

import type { ExtractedDocument } from "./DocumentCard";

type Props = {
  doc: ExtractedDocument;
  editMode: boolean;
  onToggleEdit: () => void;
  onChange: (patch: Partial<ExtractedDocument>) => void;
  onReupload?: () => void; // 
};


function statusDotClass(status: ExtractedDocument["creditStatus"]) {
  if (status === "Lancar") return "bg-green-500";
  if (status === "Perhatian") return "bg-yellow-500";
  if (status === "Tidak Lancar") return "bg-red-500";
  return "bg-gray-400";
}

export default function ExtractedSummary({ doc, editMode, onToggleEdit, onChange, onReupload }: Props) {
 const nameRaw = (doc.fullName ?? "").trim();
  const nameUnknown =
    !nameRaw ||
    /^unknown$/i.test(nameRaw) ||
    /^tidak diketahui$/i.test(nameRaw) ||
    nameRaw === "—";

  const creditUnknown =
    doc.documentType === "SLIK OJK" &&
    (doc.creditStatus === "Unknown" || !doc.creditStatus);

  const unreadable = nameUnknown || creditUnknown;

  const unreadableReasons: string[] = [];
  if (nameUnknown) unreadableReasons.push("Nama debitur tidak terbaca.");
  if (creditUnknown) unreadableReasons.push("Status kredit terdeteksi 'Unknown'.");

  
 
  return (
    <div className="space-y-3">
      {unreadable ? (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-extrabold text-amber-900">
          Dokumen Tidak terbaca
        </p>
        <p className="mt-1 text-xs text-amber-800">
          {unreadableReasons.join(" ")} Kemungkinan dokumen blur/terpotong. Silakan unggah ulang
          atau koreksi manual.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onReupload}
            className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-extrabold text-amber-900 hover:bg-amber-100"
          >
            Upload Ulang Dokumen
          </button>

          <button
            type="button"
            onClick={onToggleEdit}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground hover:opacity-90"
          >
            {editMode ? "Selesai " : "Perbaiki Manual"}
          </button>
        </div>
      </div>
    ) : null}

      {/* header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold tracking-wider text-gray-500">EXTRACTED DATA</p>

        <button
          type="button"
          onClick={onToggleEdit}
          className="text-xs font-bold text-blue-600 hover:underline"
        >
          {editMode ? "Selesai" : "Edit"}
        </button>
      </div>

      {/* Nama Debitur */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-800">Nama Debitur</label>
        <input
          value={doc.fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
          disabled={!editMode}
          className="w-full rounded-2xl border px-4 py-3 text-base font-semibold text-gray-900 shadow-sm
                     placeholder:text-gray-400 disabled:bg-gray-50"
          placeholder="—"
        />
      </div>

      {/* Jenis Dokumen */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-800">Jenis Dokumen</label>
        <div className="relative">
          <select
            value={doc.documentType}
            onChange={(e) => onChange({ documentType: e.target.value as ExtractedDocument["documentType"] })}
            disabled={!editMode}
            className="w-full appearance-none rounded-2xl border bg-white px-4 py-3 text-base font-semibold text-gray-900 shadow-sm
                       disabled:bg-gray-50"
          >
            <option value="SLIK OJK">SLIK OJK</option>
            <option value="Slip Gaji">Slip Gaji</option>
            <option value="Lainnya">Lainnya</option>
          </select>

          {/* chevron */}
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </div>
      </div>
      {/* Gaji Debitur — hanya Slip Gaji */}
      {doc.documentType === "Slip Gaji" && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-800">
            Gaji Bersih (Take Home Pay)
          </label>

          <input
            value={
              typeof doc.netIncome === "number"
                ? doc.netIncome.toLocaleString("id-ID")
                : ""
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, "");
              onChange({ netIncome: raw ? Number(raw) : undefined });
            }}
            disabled={!editMode}
            className="w-full rounded-2xl border px-4 py-3 text-base font-semibold text-gray-900 shadow-sm
                      disabled:bg-gray-50"
            placeholder="Contoh: 9.000.000"
            inputMode="numeric"
          />

          <p className="pt-1 text-xs text-gray-500">
            Diambil dari slip gaji (AI) dan dapat dikoreksi manual.
          </p>
        </div>
      )}


     {/* Status Kredit — hanya untuk SLIK OJK */}
      {doc.documentType === "SLIK OJK" && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-800">Status Kredit</label>

          <div className="relative">
            <span
              className={`absolute left-5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${statusDotClass(
                doc.creditStatus
              )}`}
            />

            <select
              value={doc.creditStatus}
              onChange={(e) => {
                const nextType = e.target.value as ExtractedDocument["documentType"];
                onChange({
                  documentType: nextType,
                  ...(nextType !== "SLIK OJK" ? { creditStatus: "Unknown" } : {}),
                });
              }}

              disabled={!editMode}
              className="w-full appearance-none rounded-2xl border bg-white py-3 pl-12 pr-12 text-base font-semibold text-gray-900 shadow-sm
                        disabled:bg-gray-50"
            >
              <option value="Lancar">Lancar (KOL 1)</option>
              <option value="Perhatian">Perhatian (KOL 2)</option>
              <option value="Tidak Lancar">Tidak Lancar (KOL 3+)</option>
              <option value="Unknown">Unknown</option>
            </select>

            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </div>

          <p className="pt-1 text-xs text-gray-500">
            {editMode ? "Mode edit aktif — gunakan untuk koreksi manual hasil PoC." : "Klik Edit untuk koreksi manual."}
          </p>
        </div>
      )}

    </div>
  );
}
