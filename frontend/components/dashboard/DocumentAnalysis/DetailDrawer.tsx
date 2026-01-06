"use client";

import type { ExtractedDocument } from "./DocumentCard";

type Props = {
  open: boolean;
  onClose: () => void;
  doc: ExtractedDocument | null;
};

export default function DetailDrawer({ open, onClose, doc }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
        aria-label="Close"
      />

      {/* panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b p-5">
          <div>
            <h3 className="text-base font-extrabold">Detail Dokumen</h3>
            <p className="mt-1 text-sm text-gray-600">Informasi lengkap hasil ekstraksi (PoC).</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Tutup
          </button>
        </div>

        <div className="p-5">
          {!doc ? (
            <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
              Belum ada hasil. Upload dokumen dulu.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border bg-white p-4">
                <p className="text-xs font-semibold text-gray-500">Nama</p>
                <p className="mt-1 text-sm font-bold text-gray-900">{doc.fullName}</p>

                <p className="mt-3 text-xs font-semibold text-gray-500">Jenis Dokumen</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{doc.documentType}</p>
              
                 {doc.documentType === "Slip Gaji" && (
                    <>
                      <p className="mt-3 text-xs font-semibold text-gray-500">Rentang Penghasilan</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {doc.incomeRange ?? "-"}
                      </p>
                    </>
                  )}

                
                  {doc.documentType === "SLIK OJK" && (
                  <>
                    <p className="mt-3 text-xs font-semibold text-gray-500">Status Kredit</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {doc.creditStatus || "-"}
                    </p>
                  </>
                )}
                   
                <p className="mt-3 text-xs font-semibold text-gray-500">Confidence (mock)</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {typeof doc.rawConfidence === "number" ? `${Math.round(doc.rawConfidence * 100)}%` : "-"}
                </p>

              </div>

             

              {doc.notes ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                  {doc.notes}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
