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

  const vehicleReady = !!vehicle?.brandModel;

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
    const brandModel = (v?.brandModel || "").trim();

    // kalau reset / kosong, bener-bener hapus kendaraan
    if (!brandModel) {
      setVehicle(null);
      return;
    }

    const input = v as VehicleAnalyzedInput;
    const defects = Array.isArray(input?.defects) ? input.defects : [];

    const normalized: VehiclePayload = {
      brandModel,
      year: String(v?.year || "").trim(),
      physicalCondition: v?.physicalCondition,
      defects,
    };

    setVehicle(normalized);
  }}
/>



        <PricingCard vehicleReady={vehicleReady} vehicle={vehicle ?? undefined} />
      </DashboardGrid>
    </div>
  );
}
