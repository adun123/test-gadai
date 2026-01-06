"use client";

import { useState } from "react";
import type { Province } from "@/constants/provinces";
import { ChevronDown } from "lucide-react";

type Props = {
  vehicleReady: boolean;
  province: string;
  setProvince: (v: string) => void;
  provinces: readonly Province[];
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
  const [open, setOpen] = useState(false);

  const current = normalize(province);
  const isValid = provinces.includes(current as Province);
  const showWarn = current.length > 0 && !isValid;

  return (
    <div className={`${disabled ? "pointer-events-none opacity-50" : ""}`}>
      <label className="text-sm font-extrabold text-foreground">
        Provinsi
      </label>

      {/* Trigger */}
      <div className="relative mt-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={[
            "w-full rounded-2xl border bg-card px-4 py-3 text-left text-sm font-semibold shadow-sm",
            "flex items-center justify-between",
            showWarn ? "border-amber-300" : "border-input",
          ].join(" ")}
        >
          <span className={province ? "text-foreground" : "text-muted-foreground"}>
            {province || "Pilih provinsi…"}
          </span>

          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-border bg-card shadow-lg">
            {provinces.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setProvince(p);
                  setOpen(false);
                }}
                className={[
                  "w-full px-4 py-2 text-left text-sm font-semibold transition",
                  p === province
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent",
                ].join(" ")}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Estimasi harga untuk provinsi{" "}
        <span className="font-semibold text-foreground">
          {isValid ? current : "—"}
        </span>
      </p>

      {showWarn && (
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
          Provinsi tidak dikenali. Pilih salah satu dari daftar.
        </div>
      )}
    </div>
  );
}
