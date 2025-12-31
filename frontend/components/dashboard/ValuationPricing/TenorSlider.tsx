// components/dashboard/ValuationPricing/PricingCard/TenorSlider.tsx
type Props = {
  vehicleReady: boolean;
  product: "reguler" | "harian";
  tenorDays: number;
  setTenorDays: (v: number) => void;
};

export default function TenorSlider({ vehicleReady, product, tenorDays, setTenorDays }: Props) {
  const min = 1;
  const max = product === "harian" ? 60 : 120;

  // safety: clamp supaya state yang keburu > max (misal sebelumnya reguler 120 lalu switch harian) tetap aman
  const safeValue = Math.min(Math.max(tenorDays, min), max);

  return (
    <div className={`${vehicleReady ? "" : "pointer-events-none opacity-50"}`}>
      <div className="rounded-2xl border bg-white p-5">
        <div className="flex items-end justify-between">
          <p className="text-sm font-extrabold text-gray-900">Tenor</p>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-blue-700">{safeValue}</p>
            <p className="text-sm font-semibold text-gray-600">Hari</p>
          </div>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          value={safeValue}
          onChange={(e) => setTenorDays(Number(e.target.value))}
          className="mt-4 w-full"
        />

        <div className="mt-2 flex justify-between text-xs font-semibold text-gray-500">
          <span>{min} Hari</span>
          <span>{max} Hari</span>
        </div>
      </div>
    </div>
  );
}
