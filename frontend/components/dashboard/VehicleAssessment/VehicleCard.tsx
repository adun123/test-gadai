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
};
type VehicleScanApiResponse = {
  success: boolean;
  document_type: "VEHICLE" | string;
  scanned_data: any;
  scanned_at: string;
  is_editable: boolean;
  error?: string;
};

function mapVehicleScanToUI(payload: any): { form: VehicleForm; notes: string; defects: DefectItem[] } {
  const s = payload ?? {};
  const vid = s.vehicle_identification ?? {};
  const pc = s.physical_condition ?? {};
  const cs = s.conditionScore ?? {};

  const brandModel = [vid.make, vid.model].filter(Boolean).join(" ").trim();
  const plateNumber = vid.license_plate ?? "";
  const year = vid.estimated_year ?? vid.year ?? "";

  // Map condition score (0.30-1.0) to UI grade labels
  const finalScore = cs.final_score ?? 1.0;
  const physicalCondition: VehicleCondition =
    finalScore >= 0.90 ? "Mulus (Grade A)"
      : finalScore >= 0.70 ? "Normal (Grade B)"
        : finalScore >= 0.50 ? "Banyak Lecet (Grade C)"
          : "Perlu Perbaikan (Grade D)";

  // Handle new defects format: array of objects with description and severity
  const defectsList = cs.defects_applied || pc.defects || [];
  const defects: DefectItem[] = defectsList.map((d: any, idx: number) => {
    const label = typeof d === "string" ? d : (d.description || "Defect");
    const severityRaw = typeof d === "string" ? label : (d.severity || "Minor");
    const lower = severityRaw.toLowerCase();

    const severity: DefectItem["severity"] =
      lower.includes("severe") ? "high"
        : lower.includes("major") ? "high"
          : lower.includes("moderate") ? "medium"
            : "low";

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
    notes: `AI confidence: ${typeof conf === "number" ? conf.toFixed(2) : "n/a"} • Condition: ${Math.round(finalScore * 100)}% • Processed ${s.images_processed ?? "?"} foto.`,
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
    if (tone === "blue") return `${base} border-blue-200 bg-blue-50/90 text-blue-700`;
    if (tone === "red") return `${base} border-red-200 bg-red-50/90 text-red-700`;
    return `${base} border-gray-200 bg-white/80 text-gray-700`;
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


      setForm(mapped.form);
      setNotes(mapped.notes);
      setDefects(mapped.defects);

      setState("done");
      onAnalyzed?.({
        brandModel: mapped.form.brandModel,
        year: mapped.form.year,
        physicalCondition: mapped.form.physicalCondition,
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





  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="text-primary">
            <Bike className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-card-foreground">Vehicle Assessment</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload foto motor → AI isi atribut → pegawai bisa koreksi (Edit).
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <input
              type="checkbox"
              checked={useMock}
              onChange={(e) => setUseMock(e.target.checked)}
              disabled={state === "uploading" || state === "processing"}
            />
            Use mock
          </label>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent"
          >
            Reset
          </button>
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
          onToggle={(id) =>
            setDefects((prev) =>
              prev.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d))
            )
          }
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
      </div>
    </section>
  );
}
