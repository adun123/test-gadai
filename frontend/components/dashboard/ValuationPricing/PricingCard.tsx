"use client";

import { useMemo, useState } from "react";



type VehicleCondition = "Mulus (Grade A)" | "Normal (Grade B)" | "Banyak Lecet (Grade C)" | "Perlu Perbaikan (Grade D)";

type Props = {
  vehicleReady: boolean;
  vehicle?: {
    brandModel?: string;
    year?: string;
    physicalCondition?: VehicleCondition;
  };
};
// Tambahkan type di atas komponen (di PricingCard.tsx)
type PawnProduct = "reguler" | "harian";

type PricingBreakdown = {
  basePrice: number;        // harga pasar
  adjustment: number;       // penyesuaian (bisa minus)
  assetValue: number;       // base + adjustment
  confidence: number;       // 0..1
};

function rupiah(n: number) {
  // ringkas ala UI screenshot: Rp 18.5jt / Rp 500rb
  const abs = Math.abs(n);

  if (abs >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatIDDate(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function mockPawnSimulation(assetValue: number, tenorDays: number, product: PawnProduct) {
  // Aturan mock (PoC):
  // - LTV (maks dana cair) tergantung produk
  const ltv = product === "reguler" ? 0.92 : 0.85;
  const maxDisbursement = Math.floor(assetValue * ltv / 1000) * 1000;

  // - Nilai taksir sedikit di atas maks cair (biar terasa "ada buffer risiko")
  const appraisal = Math.floor((maxDisbursement / 0.925) / 1000) * 1000;

  // - Sewa modal sederhana: % per bulan pro-rata
  const monthlyRate = product === "reguler" ? 0.015 : 0.02; // mock
  const sewaModal = Math.floor((maxDisbursement * monthlyRate * (tenorDays / 30)) / 1000) * 1000;

  const dueDate = addDays(new Date(), tenorDays);

  return { appraisal, maxDisbursement, sewaModal, dueDate };
}



function mockPricing(
  location: string,
  vehicle?: Props["vehicle"]
): PricingBreakdown {
  // base price mock: pakai year + brandModel sedikit biar "hidup"
  const year = Number(vehicle?.year ?? "2021") || 2021;
  const age = Math.max(0, new Date().getFullYear() - year);

  let base = 19_000_000; // default
  const bm = (vehicle?.brandModel ?? "").toLowerCase();
  if (bm.includes("nmax")) base = 28_500_000;
  if (bm.includes("vario")) base = 21_500_000;
  if (bm.includes("scoopy")) base = 18_500_000;

  // depreciation ringan per tahun
  base = Math.max(9_000_000, base - age * 900_000);

  // adjustment berdasar kondisi
  const cond = vehicle?.physicalCondition ?? "Normal (Grade B)";
  let adjustment = 0;
  if (cond.includes("Grade A")) adjustment = +300_000;
  if (cond.includes("Grade B")) adjustment = 0;
  if (cond.includes("Grade C")) adjustment = -500_000;
  if (cond.includes("Grade D")) adjustment = -1_200_000;

  // lokasi bisa mempengaruhi sedikit
  const loc = location.toLowerCase();
  if (loc.includes("jakarta")) base += 200_000;
  if (loc.includes("jawa barat")) base += 100_000;

  const assetValue = base + adjustment;

  // confidence mock: makin jelas data, makin tinggi
  let confidence = 0.86;
  if (vehicle?.brandModel && vehicle?.year && vehicle?.physicalCondition) confidence = 0.94;
  if (cond.includes("Grade D")) confidence -= 0.05;

  return { basePrice: base, adjustment, assetValue, confidence: Math.max(0.6, Math.min(0.97, confidence)) };
}

export default function PricingCard({ vehicleReady, vehicle }: Props) {
  const [location, setLocation] = useState("Jakarta Selatan, DKI Jakarta");
  const [product, setProduct] = useState<PawnProduct>("reguler");
  const [tenorDays, setTenorDays] = useState(90);

  const breakdown = useMemo(() => {
    if (!vehicleReady) return null;
    return mockPricing(location, vehicle);
  }, [vehicleReady, location, vehicle?.brandModel, vehicle?.year, vehicle?.physicalCondition]);

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="text-blue-700">
            {/* pricing icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 7h6a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path d="M12 3v4M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-extrabold">Valuation &amp; Pricing</h2>
            <p className="mt-1 text-sm text-gray-600">Generate pricing recommendations based on market data and rules.</p>
          </div>
        </div>

        <div className="rounded-xl border bg-white px-3 py-2 text-xs font-extrabold text-gray-700">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500 align-middle" />
          AI Confidence: {breakdown ? `${Math.round(breakdown.confidence * 100)}%` : "—"}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Gating state */}
        {!vehicleReady ? (
          <div className="rounded-2xl border border-dashed bg-gray-50 p-5">
            <p className="text-sm font-extrabold text-gray-900">Menunggu data kendaraan</p>
            <p className="mt-1 text-sm text-gray-600">
              Upload &amp; analisis foto kendaraan dulu untuk memunculkan estimasi harga.
            </p>
          </div>
        ) : null}

        {/* Location */}
        <div className={`${vehicleReady ? "" : "opacity-50 pointer-events-none"}`}>
          <label className="text-sm font-medium text-blue-700">Location</label>
          <div className="relative mt-1">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Estimasi harga untuk wilayah{" "}
            <span className="font-semibold text-gray-700">
              {location.split(",")[0] || location}
            </span>
          </p>
        </div>

        {/* Breakdown */}
        <div className={`${vehicleReady ? "" : "opacity-50 pointer-events-none"}`}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-extrabold text-gray-500">HARGA PASAR</p>
              <p className="mt-2 text-lg font-extrabold text-gray-900">
                {breakdown ? rupiah(breakdown.basePrice) : "—"}
              </p>
              <p className="mt-1 text-xs text-gray-500">Base price (current market value)</p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-extrabold text-gray-500">PENYESUAIAN</p>
              <p
                className={[
                  "mt-2 text-lg font-extrabold",
                  breakdown && breakdown.adjustment < 0 ? "text-red-600" : "text-gray-900",
                ].join(" ")}
              >
                {breakdown ? `${breakdown.adjustment < 0 ? "-" : "+"} ${rupiah(Math.abs(breakdown.adjustment))}` : "—"}
              </p>
              <p className="mt-1 text-xs text-gray-500">Condition adjustment (assumption)</p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-extrabold text-blue-700">NILAI ASET</p>
              <p className="mt-2 text-lg font-extrabold text-blue-700">
                {breakdown ? rupiah(breakdown.assetValue) : "—"}
              </p>
              <p className="mt-1 text-xs text-blue-700/80">Asset value (+ confidence)</p>
            </div>
          </div>
        </div>

        {/* Edu / trust (opsional tapi bagus buat PoC) */}
        {vehicleReady && breakdown ? (
          <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-700">
            <p className="font-bold">Breakdown (Edu &amp; Trust)</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
              <li>Base price diambil dari referensi pasar (contoh: OLX / database internal).</li>
              <li>Penyesuaian dihitung dari kondisi fisik (asumsi rule-based untuk PoC).</li>
              <li>Nilai aset = base price + penyesuaian, disertai confidence level AI.</li>
            </ul>
          </div>
        ) : null}


        {/* Pawn simulation block */}
        {vehicleReady && breakdown ? (
        (() => {
            const sim = mockPawnSimulation(breakdown.assetValue, tenorDays, product);

            return (
            <div className="space-y-4">
                {/* Tabs */}
                <div className="rounded-2xl border bg-gray-50 p-2">
                <div className="grid grid-cols-2 gap-2">
                    <button
                    type="button"
                    onClick={() => setProduct("reguler")}
                    className={[
                        "rounded-xl px-4 py-2 text-sm font-extrabold",
                        product === "reguler" ? "bg-white shadow-sm border" : "text-gray-500",
                    ].join(" ")}
                    >
                    Gadai Reguler
                    </button>
                    <button
                    type="button"
                    onClick={() => setProduct("harian")}
                    className={[
                        "rounded-xl px-4 py-2 text-sm font-extrabold",
                        product === "harian" ? "bg-white shadow-sm border" : "text-gray-500",
                    ].join(" ")}
                    >
                    Gadai Harian
                    </button>
                </div>
                </div>

                {/* Tenor */}
                <div className="rounded-2xl border bg-white p-5">
                <div className="flex items-end justify-between">
                    <p className="text-sm font-extrabold text-gray-900">Tenor Pinjaman</p>
                    <div className="text-right">
                    <p className="text-3xl font-extrabold text-blue-700">{tenorDays}</p>
                    <p className="text-sm font-semibold text-gray-600">Hari</p>
                    </div>
                </div>

                <input
                    type="range"
                    min={1}
                    max={120}
                    value={tenorDays}
                    onChange={(e) => setTenorDays(Number(e.target.value))}
                    className="mt-4 w-full"
                />

                <div className="mt-2 flex justify-between text-xs font-semibold text-gray-500">
                    <span>1 Hari</span>
                    <span>120 Hari</span>
                </div>
                </div>

                {/* Result panel */}
                <div className="rounded-2xl bg-blue-700 p-5 text-white shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div>
                    <p className="text-xs font-extrabold text-white/80">Nilai Taksir Gadai</p>
                    <p className="mt-2 text-lg font-extrabold">{sim.appraisal.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}</p>
                    <p className="mt-2 text-xs text-white/70">
                        • Memperhitungkan risiko penurunan nilai
                    </p>
                    </div>

                    <div className="text-right">
                    <p className="text-xs font-extrabold text-white/80">Maksimal Dana Cair</p>
                    <p className="mt-2 text-lg font-extrabold text-yellow-300">
                        {sim.maxDisbursement.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                    </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div>
                    <p className="text-xs font-extrabold text-white/80">SEWA MODAL</p>
                    <p className="mt-1 text-sm font-bold">
                        {sim.sewaModal.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                    </p>
                    </div>
                    <div className="text-right">
                    <p className="text-xs font-extrabold text-white/80">JATUH TEMPO</p>
                    <p className="mt-1 text-sm font-bold">{formatIDDate(sim.dueDate)}</p>
                    </div>
                </div>
                </div>
            </div>
            );
        })()
        ) : null}

      </div>
    </section>
  );
}
