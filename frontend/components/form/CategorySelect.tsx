import React from "react";

export type PawnCategory =
  | "AUTO"
  | "ELEKTRONIK"
  | "KENDARAAN"
  | "EMAS";

type CategorySelectProps = {
  value: PawnCategory;
  onChange: (value: PawnCategory) => void;
  disabled?: boolean;
};

export default function CategorySelect({
  value,
  onChange,
  disabled = false,
}: CategorySelectProps) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label style={{ fontWeight: 600 }}>
        Kategori Barang
      </label>

      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as PawnCategory)}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 10,
          border: "1px solid #ddd",
          backgroundColor: disabled ? "#f5f5f5" : "white",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <option value="AUTO">Auto (Deteksi AI)</option>
        <option value="ELEKTRONIK">Elektronik</option>
        <option value="KENDARAAN">Kendaraan</option>
        <option value="EMAS">Emas</option>
      </select>

      <small style={{ color: "#666", fontSize: 12 }}>
        Pilih <b>Auto</b> jika ingin kategori ditentukan oleh AI dari foto.
      </small>
    </div>
  );
}
