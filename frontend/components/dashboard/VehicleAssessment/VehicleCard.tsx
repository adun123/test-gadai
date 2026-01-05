"use client";

import { Bike } from "lucide-react";
import { useMemo, useState } from "react";
import VehicleImageUpload from "./VehicleImageUpload";
import VehicleFields, { VehicleForm, VehicleCondition } from "./VehicleFields";
import Notes from "./Notes";
import DefectChips, { DefectItem } from "./DefectChips";

type VehicleAnalyzedPayload = {
  brandModel: string;
  year: string;
  physicalCondition?: VehicleCondition;
  defects?: string[]; 
};

type VehicleScanApiResponse = {
  success: boolean;
  document_type: "VEHICLE" | string;
  scanned_data: any;
  scanned_at: string;
  is_editable: boolean;
  error?: string;
};
type Sev = "minor" | "moderate" | "major" | "severe" | "unknown";

function extractSeverity(text: string): Sev {
  const m = text.match(/\((minor|moderate|major)\)/i);
  if (!m) return "unknown";
  const s = m[1].toLowerCase();
  if (s === "minor") return "minor";
  if (s === "moderate") return "moderate";
  if (s === "major") return "major";
  return "unknown";
}


function computeFinalScoreFromDefects(defects: string[]): number {
  // pengurangan (dalam persen) sesuai tabel
  const deduction: Record<Sev, number> = {
    minor: 2,
    moderate: 5,
    major: 10,
    severe: 15,
    unknown: 2,
  };

  const totalDeduction = defects.reduce((sum, d) => sum + deduction[extractSeverity(d)], 0);
  const effectiveDeduction = Math.min(totalDeduction, 50);

  const scorePct = Math.max(100 - effectiveDeduction, 30); // 30..100
  return scorePct / 100; // balik ke 0.30..1.00 biar kompatibel dengan kode kamu
}


function mapVehicleScanToUI(payload: any): { form: VehicleForm; notes: string; defects: DefectItem[] } {
  const s = payload ?? {};
  const vid = s.vehicle_identification ?? {};
  const pc = s.physical_condition ?? {};
 

  const brandModel = [vid.make, vid.model].filter(Boolean).join(" ").trim();
  const plateNumber = vid.license_plate ?? "";
  const year = vid.estimated_year ?? vid.year ?? "";

  const cs = s.conditionScore ?? {}; // tetap support kalau backend suatu saat ngirim
  const rawDefects: string[] = Array.isArray(pc.defects) ? pc.defects : [];

const finalScore =
  typeof cs.final_score === "number"
    ? cs.final_score
    : rawDefects.length
      ? computeFinalScoreFromDefects(rawDefects)
      : (typeof s.confidence === "number" ? s.confidence : 0.85); // fallback terakhir

  const physicalCondition: VehicleCondition =
    finalScore >= 0.90 ? "Mulus (Grade A)"
      : finalScore >= 0.70 ? "Normal (Grade B)"
        : finalScore >= 0.50 ? "Banyak Lecet (Grade C)"
          : "Perlu Perbaikan (Grade D)";

  // Handle new defects format: array of objects with description and severity
  const defectsList = cs.defects_applied || pc.defects || [];
  const defects: DefectItem[] = defectsList.map((d: any, idx: number) => {
    const labelRaw = typeof d === "string" ? d : (d.description || "Defect");

    // 1) Ambil severity dari string mentah (labelRaw)
    const lowerRaw = labelRaw.toLowerCase();
    const severity: DefectItem["severity"] =
    lowerRaw.includes("(severe)") ? "high" // sementara treat severe = high (atau extend jadi "severe")
      : lowerRaw.includes("(major)") ? "high"
        : lowerRaw.includes("(moderate)") ? "medium"
          : lowerRaw.includes("(minor)") ? "low"
            : "low";
// default

    // 2) Label buat UI dibersihkan (tanpa "(Minor/Moderate/Major)")
    const label = labelRaw.replace(/\s*\((Minor|Moderate|Major)\)\s*/i, "").trim();

    return { id: `ai-${idx}`, label, severity, selected: true };
  });



  const conf = typeof s.confidence === "number" ? s.confidence : undefined;

  return {
    form: {
      brandModel: brandModel || "",
      plateNumber,
      year,
      physicalCondition,
    },
    notes: `AI confidence: ${typeof conf === "number" ? conf.toFixed(2) : "n/a"} •  Processed ${s.images_processed ?? "?"} foto.`,
    defects,
  };
}


type State = "idle" | "uploading" | "processing" | "done" | "error";

function mockAiDetect(): { form: VehicleForm; notes: string; defects: DefectItem[] } {
  const variants: { form: VehicleForm; notes: string; defects: DefectItem[] }[] = [
    {
      form: { brandModel: "Honda Scoopy", plateNumber: "B 1234 XYZ", year: "2021", physicalCondition: "Mulus (Grade A)" },
      notes: "AI mendeteksi gores ringan di body kanan. Silakan koreksi manual bila perlu.",
      defects: [
        { id: "d1", label: "Lecet halus", severity: "low", selected: true },
        { id: "d2", label: "Baret body", severity: "medium", selected: true },
      ],
    },
    {
      form: { brandModel: "Yamaha NMAX", plateNumber: "D 9812 AB", year: "2020", physicalCondition: "Normal (Grade B)" },
      notes: "AI mendeteksi ban agak aus dan baret tipis di cover samping.",
      defects: [
        { id: "d3", label: "Ban aus", severity: "medium", selected: true },
        { id: "d4", label: "Baret tipis", severity: "low", selected: true },
      ],
    },
    {
      form: { brandModel: "Honda Vario 125", plateNumber: "L 7711 CD", year: "2019", physicalCondition: "Banyak Lecet (Grade C)" },
      notes: "AI mendeteksi lecet besar dan lampu depan terlihat retak.",
      defects: [
        { id: "d5", label: "Lecet besar", severity: "high", selected: true },
        { id: "d6", label: "Lampu retak", severity: "high", selected: true },
        { id: "d7", label: "Spion goyang", severity: "medium", selected: true },
      ],
    },
  ];

  return variants[Math.floor(Math.random() * variants.length)];
}


export default function VehicleCard({

  onAnalyzed,
}: {
  onAnalyzed?: (v: VehicleAnalyzedPayload) => void;
}) {
  console.log("VehicleCard rendered");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [defects, setDefects] = useState<DefectItem[]>([]);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleForm>({
    brandModel: "",
    plateNumber: "",
    year: "",
    physicalCondition: "Mulus (Grade A)",

  });
  const [notes, setNotes] = useState("");
  const [useMock, setUseMock] = useState(true);
  const [lastFiles, setLastFiles] = useState<File[]>([]);


  // ✅ penting: setelah AI isi, field defaultnya terkunci (read-only) sampai user klik Edit
  const [editMode, setEditMode] = useState(false);

  const badge = useMemo(() => {
    if (state === "idle") return null;
    if (state === "uploading") return { text: "Uploading…", tone: "gray" as const };
    if (state === "processing") return { text: "AI Detecting…", tone: "blue" as const };
    if (state === "done") return { text: "Analyzed", tone: "green" as const };
    return { text: "Error", tone: "red" as const };
  }, [state]);

  function badgeClass(tone: "gray" | "blue" | "green" | "red") {
    const base =
      "absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold border backdrop-blur";
    if (tone === "green") return `${base} border-green-200 bg-green-50/90 text-green-700`;
    if (tone === "blue") return `${base} border-primary/30 bg-primary/10 text-primary`;
    if (tone === "red") return `${base} border-red-200 bg-red-50/90 text-red-700`;
    return `${base} border-gray-200 bg-white/80 text-gray-700`;
  }

  function toPricingDefects(items: DefectItem[]): string[] {
    const sevMap: Record<NonNullable<DefectItem["severity"]>, string> = {
      low: "Minor",
      medium: "Moderate",
      high: "Major", // kalau nanti ada Severe, bisa di-extend
    };

    return items
      .filter((d) => d.selected)
      .map((d) => `${d.label} (${sevMap[d.severity ?? "low"] ?? "Minor"})`);
  }

  //integrasi handleupload
  async function handleUpload(files: File[]) {

    console.log("VehicleCard handleUpload called:", files?.map(f => f.name));

    setErrorMsg(null);
    setEditMode(false);
    setState("uploading");

    try {
      if (!files || files.length === 0) throw new Error("Pilih minimal 1 foto.");

      const limited = files.slice(0, 5);
      setLastFiles(limited);

      // preview pakai foto pertama
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      const preview = URL.createObjectURL(limited[0]);
      setImageUrl(preview);

      setState("processing");

      const formData = new FormData();
      limited.forEach((f) => formData.append("images", f)); // HARUS "images"

      const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const url = `${base}/api/scan/vehicle${useMock ? "?mock=true" : ""}`;

      const res = await fetch(url, { method: "POST", body: formData });
      const data = (await res.json()) as VehicleScanApiResponse;

      if (!res.ok) {
        throw new Error(`Request failed (HTTP ${res.status})`);
      }

      const normalized = normalizeVehicleScan(data);
      if (!normalized.ok) {
        throw new Error(normalized.error || "Vehicle scan failed");
      }

      const mapped = mapVehicleScanToUI(normalized.payload);
      const pricingDefects = toPricingDefects(mapped.defects);

      setForm(mapped.form);
      setNotes(mapped.notes);
      setDefects(mapped.defects);

      setState("done");
      onAnalyzed?.({
        brandModel: mapped.form.brandModel,
        year: mapped.form.year,
        physicalCondition: mapped.form.physicalCondition,
        defects: pricingDefects,
      });
    } catch (e) {
      setState("error");
      setErrorMsg(e instanceof Error ? e.message : "Gagal memproses gambar");
    }
  }

  function normalizeVehicleScan(data: VehicleScanApiResponse): { ok: boolean; payload: any; error?: string } {
    // Case A: wrapper
    if ("success" in data) {
      return {
        ok: !!data.success,
        payload: data.scanned_data,
        error: data.error,
      };
    }

    // Case B: raw (README style)
    if ((data as any)?.vehicle_identification || (data as any)?.physical_condition) {
      return { ok: true, payload: data };
    }

    return { ok: false, payload: null, error: (data as any)?.error || "Invalid vehicle scan response" };
  }


  //integrasi reset
  function reset() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setState("idle");
    setErrorMsg(null);
    setEditMode(false);
    setForm({ brandModel: "", plateNumber: "", year: "", physicalCondition: "Mulus (Grade A)" });
    setNotes("");
    setDefects([]);
    onAnalyzed?.({
      brandModel: "",
      year: "",
      physicalCondition: undefined,
      defects: [],
    });


  }
  const isBusy = state === "uploading" || state === "processing";
  const hasResult = state === "done";

  //integrasi reprocess
  async function reprocess() {
    if (lastFiles.length === 0 || isBusy) return;
    setEditMode(false);
    await handleUpload(lastFiles);
  }


function scoreToVehicleCondition(score: number): VehicleCondition {
  if (score >= 0.9) return "Mulus (Grade A)";
  if (score >= 0.7) return "Normal (Grade B)";
  if (score >= 0.5) return "Banyak Lecet (Grade C)";
  return "Perlu Perbaikan (Grade D)";
}


function applyDefects(next: DefectItem[]) {
  setDefects(next);

  const selectedStrings = toPricingDefects(next);
  const score = computeFinalScoreFromDefects(selectedStrings);
  const newCond = scoreToVehicleCondition(score);

  // ⬇️ ini kunci turunnya grade
  setForm((prev) =>
    prev.physicalCondition === newCond
      ? prev
      : { ...prev, physicalCondition: newCond }
  );

  setNotes((old) =>
    old.replace(/Condition:\s*\d+%/i, `Condition: ${Math.round(score * 100)}%`)
  );

  onAnalyzed?.({
    brandModel: form.brandModel,
    year: form.year,
    physicalCondition: newCond, // ⬅BUKAN yang lama
    defects: selectedStrings,
  });
}



  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Bike className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Vehicle Assessment</h2>
              <p className="text-sm text-muted-foreground">Physical condition analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Image upload input */}
        <VehicleImageUpload onUpload={handleUpload} disabled={isBusy} />

        {/* Image area */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
          {badge ? <div className={badgeClass(badge.tone)}>{badge.text}</div> : null}

          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Vehicle" className="h-52 w-full object-cover" />
          ) : (
            <div className="grid h-52 place-items-center px-6 text-center">
              <div>
                <p className="text-sm font-extrabold text-foreground">Preview Foto Kendaraan</p>

              </div>
            </div>
          )}
        </div>

        {errorMsg ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
            {errorMsg}
          </div>
        ) : null}






        {/* Header kecil untuk hasil + tombol edit */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-extrabold tracking-wider text-muted-foreground">AI GENERATED FIELDS</p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reprocess}
              disabled={!imageUrl || isBusy}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-accent disabled:opacity-50"
            >
              Re-process
            </button>

            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              disabled={!hasResult}
              className="rounded-xl bg-primary px-3 py-2 text-xs font-extrabold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {editMode ? "Selesai" : "Edit"}
            </button>
          </div>
        </div>

        <VehicleFields
          value={form}
          disabled={isBusy || !editMode}
          onChange={(patch) => {
            setForm((prev) => {
              const next = { ...prev, ...patch };
              // realtime update pricing saat edit
              onAnalyzed?.({
                brandModel: next.brandModel,
                year: next.year,
                physicalCondition: next.physicalCondition,
              });
              return next;
            });
          }}
        />


    <DefectChips
      items={defects}
      editable={!isBusy && editMode}
      onToggle={(id) => {
        const next = defects.map((d) =>
          d.id === id ? { ...d, selected: !d.selected } : d
        );
        applyDefects(next);
      }}
      onAdd={({ label, severity, selected }) => {
        const next = [
          ...defects,
          {
            id: `manual-${Date.now()}`,
            label,
            severity,
            selected: selected ?? true,
          },
        ];
        applyDefects(next);
      }}
    />





        <Notes
          value={notes}
          disabled={isBusy || !editMode}
          onChange={setNotes}
        />


        {!hasResult ? (
          <p className="text-xs text-muted-foreground">
            Hasil akan muncul setelah foto diunggah dan diproses AI.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Catatan: PoC — output AI bersifat estimasi, verifikasi manual tetap wajib.
          </p>
        )}

        <div className="flex justify-end pt-2 border-t border-border/50">
          <label className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={useMock}
              onChange={(e) => setUseMock(e.target.checked)}
              disabled={state === "uploading" || state === "processing"}
              className="h-3 w-3 rounded border-border text-primary focus:ring-primary accent-primary"
            />
            Use Mock Data
          </label>
        </div>
      </div>
    </section>
  );
}
