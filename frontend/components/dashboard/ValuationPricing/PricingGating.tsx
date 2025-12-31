// components/dashboard/ValuationPricing/PricingCard/PricingGating.tsx
type Props = { vehicleReady: boolean };

export default function PricingGating({ vehicleReady }: Props) {
  if (vehicleReady) return null;

  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted p-5">
      <p className="text-sm font-extrabold text-foreground">Menunggu data kendaraan</p>
      <p className="mt-1 text-sm text-muted-foreground">Upload &amp; analisis foto kendaraan dulu untuk memunculkan estimasi harga.</p>
    </div>
  );
}
