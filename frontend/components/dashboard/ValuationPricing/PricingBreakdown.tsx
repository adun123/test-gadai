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
  onPickProvince?: (p: string) => void;
};
const FALLBACK_PROVINCES = [
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Banten",
];





function SkeletonCircle({ tone = "neutral" }: { tone?: "neutral" | "primary" }) {
  const bg =
    tone === "primary" ? "bg-primary/25" : "bg-muted";

  return (
    <div className="mt-2 flex items-center gap-3">
      <div
        className={[
          "h-10 w-10 rounded-full animate-pulse",
          bg,
        ].join(" ")}
      />
      <div className="space-y-2">
        <div className="h-4 w-24 rounded-md bg-muted/70 animate-pulse" />
      </div>
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


export default function PricingBreakdown({ vehicleReady, breakdown, state, rupiah, onPickProvince }: Props) {
 const hasMarketData =
  typeof breakdown?.dataPoints === "number" &&
  breakdown.dataPoints > 0;

 const isProcessing = state === "processing";
 const noDataNow =
  !!breakdown &&
  (!hasMarketData || breakdown.dataPoints === 0);


  const [showNoData, setShowNoData] = React.useState(false);

const showLoading = isProcessing;








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
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div>
            <p className="text-sm font-extrabold text-amber-900">
              Data harga tidak ditemukan
            </p>
            <p className="mt-1 text-xs text-amber-800">
              Kami tidak menemukan data yang cukup untuk provinsi ini.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-amber-900">
              Coba provinsi dengan data tersedia:
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {FALLBACK_PROVINCES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPickProvince?.(p)}
                  className="rounded-full border border-amber-300 bg-white px-3 py-1.5
                            text-xs font-extrabold text-amber-900
                            hover:bg-amber-100 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

 
      <div className="grid gap-3 mt-2 sm:grid-cols-3">
       
    <StatCard
        title="HARGA PASAR"
        value={
          showLoading
            ? <SkeletonCircle />
            : hasMarketData
              ? rupiah(breakdown!.basePrice)
              : "-"
        }
        sub={
          hasMarketData
            ? `Berdasarkan ${breakdown!.dataPoints} data pasar`
            : "Data pasar tidak tersedia di provinsi ini"
        }
      />



      <StatCard
        title="PENYESUAIAN"
        value={
          showLoading
            ? <SkeletonCircle />
            : hasMarketData
              ? `${breakdown!.adjustment < 0 ? "-" : "+"} ${rupiah(Math.abs(breakdown!.adjustment))}`
              : "-"
        }
        sub="Condition adjustment (from rules/AI)"
        highlight={hasMarketData && !!breakdown && breakdown.adjustment < 0}
      />


        <StatCard
            title="NILAI ASET"
            value={
              showLoading
                ? <SkeletonCircle tone="primary" />
                : hasMarketData
                  ? rupiah(breakdown!.assetValue)
                  : "-"
            }
            sub={
              hasMarketData
                ? breakdown?.confidenceLabel
                  ? `Confidence: ${breakdown.confidenceLabel}`
                  : "Asset value"
                : "Menunggu data pasar"
            }
            tone="primary"
          />

      </div>
    </div>
  );
}
