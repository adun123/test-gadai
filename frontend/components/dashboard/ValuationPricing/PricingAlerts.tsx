// components/dashboard/ValuationPricing/PricingCard/PricingAlerts.tsx
type Props = {
  errorMsg?: string | null;
  isLoading: boolean;
};

export default function PricingAlerts({ errorMsg, isLoading }: Props) {
  return (
    <>
      {errorMsg ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
          {errorMsg}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-muted p-4 text-sm text-foreground">
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
            <div>
              <p className="font-bold">Sedang hitung pricing…</p>
              <p className="text-xs text-muted-foreground">Ambil harga pasar + hitung taksiran. Bisa beberapa detik.</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
