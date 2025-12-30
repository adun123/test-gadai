// components/dashboard/ValuationPricing/PricingCard/PricingBreakdown.tsx
type Breakdown = {
  basePrice: number;
  adjustment: number;
  assetValue: number;
  confidenceLabel?: string;
  confidence: number;
  dataPoints?: number;
  appraisalValue?: number;
  effectiveCollateralValue?: number;
};

type Props = {
  vehicleReady: boolean;
  breakdown?: Breakdown | null;
  state: string; // ex: "processing" | "idle" | ...
  rupiah: (n: number) => string;
};

export default function PricingBreakdown({ vehicleReady, breakdown, state, rupiah }: Props) {
  return (
    <div className={`${vehicleReady ? "" : "pointer-events-none opacity-50"}`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-extrabold text-gray-500">HARGA PASAR</p>
          <p className="mt-2 text-lg font-extrabold text-gray-900">
            {breakdown ? rupiah(breakdown.basePrice) : state === "processing" ? "Menghitung…" : "—"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {breakdown?.dataPoints ? `${breakdown.dataPoints} data points` : "Base price (market value)"}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-extrabold text-gray-500">PENYESUAIAN</p>
          <p
            className={[
              "mt-2 text-lg font-extrabold",
              breakdown && breakdown.adjustment < 0 ? "text-red-600" : "text-gray-900",
            ].join(" ")}
          >
            {breakdown
              ? `${breakdown.adjustment < 0 ? "-" : "+"} ${rupiah(Math.abs(breakdown.adjustment))}`
              : state === "processing"
                ? "Menghitung…"
                : "—"}
          </p>
          <p className="mt-1 text-xs text-gray-500">Condition adjustment (from rules/AI)</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-extrabold text-blue-700">NILAI ASET</p>
          <p className="mt-2 text-lg font-extrabold text-blue-700">
            {breakdown ? rupiah(breakdown.assetValue) : state === "processing" ? "Menghitung…" : "—"}
          </p>
          <p className="mt-1 text-xs text-blue-700/80">
            {breakdown?.confidenceLabel ? `Confidence: ${breakdown.confidenceLabel}` : "Asset value"}
          </p>
        </div>
      </div>
    </div>
  );
}
