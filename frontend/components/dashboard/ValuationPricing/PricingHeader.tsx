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
    <div className="px-6 py-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Valuation & Pricing</h2>
            <p className="text-sm text-muted-foreground">Market data analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground">
            {isLoading ? (
              <Spinner label="Calculating..." />
            ) : (
              <>
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary align-middle" />
                Confidence: {breakdown ? `${Math.round(breakdown.confidence * 100)}%` : "—"}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
