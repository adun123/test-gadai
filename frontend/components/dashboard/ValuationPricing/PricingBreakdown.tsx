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
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-extrabold text-muted-foreground">HARGA PASAR</p>
          <p className="mt-2 text-lg font-extrabold text-foreground">
            {breakdown ? rupiah(breakdown.basePrice) : state === "processing" ? "Menghitung…" : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {breakdown?.dataPoints ? `${breakdown.dataPoints} data points` : "Base price (market value)"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-extrabold text-muted-foreground">PENYESUAIAN</p>
          <p
            className={[
              "mt-2 text-lg font-extrabold",
              breakdown && breakdown.adjustment < 0 ? "text-destructive" : "text-foreground",
            ].join(" ")}
          >
            {breakdown
              ? `${breakdown.adjustment < 0 ? "-" : "+"} ${rupiah(Math.abs(breakdown.adjustment))}`
              : state === "processing"
                ? "Menghitung…"
                : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Condition adjustment (from rules/AI)</p>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <p className="text-xs font-extrabold text-primary">NILAI ASET</p>
          <p className="mt-2 text-lg font-extrabold text-primary">
            {breakdown ? rupiah(breakdown.assetValue) : state === "processing" ? "Menghitung…" : "—"}
          </p>
          <p className="mt-1 text-xs text-primary/80">
            {breakdown?.confidenceLabel ? `Confidence: ${breakdown.confidenceLabel}` : "Asset value"}
          </p>
        </div>
      </div>
    </div>
  );
}
