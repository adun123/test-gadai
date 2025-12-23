import React from "react";
import Link from "next/link";

export default function ScoreDetailPage() {
  // Dummy data (nanti diganti dari API / state global)
  type Status = "APPROVED" | "REVIEW" | "REJECTED";

    const data: {
    region: string;
    category: string;
    score: number;
    status: Status;
    headline: string;
    factors: { label: string; impact: "POSITIF" | "NETRAL" | "NEGATIF"; note: string }[];
    recommendations: string[];
    } = {
    region: "Jakarta Selatan",
    category: "AUTO",
    score: 62,
    status: "REVIEW",
    headline: "Perlu verifikasi tambahan (dokumen pendukung belum lengkap).",
    factors: [
        { label: "Kelengkapan dokumen", impact: "NEGATIF", note: "Slip gaji/SLIK belum diunggah." },
        { label: "Konsistensi lokasi", impact: "NETRAL", note: "Lokasi valid, tapi butuh detail cabang bila perlu." },
        { label: "Kesiapan scan barang", impact: "POSITIF", note: "Foto barang tersedia untuk proses AI berikutnya." },
    ],
    recommendations: [
        "Unggah minimal salah satu dokumen: slip gaji atau SLIK.",
        "Pastikan foto barang jelas (pencahayaan bagus, fokus, tanpa blur).",
        "Jika kategori tidak sesuai, ubah dari Auto ke kategori yang benar.",
    ],
    };


  const badgeClass =
    data.status === "APPROVED"
      ? "bg-green-100 text-green-800 border-green-200"
      : data.status === "REVIEW"
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-red-100 text-red-800 border-red-200";

  const impactPill = (impact: "POSITIF" | "NETRAL" | "NEGATIF") => {
    if (impact === "POSITIF") return "bg-green-50 border-green-200 text-green-700";
    if (impact === "NETRAL") return "bg-gray-50 border-gray-200 text-gray-700";
    return "bg-red-50 border-red-200 text-red-700";
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Detail Skor Kelayakan</h1>
          <p className="text-gray-600 mt-1">
            Rincian alasan skor untuk keputusan operasional & audit.
          </p>
        </div>

        <Link
          href="/"
          className="text-sm font-semibold underline text-gray-700 hover:text-gray-900"
        >
          Kembali
        </Link>
      </div>

      {/* Summary Card */}
      <section className="border rounded-2xl p-5 bg-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-600">Skor</p>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-extrabold">{data.score}</p>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badgeClass}`}>
                {data.status}
              </span>
            </div>
            <p className="mt-2 text-gray-800 font-semibold">{data.headline}</p>
          </div>

          <div className="text-right text-sm text-gray-600">
            <p>
              <span className="font-semibold text-gray-900">Lokasi:</span> {data.region}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Kategori:</span> {data.category}
            </p>
          </div>
        </div>
      </section>

      {/* Factors */}
      <section className="border rounded-2xl p-5 bg-white">
        <h2 className="text-lg font-extrabold">Faktor Penilaian</h2>
        <p className="text-sm text-gray-600 mt-1">
          Faktor yang mempengaruhi skor (positif/negatif/netral).
        </p>

        <div className="mt-4 space-y-3">
          {data.factors.map((f, idx) => (
            <div key={idx} className="flex items-start justify-between gap-4 border rounded-xl p-4">
              <div>
                <p className="font-bold text-gray-900">{f.label}</p>
                <p className="text-sm text-gray-600 mt-1">{f.note}</p>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${impactPill(
                  f.impact as any
                )}`}
              >
                {f.impact}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendations */}
      <section className="border rounded-2xl p-5 bg-white">
        <h2 className="text-lg font-extrabold">Saran Tindakan</h2>
        <p className="text-sm text-gray-600 mt-1">
          Biar kasus “Review” cepat naik kelas jadi “Approved”.
        </p>

        <ul className="mt-4 list-disc pl-5 space-y-2 text-gray-800">
          {data.recommendations.map((r, idx) => (
            <li key={idx}>{r}</li>
          ))}
        </ul>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/scan"
            className="w-full text-center py-3 px-4 rounded-xl bg-black text-white font-bold hover:opacity-90"
          >
            Lanjut Scan / Foto Barang
          </Link>

          <Link
            href="/"
            className="w-full text-center py-3 px-4 rounded-xl border border-gray-300 font-bold hover:bg-gray-50"
          >
            Perbaiki Input
          </Link>
        </div>
      </section>

      {/* Debug JSON (opsional tapi enak buat dev) */}
      <section className="border rounded-2xl p-5 bg-white">
        <h2 className="text-lg font-extrabold">Debug Output</h2>
        <p className="text-sm text-gray-600 mt-1">Sementara untuk frontend-only.</p>

        <pre className="mt-4 p-4 rounded-xl bg-gray-50 border overflow-x-auto text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      </section>
    </main>
  );
}
