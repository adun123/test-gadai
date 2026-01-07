"use client";

import { useMemo, useState } from "react";

export type DefectItem = {
  id: string;
  label: string;
  severity?: "low" | "medium" | "high";
  selected: boolean;
};

type Props = {
  items: DefectItem[];
  editable: boolean;
  onToggle: (id: string) => void;
  onAdd?: (item: Omit<DefectItem, "id" | "selected"> & { selected?: boolean }) => void;
};

function chipTone(sev?: DefectItem["severity"]) {
  const base = "border border-border bg-card text-foreground";
  if (sev === "high") return "border-destructive/30 bg-destructive/10 text-destructive";
  if (sev === "medium") return "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
  if (sev === "low") return "border-border bg-muted text-muted-foreground";
  return base;
}
function dotTone(sev?: DefectItem["severity"], selected?: boolean) {
  if (!selected) return "bg-gray-300";
  if (sev === "high") return "bg-red-500";
  if (sev === "medium") return "bg-orange-500";
  if (sev === "low") return "bg-green-500";
  return "bg-gray-400";
}

function sevFromPick(pick: "Minor" | "Moderate" | "Major" | "Severe"): DefectItem["severity"] {
  if (pick === "Major" || pick === "Severe") return "high";
  if (pick === "Moderate") return "medium";
  return "low";
}

export default function DefectChips({ items, editable, onToggle, onAdd }: Props) {
  const [text, setText] = useState("");
  const [pick, setPick] = useState<"Minor" | "Moderate" | "Major" | "Severe">("Minor");

  const canAdd = useMemo(() => {
    const t = text.trim();
    if (!editable) return false;
    if (!t) return false;

    // prevent duplicate label (case-insensitive)
    const exists = items.some((d) => d.label.trim().toLowerCase() === t.toLowerCase());
    return !exists;
  }, [text, editable, items]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-foreground">Defect Terdeteksi (AI)</p>
        <span className="text-xs font-semibold text-muted-foreground">
          {editable ? "Klik chip untuk toggle / tambah manual" : "Klik Edit untuk koreksi"}
        </span>
      </div>

      {/* ✅ Add manual defect */}
      {editable && onAdd ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Tambah kerusakan manual… (contoh: "Ban botak")'
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/30"
          />

          <select
            value={pick}
            onChange={(e) => setPick(e.target.value as "Minor" | "Moderate" | "Major" | "Severe")}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
          >
            <option value="Minor">Minor</option>
            <option value="Moderate">Moderate</option>
            <option value="Major">Major</option>
           
          </select>

          <button
            type="button"
            disabled={!canAdd}
            onClick={() => {
              const label = text.trim();
              if (!label) return;

              onAdd({
                label,
                severity: sevFromPick(pick),
                selected: true,
              });

              setText("");
              setPick("Minor");
            }}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground disabled:opacity-50"
          >
            Tambah
          </button>
        </div>
      ) : null}

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
              <span className={["h-2 w-2 rounded-full", dotTone(d.severity, d.selected)].join(" ")} />
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
