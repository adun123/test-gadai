import React from "react";

type RegionInputProps = {
  value: string;
  onChange: (value: string) => void;

  label?: string;
  placeholder?: string;

  required?: boolean;
  disabled?: boolean;

  /**
   * Optional helper for showing validation error from parent form
   * (ex: "Lokasi wajib diisi")
   */
  error?: string;

  /**
   * Optional UI extras
   */
  hint?: string;
  onUseLastRegion?: () => void;
  lastRegionLabel?: string; // ex: "Jakarta Selatan"
};

export default function RegionInput({
  value,
  onChange,
  label = "Lokasi / Region",
  placeholder = "Contoh: Jakarta Selatan, Surabaya, dll",
  required = true,
  disabled = false,
  error,
  hint = "Gunakan format kota/kabupaten + kecamatan bila perlu (mis. Jakarta Selatan).",
  onUseLastRegion,
  lastRegionLabel,
}: RegionInputProps) {
  const isInvalid = Boolean(error);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={{ fontWeight: 600 }}>
          {label} {required ? <span aria-hidden="true">*</span> : null}
        </label>

        {onUseLastRegion && lastRegionLabel ? (
          <button
            type="button"
            onClick={onUseLastRegion}
            disabled={disabled}
            style={{
              border: "none",
              background: "transparent",
              textDecoration: "underline",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.6 : 1,
              fontSize: 12,
            }}
          >
            Pakai terakhir: {lastRegionLabel}
          </button>
        ) : null}
      </div>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? "region-error" : "region-hint"}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 10,
          border: `1px solid ${isInvalid ? "#d33" : "#ddd"}`,
          outline: "none",
        }}
      />

      {isInvalid ? (
        <div id="region-error" style={{ color: "#d33", fontSize: 12 }}>
          {error}
        </div>
      ) : (
        <div id="region-hint" style={{ color: "#666", fontSize: 12 }}>
          {hint}
        </div>
      )}
    </div>
  );
}
