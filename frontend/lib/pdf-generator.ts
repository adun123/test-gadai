import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Add these types to window object since they're loaded via script tags in some environments
// but here we imported them. However to be safe with TypeScript:
declare module "jspdf" {
    interface jsPDF {
        lastAutoTable: { finalY: number };
    }
}

// Helper to format currency
function formatCurrency(value: number | undefined): string | null {
    if (value === undefined || value === null) return null;
    return `Rp ${value.toLocaleString('id-ID')}`;
}

// Helper to check if value is non-empty
function hasValue(value: any): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (typeof value === 'number' && isNaN(value)) return false;
    return true;
}

export async function generateAssessmentPDF(data: any) {
    const { vehicle, pricing } = data;
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString("id-ID");

    // --- HEADER ---
    doc.setFontSize(18);
    doc.setTextColor(19, 91, 236); // Primary Blue
    doc.text("PEGADAIAN AI ANALYTICS", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${timestamp}`, 14, 26);
    doc.text(`ID: ${crypto.randomUUID().slice(0, 8).toUpperCase()}`, 14, 31);
    doc.line(14, 35, 196, 35);

    let finalY = 40;
    let sectionNumber = 1;

    // --- VEHICLE ASSESSMENT (only if vehicle data exists) ---
    if (vehicle && hasValue(vehicle.brandModel)) {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(`${sectionNumber}. Vehicle Assessment`, 14, finalY);
        finalY += 8;
        sectionNumber++;

        // Build vehicle data array - only include non-empty fields
        const vehicleData: [string, string][] = [];

        if (hasValue(vehicle.brandModel)) {
            vehicleData.push(["Brand & Model", vehicle.brandModel]);
        }
        if (hasValue(vehicle.plateNumber)) {
            vehicleData.push(["Plate Number", vehicle.plateNumber]);
        }
        if (hasValue(vehicle.year)) {
            vehicleData.push(["Year", vehicle.year]);
        }
        if (hasValue(vehicle.physicalCondition)) {
            vehicleData.push(["Physical Condition", vehicle.physicalCondition]);
        }

        if (vehicleData.length > 0) {
            autoTable(doc, {
                startY: finalY,
                head: [["Attribute", "Details"]],
                body: vehicleData,
                theme: 'striped',
                headStyles: { fillColor: [19, 91, 236] },
                styles: { fontSize: 10 },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
            });
            finalY = doc.lastAutoTable.finalY + 15;
        }
    }

    // --- VALUATION & PRICING (only if pricing data exists) ---
    if (pricing) {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(`${sectionNumber}. Valuation & Pricing`, 14, finalY);
        finalY += 8;
        sectionNumber++;

        // Build pricing data array - only include non-empty fields
        const priceData: [string, string][] = [];

        if (hasValue(pricing.location)) {
            priceData.push(["Location", pricing.location]);
        }
        if (hasValue(pricing.basePrice)) {
            priceData.push(["Market Price (Base)", formatCurrency(pricing.basePrice)!]);
        }
        if (hasValue(pricing.adjustment)) {
            const sign = pricing.adjustment >= 0 ? "+" : "";
            priceData.push(["Condition Adjustment", `${sign}${formatCurrency(pricing.adjustment)}`]);
        }
        if (hasValue(pricing.assetValue)) {
            priceData.push(["Estimated Asset Value", formatCurrency(pricing.assetValue)!]);
        }
        if (hasValue(pricing.appraisalValue)) {
            priceData.push(["Appraisal Value", formatCurrency(pricing.appraisalValue)!]);
        }
        if (hasValue(pricing.effectiveCollateralValue)) {
            priceData.push(["Effective Collateral Value", formatCurrency(pricing.effectiveCollateralValue)!]);
        }
        if (hasValue(pricing.confidence)) {
            priceData.push(["AI Confidence", `${Math.round(pricing.confidence * 100)}%`]);
        }
        if (hasValue(pricing.confidenceLabel)) {
            priceData.push(["Confidence Level", pricing.confidenceLabel]);
        }

        if (priceData.length > 0) {
            autoTable(doc, {
                startY: finalY,
                head: [["Component", "Value"]],
                body: priceData,
                theme: 'grid',
                headStyles: { fillColor: [40, 167, 69] }, // Green for money
                styles: { fontSize: 10 },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
            });
            finalY = doc.lastAutoTable.finalY + 15;
        }

        // --- PAWN SIMULATION (if available) ---
        const pawnData: [string, string][] = [];

        if (hasValue(pricing.product)) {
            pawnData.push(["Product Type", pricing.product === 'harian' ? 'Gadai Harian' : 'Gadai Reguler']);
        }
        if (hasValue(pricing.tenorDays)) {
            pawnData.push(["Tenor", `${pricing.tenorDays} days`]);
        }
        if (hasValue(pricing.maxDisbursement)) {
            pawnData.push(["Maximum Disbursement", formatCurrency(pricing.maxDisbursement)!]);
        }
        if (hasValue(pricing.sewaModal)) {
            pawnData.push(["Service Fee (Sewa Modal)", formatCurrency(pricing.sewaModal)!]);
        }
        if (hasValue(pricing.dueDate)) {
            const dueDate = pricing.dueDate instanceof Date
                ? pricing.dueDate.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                : pricing.dueDate;
            pawnData.push(["Due Date", dueDate]);
        }

        if (pawnData.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text(`${sectionNumber}. Pawn Simulation`, 14, finalY);
            finalY += 8;

            autoTable(doc, {
                startY: finalY,
                head: [["Parameter", "Value"]],
                body: pawnData,
                theme: 'grid',
                headStyles: { fillColor: [255, 193, 7] }, // Yellow/Gold for pawn
                styles: { fontSize: 10 },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
            });
            finalY = doc.lastAutoTable.finalY + 10;
        }
    }

    // Legal Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Disclaimer: This report is generated by AI (PoC). Values are estimates and require final verification by an appraiser.", 14, finalY + 10);

    doc.save(`Pegadaian_Analytics_${new Date().toISOString().slice(0, 10)}.pdf`);
}
