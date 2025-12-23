const { getVisionModel } = require('../config/gemini');
const axios = require('axios');

const PAWN_SCHEMA = {
  type: "OBJECT",
  properties: {
    pawn_assessment: {
      type: "OBJECT",
      properties: {
        region_context: { type: "STRING" },
        applicant_analysis: {
          type: "OBJECT",
          properties: {
            documents_verification: {
              type: "OBJECT",
              properties: {
                salary_slip_detected: { type: "BOOLEAN" },
                slik_checking_detected: { type: "BOOLEAN" },
                data_match_status: { type: "STRING", enum: ["MATCH", "MISMATCH", "PARTIAL"] }
              }
            },
            risk_score: { type: "STRING", enum: ["LOW_RISK", "HIGH_RISK", "REJECT"] }
          }
        },
        collaterals: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              category: { type: "STRING", enum: ["KENDARAAN", "ELEKTRONIK", "PERHIASAN", "LUXURY_FASHION", "LAINNYA"] },
              basic_info: {
                type: "OBJECT",
                properties: {
                  type: { type: "STRING" },
                  brand: { type: "STRING" },
                  model: { type: "STRING" },
                  is_luxury_brand: { type: "BOOLEAN" }
                }
              },
              technical_specifications: {
                type: "OBJECT",
                properties: {
                  license_plate_year: { type: "STRING" },
                  odometer_km: { type: "NUMBER" },
                  vehicle_documents: { type: "ARRAY", items: { type: "STRING" } },
                  jewelry_scale_visible: { type: "BOOLEAN" },
                  jewelry_weight_grams: { type: "NUMBER" },
                  jewelry_purity_code: { type: "STRING" },
                  screen_condition: { type: "STRING", enum: ["GOOD", "CRACKED", "DEAD_PIXEL", "UNKNOWN"] }
                }
              },
              physical_condition: {
                type: "OBJECT",
                properties: {
                  grade: { type: "STRING", enum: ["A", "B", "C", "D"] },
                  detected_defects: { type: "ARRAY", items: { type: "STRING" } },
                  authenticity_flag: { type: "STRING", enum: ["LIKELY_AUTHENTIC", "SUSPICIOUS", "FAKE"] }
                }
              },
              value_estimation: {
                type: "OBJECT",
                properties: {
                  search_query_used: { type: "STRING" },
                  market_price_avg: { type: "NUMBER" },
                  confidence_score: { type: "NUMBER" }
                }
              }
            }
          }
        },
        final_decision: {
          type: "OBJECT",
          properties: {
            status: { type: "STRING", enum: ["APPROVED", "REJECTED", "MANUAL_REVIEW"] },
            total_loan_offer: { type: "NUMBER" },
            reasoning: { type: "STRING" }
          }
        }
      }
    }
  }
};

const SYSTEM_INSTRUCTION = `You are a Professional Pawn Appraiser AI (General Appraiser).

PROCESS FLOW (Thinking Mode):

1. Identification: Examine images and determine category (Electronics, Vehicles, or Jewelry)

2. Specific Verification:
   - Vehicles: Check License Plate (Year), Odometer, body condition, missing parts, etc.
   - Electronics: Check screen cracks, body dents, scratches, etc.
   - Jewelry: CRITICAL: Read the numbers on the digital scale display in the photo to determine item weight. Read the purity stamp on jewelry (375, 700, 750, 999).

3. Searching (Grounding With Google):
   - Use Google Search to find current used/second-hand prices today.
   - Ignore unreasonable prices
   - Query Vehicles/Electronics: "Used [Brand] [Type] [Year/Spec] condition price"
   - Query Jewelry: "Gold buyback price per gram today". Formula: (Gold Price x Weight x Purity x 0.8)

4. GRADING SYSTEM:
   - Grade A (Excellent/Complete): Perfect condition, no defects, all documents complete
   - Grade B (Minor Scratches): 1-3 minor defects (light scratches, small dents)
   - Grade C (Damaged): 4-6 defects OR major damage (broken parts, heavy scratches)
   - Grade D (Severely Damaged/Fake): 7+ defects OR critical damage OR fake item

5. Constraints:
   - If Jewelry is not photographed on a digital scale with visible numbers, set status: "Manual Review" (Reason: Weight not verified)
   - If category detected as "Luxury Brand" (Rolex, LV, Gucci), automatically set status to "Manual Review"
   - Count ALL defects carefully (both visible in photos and reported by employee)
   - Output ONLY in JSON format`;

function evaluateGradeByDefects(aiDetectedDefects = [], manualDefects = []) {
  const allDefects = [...aiDetectedDefects, ...manualDefects];
  const totalDefects = allDefects.length;
  
  const hasCriticalDefect = allDefects.some(d => 
    d.toLowerCase().includes('broken') ||
    d.toLowerCase().includes('crack') ||
    d.toLowerCase().includes('dead') ||
    d.toLowerCase().includes('not working') ||
    d.toLowerCase().includes('missing') ||
    d.toLowerCase().includes('fake') ||
    d.toLowerCase().includes('swollen battery')
  );
  
  let grade;
  if (hasCriticalDefect || totalDefects >= 7) {
    grade = 'D';
  } else if (totalDefects >= 4) {
    grade = 'C';
  } else if (totalDefects >= 1) {
    grade = 'B';
  } else {
    grade = 'A';
  }
  
  return {
    grade,
    total_defects: totalDefects,
    has_critical_defect: hasCriticalDefect
  };
}

function calculateLoanOffer(grade, marketPrice) {
  const gradePercentages = {
    'A': 70,
    'B': 60,
    'C': 40,
    'D': 0
  };
  
  const percentage = gradePercentages[grade] || 0;
  const loanAmount = Math.floor(marketPrice * (percentage / 100));
  
  return {
    loan_percentage: percentage,
    loan_amount: loanAmount
  };
}

function getGradeReasoning(evaluation) {
  const { grade, total_defects, has_critical_defect } = evaluation;
  
  const gradeDescriptions = {
    'A': 'Perfect condition with no visible defects',
    'B': `Good condition with ${total_defects} minor defects`,
    'C': `Fair condition with ${total_defects} defects requiring attention`,
    'D': has_critical_defect ? 
      `Poor condition - critical defect detected requiring rejection` : 
      `Poor condition with ${total_defects} defects - not suitable for loan`
  };
  
  return `Grade ${grade}: ${gradeDescriptions[grade] || 'Unknown grade'}`;
}

async function analyzeCollateral(imageBuffers, region, riskScore, additionalDefects = []) {
  try {
    const model = getVisionModel();

    const imageParts = imageBuffers.map(buffer => ({
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    }));

    const prompt = `${SYSTEM_INSTRUCTION}

Analyze these collateral item photos for region ${region}.

Risk Score from financial analysis: ${riskScore}

Perform complete assessment and return results in JSON format according to schema.

IMPORTANT: List ALL visible defects you can detect in the photos in the detected_defects array.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }, ...imageParts] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: PAWN_SCHEMA
      }
    });

    const response = await result.response;
    const text = response.text();
    const aiResult = JSON.parse(text);
    
    if (additionalDefects.length > 0) {
      aiResult.pawn_assessment.collaterals.forEach(collateral => {
        const aiDefects = collateral.physical_condition.detected_defects || [];
        const allDefects = [...aiDefects, ...additionalDefects];
        
        collateral.physical_condition.detected_defects = allDefects;
        
        const recalculatedGrade = evaluateGradeByDefects(aiDefects, additionalDefects);
        const originalGrade = collateral.physical_condition.grade;
        
        if (recalculatedGrade !== originalGrade) {
          collateral.physical_condition.grade = recalculatedGrade;
          collateral.physical_condition.grade_adjusted = true;
          collateral.physical_condition.original_ai_grade = originalGrade;
        }
        
        const marketPrice = collateral.value_estimation.market_price_avg;
        const newLoanOffer = calculateLoanOffer(marketPrice, recalculatedGrade);
        
        if (aiResult.pawn_assessment.final_decision) {
          aiResult.pawn_assessment.final_decision.total_loan_offer = newLoanOffer;
          aiResult.pawn_assessment.final_decision.reasoning = getGradeReasoning(
            recalculatedGrade, 
            allDefects.length,
            aiDefects,
            additionalDefects
          );
          
          if (recalculatedGrade === 'D') {
            aiResult.pawn_assessment.final_decision.status = 'REJECTED';
          } else if (recalculatedGrade === 'C') {
            aiResult.pawn_assessment.final_decision.status = 'MANUAL_REVIEW';
          }
        }
      });
    }
    
    return aiResult;
  } catch (error) {
    throw new Error(`Visual analysis failed: ${error.message}`);
  }
}

async function searchMarketPrice(query) {
  try {
    return {
      query: query,
      estimated_price: 0,
      confidence: 0.7,
      note: 'Manual price search required'
    };
  } catch (error) {
    return {
      query: query,
      estimated_price: 0,
      confidence: 0,
      error: error.message
    };
  }
}

module.exports = {
  analyzeCollateral,
  searchMarketPrice,
  evaluateGradeByDefects,
  calculateLoanOffer,
  getGradeReasoning
};
