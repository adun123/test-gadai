const { getVisionModel } = require('../config/gemini');

const VEHICLE_SCAN_PROMPT = `You are an expert motorcycle appraiser. Scan this motorcycle image and extract all identifiable information.

Return ONLY a valid JSON object with this structure:
{
  "vehicle_identification": {
    "vehicle_type": "Manual/Matic/Sport/Vespa/Trail/Cruiser/Electric/Unknown",
    "make": "Honda/Yamaha/Kawasaki/Suzuki/Vespa/etc or null",
    "model": "specific model name or null",
    "color": "primary color",
    "license_plate": "plate number if visible or null",
    "estimated_year": "estimated year range or null"
  },
  "physical_condition": {
    "overall_grade": "Excellent/Good/Fair/Poor",
    "defects": ["defect 1 (severity)", "defect 2 (severity)"]
  },
  "confidence": number (0-1)
}

For defects array, list each defect briefly with severity in parentheses. Example: "Paint fading on front panel (Minor)", "Scratches on side body (Moderate)"
Be thorough in detecting ALL visible defects: scratches, dents, rust, fading paint, cracks, missing parts, etc.`;

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
      contents: [{ role: 'user', parts: [{ text: VEHICLE_SCAN_PROMPT }, ...imageParts] }]
    });

    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ...parsed,
        images_processed: imageBuffers.length,
        scanned_at: new Date().toISOString()
      };
    }

    return { error: 'Failed to parse vehicle scan' };
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
      overall_grade: 'Good',
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

function calculateConditionScore(physicalCondition) {
  const gradeScores = {
    'Excellent': 1.0,
    'Good': 0.85,
    'Fair': 0.65,
    'Poor': 0.45
  };

  const severityDeductions = {
    'Minor': 0.02,
    'Moderate': 0.05,
    'Major': 0.10,
    'Severe': 0.15
  };

  const baseScore = gradeScores[physicalCondition.overall_grade] || 0.7;
  const defects = physicalCondition.detected_defects || [];
  
  let totalDeduction = 0;
  defects.forEach(defect => {
    totalDeduction += severityDeductions[defect.severity] || 0.03;
  });

  totalDeduction = Math.min(totalDeduction, 0.5);
  const finalScore = Math.max(0.3, baseScore - totalDeduction);

  return {
    base_score: baseScore,
    deduction: parseFloat(totalDeduction.toFixed(2)),
    final_score: parseFloat(finalScore.toFixed(2)),
    defect_count: defects.length,
    grade: physicalCondition.overall_grade
  };
}

module.exports = {
  scanVehicleImages,
  getMockVehicleScan,
  calculateConditionScore
};
