"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { generateAssessmentPDF } from "@/lib/pdf-generator";
import PricingHeader from "./PricingHeader";
import PricingGating from "./PricingGating";
import PricingAlerts from "./PricingAlerts";
import PricingLocation from "./PricingLocation";
import TenorSlider from "./TenorSlider";
import PricingBreakdown from "./PricingBreakdown";
import PawnSimulation from "./PawnSimulation";
import PricingFooter from "./PricingFooter";
import { VALID_PROVINCES } from "../../../constants/provinces";


type VehicleCondition =
  | "Mulus (Grade A)"
  | "Normal (Grade B)"
  | "Banyak Lecet (Grade C)"
  | "Perlu Perbaikan (Grade D)";

type Props = {
  vehicleReady: boolean;
  vehicle?: {
    brandModel?: string;
    year?: string;
    physicalCondition?: VehicleCondition;
    defects?: Array<{ description: string; severity: "Minor" | "Moderate" | "Major" | string }> | string[];
  };
  onPricingCalculated?: (data: any) => void;
};



type PawnProduct = "reguler" | "harian";

// === API shapes (ikuti calculate.js kamu) ===
type PricingApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    vehicle?: {
      make?: string;
      model?: string;
      year?: number;
      vehicle_type?: string;
      province?: string;
    };
    condition?: any;
    pricing?: {
      market_price?: number;
      price_range?: { low?: number; high?: number } | null;
      price_confidence?: "HIGH" | "MEDIUM" | "LOW" | string;
      data_points?: number;
      effective_collateral_value?: number;
      appraisal_value?: number;
      tenor_days?: number;
    };
    breakdown?: any;
    calculated_at?: string;
  };
  error?: string;
  errors?: any[];
};

type PawnApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    input?: {
      appraisal_value: number;
      loan_amount: number;
      period_days: number;
    };
    products?: any; // comparePawnProducts output
    calculated_at?: string;
  };
  error?: string;
  errors?: any[];
};

type UiBreakdown = {
  basePrice: number; // market_price
  adjustment: number; // (asset_value - base_market_price) (dari breakdown)
  assetValue: number; // breakdown.pricing_breakdown.asset_value
  confidence: number; // mapped dari confidence_level score (0..1) fallback
  confidenceLabel?: string;
  priceRange?: { low?: number; high?: number } | null;
  dataPoints?: number;
  appraisalValue?: number;
  effectiveCollateralValue?: number;
  tenorDays?: number;
};
function Spinner({ label }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      {label ? <span className="text-xs font-semibold text-muted-foreground">{label}</span> : null}
    </div>
  );
}

function rupiah(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatIDDate(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

// Export Section Component
type ExportSectionProps = {
  vehicle?: {
    brandModel?: string;
    year?: string;
    physicalCondition?: string;
  };
  breakdown?: UiBreakdown | null;
  pawnSim?: {
    maxDisbursement?: number;
    sewaModal?: number;
    dueDate?: Date;
  } | null;
  location: string;
  tenorDays: number;
  product: PawnProduct;
};

function ExportSection({ vehicle, breakdown, pawnSim, location, tenorDays, product }: ExportSectionProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);

      // Build export data with only non-empty values
      const exportData = {
        vehicle: vehicle?.brandModel ? vehicle : undefined,
        pricing: breakdown ? {
          basePrice: breakdown.basePrice,
          adjustment: breakdown.adjustment,
          assetValue: breakdown.assetValue,
          confidence: breakdown.confidence,
          confidenceLabel: breakdown.confidenceLabel,
          appraisalValue: breakdown.appraisalValue,
          effectiveCollateralValue: breakdown.effectiveCollateralValue,
          location: location || undefined,
          tenorDays,
          product,
          ...(pawnSim?.maxDisbursement && { maxDisbursement: pawnSim.maxDisbursement }),
          ...(pawnSim?.sewaModal && { sewaModal: pawnSim.sewaModal }),
          ...(pawnSim?.dueDate && { dueDate: pawnSim.dueDate }),
        } : undefined,
      };

      await generateAssessmentPDF(exportData);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-4 border-t border-border">
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        Export Hasil Analytics
      </button>
    </div>
  );
}

function mapVehicleConditionToGrade(cond?: VehicleCondition): "Excellent" | "Good" | "Fair" | "Poor" {
  if (!cond) return "Good";
  if (cond.includes("Grade A")) return "Excellent";
  if (cond.includes("Grade B")) return "Good";
  if (cond.includes("Grade C")) return "Fair";
  return "Poor";
}

function splitBrandModel(brandModel?: string): { make: string; model: string } {
  const raw = typeof brandModel === "string" ? brandModel.trim() : ""; // ✅ guard
  if (!raw) return { make: "", model: "" };

  const parts = raw.split(/\s+/);
  if (parts.length === 1) return { make: parts[0], model: parts[0] };

  const make = parts[0];
  const model = parts.slice(1).join(" ");
  return { make, model };
}


function parseProvince(location: string): string {
  // UI kamu input "Jakarta Selatan, DKI Jakarta"
  // backend minta "province"
  const pieces = location.split(",").map((x) => x.trim()).filter(Boolean);
  if (pieces.length >= 2) return pieces[1];
  return pieces[0] || "Indonesia";

}

function confidenceToNumber(label?: string): number {
  // fallback kalau backend belum kasih score
  if (!label) return 0.75;
  const x = label.toLowerCase();
  if (x.includes("high")) return 0.9;
  if (x.includes("medium")) return 0.75;
  return 0.6;
}





function mapPricingResponseToUi(resp: PricingApiResponse): UiBreakdown | null {
  if (!resp?.success || !resp.data) return null;

  const pricing = resp.data.pricing ?? {};
  const breakdown = resp.data.breakdown ?? {};
  const pb = breakdown.pricing_breakdown ?? {};
  const coll = breakdown.collateral_calculation ?? {};

  const baseMarket = Number(pb.base_market_price?.value ?? pricing.market_price ?? 0);

  const condAdj = Number(pb.condition_adjustment?.value ?? 0);

  // kalau backend sudah kasih asset_value, pakai. Kalau tidak, hitung dari base+adj
  const assetValueRaw = pb.asset_value;
  const assetValue =
    Number.isFinite(Number(assetValueRaw)) && Number(assetValueRaw) !== 0
      ? Number(assetValueRaw)
      : baseMarket + condAdj;

  // adjustment: prioritaskan condition_adjustment (bukan selisih)
  const adjustment =
    Number.isFinite(condAdj) && condAdj !== 0
      ? condAdj
      : (baseMarket && assetValue ? assetValue - baseMarket : 0);

  const confScore =
    typeof breakdown?.confidence_level?.score === "number"
      ? breakdown.confidence_level.score
      : confidenceToNumber(pricing.price_confidence);

  return {
    basePrice: baseMarket,
    adjustment,
    assetValue,
    confidence: Math.max(0.6, Math.min(0.97, confScore)),
    confidenceLabel: breakdown?.confidence_level?.level ?? pricing.price_confidence ?? "—",
    priceRange: pb.base_market_price?.range ?? pricing.price_range ?? null,
    dataPoints: pb.base_market_price?.data_points ?? pricing.data_points,
    appraisalValue: coll.appraisal_value ?? pricing.appraisal_value,
    effectiveCollateralValue: coll.effective_collateral_value ?? pricing.effective_collateral_value,
    tenorDays: coll.tenor_days ?? pricing.tenor_days,
  };
}


export default function PricingCard({ vehicleReady, vehicle, onPricingCalculated }: Props) {
  const [location, setLocation] = useState("Jakarta Selatan, DKI Jakarta");
  const [tenorDays, setTenorDays] = useState(30);
  const [product, setProduct] = useState<PawnProduct>("reguler");

  const [useMock, setUseMock] = useState(false);


  const [province, setProvince] = useState<string>("Jawa Barat"); 

  const [state, setState] = useState<"idle" | "processing" | "done" | "error">("idle");
  const isLoading = state === "processing";
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [pricing, setPricing] = useState<UiBreakdown | null>(null);

  const [pawnState, setPawnState] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [pawnError, setPawnError] = useState<string | null>(null);
  const [pawnResp, setPawnResp] = useState<PawnApiResponse | null>(null);


  const debounceRef = useRef<number | null>(null);

 
  const safeBrandModel =
    typeof vehicle?.brandModel === "string" ? vehicle.brandModel : "";

  const makeModel = useMemo(() => splitBrandModel(safeBrandModel), [safeBrandModel]);

  const yearNum = useMemo(() => {
    const y = Number(vehicle?.year);
    return Number.isFinite(y) ? y : undefined;
  }, [vehicle?.year]);

  const overallGrade = useMemo(() => mapVehicleConditionToGrade(vehicle?.physicalCondition), [vehicle?.physicalCondition]);
  const [defects, setDefects] = useState<string[]>([]);

  const canCallPricing = vehicleReady && !!makeModel.make && !!makeModel.model;
  

async function fetchPricing() {
  if (!canCallPricing) return;

  setErrorMsg(null);
  setState("processing");

  try {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    const url = `${base}/api/calculate/pricing${useMock ? "?mock=true" : ""}`;

    const body = {
      vehicle_identification: {
        make: makeModel.make,
        model: makeModel.model,
        year: yearNum,
        vehicle_type: "Matic",
      },
      physical_condition: {
        overall_grade: overallGrade,
        defects, // ✅ ini penting
      },
      province,
      tenor_days: tenorDays,
    };
 
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });


    const data = (await res.json()) as PricingApiResponse;

 

    console.log("RAW pricing response:", data);
    console.log("RAW breakdown.pricing_breakdown:", data?.data?.breakdown?.pricing_breakdown);
    console.log("RAW condition_adjustment:", data?.data?.breakdown?.pricing_breakdown?.condition_adjustment);
    console.log("DEFECTS SENT:", defects);

    if (!res.ok || !data.success) {
      const msg =
        data?.error ||
        (Array.isArray(data?.errors) ? data.errors?.[0]?.msg : null) ||
        `Request failed (HTTP ${res.status})`;
      throw new Error(msg);
    }
    const mapped = mapPricingResponseToUi(data);
    
    console.log("PB:", data?.data?.breakdown?.pricing_breakdown);
console.log("COND:", data?.data?.breakdown?.pricing_breakdown?.condition_adjustment);

    console.log("MAPPED UI breakdown:", mapped);
    setPricing(mapped);

    setPricing(mapPricingResponseToUi(data));
    
    setState("done");
  } catch (e) {
    setState("error");
    setErrorMsg(e instanceof Error ? e.message : "Gagal menghitung pricing");
    setPricing(null);
  }
}

  async function fetchPawn(appraisalValue: number) {
    setPawnError(null);
    setPawnState("processing");

    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const url = `${base}/api/calculate/pawn${useMock ? "?mock=true" : ""}`;

      // loan_amount: di UI sekarang kamu belum input manual, jadi default = appraisal
      const body = {
        appraisal_value: appraisalValue,
        loan_amount: appraisalValue,
        tenor_days: tenorDays,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as PawnApiResponse;

      if (!res.ok || !data.success) {
        const msg =
          data?.error ||
          (Array.isArray(data?.errors) ? data.errors?.[0]?.msg : null) ||
          `Request failed (HTTP ${res.status})`;
        throw new Error(msg);
      }

      setPawnResp(data);
      setPawnState("done");
    } catch (e) {
      setPawnState("error");
      setPawnError(e instanceof Error ? e.message : "Gagal simulasi gadai");
      setPawnResp(null);
    }
  }

  useEffect(() => {
  const raw = (vehicle as any)?.defects;

  if (!raw) {
    setDefects([]);
    return;
  }

  // kalau array string udah "desc (Severity)"
  if (Array.isArray(raw) && typeof raw[0] === "string") {
    setDefects(raw as string[]);
    return;
  }

  // kalau array object {description, severity}
  if (Array.isArray(raw)) {
    const formatted = raw
      .map((d: any) => {
        const desc = d?.description ?? d?.label ?? "";
        const sev = d?.severity ?? "Minor";
        return desc ? `${desc} (${sev})` : null;
      })
      .filter(Boolean) as string[];

    setDefects(formatted);
  }
}, [vehicle]);

  // Auto-call pricing on changes (debounced)
  useEffect(() => {
    if (!canCallPricing) {
      setPricing(null);
      setState("idle");
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      fetchPricing();
    }, 450);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCallPricing, province, makeModel.make, makeModel.model, yearNum, overallGrade,defects, tenorDays, useMock]);

  // Auto-call pawn after pricing ready (whenever appraisal/tenor changes)
  useEffect(() => {
    const appraisal = pricing?.appraisalValue;
    if (!vehicleReady || !appraisal) {
      setPawnResp(null);
      setPawnState("idle");
      return;
    }
    fetchPawn(appraisal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricing?.appraisalValue, tenorDays, useMock, vehicleReady]);


  useEffect(() => {
    if (product === "harian") {
      setTenorDays((v) => Math.min(Math.max(v, 1), 60));
    }
  }, [product, setTenorDays]);

  


  const breakdown = pricing;

  const confidenceText = breakdown ? `${Math.round(breakdown.confidence * 100)}%` : "—";
  const isBusy = state === "processing" || pawnState === "processing";

  // UI helper: ambil angka produk dari response comparePawnProducts (kalau beda struktur, tetep aman fallback)
  const pawnSim = useMemo(() => {
    if (!pawnResp?.data?.products || !breakdown?.appraisalValue) return null;

    const products = pawnResp.data.products;
    const key = product === "reguler" ? "regular" : "daily";
    const p = products?.[key];

    // Support both old (snake_case) and new (camelCase) API response formats
    const maxLoan = p?.max_loan_amount ?? p?.max_loan_amount ?? pawnResp.data.input?.loan_amount ?? 0;
    const sewaModal = p?.sewaModal?.amount ?? p?.sewa_modal?.sewa_modal_amount ?? 0;

    // due date dari schedule (kalau ada) atau tenorDays
    const dueDateStr = p?.schedule?.dueDate ?? p?.schedule?.due_date;
    const due = dueDateStr ? new Date(dueDateStr) : addDays(new Date(), tenorDays);

    return {
      appraisal: breakdown.appraisalValue,
      maxDisbursement: maxLoan,
      sewaModal,
      dueDate: due, // ✅ Date
    };

  }, [pawnResp, product, breakdown?.appraisalValue, tenorDays]);

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <PricingHeader
        useMock={useMock}
        setUseMock={setUseMock}
        isBusy={isBusy}
        isLoading={isLoading}
        breakdown={breakdown}
      />

      <div className="space-y-4 p-5">
        <PricingGating vehicleReady={vehicleReady} />

        <PricingAlerts errorMsg={errorMsg} isLoading={isLoading} />

      <PricingLocation
        vehicleReady={vehicleReady}
        province={province}
        setProvince={setProvince}
        provinces={VALID_PROVINCES}
      />




        <PricingBreakdown vehicleReady={vehicleReady} breakdown={breakdown} state={state} rupiah={rupiah} />

        <TenorSlider
          vehicleReady={vehicleReady}
          product={product}
          tenorDays={tenorDays}
          setTenorDays={setTenorDays}
        />

       
        <PawnSimulation
          vehicleReady={vehicleReady}
          pawnError={pawnError}
          breakdown={breakdown}
          product={product}
          setProduct={setProduct}
          pawnSim={pawnSim}
          pawnState={pawnState}
          formatIDDate={formatIDDate}
        />


        <PricingFooter vehicleReady={vehicleReady} fetchPricing={fetchPricing} canCallPricing={canCallPricing} isBusy={isBusy} />

        {/* Export Button */}
        {vehicleReady && breakdown && (
          <ExportSection
            vehicle={vehicle}
            breakdown={breakdown}
            pawnSim={pawnSim}
            location={location}
            tenorDays={tenorDays}
            product={product}
          />
        )}

        {/* Bottom Toggle for Mock */}
        <div className="flex justify-end pt-2 border-t border-border/50">
          <label className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={useMock}
              onChange={(e) => setUseMock(e.target.checked)}
              disabled={isBusy}
              className="h-3 w-3 rounded border-border text-primary focus:ring-primary accent-primary"
            />
            Use Mock Data
          </label>
        </div>
      </div>
    </section>
  );
}