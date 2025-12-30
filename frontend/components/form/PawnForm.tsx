"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import RegionInput from "./RegionInput";
import CategorySelect, { PawnCategory } from "./CategorySelect";
import FileUpload from "../common/FileUpload";
import DocumentUpload from "./DocumentUpload";
import Spinner from "../common/Spinner";

type FormErrors = {
  region?: string;
  collateralImage?: string;
};

type ScoreResult = {
  score: number; // 0 - 100
  status: "APPROVED" | "REVIEW" | "REJECTED";
  headline: string; // alasan singkat 1 baris
};

type UiState = "idle" | "loading" | "scored";

export default function PawnForm() {
  const [region, setRegion] = useState("jakarta selatan");
  const [category, setCategory] = useState<PawnCategory>("AUTO");
  const [collateralImage, setCollateralImage] = useState<File | null>(null);
  const [salarySlip, setSalarySlip] = useState<File | null>(null);
  const [slikDoc, setSlikDoc] = useState<File | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [uiState, setUiState] = useState<UiState>("idle");
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const router = useRouter();

  const canSubmit = useMemo(() => {
    return region.trim().length >= 2 && !!collateralImage && uiState !== "loading";
  }, [region, collateralImage, uiState]);

  function validate(): boolean {
    const next: FormErrors = {};
    if (region.trim().length < 2) next.region = "Lokasi wajib diisi.";
    if (!collateralImage) next.collateralImage = "Foto barang wajib diunggah.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // Dummy “skor” frontend-only (nanti ganti ke API)
  function mockScore(): ScoreResult {
    const hasDocs = Boolean(salarySlip || slikDoc);

    if (!hasDocs) {
      return {
        score: 62,
        status: "REVIEW",
        headline: "Perlu verifikasi tambahan (dokumen pendukung belum lengkap).",
      };
    }

    return {
      score: 82,
      status: "APPROVED",
      headline: "Layak diproses. Lanjut scan foto barang untuk estimasi final.",
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setUiState("loading");
    setScoreResult(null);

    await new Promise((r) => setTimeout(r, 900));

    const result = mockScore();
    setScoreResult(result);
    setUiState("scored");
  }

  const statusMeta = useMemo(() => {
    const s = scoreResult?.status;
    if (s === "APPROVED")
      return {
        badge: "LAYAK",
        ring: "ring-1 ring-green-200",
        panel: "bg-green-50/70 border-green-200 text-green-800",
        bar: "bg-green-600",
        note: "Skor bagus. Tinggal lanjut foto untuk estimasi final.",
      };
    if (s === "REVIEW")
      return {
        badge: "PERLU REVIEW",
        ring: "ring-1 ring-yellow-200",
        panel: "bg-yellow-50/70 border-yellow-200 text-yellow-800",
        bar: "bg-yellow-600",
        note: "Ada yang perlu dicek. Dokumen pendukung bikin proses lebih cepat.",
      };
    return {
      badge: "TIDAK LAYAK",
      ring: "ring-1 ring-red-200",
      panel: "bg-red-50/70 border-red-200 text-red-800",
      bar: "bg-red-600",
      note: "Pengajuan belum memenuhi syarat minimal.",
    };
  }, [scoreResult?.status]);

  const progress = useMemo(() => {
    // purely UI, tidak memengaruhi logic
    if (!scoreResult) return 0;
    return Math.max(0, Math.min(100, scoreResult.score));
  }, [scoreResult]);

  const hasDocs = Boolean(salarySlip || slikDoc);

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Header Card */}
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-600">Pengajuan Gadai</p>
              <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Isi data, unggah foto, dapatkan skor.
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Skor ini simulasi frontend dulu. Nanti gampang diganti API—tenang, bukan
                sulap kok (walau terlihat seperti itu).
              </p>
            </div>

            {/* Tiny status pill */}
            <div className="shrink-0 rounded-2xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50">
              {uiState === "loading" ? "Memproses" : uiState === "scored" ? "Selesai" : "Siap"}
            </div>
          </div>

          {/* Mini checklist */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-600">Langkah 1</p>
              <p className="mt-1 text-sm font-bold text-gray-900">Lokasi & Kategori</p>
              <p className="mt-1 text-xs text-gray-600">Biar cabang & aturan cocok.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-600">Langkah 2</p>
              <p className="mt-1 text-sm font-bold text-gray-900">Foto Barang</p>
              <p className="mt-1 text-xs text-gray-600">Wajib untuk penilaian awal.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-600">Langkah 3</p>
              <p className="mt-1 text-sm font-bold text-gray-900">Dokumen Opsional</p>
              <p className="mt-1 text-xs text-gray-600">Bantu naikkan keyakinan skor.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-gray-900">Data Pengajuan</h3>
            <div className="text-xs font-semibold text-gray-600">
              Dokumen:{" "}
              <span className={hasDocs ? "text-gray-900" : "text-gray-500"}>
                {hasDocs ? "Terisi" : "Belum"}
              </span>
            </div>
          </div>

          <RegionInput
            value={region}
            onChange={setRegion}
            error={errors.region}
            onUseLastRegion={() => setRegion("jakarta selatan")}
            lastRegionLabel="jakarta selatan"
          />

          <CategorySelect value={category} onChange={setCategory} />

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <FileUpload
              label="Foto Barang Jaminan (Wajib)"
              file={collateralImage}
              onChange={(f) => {
                setCollateralImage(f);
                setErrors((prev) => ({ ...prev, collateralImage: undefined }));
              }}
              accept="image/*"
              required
              error={errors.collateralImage}
              disabled={uiState === "loading"}
            />
            <p className="mt-2 text-xs text-gray-600">
              Tips: foto jelas, pencahayaan cukup, dan objek memenuhi frame.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <DocumentUpload
              salarySlip={salarySlip}
              onSalarySlipChange={setSalarySlip}
              slikDoc={slikDoc}
              onSlikDocChange={setSlikDoc}
              disabled={uiState === "loading"}
            />
            <p className="mt-2 text-xs text-gray-600">
              Dokumen opsional, tapi biasanya bikin hasil lebih meyakinkan.
            </p>
          </div>

          {/* Action */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={!canSubmit}
              className={[
                "w-full py-4 px-6 rounded-2xl font-extrabold text-base sm:text-lg",
                "transition-all duration-200 outline-none",
                canSubmit
                  ? "bg-gray-900 text-white hover:bg-black hover:shadow-lg active:scale-[0.99]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200",
              ].join(" ")}
            >
              {uiState === "loading" ? (
                <span className="inline-flex items-center justify-center gap-3">
                  <Spinner className="w-5 h-5" />
                  Memproses skor...
                </span>
              ) : (
                "Ajukan Sekarang"
              )}
            </button>

            <div className="mt-3 flex items-start gap-2 text-xs text-gray-600">
              <span className="mt-[2px] inline-block h-2 w-2 rounded-full bg-gray-400" />
              <p>
                Setelah klik, sistem menampilkan skor kelayakan & tombol lanjutan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Result Panel */}
      {uiState === "scored" && scoreResult && (
        <div className={["rounded-3xl border p-5 sm:p-6", statusMeta.panel].join(" ")}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold",
                    "bg-white/70 border border-current",
                    statusMeta.ring,
                  ].join(" ")}
                >
                  {statusMeta.badge}
                </span>
                <span className="text-xs font-semibold opacity-80">
                  Skor: 0–100
                </span>
              </div>

              <div className="mt-3 flex items-end gap-3">
                <p className="text-4xl sm:text-5xl font-extrabold leading-none">
                  {scoreResult.score}
                </p>
                <div className="pb-1">
                  <p className="text-sm font-semibold opacity-90">Ringkasan</p>
                  <p className="text-sm opacity-90">{scoreResult.headline}</p>
                </div>
              </div>

              {/* progress bar */}
              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-white/60 border border-current/20 overflow-hidden">
                  <div
                    className={["h-full", statusMeta.bar].join(" ")}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs opacity-90">{statusMeta.note}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setUiState("idle");
                setScoreResult(null);
              }}
              className="shrink-0 text-sm font-extrabold underline opacity-80 hover:opacity-100"
            >
              Ajukan ulang
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                router.push("/score/detail");
              }}
              className="w-full py-3 px-4 rounded-2xl border border-current font-extrabold bg-white/60 hover:bg-white/80 transition"
            >
              Lihat Detail
            </button>

            <button
              type="button"
              onClick={() => {
                router.push("/scan");
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gray-900 text-white font-extrabold hover:bg-black transition"
            >
              Lanjut Scan / Foto Barang
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
