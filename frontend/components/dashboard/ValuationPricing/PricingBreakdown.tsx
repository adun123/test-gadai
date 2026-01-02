// components/dashboard/ValuationPricing/PricingCard/PricingBreakdown.tsx
import React from "react";

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

function isZeroResult(b?: Breakdown | null) {
  if (!b) return false;
  return [b.basePrice, b.assetValue, b.adjustment].every((x) => Math.abs(x) < 1e-9);
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
          "whitespace-normal break-words",
          highlight ? "text-destructive" : valueCls,
        ].join(" ")}
      >
        {value}
      </p>

      <p
        className={[
          "mt-1 text-xs",
          tone === "primary" ? "text-primary/80" : "text-muted-foreground",
          "whitespace-normal break-words",
        ].join(" ")}
      >
        {sub}
      </p>
    </div>
  );
}


export default function PricingBreakdown({ vehicleReady, breakdown, state, rupiah }: Props) {
 
 const isProcessing = state === "processing";
  const noDataNow = !!breakdown && isZeroResult(breakdown);

  const [showNoData, setShowNoData] = React.useState(false);

  const baseValue = breakdown ? rupiah(breakdown.basePrice) : isProcessing ? <SkeletonValue /> : "—";
  const assetValue = breakdown ? rupiah(breakdown.assetValue) : isProcessing ? <SkeletonValue tone="primary" /> : "—";
  
 
  const adjustmentValue = breakdown
    ? `${breakdown.adjustment < 0 ? "-" : "+"} ${rupiah(Math.abs(breakdown.adjustment))}`
    : isProcessing
      ? <SkeletonValue />
      : "—";
    React.useEffect(() => {
    // kalau no data, tampilkan tapi jangan instan (anti flicker)
    if (noDataNow) {
      const t = setTimeout(() => setShowNoData(true), 800);
      return () => clearTimeout(t);
    }

    // kalau data valid muncul, langsung hilangkan warning
    setShowNoData(false);
  }, [noDataNow]);
  return (
    
    <div className={`${vehicleReady ? "" : "pointer-events-none opacity-50"}`}>
  
      {isProcessing ? (
        <div className="rounded-2xl border border-border bg-muted px-4 py-3 text-xs font-bold text-muted-foreground">
          Menghitung ulang berdasarkan lokasi…
        </div>
      ) : null}

      {showNoData && !isProcessing ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-extrabold text-amber-900">Data harga tidak ditemukan</p>
          <p className="mt-1 text-xs text-amber-800">
            Coba pilih provinsi lain atau periksa ejaan lokasi.
          </p>
        </div>
      ) : null}
 
      <div className="grid gap-3 mt-2 sm:grid-cols-3">
       
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
