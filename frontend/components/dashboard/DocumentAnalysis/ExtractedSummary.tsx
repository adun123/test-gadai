"use client";

import type { ExtractedDocument } from "./DocumentCard";

type Props = {
  doc: ExtractedDocument;
  editMode: boolean;
  onToggleEdit: () => void;
  onChange: (patch: Partial<ExtractedDocument>) => void;
};

function statusDotClass(status: ExtractedDocument["creditStatus"]) {
  if (status === "Lancar") return "bg-green-500";
  if (status === "Perhatian") return "bg-yellow-500";
  if (status === "Tidak Lancar") return "bg-red-500";
  return "bg-gray-400";
}

export default function ExtractedSummary({ doc, editMode, onToggleEdit, onChange }: Props) {
  return (
    <div className="space-y-3">
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


      {/* Status Kredit */}
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
            onChange={(e) => onChange({ creditStatus: e.target.value as ExtractedDocument["creditStatus"] })}
            disabled={!editMode}
            className="w-full appearance-none rounded-2xl border bg-white py-3 pl-12 pr-12 text-base font-semibold text-gray-900 shadow-sm
                       disabled:bg-gray-50"
          >
            <option value="Lancar">Lancar (KOL 1)</option>
            <option value="Perhatian">Perhatian (KOL 2)</option>
            <option value="Tidak Lancar">Tidak Lancar (KOL 3+)</option>
            <option value="Unknown">Unknown</option>
          </select>

          {/* chevron */}
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </div>

        {/* kecilin text helper biar clean */}
        <p className="pt-1 text-xs text-gray-500">
          {editMode ? "Mode edit aktif — gunakan untuk koreksi manual hasil PoC." : "Klik Edit untuk koreksi manual."}
        </p>
      </div>
    </div>
  );
}
