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
    // contoh aturan sederhana: kalau tanpa dokumen -> REVIEW; kalau ada dokumen -> APPROVED
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

    // simulasi loading (biar UX kebayang). nanti ganti fetch API.
    await new Promise((r) => setTimeout(r, 900));

    const result = mockScore();
    setScoreResult(result);
    setUiState("scored");
  }

  const statusStyle =
    scoreResult?.status === "APPROVED"
      ? "bg-green-50 border-green-200 text-green-700"
      : scoreResult?.status === "REVIEW"
      ? "bg-yellow-50 border-yellow-200 text-yellow-700"
      : "bg-red-50 border-red-200 text-red-700";

  const statusLabel =
    scoreResult?.status === "APPROVED"
      ? "LAYAK"
      : scoreResult?.status === "REVIEW"
      ? "PERLU REVIEW"
      : "TIDAK LAYAK";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <RegionInput
        value={region}
        onChange={setRegion}
        error={errors.region}
        onUseLastRegion={() => setRegion("jakarta selatan")}
        lastRegionLabel="jakarta selatan"
      />

      <CategorySelect value={category} onChange={setCategory} />

      <FileUpload
        label="Foto Barang (Wajib)"
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

      <DocumentUpload
        salarySlip={salarySlip}
        onSalarySlipChange={setSalarySlip}
        slikDoc={slikDoc}
        onSlikDocChange={setSlikDoc}
        disabled={uiState === "loading"}
      />

      {/* Action Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 
            ${
              canSubmit
                ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
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

        <p className="mt-2 text-sm text-gray-500">
          Setelah klik, sistem akan menampilkan skor kelayakan dan opsi lanjutan.
        </p>
      </div>

      {/* CTA Panel (muncul setelah scored) */}
      {uiState === "scored" && scoreResult && (
        <div className={`mt-4 border rounded-2xl p-5 ${statusStyle}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold tracking-wide">
                HASIL SKOR: <span className="font-bold">{statusLabel}</span>
              </p>
              <p className="mt-1 text-3xl font-extrabold">{scoreResult.score}</p>
              <p className="mt-2 text-sm">{scoreResult.headline}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                // reset cepat kalau mau ajukan ulang
                setUiState("idle");
                setScoreResult(null);
              }}
              className="text-sm font-semibold underline opacity-80 hover:opacity-100"
            >
              Ajukan ulang
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                router.push("/score/detail");
              }}
              className="w-full py-3 px-4 rounded-xl border border-current font-bold hover:opacity-90"
            >
              Lihat Detail
            </button>


            <button
              type="button"
              onClick={() => {
                // nanti: navigate ke halaman scan/foto barang (AI)
                // contoh Next.js: router.push("/scan")
                alert("Lanjut ke halaman scan/foto barang (AI).");
              }}
              className="w-full py-3 px-4 rounded-xl bg-black text-white font-bold hover:opacity-90"
            >
              Lanjut Scan / Foto Barang
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
