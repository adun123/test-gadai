// components/dashboard/ValuationPricing/PricingCard/PricingHeader.tsx
import { DollarSign } from "lucide-react";
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
    <div className="border-b border-border bg-muted px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="text-primary">
          <DollarSign className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-extrabold text-card-foreground">Valuation &amp; Pricing</h2>
          <p className="mt-1 text-sm text-muted-foreground">Generate pricing recommendations based on market data and rules.</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <input type="checkbox" checked={useMock} onChange={(e) => setUseMock(e.target.checked)} disabled={isBusy} />
          Use mock
        </label>

        <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-extrabold text-foreground">
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
