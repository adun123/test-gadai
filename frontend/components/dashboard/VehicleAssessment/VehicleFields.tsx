"use client";

export type VehicleCondition =
  | "Mulus (Grade A)"
  | "Normal (Grade B)"
  | "Banyak Lecet (Grade C)"
  | "Perlu Perbaikan (Grade D)";

export type VehicleForm = {
  brandModel: string;
  plateNumber: string;
  year: string;
  physicalCondition: VehicleCondition;
};

type Props = {
  value: VehicleForm;
  disabled?: boolean;
  onChange: (patch: Partial<VehicleForm>) => void;
};

export default function VehicleFields({ value, disabled, onChange }: Props) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Brand & Model</label>
          <input
            value={value.brandModel}
            onChange={(e) => onChange({ brandModel: e.target.value })}
            disabled={disabled}
            placeholder="Contoh: Honda Scoopy"
            className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm disabled:bg-muted"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Nomor Plat</label>
          <input
            value={value.plateNumber}
            onChange={(e) => onChange({ plateNumber: e.target.value })}
            disabled={disabled}
            placeholder="Contoh: B 1234 XYZ"
            className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm disabled:bg-muted"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Tahun</label>
          <input
            value={value.year}
            onChange={(e) => onChange({ year: e.target.value })}
            disabled={disabled}
            placeholder="Contoh: 2021"
            inputMode="numeric"
            className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm disabled:bg-muted"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Kondisi Fisik</label>
          <div className="relative">
            <select
              value={value.physicalCondition}
              onChange={(e) => onChange({ physicalCondition: e.target.value as VehicleCondition })}
              disabled={disabled}
              className="w-full appearance-none rounded-2xl border border-input bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm disabled:bg-muted"
            >
              <option value="Mulus (Grade A)">Mulus (Grade A)</option>
              <option value="Normal (Grade B)">Normal (Grade B)</option>
              <option value="Banyak Lecet (Grade C)">Banyak Lecet (Grade C)</option>
              <option value="Perlu Perbaikan (Grade D)">Perlu Perbaikan (Grade D)</option>
            </select>

            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
