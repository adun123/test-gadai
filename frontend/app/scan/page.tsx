"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/common/Spinner";

type ScanStage = "idle" | "scanning_initial" | "initial_done" | "finalizing" | "final_done";

type InitialAIResult = {
  region: string;
  brand: string;
  category: "ELEKTRONIK" | "KENDARAAN" | "EMAS" | "LAINNYA";
  type: string;
  model_or_type: string;
  detected_defects: string[];
};

type FinalAIResult = {
  grade: "A" | "B" | "C" | "D";
  confidence: number;
  estimated_market_value: number;
  status: "APPROVED" | "REVIEW" | "REJECTED";
  rejection_reason?: string;
  final_loan_offer: number;
};

export default function ScanPage() {
  // ===== Input utama =====
  const [region, setRegion] = useState("jakarta selatan");
  const [photo, setPhoto] = useState<File | null>(null);

  // ===== State proses =====
  const [stage, setStage] = useState<ScanStage>("idle");

  // ===== Data hasil =====
  const [initial, setInitial] = useState<InitialAIResult | null>(null);
  const [manualDefect, setManualDefect] = useState("");
  const [manualDefects, setManualDefects] = useState<string[]>([]);
  const [finalResult, setFinalResult] = useState<FinalAIResult | null>(null);

  const canScanInitial = useMemo(() => {
    return region.trim().length >= 2 && !!photo && stage !== "scanning_initial" && stage !== "finalizing";
  }, [region, photo, stage]);

  const canFinalize = useMemo(() => {
    return !!initial && stage !== "finalizing" && stage !== "scanning_initial";
  }, [initial, stage]);

  // ===== DUMMY: scan awal (brand/model/defects visible) =====
  async function runInitialScan() {
    if (!canScanInitial) return;

    setStage("scanning_initial");
    setFinalResult(null);
    setInitial(null);
    setManualDefects([]);

    // simulasi loading scan AI
    await new Promise((r) => setTimeout(r, 900));

    // dummy output sesuai contoh kamu
    const dummy: InitialAIResult = {
      region: region.trim(),
      brand: "Oppo",
      category: "ELEKTRONIK",
      type: "Smartphone",
      model_or_type: "A37",
      detected_defects: [
        "Layar pecah parah (shattered glass)",
        "Kerusakan bezel dan sudut perangkat",
        "Model perangkat lama/obsolete",
      ],
    };

    setInitial(dummy);
    setStage("initial_done");
  }

  // ===== DUMMY: finalisasi grade & harga (gabung AI defect + manual defect) =====
  async function finalizeAssessment() {
    if (!canFinalize || !initial) return;

    setStage("finalizing");

    await new Promise((r) => setTimeout(r, 900));

    // gabung defects
    const allDefects = [...initial.detected_defects, ...manualDefects];

    // dummy rule sederhana:
    // - kalau defect banyak atau ada kata "rusak" / "pecah" -> Grade D
    const heavy =
      allDefects.length >= 3 ||
      allDefects.some((d) => /pecah|rusak|mati total|parah/i.test(d));

    const grade: FinalAIResult["grade"] = heavy ? "D" : "C";

    const estimated_market_value = heavy ? 150000 : 600000;
    const status: FinalAIResult["status"] = heavy ? "REJECTED" : "REVIEW";
    const final_loan_offer = heavy ? 0 : Math.floor(estimated_market_value * 0.6);

    const finalDummy: FinalAIResult = {
      grade,
      confidence: heavy ? 0.85 : 0.72,
      estimated_market_value,
      status,
      rejection_reason: heavy
        ? "Kondisi barang rusak berat dan nilai pasar rendah di wilayah yang dipilih."
        : undefined,
      final_loan_offer,
    };

    setFinalResult(finalDummy);
    setStage("final_done");
  }

  function addManualDefect() {
    const v = manualDefect.trim();
    if (!v) return;
    setManualDefects((prev) => [v, ...prev]);
    setManualDefect("");
  }

  function removeManualDefect(index: number) {
    setManualDefects((prev) => prev.filter((_, i) => i !== index));
  }

  const combinedDefects = useMemo(() => {
    if (!initial) return [];
    return [...initial.detected_defects, ...manualDefects];
  }, [initial, manualDefects]);

return (
  <main className="mx-auto max-w-6xl p-6">
    {/* Header */}
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
          Scan / Foto Barang (AI)
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Step 1: identifikasi barang & defect terlihat → Step 2: tambah defect manual → Step 3: hitung grade & harga.
        </p>
      </div>

      <Link href="/" className="text-sm font-semibold underline text-gray-700 hover:text-gray-900">
        Kembali
      </Link>
    </div>

    {/* Layout */}
    <div className="grid gap-6 lg:grid-cols-12">
      {/* LEFT: Input + Preview */}
      <aside className="lg:col-span-5 space-y-6">
        {/* Input Scan Card */}
        <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Input Scan</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Isi lokasi & unggah foto barang. Preview akan muncul di bawah.
                </p>
              </div>

              <span className="shrink-0 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                {stage === "scanning_initial"
                  ? "Scanning"
                  : stage === "finalizing"
                  ? "Finalizing"
                  : stage === "final_done"
                  ? "Selesai"
                  : initial
                  ? "Step 2"
                  : "Step 1"}
              </span>
            </div>

            {/* Region */}
            <label className="grid gap-1">
              <span className="text-sm font-semibold text-gray-800">Lokasi / Region</span>
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-gray-200"
                placeholder="Contoh: jakarta selatan"
                disabled={stage === "scanning_initial" || stage === "finalizing"}
              />
            </label>

            {/* Upload */}
            <label className="grid gap-1">
              <span className="text-sm font-semibold text-gray-800">Foto Barang (wajib)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3"
                disabled={stage === "scanning_initial" || stage === "finalizing"}
              />
              {photo ? (
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold">
                    Dipilih
                  </span>
                  <span className="font-semibold">{photo.name}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Upload foto yang jelas (fokus, terang).</p>
              )}
            </label>

            {/* Preview */}
            <div className="rounded-3xl border border-gray-200 bg-gray-50 overflow-hidden">
              <div className="relative aspect-[4/3] w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Preview foto barang"
                  src={photo ? URL.createObjectURL(photo) : "/placeholder.png"}
                  className={`h-full w-full object-cover ${photo ? "" : "opacity-40"}`}
                />

                {/* Overlay state */}
                {(stage === "scanning_initial" || stage === "finalizing") && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <div className="inline-flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 text-sm font-bold text-gray-900 shadow">
                      <Spinner className="w-5 h-5" />
                      {stage === "scanning_initial" ? "Scan awal..." : "Menghitung grade & harga..."}
                    </div>
                  </div>
                )}

                {!photo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 text-sm font-semibold text-gray-700">
                      Belum ada foto — upload dulu ya 😄
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="text-xs text-gray-600">
                  Tips: foto memenuhi frame, cahaya cukup, hindari blur. AI juga manusia… eh bukan.
                </p>
              </div>
            </div>

            {/* CTA Scan Awal */}
            <button
              type="button"
              onClick={runInitialScan}
              disabled={!canScanInitial}
              className={[
                "w-full rounded-2xl py-3.5 px-4 font-extrabold transition-all",
                canScanInitial
                  ? "bg-gray-900 text-white hover:bg-black hover:shadow-md active:scale-[0.99]"
                  : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed",
              ].join(" ")}
            >
              {stage === "scanning_initial" ? (
                <span className="inline-flex items-center justify-center gap-3">
                  <Spinner className="w-5 h-5" />
                  Scan awal...
                </span>
              ) : (
                "Scan Awal (Brand / Model / Kerusakan terlihat)"
              )}
            </button>
          </div>
        </section>

        {/* Stepper / status */}
        <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <h3 className="text-base font-extrabold text-gray-900">Progress</h3>

            <div className="mt-4 space-y-3">
              {[
                { t: "Step 1", d: "Scan awal identitas & defect terlihat", done: !!initial },
                { t: "Step 2", d: "Tambah defect manual (opsional)", done: !!initial && manualDefects.length > 0 },
                { t: "Step 3", d: "Finalisasi grade & harga", done: !!finalResult },
              ].map((s, i) => {
                const active =
                  (i === 0 && !initial) ||
                  (i === 1 && initial && !finalResult) ||
                  (i === 2 && stage === "finalizing");
                return (
                  <div
                    key={s.t}
                    className={[
                      "flex items-start gap-3 rounded-2xl border px-4 py-3",
                      active ? "border-gray-300 bg-gray-50" : "border-gray-200 bg-white",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center text-xs font-extrabold",
                        s.done ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-600",
                      ].join(" ")}
                    >
                      {s.done ? "✓" : i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-gray-900">{s.t}</p>
                      <p className="text-xs text-gray-600">{s.d}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </aside>

      {/* RIGHT: Results */}
      <section className="lg:col-span-7 space-y-6">
        {/* Empty state */}
        {!initial && (
          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-extrabold text-gray-900">Hasil akan muncul di sini</h2>
              <p className="mt-2 text-sm text-gray-600">
                Setelah kamu upload foto dan klik <b>Scan Awal</b>, AI akan menampilkan identitas barang dan kerusakan yang terlihat.
              </p>
              <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
                Pro tip: kalau hasilnya ngaco, biasanya fotonya yang “kurang niat”, bukan AI-nya. Biasanya ya.
              </div>
            </div>
          </div>
        )}

        {/* Initial Result */}
        {initial && (
          <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">Hasil Scan Awal</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    AI mendeteksi identitas barang dan kerusakan yang terlihat dari foto.
                  </p>
                </div>
                <span className="text-xs font-extrabold px-3 py-2 rounded-2xl border border-gray-200 bg-gray-50 text-gray-700">
                  STEP 1 SELESAI
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-600">Brand</p>
                  <p className="mt-1 text-xl font-extrabold text-gray-900">{initial.brand}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-600">Kategori</p>
                  <p className="mt-1 text-xl font-extrabold text-gray-900">{initial.category}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-600">Tipe</p>
                  <p className="mt-1 text-xl font-extrabold text-gray-900">{initial.type}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-600">Model</p>
                  <p className="mt-1 text-xl font-extrabold text-gray-900">{initial.model_or_type}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                <p className="font-extrabold text-gray-900">Kerusakan terdeteksi (AI)</p>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-800">
                  {initial.detected_defects.map((d, idx) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Manual defects */}
        {initial && (
          <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">Tambah Kerusakan Manual</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Untuk kerusakan yang tidak terlihat di foto (mis. komponen dalam, fungsi, suara, dll).
                  </p>
                </div>
                <span className="text-xs font-extrabold px-3 py-2 rounded-2xl border border-gray-200 bg-gray-50 text-gray-700">
                  STEP 2
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={manualDefect}
                  onChange={(e) => setManualDefect(e.target.value)}
                  placeholder="Contoh: Baterai drop / Speaker pecah / Mesin panas"
                  className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-gray-200"
                  disabled={stage === "finalizing" || stage === "scanning_initial"}
                />
                <button
                  type="button"
                  onClick={addManualDefect}
                  className="rounded-2xl px-5 py-3 font-extrabold border border-gray-200 hover:bg-gray-50"
                  disabled={stage === "finalizing" || stage === "scanning_initial"}
                >
                  Tambah
                </button>
              </div>

              {manualDefects.length > 0 ? (
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="font-extrabold text-gray-900">Kerusakan manual (pegawai)</p>
                  <ul className="mt-3 space-y-2">
                    {manualDefects.map((d, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <span className="text-sm text-gray-800">{d}</span>
                        <button
                          type="button"
                          onClick={() => removeManualDefect(idx)}
                          className="text-xs font-extrabold underline text-gray-600 hover:text-gray-900"
                          disabled={stage === "finalizing" || stage === "scanning_initial"}
                        >
                          Hapus
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Belum ada kerusakan manual ditambahkan.</p>
              )}

              <button
                type="button"
                onClick={finalizeAssessment}
                disabled={!canFinalize}
                className={[
                  "w-full rounded-2xl py-3.5 px-4 font-extrabold transition-all",
                  canFinalize
                    ? "bg-gray-900 text-white hover:bg-black hover:shadow-md active:scale-[0.99]"
                    : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed",
                ].join(" ")}
              >
                {stage === "finalizing" ? (
                  <span className="inline-flex items-center justify-center gap-3">
                    <Spinner className="w-5 h-5" />
                    Menghitung grade & harga...
                  </span>
                ) : (
                  "Hitung Grade & Harga (AI Final)"
                )}
              </button>
            </div>
          </section>
        )}

        {/* Final output */}
        {initial && finalResult && (
          <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">Hasil Akhir (Dummy)</h2>
                  <p className="mt-1 text-sm text-gray-600">Ringkasan keputusan, grade, dan estimasi nilai.</p>
                </div>
                <span className="text-xs font-extrabold px-3 py-2 rounded-2xl border border-gray-200 bg-gray-50 text-gray-700">
                  STEP 3 SELESAI
                </span>
              </div>

              {/* Hero */}
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Kondisi</p>
                    <p className="mt-1 text-4xl font-extrabold text-gray-900">Grade {finalResult.grade}</p>
                    <p className="mt-2 text-sm text-gray-600">
                      Confidence: <span className="font-semibold">{finalResult.confidence}</span>
                    </p>

                    <div className="mt-2 h-2 w-full rounded-full bg-white border border-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-gray-900"
                        style={{ width: `${Math.round(finalResult.confidence * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div
                    className={[
                      "rounded-2xl border px-4 py-3 text-sm font-extrabold",
                      finalResult.status === "APPROVED"
                        ? "border-green-200 bg-green-50 text-green-800"
                        : finalResult.status === "REVIEW"
                        ? "border-yellow-200 bg-yellow-50 text-yellow-800"
                        : "border-red-200 bg-red-50 text-red-800",
                    ].join(" ")}
                  >
                    {finalResult.status}
                  </div>
                </div>

                {finalResult.rejection_reason ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <p className="font-extrabold">Alasan Penolakan</p>
                    <p className="mt-1">{finalResult.rejection_reason}</p>
                  </div>
                ) : null}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-600">Harga Pasar</p>
                  <p className="mt-1 text-2xl font-extrabold text-gray-900">
                    Rp {finalResult.estimated_market_value.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-600">Tawaran Gadai</p>
                  <p className="mt-1 text-2xl font-extrabold text-gray-900">
                    Rp {finalResult.final_loan_offer.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              {/* Console */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <pre className="text-xs overflow-x-auto leading-5">
{`========================================
LOKASI        : ${initial.region}
BARANG        : ${initial.brand} ${initial.model_or_type}
KONDISI       : Grade ${finalResult.grade}
HARGA PASAR   : Rp ${finalResult.estimated_market_value.toLocaleString("id-ID")}
TAWARAN GADAI : Rp ${finalResult.final_loan_offer.toLocaleString("id-ID")}
========================================`}
                </pre>
              </div>

              {/* Debug JSON */}
              <details className="rounded-2xl border border-gray-200 p-4">
                <summary className="font-extrabold cursor-pointer text-gray-900">Lihat JSON (Debug)</summary>
                <pre className="mt-3 text-xs overflow-x-auto">
                  {JSON.stringify(
                    {
                      pawn_assessment: {
                        applicant_analysis: { salary_slip: null, slik_check: null },
                        collaterals: [
                          {
                            brand: initial.brand,
                            category: initial.category,
                            model_or_type: initial.model_or_type,
                            physical_condition: {
                              accessories_visible: [],
                              detected_defects: combinedDefects,
                              grade: finalResult.grade,
                            },
                            type: initial.type,
                            value_estimation: {
                              confidence: finalResult.confidence,
                              estimated_market_value: finalResult.estimated_market_value,
                            },
                          },
                        ],
                        final_decision: {
                          final_loan_offer: finalResult.final_loan_offer,
                          rejection_reason: finalResult.rejection_reason ?? null,
                          status: finalResult.status,
                        },
                        region_context: initial.region,
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </div>
          </section>
        )}
      </section>
    </div>
  </main>
);

}
