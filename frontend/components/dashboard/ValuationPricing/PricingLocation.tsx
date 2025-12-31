// components/dashboard/ValuationPricing/PricingCard/PricingLocation.tsx
type Props = {
  vehicleReady: boolean;
  location: string;
  setLocation: (v: string) => void;
  province?: string | null;
};

export default function PricingLocation({
  vehicleReady,
  location,
  setLocation,
  province,
}: Props) {
  return (
    <div className={`${vehicleReady ? "" : "pointer-events-none opacity-50"}`}>
      <label className="text-sm font-extrabold text-foreground">Lokasi</label>

      <div className="mt-1">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Contoh: Jakarta Selatan, Surabaya"
          className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm focus:border-ring focus:outline-none"
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Estimasi harga untuk wilayah{" "}
        <span className="font-semibold text-foreground">
          {province || "Indonesia"}
        </span>
      </p>
    </div>
  );
}
