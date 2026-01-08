// components/dashboard/ValuationPricing/PawnSimulation.tsx
type PawnSim = {
  maxDisbursement?: number;
  sewaModal?: number;
  dueDate?: Date; // Date, bukan string
};

type Props = {
  vehicleReady: boolean;
  hasMarketData: boolean;   
  pawnError?: string | null;
  breakdown?: {
    appraisalValue?: number;
    effectiveCollateralValue?: number;
  } | null;


  product: "reguler" | "harian";
  setProduct: (v: "reguler" | "harian") => void;

  pawnSim?: PawnSim | null;
  pawnState: string;

  formatIDDate: (d: Date) => string; //  Date
};



export default function PawnSimulation({
  vehicleReady,
  pawnError,
  breakdown,
  product,
  setProduct,
  pawnSim,
  pawnState,
  formatIDDate,
  hasMarketData,
}: Props) {
  return (
    <>
      {vehicleReady && pawnError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
          {pawnError}
        </div>
      ) : null}

     {vehicleReady && hasMarketData && typeof breakdown?.appraisalValue === "number" ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-muted p-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProduct("reguler")}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-extrabold",
                  product === "reguler" ? "border border-border bg-card shadow-sm text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                Gadai Reguler
              </button>
              <button
                type="button"
                onClick={() => setProduct("harian")}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-extrabold",
                  product === "harian" ? "border border-border bg-card shadow-sm text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                Gadai Harian
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold opacity-80">Nilai Taksir Gadai</p>
                <p className="mt-2 text-lg font-extrabold">
                  {breakdown.appraisalValue.toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="mt-2 text-xs opacity-70">
                  • ECV:{" "}
                  {typeof breakdown.effectiveCollateralValue === "number"
                    ? breakdown.effectiveCollateralValue.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    })
                    : "—"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-extrabold opacity-80">Maksimal Dana Cair</p>
                <p className="mt-2 text-lg font-extrabold text-yellow-300">
                 {typeof pawnSim?.maxDisbursement === "number"
                    ? pawnSim.maxDisbursement.toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      })
                    : pawnState === "processing"
                      ? "Menghitung…"
                      : "—"}

                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-extrabold opacity-80">SEWA MODAL</p>
                <p className="mt-1 text-sm font-bold">
                  {pawnSim?.sewaModal
                    ? pawnSim.sewaModal.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    })
                    : pawnState === "processing"
                      ? "Menghitung…"
                      : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-extrabold opacity-80">JATUH TEMPO</p>
                <p className="mt-1 text-sm font-bold">
                  {pawnSim?.dueDate ? formatIDDate(pawnSim.dueDate) : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
