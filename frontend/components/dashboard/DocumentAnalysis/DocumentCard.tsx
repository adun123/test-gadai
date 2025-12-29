"use client";

import { useMemo, useState } from "react";
import DocumentUpload from "./DocumentUpload";
import ExtractedSummary from "./ExtractedSummary";
import DetailDrawer from "./DetailDrawer";




export type CreditStatus = "Lancar" | "Tidak Lancar" | "Perhatian" | "Unknown";

export type DocumentType = "SLIK OJK" | "Slip Gaji" | "Lainnya";

export type ExtractedDocument = {
  id: string;
  fileName: string;
  extractedAt: string; // ISO string
  fullName: string;
  documentType: DocumentType;
  creditStatus: CreditStatus;

  // detail fields (disimpan tapi tidak ditampilkan di ringkas)
  employmentStatus?: string; // contoh: "Karyawan Tetap"
  incomeRange?: string; // contoh: "Rp 5–10 jt"
  notes?: string;
  rawConfidence?: number; // 0..1
};

type ProcessState = "idle" | "uploading" | "processing" | "done" | "error";

type ScanApiResponse = {
  success: boolean;
  document_type: "SLIK" | "SALARY_SLIP" | string;
  scanned_data: any;
  scanned_at: string;
  is_editable: boolean;
  error?: string;
};

function mapScanToExtracted(api: ScanApiResponse, fileName: string): ExtractedDocument {
  const d = api?.scanned_data ?? {};

  const fullName = d.full_name || d.fullName || d.name || "Unknown";

  const docType: DocumentType =
    api.document_type === "SLIK"
      ? "SLIK OJK"
      : api.document_type === "SALARY_SLIP"
        ? "Slip Gaji"
        : "Lainnya";

  const creditStatusRaw = d.credit_status;
  const creditStatus: CreditStatus =
    creditStatusRaw === "Lancar" || creditStatusRaw === "Tidak Lancar" || creditStatusRaw === "Perhatian"
      ? creditStatusRaw
      : "Unknown";

  const netIncome = typeof d.net_income === "number" ? d.net_income : undefined;
  const incomeRange =
    typeof netIncome === "number"
      ? netIncome >= 10_000_000
        ? "≥ Rp 10 jt"
        : netIncome >= 5_000_000
          ? "Rp 5–10 jt"
          : "< Rp 5 jt"
      : undefined;

  const employmentStatus = d.employment_status || d.employmentStatus;

  return {
    id: crypto.randomUUID(),
    fileName,
    extractedAt: api?.scanned_at || new Date().toISOString(),
    fullName,
    documentType: docType,
    creditStatus: docType === "SLIK OJK" ? creditStatus : "Unknown",
    employmentStatus,
    incomeRange,
    notes: api?.success
      ? "Hasil PoC. Tetap perlu verifikasi human sebelum dipakai untuk keputusan final."
      : api?.error || "Gagal memproses dokumen.",
    rawConfidence:
      typeof d.confidence === "number"
        ? d.confidence
        : typeof (api as any).confidence === "number"
          ? (api as any).confidence
          : undefined,
  };
}


type VehicleScanWrapped = {
  success: boolean;
  document_type: "VEHICLE" | string;
  scanned_data: any;
  scanned_at?: string;
  is_editable?: boolean;
  error?: string;
};

type VehicleScanRaw = {
  vehicle_identification: any;
  physical_condition: any;
  confidence?: number;
  images_processed?: number;
  scanned_at?: string;
  error?: string;
};

type VehicleScanApiResponse = VehicleScanWrapped | VehicleScanRaw;

type DocumentCardProps = {
  onAnalyzed?: (doc: ExtractedDocument | null) => void;
};

export default function DocumentCard({ onAnalyzed }: DocumentCardProps) {
  const [state, setState] = useState<ProcessState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [doc, setDoc] = useState<ExtractedDocument | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>("SLIK OJK");
  const [useMock, setUseMock] = useState(true);


  const statusLabel = useMemo(() => {
    switch (state) {
      case "idle":
        return "Upload Dokumen untuk mulai analisis.";
      case "uploading":
        return "Uploading…";
      case "processing":
        return "Processing OCR & extraction…";
      case "done":
        return "Selesai.";
      case "error":
        return "Gagal memproses dokumen.";
      default:
        return "";
    }
  }, [state]);

async function handleUpload(file: File) {
  setErrorMsg(null);
  setState("uploading");

  try {
    const form = new FormData();
    form.append("document", file);

    const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";

    // hint buat mock mode (tanpa dropdown)
    const lower = file.name.toLowerCase();
    const typeHint =
      lower.includes("gaji") || lower.includes("salary") || lower.includes("payslip") || lower.includes("slip")
        ? "salary-slip"
        : "slik";

    const url = `${base}/api/scan/document${
      useMock ? `?mock=true&type=${typeHint}` : ""
    }`;

    setState("processing");

    const res = await fetch(url, { method: "POST", body: form });
    const data = (await res.json()) as ScanApiResponse;

    if (!res.ok || !data.success) {
      throw new Error(data?.error || `Request failed (HTTP ${res.status})`);
    }

    const extracted = mapScanToExtracted(data, file.name);
    setDoc(extracted);
    onAnalyzed?.(extracted);
    setState("done");
  } catch (e) {
    setState("error");
    setErrorMsg(e instanceof Error ? e.message : "Unknown error");
  }
}


function mapBackendToDoc(api: any, fileName: string): ExtractedDocument {
  // karena aku belum lihat bentuk JSON result backend (mocknya gimana),
  // aku buat fallback aman: taruh raw di notes
  return {
    id: api?.id || api?.scan_id || crypto.randomUUID(),
    fileName,
    extractedAt: new Date().toISOString(),
    fullName: api?.fullName || api?.data?.fullName || "Unknown",
    documentType: "SLIK OJK",
    creditStatus: api?.creditStatus || "Unknown",
    employmentStatus: api?.employmentStatus,
    incomeRange: api?.incomeRange,
    notes: api?.notes || `Raw result: ${JSON.stringify(api).slice(0, 500)}...`,
    rawConfidence: api?.confidence ?? api?.rawConfidence ?? undefined,
  };
}


  function reset() {
    setDoc(null);
    onAnalyzed?.(null);
    setErrorMsg(null);
    setState("idle");
  }

async function reprocess() {
  if (!doc) return;

  setErrorMsg(null);

  if (!useMock) {
    setState("error");
    setErrorMsg("Untuk reprocess non-mock, silakan upload ulang file (PoC belum menyimpan file).");
    return;
  }

  // mock mode: cukup refresh timestamp (simulasi rerun)
  setState("processing");
  setTimeout(() => {
    const updated = doc ? { ...doc, extractedAt: new Date().toISOString(), notes: "Re-process (mock) dijalankan ulang." } : null;
    setDoc(updated);
    onAnalyzed?.(updated);
    setState("done");
  }, 500);
}

function normalizeVehicleScan(data: VehicleScanApiResponse): { ok: boolean; payload: any; error?: string } {
  // Case A: wrapper
  if ("success" in data) {
    return {
      ok: !!data.success,
      payload: data.scanned_data,
      error: data.error,
    };
  }

  // Case B: raw (README style)
  if ((data as any)?.vehicle_identification || (data as any)?.physical_condition) {
    return { ok: true, payload: data };
  }

  return { ok: false, payload: null, error: (data as any)?.error || "Invalid vehicle scan response" };
}

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold">Document Analysis</h2>
          <p className="mt-1 text-sm text-gray-600">
            Upload dokumen → sistem ekstrak data → tampil ringkas + detail.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
              className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-700"
              disabled={state === "uploading" || state === "processing"}
            >
              <option value="SLIK OJK">SLIK OJK</option>
              <option value="Slip Gaji">Slip Gaji</option>
            </select> */}

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={useMock}
                onChange={(e) => setUseMock(e.target.checked)}
                disabled={state === "uploading" || state === "processing"}
              />
              Use mock
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          disabled={!doc}
          className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Detail
        </button>
      </div>


      <div className="mt-4 space-y-4">
        <div className="rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{statusLabel}</span>
            <span className="text-xs text-gray-500">
              Mode: PoC (mock extraction)
            </span>
          </div>
          {errorMsg ? <p className="mt-2 text-sm text-red-600">{errorMsg}</p> : null}
        </div>

        {!doc ? (
          <DocumentUpload onUpload={handleUpload} disabled={state === "uploading" || state === "processing"} />
        ) : (
          <>
            <ExtractedSummary
              doc={doc}
              editMode={editMode}
              onToggleEdit={() => setEditMode((v) => !v)}
              onChange={(patch) => setDoc((prev) => (prev ? { ...prev, ...patch } : prev))}
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Ganti Dokumen
              </button>
              <button
                type="button"
                onClick={reprocess}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                Re-process
              </button>
            </div>
          </>
        )}
      </div>

      <DetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} doc={doc} />
    </section>
  );
}
