"use client";

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

  async function handleUpload(file: File) {
    setErrorMsg(null);
    setEditMode(false); // ✅ setelah upload, defaultnya read-only dulu
    setState("uploading");

    try {
      // preview
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      const url = URL.createObjectURL(file);
      setImageUrl(url);

      await new Promise((r) => setTimeout(r, 500));
      setState("processing");

      // mock AI detect
      await new Promise((r) => setTimeout(r, 1000));
      const result = mockAiDetect();

      setForm(result.form);
      
      setNotes(result.notes);
      setDefects(result.defects);

      setState("done");
      onAnalyzed?.({
        brandModel: result.form.brandModel,
        year: result.form.year,
        physicalCondition: result.form.physicalCondition,
        });

    } catch (e) {
      setState("error");
      setErrorMsg(e instanceof Error ? e.message : "Gagal memproses gambar");
    }
  }

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

  function reprocess() {
    if (!imageUrl) return;
    setEditMode(false);
    setState("processing");
    setTimeout(() => {
      const result = mockAiDetect();
      setForm(result.form);
      setNotes(result.notes);
      setDefects(result.defects);

      setState("done");
      onAnalyzed?.({
        brandModel: result.form.brandModel,
        year: result.form.year,
        physicalCondition: result.form.physicalCondition,
        });
    }, 900);
  }

  const isBusy = state === "uploading" || state === "processing";
  const hasResult = state === "done";

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold">Vehicle Assessment</h2>
          <p className="mt-1 text-sm text-gray-600">
            Upload foto motor → AI isi atribut → pegawai bisa koreksi (Edit).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {/* Image area */}
        <div className="relative overflow-hidden rounded-2xl border bg-gray-50">
          {badge ? <div className={badgeClass(badge.tone)}>{badge.text}</div> : null}

          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Vehicle" className="h-52 w-full object-cover" />
          ) : (
            <div className="grid h-52 place-items-center px-6 text-center">
              <div>
                <p className="text-sm font-extrabold text-gray-900">Upload Foto Motor</p>
                <p className="mt-1 text-xs text-gray-500">Untuk PoC, cukup 1 foto samping yang jelas.</p>
              </div>
            </div>
          )}
        </div>

        {errorMsg ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMsg}
          </div>
        ) : null}

        <VehicleImageUpload onUpload={handleUpload} disabled={isBusy} />

        {/* Header kecil untuk hasil + tombol edit */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-extrabold tracking-wider text-gray-500">AI GENERATED FIELDS</p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reprocess}
              disabled={!imageUrl || isBusy}
              className="rounded-xl border bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Re-process
            </button>

            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              disabled={!hasResult}
              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-extrabold text-white hover:opacity-90 disabled:opacity-50"
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
          <p className="text-xs text-gray-500">
            Hasil akan muncul setelah foto diunggah dan diproses AI.
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            Catatan: PoC — output AI bersifat estimasi, verifikasi manual tetap wajib.
          </p>
        )}
      </div>
    </section>
  );
}
