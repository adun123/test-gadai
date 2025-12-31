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
  const base = "border border-border bg-card text-foreground";
  if (sev === "high") return "border-destructive/30 bg-destructive/10 text-destructive";
  if (sev === "medium") return "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
  if (sev === "low") return "border-border bg-muted text-muted-foreground";
  return base;
}

export default function DefectChips({ items, editable, onToggle }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-foreground">Defect Terdeteksi (AI)</p>
        <span className="text-xs font-semibold text-muted-foreground">
          {editable ? "Klik chip untuk toggle" : "Klik Edit untuk koreksi"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {items.length === 0 ? (
          <span className="text-xs text-muted-foreground">Belum ada defect terdeteksi.</span>
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

      <p className="mt-3 text-xs text-muted-foreground">
        Catatan: Ini PoC — output AI bisa salah. Pegawai boleh koreksi via Edit.
      </p>
    </div>
  );
}
