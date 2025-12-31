// components/dashboard/ValuationPricing/PricingCard/PricingFooter.tsx
type Props = {
  vehicleReady: boolean;
  fetchPricing: () => void;
  canCallPricing: boolean;
  isBusy: boolean;
};

export default function PricingFooter({ vehicleReady, fetchPricing, canCallPricing, isBusy }: Props) {
  if (!vehicleReady) return null;

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={fetchPricing}
        disabled={!canCallPricing || isBusy}
        className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-extrabold text-foreground hover:bg-accent disabled:opacity-50"
      >
        Refresh Pricing
      </button>
    </div>
  );
}
