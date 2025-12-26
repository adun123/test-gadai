"use client";

// app/(dashboard)/page.tsx
import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import DocumentCard from "@/components/dashboard/DocumentAnalysis/DocumentCard";
import VehicleCard from "@/components/dashboard/VehicleAssessment/VehicleCard";
import PricingCard from "@/components/dashboard/ValuationPricing/PricingCard";

type VehiclePayload = {
  brandModel?: string;
  year?: string;
  physicalCondition?: any; // boleh rapihin nanti pakai VehicleCondition
};


function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
        </div>

        <button
          type="button"
          className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Detail
        </button>
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}

function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 w-full rounded bg-gray-100" />
      ))}
      <div className="h-10 w-full rounded-xl bg-gray-100" />
    </div>
  );
}

export default function DashboardPage() {
  const [vehicleReady, setVehicleReady] = useState(false);
  const [vehicle, setVehicle] = useState<VehiclePayload>({});
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Manage vehicle appraisals, credit checks, and pricing analytics."
      />

      <DashboardGrid>
         <DocumentCard />

         <VehicleCard
          onAnalyzed={(v) => {
            
            setVehicleReady(!!v?.brandModel);
            setVehicle(v || {});
          }}
        />

        <PricingCard vehicleReady={vehicleReady} vehicle={vehicle} />

      </DashboardGrid>
    </div>
  );
}
