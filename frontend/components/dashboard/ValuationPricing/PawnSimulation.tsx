// components/dashboard/ValuationPricing/PawnSimulation.tsx
type PawnSim = {
  maxDisbursement?: number;
  sewaModal?: number;
  dueDate?: Date; // ✅ Date, bukan string
};

type Props = {
  vehicleReady: boolean;
  pawnError?: string | null;

  breakdown?: {
    appraisalValue?: number;
    effectiveCollateralValue?: number;
  } | null;

  product: "reguler" | "harian";
  setProduct: (v: "reguler" | "harian") => void;

  pawnSim?: PawnSim | null;
  pawnState: string;

  formatIDDate: (d: Date) => string; // ✅ Date
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
}: Props) {
  return (
    <>
      {vehicleReady && pawnError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {pawnError}
        </div>
      ) : null}

      {vehicleReady && breakdown?.appraisalValue ? (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-gray-50 p-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProduct("reguler")}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-extrabold",
                  product === "reguler" ? "border bg-white shadow-sm" : "text-gray-500",
                ].join(" ")}
              >
                Gadai Reguler
              </button>
              <button
                type="button"
                onClick={() => setProduct("harian")}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-extrabold",
                  product === "harian" ? "border bg-white shadow-sm" : "text-gray-500",
                ].join(" ")}
              >
                Gadai Harian
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-blue-700 p-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold text-white/80">Nilai Taksir Gadai</p>
                <p className="mt-2 text-lg font-extrabold">
                  {breakdown.appraisalValue.toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="mt-2 text-xs text-white/70">
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
                <p className="text-xs font-extrabold text-white/80">Maksimal Dana Cair</p>
                <p className="mt-2 text-lg font-extrabold text-yellow-300">
                  {pawnSim?.maxDisbursement
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
                <p className="text-xs font-extrabold text-white/80">SEWA MODAL</p>
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
                <p className="text-xs font-extrabold text-white/80">JATUH TEMPO</p>
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
