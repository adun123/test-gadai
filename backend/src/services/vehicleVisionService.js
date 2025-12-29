const { getVisionModel } = require('../config/gemini');

const VEHICLE_VISION_SCHEMA = {
  type: "OBJECT",
  properties: {
    vehicle_identification: {
      type: "OBJECT",
      properties: {
        vehicle_type: {
          type: "STRING",
          enum: ["Manual", "Matic", "Sport", "Vespa", "Trail", "Cruiser", "Electric", "Unknown"]
        },
        make: {
          type: "STRING",
          description: "Brand: Honda, Yamaha, Kawasaki, Suzuki, etc."
        },
        model: {
          type: "STRING",
          description: "Model name: Beat, Vario 160, Scoopy, Revo, CBR150, NMax, etc."
        },
        color: {
          type: "STRING",
          description: "Primary color of the vehicle"
        },
        license_plate: {
          type: "STRING",
          description: "License plate number if visible"
        },
        confidence_score: {
          type: "NUMBER",
          description: "Confidence level 0-1"
        }
      }
    },
    physical_condition: {
      type: "OBJECT",
      properties: {
        overall_grade: {
          type: "STRING",
          enum: ["Excellent", "Good", "Fair", "Poor"]
        },
        detected_issues: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              issue_type: { type: "STRING" },
              location: { type: "STRING" },
              severity: { type: "STRING", enum: ["Minor", "Moderate", "Severe"] }
            }
          }
        },
        body_condition: { type: "STRING" },
        paint_condition: { type: "STRING" },
        tire_condition: { type: "STRING" },
        visible_modifications: {
          type: "ARRAY",
          items: { type: "STRING" }
        }
      }
    },
    image_quality: {
      type: "OBJECT",
      properties: {
        is_clear: { type: "BOOLEAN" },
        angle_captured: { type: "STRING" },
        requires_retake: { type: "BOOLEAN" },
        retake_reason: { type: "STRING" }
      }
    }
  }
};

const VEHICLE_ANALYSIS_PROMPT = `You are an expert motorcycle appraiser for a pawn shop system.
Analyze the uploaded motorcycle image(s) and extract detailed information.

IDENTIFICATION TASK:
1. Identify the motorcycle type (Manual, Matic, Sport, Vespa, Trail, Cruiser, Electric)
2. Identify the brand/make (Honda, Yamaha, Kawasaki, Suzuki, etc.)
3. Identify the specific model (Beat, Vario 160, Scoopy, Revo, CBR150, NMax, etc.)
4. Identify the color
5. Read the license plate number if visible

CONDITION ASSESSMENT:
1. Evaluate overall body condition (dents, scratches, rust)
2. Assess paint condition (fading, peeling, discoloration)
3. Check tire condition if visible
4. Note any visible modifications
5. Identify all physical defects with location and severity

IMAGE QUALITY CHECK:
1. Is the image clear enough for assessment?
2. What angle is captured (front, side, rear)?
3. Does the image need to be retaken?

Be thorough and list ALL visible defects. This assessment affects loan value.`;

async function analyzeVehicleImages(imageBuffers, options = {}) {
  try {
    const model = getVisionModel();

    const imageParts = imageBuffers.map(buffer => ({
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    }));

    const prompt = options.additionalContext
      ? `${VEHICLE_ANALYSIS_PROMPT}\n\nAdditional context: ${options.additionalContext}`
      : VEHICLE_ANALYSIS_PROMPT;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }, ...imageParts] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: VEHICLE_VISION_SCHEMA
      }
    });

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Vehicle analysis failed: ${error.message}`);
  }
}

function calculateConditionScore(physicalCondition) {
  const gradeScores = {
    'Excellent': 1.0,
    'Good': 0.85,
    'Fair': 0.70,
    'Poor': 0.50
  };

  const baseScore = gradeScores[physicalCondition.overall_grade] || 0.7;

  const issues = physicalCondition.detected_issues || [];
  let deduction = 0;

  for (const issue of issues) {
    switch (issue.severity) {
      case 'Minor':
        deduction += 0.02;
        break;
      case 'Moderate':
        deduction += 0.05;
        break;
      case 'Severe':
        deduction += 0.10;
        break;
    }
  }

  const finalScore = Math.max(0.3, baseScore - deduction);

  return {
    base_score: baseScore,
    deduction: deduction,
    final_score: parseFloat(finalScore.toFixed(2)),
    issue_count: issues.length,
    grade: physicalCondition.overall_grade
  };
}

function mergeManualOverrides(aiAnalysis, manualOverrides = {}) {
  const merged = JSON.parse(JSON.stringify(aiAnalysis));

  if (manualOverrides.vehicle_type) {
    merged.vehicle_identification.vehicle_type = manualOverrides.vehicle_type;
  }
  if (manualOverrides.make) {
    merged.vehicle_identification.make = manualOverrides.make;
  }
  if (manualOverrides.model) {
    merged.vehicle_identification.model = manualOverrides.model;
  }
  if (manualOverrides.color) {
    merged.vehicle_identification.color = manualOverrides.color;
  }
  if (manualOverrides.license_plate) {
    merged.vehicle_identification.license_plate = manualOverrides.license_plate;
  }
  if (manualOverrides.year) {
    merged.vehicle_identification.year = manualOverrides.year;
  }

  if (manualOverrides.additional_defects && Array.isArray(manualOverrides.additional_defects)) {
    const existingIssues = merged.physical_condition.detected_issues || [];
    merged.physical_condition.detected_issues = [
      ...existingIssues,
      ...manualOverrides.additional_defects.map(defect => ({
        issue_type: defect,
        location: 'Reported by staff',
        severity: 'Moderate'
      }))
    ];
  }

  if (manualOverrides.overall_grade) {
    merged.physical_condition.overall_grade = manualOverrides.overall_grade;
  }

  const hasOverrides = Object.keys(manualOverrides).length > 0;
  if (hasOverrides) {
    merged.has_manual_overrides = true;
  }

  return merged;
}

function validateImageQuality(analysisResults) {
  const validationResult = {
    is_valid: true,
    issues: [],
    recommendations: []
  };

  if (!analysisResults.image_quality) {
    validationResult.is_valid = false;
    validationResult.issues.push('Unable to assess image quality');
    return validationResult;
  }

  const quality = analysisResults.image_quality;

  if (!quality.is_clear) {
    validationResult.issues.push('Image is not clear enough');
    validationResult.recommendations.push('Please retake with better lighting');
  }

  if (quality.requires_retake) {
    validationResult.is_valid = false;
    validationResult.issues.push(quality.retake_reason || 'Image requires retake');
  }

  return validationResult;
}

module.exports = {
  analyzeVehicleImages,
  calculateConditionScore,
  mergeManualOverrides,
  validateImageQuality
};
