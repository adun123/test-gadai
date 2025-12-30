"use client";

// app/(dashboard)/page.tsx
import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import DocumentCard from "@/components/dashboard/DocumentAnalysis/DocumentCard";
import VehicleCard from "@/components/dashboard/VehicleAssessment/VehicleCard";
import PricingCard from "@/components/dashboard/ValuationPricing/PricingCard";
import ExportButton from "@/components/dashboard/ExportButton";

type VehicleCondition =
  | "Mulus (Grade A)"
  | "Normal (Grade B)"
  | "Banyak Lecet (Grade C)"
  | "Perlu Perbaikan (Grade D)";

type VehiclePayload = {
  brandModel?: string;
  year?: string;
  physicalCondition?: VehicleCondition;
};

export default function DashboardPage() {
  const [document, setDocument] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [vehicle, setVehicle] = useState<VehiclePayload | null>(null);

  const vehicleReady = !!vehicle?.brandModel;

  const exportData = {
    document,
    vehicle,
    pricing,
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Manage vehicle appraisals, credit checks, and pricing analytics."
      />

      <DashboardGrid>
        <DocumentCard onAnalyzed={setDocument} />

        <VehicleCard
          onAnalyzed={(v) => {
            const normalized: VehiclePayload = {
              brandModel: (v?.brandModel || "").trim(),
              year: (v?.year || "").toString().trim(),
              physicalCondition: v?.physicalCondition,
            };
            setVehicle(normalized);
          }}
        />

        <PricingCard vehicleReady={vehicleReady} vehicle={vehicle ?? undefined} onPricingCalculated={setPricing} />
      </DashboardGrid>

      <ExportButton data={exportData} disabled={!vehicleReady && !document} />
    </div>
  );
}
