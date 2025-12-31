"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PricingHeader from "./PricingHeader";
import PricingGating from "./PricingGating";
import PricingAlerts from "./PricingAlerts";
import PricingLocation from "./PricingLocation";
import TenorSlider from "./TenorSlider";
import PricingBreakdown from "./PricingBreakdown";
import PawnSimulation from "./PawnSimulation";
import PricingFooter from "./PricingFooter";


type VehicleCondition =
  | "Mulus (Grade A)"
  | "Normal (Grade B)"
  | "Banyak Lecet (Grade C)"
  | "Perlu Perbaikan (Grade D)";

type Props = {
  vehicleReady: boolean;
  vehicle?: {
    brandModel?: string; // ✅ string
    year?: string;
    physicalCondition?: VehicleCondition;
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
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      {label ? <span className="text-xs font-semibold text-gray-600">{label}</span> : null}
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

  const pricing = resp.data.pricing || {};
  const breakdown = resp.data.breakdown || {};

  const baseMarket = Number(pricing.market_price ?? breakdown?.pricing_breakdown?.base_market_price?.value ?? 0) || 0;
  const assetValue = Number(breakdown?.pricing_breakdown?.asset_value ?? 0) || 0;

  // adjustment = asset - base (kalau breakdown ada), kalau nggak ada ya 0
  const adjustment = assetValue && baseMarket ? assetValue - baseMarket : 0;

  const confScore =
    typeof breakdown?.confidence_level?.score === "number"
      ? breakdown.confidence_level.score
      : confidenceToNumber(pricing.price_confidence);

  return {
    basePrice: baseMarket,
    adjustment,
    assetValue: assetValue || baseMarket,
    confidence: Math.max(0.6, Math.min(0.97, confScore)),
    confidenceLabel: breakdown?.confidence_level?.level || pricing.price_confidence || "—",
    priceRange: (pricing.price_range as any) ?? breakdown?.pricing_breakdown?.base_market_price?.range ?? null,
    dataPoints: pricing.data_points ?? breakdown?.pricing_breakdown?.base_market_price?.data_points,
    appraisalValue: pricing.appraisal_value ?? breakdown?.collateral_calculation?.appraisal_value,
    effectiveCollateralValue:
      pricing.effective_collateral_value ?? breakdown?.collateral_calculation?.effective_collateral_value,
    tenorDays: pricing.tenor_days ?? breakdown?.collateral_calculation?.tenor_days,
  };
}

export default function PricingCard({ vehicleReady, vehicle, onPricingCalculated }: Props) {
  const [location, setLocation] = useState("Jakarta Selatan, DKI Jakarta");
  const [tenorDays, setTenorDays] = useState(30);
  const [product, setProduct] = useState<PawnProduct>("reguler");

  const [useMock, setUseMock] = useState(true);




  const [state, setState] = useState<"idle" | "processing" | "done" | "error">("idle");
  const isLoading = state === "processing";
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [pricing, setPricing] = useState<UiBreakdown | null>(null);

  const [pawnState, setPawnState] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [pawnError, setPawnError] = useState<string | null>(null);
  const [pawnResp, setPawnResp] = useState<PawnApiResponse | null>(null);
  

  const debounceRef = useRef<number | null>(null);

  const province = useMemo(() => parseProvince(location), [location]);
  const safeBrandModel =
  typeof vehicle?.brandModel === "string" ? vehicle.brandModel : "";

  const makeModel = useMemo(() => splitBrandModel(safeBrandModel), [safeBrandModel]);

  const yearNum = useMemo(() => {
    const y = Number(vehicle?.year);
    return Number.isFinite(y) ? y : undefined;
  }, [vehicle?.year]);

  const overallGrade = useMemo(() => mapVehicleConditionToGrade(vehicle?.physicalCondition), [vehicle?.physicalCondition]);

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
          defects: [], // kalau nanti ada defects dari VehicleCard, isi di sini
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

      if (!res.ok || !data.success) {
        const msg =
          data?.error ||
          (Array.isArray(data?.errors) ? data.errors?.[0]?.msg : null) ||
          `Request failed (HTTP ${res.status})`;
        throw new Error(msg);
      }

      const mapped = mapPricingResponseToUi(data);
      setPricing(mapped);
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
  }, [canCallPricing, province, makeModel.make, makeModel.model, yearNum, overallGrade, tenorDays, useMock]);

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
    <section className="rounded-2xl border bg-white shadow-sm">
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
          location={location}
          setLocation={setLocation}
          province={province}
        />




        <PricingBreakdown vehicleReady={vehicleReady} breakdown={breakdown} state={state} rupiah={rupiah} />

        <TenorSlider
          vehicleReady={vehicleReady}
          product={product}
          tenorDays={tenorDays}
          setTenorDays={setTenorDays}
        />
       

        <PricingBreakdown vehicleReady={vehicleReady} breakdown={breakdown} state={state} rupiah={rupiah} />


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
      </div>
    </section>
  );
}