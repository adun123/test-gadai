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
      <label className="text-sm font-extrabold text-gray-900">Lokasi</label>

      <div className="mt-1">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Contoh: Jakarta Selatan, Surabaya"
          className="w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none"
        />
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Estimasi harga untuk wilayah{" "}
        <span className="font-semibold text-gray-700">
          {province || "Indonesia"}
        </span>
      </p>
    </div>
  );
}
