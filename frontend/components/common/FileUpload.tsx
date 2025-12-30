import React from "react";

type FileUploadProps = {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;

  accept?: string; // contoh: "image/*" atau ".pdf,image/*"
  required?: boolean;
  disabled?: boolean;
  error?: string;
};

export default function FileUpload({
  label,
  file,
  onChange,
  accept = "image/*",
  required = false,
  disabled = false,
  error,
}: FileUploadProps) {
  const isInvalid = Boolean(error);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label style={{ fontWeight: 600 }}>
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </label>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          type="file"
          accept={accept}
          disabled={disabled}
          aria-invalid={isInvalid}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 10,
            border: `1px solid ${isInvalid ? "#d33" : "#ddd"}`,
            backgroundColor: disabled ? "#f5f5f5" : "white",
          }}
        />

        {file ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            Hapus
          </button>
        ) : null}
      </div>

      {file ? (
        <small style={{ color: "#444", fontSize: 12 }}>
          Dipilih: <b>{file.name}</b>
        </small>
      ) : (
        <small style={{ color: "#666", fontSize: 12 }}>
          {accept.includes("image") ? "Unggah foto yang jelas (depan/utama)." : "Unggah file."}
        </small>
      )}

      {isInvalid ? (
        <small style={{ color: "#d33", fontSize: 12 }}>{error}</small>
      ) : null}
    </div>
  );
}
