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

function mockExtract(fileName: string): ExtractedDocument {
  const sampleNames = ["Andi Pratama", "Siti Nur Aulia", "Budi Santoso", "Nadia Putri"];
  const sampleStatus: CreditStatus[] = ["Lancar", "Tidak Lancar", "Perhatian"];
  const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
  const status = sampleStatus[Math.floor(Math.random() * sampleStatus.length)];

  return {
    id: crypto.randomUUID(),
    fileName,
    extractedAt: new Date().toISOString(),
    fullName: name,
    documentType: "SLIK OJK",
    creditStatus: status,
    employmentStatus: "Karyawan",
    incomeRange: "Rp 5–10 jt",
    notes: "Hasil PoC (mock). Dokumen perlu verifikasi human sebelum dipakai keputusan final.",
    rawConfidence: 0.86,
  };
}

export default function DocumentCard({
  onAnalyzed,
}: {
  onAnalyzed?: (doc: ExtractedDocument | null) => void;
}) {
  const [state, setState] = useState<ProcessState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [doc, setDoc] = useState<ExtractedDocument | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

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
      // mock upload delay
      await new Promise((r) => setTimeout(r, 600));
      setState("processing");

      // mock extraction delay
      await new Promise((r) => setTimeout(r, 900));

      const extracted = mockExtract(file.name);
      setDoc(extracted);
      setState("done");
      onAnalyzed?.(extracted);
    } catch (e) {
      setState("error");
      setErrorMsg(e instanceof Error ? e.message : "Unknown error");
    }
  }

  function reset() {
    setDoc(null);
    onAnalyzed?.(null);
    setErrorMsg(null);
    setState("idle");
  }

  function reprocess() {
    if (!doc) return;
    // re-run mock quickly (simulate)
    setState("processing");
    setTimeout(() => {
      const extracted = mockExtract(doc.fileName);
      setDoc(extracted);
      setState("done");
      onAnalyzed?.(extracted);
    }, 700);
  }

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold">Document Analysis</h2>
          <p className="mt-1 text-sm text-gray-600">
            Upload SLIK OJK → sistem ekstrak data → tampil ringkas + detail.
          </p>
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
