const { getVisionModel } = require('../config/gemini');

// JSON Schema for structured output
const VEHICLE_SCAN_SCHEMA = {
  type: "object",
  properties: {
    vehicle_identification: {
      type: "object",
      properties: {
        vehicle_type: {
          type: "string",
          description: "Type of motorcycle: Manual, Matic, Sport, Vespa, Trail, Cruiser, Electric, or Unknown"
        },
        make: {
          type: "string",
          description: "Manufacturer brand: Honda, Yamaha, Kawasaki, Suzuki, Vespa, etc.",
          nullable: true
        },
        model: {
          type: "string",
          description: "Specific model name",
          nullable: true
        },
        color: {
          type: "string",
          description: "Primary color of the vehicle"
        },
        license_plate: {
          type: "string",
          description: "License plate number if visible",
          nullable: true
        },
        estimated_year: {
          type: "string",
          description: "Estimated year or year range",
          nullable: true
        }
      },
      required: ["vehicle_type", "color"]
    },
    physical_condition: {
      type: "object",
      properties: {
        defects: {
          type: "array",
          items: {
            type: "string",
            description: "Defect description with severity in format: 'Description (Severity)' where Severity is Minor, Moderate, Major, or Severe"
          },
          description: "List of visible defects with severity levels"
        }
      },
      required: ["defects"]
    },
    confidence: {
      type: "number",
      description: "Confidence score between 0 and 1"
    }
  },
  required: ["vehicle_identification", "physical_condition", "confidence"]
};

const VEHICLE_SCAN_PROMPT = `You are an expert motorcycle appraiser. Scan this motorcycle image and extract all identifiable information.

IMPORTANT: For defects array, list EACH visible defect with its severity level in parentheses.
Severity levels:
- Minor: small scratches, light paint fading, minor scuffs
- Moderate: visible dents, paint peeling, worn parts
- Major: large dents, cracks, broken parts, heavy rust
- Severe: structural damage, missing parts, non-functional components

Example defects: "Paint fading on front panel (Minor)", "Dent on fuel tank (Moderate)", "Cracked side mirror (Major)"

Be thorough in detecting ALL visible defects. If no defects are visible, return empty array [].`;

async function scanVehicleImages(imageBuffers) {
  try {
    const model = getVisionModel();

    const imageParts = imageBuffers.map(buffer => ({
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    }));

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: VEHICLE_SCAN_PROMPT }, ...imageParts] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: VEHICLE_SCAN_SCHEMA
      }
    });

    const response = await result.response;
    const text = response.text();
    const parsed = JSON.parse(text);

    return {
      ...parsed,
      images_processed: imageBuffers.length,
      scanned_at: new Date().toISOString()
    };
  } catch (error) {
    return { error: error.message };
  }
}

function getMockVehicleScan() {
  return {
    vehicle_identification: {
      vehicle_type: 'Matic',
      make: 'Honda',
      model: 'Beat',
      color: 'Hitam',
      license_plate: 'D 1234 ABC',
      estimated_year: '2021-2023'
    },
    physical_condition: {
      defects: [
        'Scratch on left side panel (Minor)',
        'Paint fading on top cover (Minor)'
      ]
    },
    confidence: 0.85,
    images_processed: 1,
    scanned_at: new Date().toISOString()
  };
}

// Konstanta pengurangan berdasarkan severity (exportable untuk referensi)
const SEVERITY_DEDUCTIONS = {
  'Minor': 0.02,     // -2%
  'Moderate': 0.05,  // -5%
  'Major': 0.10,     // -10%
  'Severe': 0.15     // -15%
};

const MAX_DEDUCTION = 0.50;  // Maksimal pengurangan 50%
const MIN_SCORE = 0.30;      // Skor minimal 30%

/**
 * Menghitung skor kondisi berdasarkan defects saja
 * Mulai dari 100%, dikurangi sesuai defects yang ditemukan
 */
function calculateConditionScore(physicalCondition, overrides = {}) {
  // Jika user override final_score langsung, gunakan itu
  if (overrides.final_score !== undefined) {
    const overriddenScore = Math.max(MIN_SCORE, Math.min(1.0, overrides.final_score));
    return {
      base_score: 1.0,
      deduction: parseFloat((1.0 - overriddenScore).toFixed(2)),
      final_score: parseFloat(overriddenScore.toFixed(2)),
      defect_count: 0,
      defects_applied: [],
      is_overridden: true,
      override_source: 'user'
    };
  }

  // Mulai dari 100%
  const baseScore = 1.0;

  // Parse defects dari array string format "description (Severity)"
  const defectsRaw = physicalCondition.defects || [];
  const defectsApplied = [];
  let totalDeduction = 0;

  defectsRaw.forEach(defectStr => {
    // Parse format "Scratch on panel (Minor)"
    const match = defectStr.match(/^(.+)\s*\((\w+)\)$/);
    if (match) {
      const description = match[1].trim();
      const severity = match[2];
      const deduction = SEVERITY_DEDUCTIONS[severity] || 0.03;

      defectsApplied.push({
        description,
        severity,
        deduction: deduction,
        deduction_percent: `${(deduction * 100).toFixed(0)}%`
      });

      totalDeduction += deduction;
    } else {
      // Jika format tidak sesuai, anggap Minor
      defectsApplied.push({
        description: defectStr,
        severity: 'Unknown',
        deduction: 0.03,
        deduction_percent: '3%'
      });
      totalDeduction += 0.03;
    }
  });

  // Terapkan batas maksimal pengurangan
  const cappedDeduction = Math.min(totalDeduction, MAX_DEDUCTION);
  const finalScore = Math.max(MIN_SCORE, baseScore - cappedDeduction);

  return {
    base_score: baseScore,
    deduction: parseFloat(totalDeduction.toFixed(2)),
    deduction_capped: parseFloat(cappedDeduction.toFixed(2)),
    final_score: parseFloat(finalScore.toFixed(2)),
    defect_count: defectsApplied.length,
    defects_applied: defectsApplied,
    is_overridden: false,
    limits: {
      max_deduction: `${MAX_DEDUCTION * 100}%`,
      min_score: `${MIN_SCORE * 100}%`,
      deduction_was_capped: totalDeduction > MAX_DEDUCTION
    }
  };
}

module.exports = {
  SEVERITY_DEDUCTIONS,
  MAX_DEDUCTION,
  MIN_SCORE,
  scanVehicleImages,
  getMockVehicleScan,
  calculateConditionScore
};
