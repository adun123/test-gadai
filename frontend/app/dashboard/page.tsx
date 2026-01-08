"use client";

// app/(dashboard)/page.tsx
import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import DocumentCard from "@/components/dashboard/DocumentAnalysis/DocumentCard";
import VehicleCard from "@/components/dashboard/VehicleAssessment/VehicleCard";
import PricingCard from "@/components/dashboard/ValuationPricing/PricingCard";

type VehicleCondition =
  | "Mulus (Grade A)"
  | "Normal (Grade B)"
  | "Banyak Lecet (Grade C)"
  | "Perlu Perbaikan (Grade D)";

type VehiclePayload = {
  brandModel?: string;
  year?: string;
  physicalCondition?: VehicleCondition;
  defects?: string[];
};

type VehicleAnalyzedInput = {
  brandModel?: string;
  year?: string;
  physicalCondition?: VehicleCondition;
  defects?: string[] | unknown;
};

export default function DashboardPage() {
  const [vehicle, setVehicle] = useState<VehiclePayload | null>(null);
const [scanDone, setScanDone] = useState(false);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Welcome back. Here is the latest valuation and risk analysis for your vehicle portfolio."
      />

      <DashboardGrid>
        <DocumentCard />

 <VehicleCard
          onAnalyzed={(v) => {
            const input = v as VehicleAnalyzedInput;

            const brandModel = (input?.brandModel || "").trim();
            const year = String(input?.year || "").trim();
            const defects = Array.isArray(input?.defects) ? (input.defects as string[]) : [];

            //  kalau ada output apapun (defect/year/brandModel), anggap scan sudah terjadi
            const gotSomething = !!brandModel || !!year || defects.length > 0;
            setScanDone(gotSomething);

            // jangan set null hanya karena brandModel kosong
            // biarkan vehicle tersimpan parsial supaya UI bisa bilang "scan done tapi blur"
            const normalized: VehiclePayload = {
              brandModel: brandModel || undefined,
              year: year || undefined,
              physicalCondition: input?.physicalCondition,
              defects,
            };

            // kalau bener-bener kosong semua (reset), baru null
            if (!gotSomething) {
              setVehicle(null);
              return;
            }

            setVehicle(normalized);
          }}
        />



        <PricingCard vehicleReady={scanDone} vehicle={vehicle ?? undefined} />
      </DashboardGrid>
    </div>
  );
}
