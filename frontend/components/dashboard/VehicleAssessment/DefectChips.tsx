"use client";

export type DefectItem = {
  id: string;
  label: string;
  severity?: "low" | "medium" | "high";
  selected: boolean;
};

type Props = {
  items: DefectItem[];
  editable: boolean; // hanya bisa toggle saat editMode
  onToggle: (id: string) => void;
};

function chipTone(sev?: DefectItem["severity"]) {
  const base = "border bg-white text-gray-800";
  if (sev === "high") return "border-red-200 bg-red-50 text-red-700";
  if (sev === "medium") return "border-yellow-200 bg-yellow-50 text-yellow-800";
  if (sev === "low") return "border-gray-200 bg-gray-50 text-gray-800";
  return base;
}

export default function DefectChips({ items, editable, onToggle }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-gray-900">Defect Terdeteksi (AI)</p>
        <span className="text-xs font-semibold text-gray-500">
          {editable ? "Klik chip untuk toggle" : "Klik Edit untuk koreksi"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {items.length === 0 ? (
          <span className="text-xs text-gray-500">Belum ada defect terdeteksi.</span>
        ) : (
          items.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => editable && onToggle(d.id)}
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold transition",
                chipTone(d.severity),
                d.selected ? "shadow-sm" : "opacity-50",
                editable ? "hover:opacity-100" : "cursor-default",
              ].join(" ")}
              aria-pressed={d.selected}
            >
              <span
                className={[
                  "h-2 w-2 rounded-full",
                  d.selected ? "bg-green-500" : "bg-gray-300",
                ].join(" ")}
              />
              {d.label}
            </button>
          ))
        )}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Catatan: Ini PoC — output AI bisa salah. Pegawai boleh koreksi via Edit.
      </p>
    </div>
  );
}
