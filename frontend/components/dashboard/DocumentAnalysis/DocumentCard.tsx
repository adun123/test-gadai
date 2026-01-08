"use client";

import { FileText } from "lucide-react";
import { useMemo, useState } from "react";
import DocumentUpload from "./DocumentUpload";
import ExtractedSummary from "./ExtractedSummary";
import DetailDrawer from "./DetailDrawer";

export type CreditStatus = "Lancar" | "Tidak Lancar" | "Perhatian" | "Unknown";
export type DocumentType = "SLIK OJK" | "Slip Gaji" | "Lainnya";

export type ExtractedDocument = {
  id: string;
  fileName: string;
  extractedAt: string;
  fullName: string;
  documentType: DocumentType;
  creditStatus: CreditStatus;

  // 🔥 TAMBAHAN
  netIncome?: number;

  employmentStatus?: string;
  incomeRange?: string;
  notes?: string;
  rawConfidence?: number;
};


type ProcessState = "idle" | "uploading" | "processing" | "done" | "error";

type ScanApiResponse = {
  success: boolean;
  document_type: "SLIK" | "SALARY_SLIP" | string;
  scanned_data: {
    full_name?: string;
    fullName?: string;
    name?: string;
    credit_status?: CreditStatus;
    net_income?: number;
    employment_status?: string;
    employmentStatus?: string;
    confidence?: number;
  };
  confidence?: number;
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
    // SIMPAN ANGKA GAJI
  netIncome,
    employmentStatus,
    incomeRange,
    notes: api?.success
      ? "Hasil PoC. Tetap perlu verifikasi human sebelum dipakai untuk keputusan final."
      : api?.error || "Gagal memproses dokumen.",
    rawConfidence:
      typeof d.confidence === "number"
        ? d.confidence
        : typeof api.confidence === "number"
          ? api.confidence
          : undefined,
  };
}

type DocSlot = {
  slotId: string;
  state: ProcessState;
  errorMsg: string | null;
  editMode: boolean;
  doc: ExtractedDocument | null;
};

const makeSlot = (): DocSlot => ({
  slotId: crypto.randomUUID(),
  state: "idle",
  errorMsg: null,
  editMode: false,
  doc: null,
});

export default function DocumentCard() {
  const [useMock, setUseMock] = useState(true);

  const [slots, setSlots] = useState<DocSlot[]>([makeSlot()]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailDoc, setDetailDoc] = useState<ExtractedDocument | null>(null);

  const anyBusy = slots.some((s) => s.state === "uploading" || s.state === "processing");

  const statusLabel = useMemo(() => {
    if (anyBusy) return "Sedang memproses…";
    return "Upload Dokumen untuk mulai analisis.";
  }, [anyBusy]);

  function addSlot() {
    setSlots((prev) => [...prev, makeSlot()]);
  }

  function removeSlot(slotId: string) {
    setSlots((prev) => {
      const next = prev.filter((s) => s.slotId !== slotId);
      return next.length ? next : [makeSlot()];
    });
  }

  function resetSlot(slotId: string) {
    setSlots((prev) =>
      prev.map((s) => (s.slotId === slotId ? { ...s, doc: null, errorMsg: null, editMode: false, state: "idle" } : s))
    );
  }

  function openDetail(doc: ExtractedDocument) {
    setDetailDoc(doc);
    setDetailOpen(true);
  }

  async function handleUpload(slotId: string, file: File) {
    setSlots((prev) =>
      prev.map((s) => (s.slotId === slotId ? { ...s, state: "uploading", errorMsg: null } : s))
    );

    try {
      const form = new FormData();
      form.append("document", file);

      const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";

      const lower = file.name.toLowerCase();
      const typeHint =
        lower.includes("gaji") || lower.includes("salary") || lower.includes("payslip") || lower.includes("slip")
          ? "salary-slip"
          : "slik";

      const url = `${base}/api/scan/document${useMock ? `?mock=true&type=${typeHint}` : ""}`;

      setSlots((prev) => prev.map((s) => (s.slotId === slotId ? { ...s, state: "processing" } : s)));

      const res = await fetch(url, { method: "POST", body: form });
      const data = (await res.json()) as ScanApiResponse;

      if (!res.ok || !data.success) {
        throw new Error(data?.error || `Request failed (HTTP ${res.status})`);
      }

      const extracted = mapScanToExtracted(data, file.name);

      setSlots((prev) =>
        prev.map((s) =>
          s.slotId === slotId ? { ...s, doc: extracted, editMode: false, state: "done" } : s
        )
      );
    } catch (e) {
      setSlots((prev) =>
        prev.map((s) =>
          s.slotId === slotId
            ? { ...s, state: "error", errorMsg: e instanceof Error ? e.message : "Unknown error" }
            : s
        )
      );
    }
  }

  async function reprocess(slotId: string) {
    const slot = slots.find((s) => s.slotId === slotId);
    if (!slot?.doc) return;

    if (!useMock) {
      setSlots((prev) =>
        prev.map((s) =>
          s.slotId === slotId
            ? { ...s, state: "error", errorMsg: "Untuk reprocess non-mock, silakan upload ulang file (PoC belum menyimpan file)." }
            : s
        )
      );
      return;
    }

    setSlots((prev) => prev.map((s) => (s.slotId === slotId ? { ...s, state: "processing", errorMsg: null } : s)));

    setTimeout(() => {
      setSlots((prev) =>
        prev.map((s) =>
          s.slotId === slotId && s.doc
            ? {
              ...s,
              doc: { ...s.doc, extractedAt: new Date().toISOString(), notes: "Re-process (mock) dijalankan ulang." },
              state: "done",
            }
            : s
        )
      );
    }, 500);
  }

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Document Analysis</h2>
              <p className="text-sm text-muted-foreground">Income & credit verification</p>
            </div>
          </div>

        </div>
      </div>


      <div className="p-5 space-y-4">
        <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{statusLabel}</span>
            <span className="text-xs text-muted-foreground">Mode: PoC (mock extraction)</span>
          </div>
        </div>

        {/* SLOT LIST */}
        {slots.map((slot, idx) => {
          const busy = slot.state === "uploading" || slot.state === "processing";

          return (
            <div key={slot.slotId} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-card-foreground">Dokumen {idx + 1}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Status: <span className="font-semibold">{slot.state}</span>
                  </div>
                  {slot.errorMsg ? <p className="mt-2 text-sm text-destructive">{slot.errorMsg}</p> : null}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => (slot.doc ? openDetail(slot.doc) : null)}
                    disabled={!slot.doc}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
                  >
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSlot(slot.slotId)}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {!slot.doc ? (
                  <DocumentUpload onUpload={(file) => handleUpload(slot.slotId, file)} disabled={busy} />
                ) : (
                  <>
                    <ExtractedSummary
                      doc={slot.doc}
                      editMode={slot.editMode}
                      onToggleEdit={() =>
                        setSlots((prev) =>
                          prev.map((s) => (s.slotId === slot.slotId ? { ...s, editMode: !s.editMode } : s))
                        )
                      }
                      onChange={(patch) =>
                        setSlots((prev) =>
                          prev.map((s) =>
                            s.slotId === slot.slotId && s.doc ? { ...s, doc: { ...s.doc, ...patch } } : s
                          )
                        )
                      }
                      onReupload={() => resetSlot(slot.slotId)}  //  ini kuncinya
                    />


                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => resetSlot(slot.slotId)}
                        className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
                      >
                        Ganti Dokumen
                      </button>
                      <button
                        type="button"
                        onClick={() => reprocess(slot.slotId)}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
                      >
                        Re-process
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/*  ADD BUTTON DI BAWAH LIST */}
        <button
          type="button"
          onClick={addSlot}
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-extrabold text-foreground hover:bg-accent"
        >
          + Tambah Dokumen
        </button>

        <div className="flex justify-end pt-2 border-t border-border/50">
          <label className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={useMock}
              onChange={(e) => setUseMock(e.target.checked)}
              disabled={anyBusy}
              className="h-3 w-3 rounded border-border text-primary focus:ring-primary accent-primary"
            />
            Use Mock Data
          </label>
        </div>
      </div>

      <DetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} doc={detailDoc} />
    </section >
  );
}
