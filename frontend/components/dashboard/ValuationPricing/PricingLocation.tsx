// components/dashboard/ValuationPricing/PricingCard/PricingLocation.tsx
type Props = {
  vehicleReady: boolean;
  location: string;
  setLocation: (v: string) => void;
  province?: string | null;
};

export default function PricingLocation({ vehicleReady, location, setLocation, province }: Props) {
  return (
    <div className={`${vehicleReady ? "" : "pointer-events-none opacity-50"}`}>
      <label className="text-sm font-medium text-blue-700">Location</label>
      <div className="relative mt-1">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </div>

      <p className="mt-2 text-sm text-gray-500">
        Estimasi harga untuk wilayah <span className="font-semibold text-gray-700">{province || "Indonesia"}</span>
      </p>
    </div>
  );
}
