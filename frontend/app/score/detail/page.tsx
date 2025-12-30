"use client";

import React from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Lightbulb, 
  MapPin, 
  Package,
  ChevronRight
} from "lucide-react";

export default function ScoreDetailPage() {
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

  const getStatusConfig = (status: Status) => {
    switch (status) {
      case "APPROVED": return { color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: <CheckCircle2 className="w-5 h-5" /> };
      case "REVIEW": return { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: <AlertCircle className="w-5 h-5" /> };
      default: return { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: <XCircle className="w-5 h-5" /> };
    }
  };

  const config = getStatusConfig(data.status);

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm">
            <ArrowLeft size={18} /> Kembali
          </Link>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detail Analisis</span>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        
        {/* Header Summary Card */}
        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Visual Score Circle */}
            <div className="relative flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                <circle 
                  cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={364.4} 
                  strokeDashoffset={364.4 - (364.4 * data.score) / 100}
                  className={`${config.color} transition-all duration-1000 ease-out`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-gray-900">{data.score}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Skor</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold mb-3 ${config.bg} ${config.color} ${config.border}`}>
                {config.icon} {data.status}
              </div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2">{data.headline}</h1>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <MapPin size={14} className="text-gray-400" /> {data.region}
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <Package size={14} className="text-gray-400" /> {data.category}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Factors List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Analisis Faktor</h2>
            <span className="text-xs text-gray-400 font-medium">{data.factors.length} Faktor Dinilai</span>
          </div>
          
          <div className="grid gap-3">
            {data.factors.map((f, idx) => (
              <div key={idx} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-start gap-4 hover:border-blue-100 transition-colors">
                <div className={`mt-1 p-2 rounded-xl ${
                  f.impact === "POSITIF" ? "bg-green-50 text-green-600" : 
                  f.impact === "NEGATIF" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-400"
                }`}>
                  {f.impact === "POSITIF" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-gray-900 text-sm">{f.label}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                      f.impact === "POSITIF" ? "border-green-100 text-green-600 bg-green-50/50" : 
                      f.impact === "NEGATIF" ? "border-red-100 text-red-600 bg-red-50/50" : "border-gray-100 text-gray-500 bg-gray-50"
                    }`}>
                      {f.impact}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations Card */}
        <section className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-xl">
              <Lightbulb className="text-blue-100" size={20} />
            </div>
            <h2 className="text-lg font-bold">Rekomendasi Tindakan</h2>
          </div>
          
          <ul className="space-y-3">
            {data.recommendations.map((r, idx) => (
              <li key={idx} className="flex items-start gap-3 text-blue-50 text-sm leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/scan"
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-white text-blue-600 font-bold hover:bg-blue-50 transition-colors shadow-sm text-sm"
            >
              Lanjut Scan Barang <ChevronRight size={16} />
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center py-3.5 px-4 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-400 transition-colors text-sm"
            >
              Perbaiki Data
            </Link>
          </div>
        </section>

        {/* Technical Logs (Accordion-style feel) */}
        <details className="group border border-gray-200 rounded-2xl overflow-hidden bg-white">
          <summary className="list-none p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
            <span className="text-sm font-bold text-gray-600">Technical Debug Logs</span>
            <ChevronRight size={18} className="text-gray-400 group-open:rotate-90 transition-transform" />
          </summary>
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <pre className="text-[10px] font-mono text-gray-500 overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </details>

      </div>
    </main>
  );
}