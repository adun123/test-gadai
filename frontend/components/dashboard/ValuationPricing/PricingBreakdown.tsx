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
  state: string; // "processing" | "idle" | ...
  rupiah: (n: number) => string;
};

function SkeletonValue({ tone = "neutral" }: { tone?: "neutral" | "primary" }) {
  const line1 = tone === "primary" ? "bg-primary/25" : "bg-muted";
  const line2 = tone === "primary" ? "bg-primary/15" : "bg-muted/70";

  return (
    <div className="mt-2 space-y-2">
      <div className={`h-6 w-40 animate-pulse rounded-lg ${line1}`} />
      <div className={`h-4 w-48 animate-pulse rounded-lg ${line2}`} />
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  highlight,
  tone = "neutral",
}: {
  title: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  highlight?: boolean;
  tone?: "neutral" | "primary";
}) {
  const base =
    tone === "primary"
      ? "border-primary/30 bg-primary/10"
      : "border-border bg-card";

  const titleCls = tone === "primary" ? "text-primary" : "text-muted-foreground";
  const valueCls = tone === "primary" ? "text-primary" : "text-foreground";

  return (
    <div className={`rounded-2xl border p-4 ${base}`}>
      <p className={`text-xs font-extrabold ${titleCls}`}>{title}</p>

      <p
        className={[
          "mt-2 text-lg font-extrabold tabular-nums",
          "truncate", // anti kepotong brutal
          highlight ? "text-destructive" : valueCls,
        ].join(" ")}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </p>

      <p className={`mt-1 text-xs ${tone === "primary" ? "text-primary/80" : "text-muted-foreground"} truncate`}>
        {sub}
      </p>
    </div>
  );
}

export default function PricingBreakdown({ vehicleReady, breakdown, state, rupiah }: Props) {
  const isProcessing = state === "processing" && !breakdown;

  const baseValue = breakdown ? rupiah(breakdown.basePrice) : isProcessing ? <SkeletonValue /> : "—";
  const assetValue = breakdown ? rupiah(breakdown.assetValue) : isProcessing ? <SkeletonValue tone="primary" /> : "—";

  const adjustmentValue = breakdown
    ? `${breakdown.adjustment < 0 ? "-" : "+"} ${rupiah(Math.abs(breakdown.adjustment))}`
    : isProcessing
      ? <SkeletonValue />
      : "—";

  return (
    <div className={`${vehicleReady ? "" : "pointer-events-none opacity-50"}`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          title="HARGA PASAR"
          value={baseValue}
          sub={breakdown?.dataPoints ? `${breakdown.dataPoints} data points` : "Base price (market value)"}
        />

        <StatCard
          title="PENYESUAIAN"
          value={adjustmentValue}
          sub="Condition adjustment (from rules/AI)"
          highlight={!!breakdown && breakdown.adjustment < 0}
        />

        <StatCard
          title="NILAI ASET"
          value={assetValue}
          sub={breakdown?.confidenceLabel ? `Confidence: ${breakdown.confidenceLabel}` : "Asset value"}
          tone="primary"
        />
      </div>
    </div>
  );
}
