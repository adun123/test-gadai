"use client";

import type { Province } from "@/constants/provinces";

type Props = {
  vehicleReady: boolean;
  province: string;
  setProvince: (v: string) => void;
  provinces: readonly Province[]; // readonly biar cocok dengan as const
};

function normalize(s: string) {
  return s.trim();
}

export default function PricingLocation({
  vehicleReady,
  province,
  setProvince,
  provinces,
}: Props) {
  const disabled = !vehicleReady;

  const current = normalize(province);
  const isValid = provinces.includes(current as Province);
  const showWarn = current.length > 0 && !isValid;

  return (
    <div className={`${vehicleReady ? "" : "pointer-events-none opacity-50"}`}>
      <label className="text-sm font-extrabold text-foreground">Provinsi</label>

      <div className="mt-1">
        <input
          list="province-list"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          placeholder="Ketik atau pilih provinsi…"
          className={[
            "w-full rounded-2xl border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm",
            "focus:border-ring focus:outline-none",
            showWarn ? "border-amber-300" : "border-input",
          ].join(" ")}
          aria-invalid={showWarn}
          disabled={disabled}
        />

        <datalist id="province-list">
          {provinces.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Estimasi harga untuk provinsi{" "}
        <span className="font-semibold text-foreground">
          {isValid ? current : "—"}
        </span>
      </p>

      {showWarn ? (
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
          Provinsi tidak dikenali. Pilih salah satu dari daftar.
        </div>
      ) : null}
    </div>
  );
}
