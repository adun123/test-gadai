"use client";

import { useRef, useState } from "react";

type Props = {
  onUpload: (file: File) => void | Promise<void>;
  disabled?: boolean;
};

export default function VehicleImageUpload({ onUpload, disabled }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const camRef = useRef<HTMLInputElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        disabled={disabled}
        className="w-full rounded-2xl border bg-white px-4 py-3 text-left text-sm font-bold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
      >
        Upload / Ambil Foto Motor
        <span className="mt-1 block text-xs font-medium text-gray-500">
          JPG/PNG — kamera tersedia untuk mobile
        </span>
      </button>

      {menuOpen ? (
        <div className="absolute left-0 right-0 z-10 mt-2 rounded-2xl border bg-white p-2 shadow-lg">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
          >
            Upload File
            <span className="mt-1 block text-xs font-medium text-gray-500">Pilih dari perangkat</span>
          </button>

          <button
            type="button"
            onClick={() => camRef.current?.click()}
            disabled={disabled}
            className="mt-1 w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
          >
            Ambil Foto
            <span className="mt-1 block text-xs font-medium text-gray-500">Gunakan kamera</span>
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="mt-1 w-full rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Batal
          </button>
        </div>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.currentTarget.value = "";
          setMenuOpen(false);
        }}
      />

      <input
        ref={camRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.currentTarget.value = "";
          setMenuOpen(false);
        }}
      />
    </div>
  );
}
