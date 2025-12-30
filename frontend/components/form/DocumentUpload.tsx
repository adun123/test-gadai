import React from "react";
import FileUpload from "../common/FileUpload";

type DocumentUploadProps = {
  salarySlip: File | null;
  onSalarySlipChange: (file: File | null) => void;

  slikDoc: File | null;
  onSlikDocChange: (file: File | null) => void;

  disabled?: boolean;
};

export default function DocumentUpload({
  salarySlip,
  onSalarySlipChange,
  slikDoc,
  onSlikDocChange,
  disabled = false,
}: DocumentUploadProps) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <h4 style={{ margin: 0 }}>Dokumen Pendukung (Opsional)</h4>
        <small style={{ color: "#666" }}>
          Isi jika diperlukan untuk analisis kelayakan nasabah.
        </small>
      </div>

      <FileUpload
        label="Slip Gaji"
        file={salarySlip}
        onChange={onSalarySlipChange}
        accept=".pdf,image/*"
        disabled={disabled}
      />

      <FileUpload
        label="Dokumen SLIK"
        file={slikDoc}
        onChange={onSlikDocChange}
        accept=".pdf,image/*"
        disabled={disabled}
      />
    </div>
  );
}
