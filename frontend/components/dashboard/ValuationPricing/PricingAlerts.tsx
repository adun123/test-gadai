// components/dashboard/ValuationPricing/PricingCard/PricingAlerts.tsx
type Props = {
  errorMsg?: string | null;
  isLoading: boolean;
};

export default function PricingAlerts({ errorMsg, isLoading }: Props) {
  return (
    <>
      {errorMsg ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorMsg}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-700">
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            <div>
              <p className="font-bold">Sedang hitung pricing…</p>
              <p className="text-xs text-gray-500">Ambil harga pasar + hitung taksiran. Bisa beberapa detik.</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
