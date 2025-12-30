// components/dashboard/ValuationPricing/PricingCard/PricingGating.tsx
type Props = { vehicleReady: boolean };

export default function PricingGating({ vehicleReady }: Props) {
  if (vehicleReady) return null;

  return (
    <div className="rounded-2xl border border-dashed bg-gray-50 p-5">
      <p className="text-sm font-extrabold text-gray-900">Menunggu data kendaraan</p>
      <p className="mt-1 text-sm text-gray-600">Upload &amp; analisis foto kendaraan dulu untuk memunculkan estimasi harga.</p>
    </div>
  );
}
