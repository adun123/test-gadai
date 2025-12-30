// components/dashboard/ValuationPricing/PricingCard/TenorSlider.tsx
type Props = {
  vehicleReady: boolean;
  tenorDays: number;
  setTenorDays: (v: number) => void;
};

export default function TenorSlider({ vehicleReady, tenorDays, setTenorDays }: Props) {
  return (
    <div className={`${vehicleReady ? "" : "pointer-events-none opacity-50"}`}>
      <div className="rounded-2xl border bg-white p-5">
        <div className="flex items-end justify-between">
          <p className="text-sm font-extrabold text-gray-900">Tenor</p>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-blue-700">{tenorDays}</p>
            <p className="text-sm font-semibold text-gray-600">Hari</p>
          </div>
        </div>

        <input
          type="range"
          min={1}
          max={120}
          value={tenorDays}
          onChange={(e) => setTenorDays(Number(e.target.value))}
          className="mt-4 w-full"
        />

        <div className="mt-2 flex justify-between text-xs font-semibold text-gray-500">
          <span>1 Hari</span>
          <span>120 Hari</span>
        </div>
      </div>
    </div>
  );
}
