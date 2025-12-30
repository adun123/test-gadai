// components/dashboard/ValuationPricing/PricingCard/PricingHeader.tsx
import Spinner from "../../common/Spinner";

type Props = {
  useMock: boolean;
  setUseMock: (v: boolean) => void;
  isBusy: boolean;
  isLoading: boolean;
  breakdown?: { confidence: number } | null;
};

export default function PricingHeader({ useMock, setUseMock, isBusy, isLoading, breakdown }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 border-b bg-slate-50 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="text-blue-700">
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

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <input type="checkbox" checked={useMock} onChange={(e) => setUseMock(e.target.checked)} disabled={isBusy} />
          Use mock
        </label>

        <div className="rounded-xl border bg-white px-3 py-2 text-xs font-extrabold text-gray-700">
          {isLoading ? (
            <Spinner label="Calculating..." />
          ) : (
            <>
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500 align-middle" />
              AI Confidence: {breakdown ? `${Math.round(breakdown.confidence * 100)}%` : "—"}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
