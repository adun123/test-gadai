const { getModel } = require('../config/gemini');

const SHORT_TERM_DEPRECIATION_RATE = 0.005;
const DEFAULT_LTV_POLICY = 0.75;

// Note: Google Search grounding does NOT support responseMimeType: 'application/json'
// Therefore, we use prompt-based JSON instructions for the pricing search.
// The expected response schema is documented in PRICE_SEARCH_PROMPT below.

const PRICE_SEARCH_PROMPT = `You are a motorcycle market price researcher in Indonesia. Your task is to find the current used/second-hand market price.

Vehicle Details:
- Make: [MAKE]
- Model: [MODEL]
- Year: [YEAR]
- Location: [PROVINCE], Indonesia

Search for prices from Indonesian marketplaces like OLX, Facebook Marketplace, or dealer websites. Prioritize listings from [PROVINCE] or nearby areas.

Return ONLY a valid JSON object with this structure:
{
  "make": "string",
  "model": "string",
  "year": number,
  "province": "string",
  "price_range": {
    "low": number,
    "high": number
  },
  "average_price": number,
  "data_points": number,
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "market_analysis": "brief explanation of how price was determined",
  "sources": ["list of sources found"]
}

Guidelines:
- Prices should be in Indonesian Rupiah (IDR)
- Filter out unrealistic outliers
- HIGH confidence: 5+ consistent data points
- MEDIUM confidence: 2-4 data points
- LOW confidence: estimated or 0-1 data points`;

async function searchMarketPrice(makeOrVehicleInfo, model, year, province = 'Indonesia') {
  let make, vehicleModel, vehicleYear, vehicleProvince;

  if (typeof makeOrVehicleInfo === 'object') {
    make = makeOrVehicleInfo.make;
    vehicleModel = makeOrVehicleInfo.model;
    vehicleYear = makeOrVehicleInfo.year;
    vehicleProvince = makeOrVehicleInfo.province || 'Indonesia';
  } else {
    make = makeOrVehicleInfo;
    vehicleModel = model;
    vehicleYear = year;
    vehicleProvince = province;
  }

  try {
    const model_ai = getModel();

    const prompt = PRICE_SEARCH_PROMPT
      .replace('[MAKE]', make)
      .replace('[MODEL]', vehicleModel)
      .replace('[YEAR]', vehicleYear)
      .replace(/\[PROVINCE\]/g, vehicleProvince);

    // Note: Google Search grounding does NOT support responseMimeType: 'application/json'
    // We must use prompt-based JSON and regex parsing for this endpoint
    const result = await model_ai.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40
      },
      tools: [{ googleSearch: {} }]
    });

    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (may contain markdown or extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          ...parsed,
          source: 'google_search'
        };
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message);
        return getFallbackEstimate(make, vehicleModel, vehicleYear);
      }
    }

    return getFallbackEstimate(make, vehicleModel, vehicleYear);
  } catch (error) {
    console.error('Market price search failed:', error.message);
    return getFallbackEstimate(make, vehicleModel, vehicleYear);
  }
}

function getFallbackEstimate(make, model, year) {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - year;
  const annualDepreciation = 0.12;

  const avgNewPrice = 20000000;
  const estimatedPrice = avgNewPrice * Math.pow(1 - annualDepreciation, vehicleAge);

  return {
    success: false,
    make,
    model,
    year,
    price_range: {
      low: Math.round(estimatedPrice * 0.85),
      high: Math.round(estimatedPrice * 1.15)
    },
    average_price: Math.round(estimatedPrice),
    data_points: 0,
    confidence: 'LOW',
    market_analysis: 'Fallback estimate using standard 12% annual depreciation',
    sources: [],
    source: 'fallback_estimate'
  };
}

async function getBaseMarketPrice(make, model, year) {
  const priceData = await searchMarketPrice(make, model, year);

  return {
    success: priceData.success,
    price: priceData.average_price,
    price_range: priceData.price_range,
    source: priceData.source,
    confidence: priceData.confidence,
    data_points: priceData.data_points,
    market_analysis: priceData.market_analysis
  };
}

function applyConditionAdjustment(basePrice, conditionScore) {
  const adjustmentFactor = conditionScore.final_score || 0.7;
  const adjustedPrice = basePrice * adjustmentFactor;

  return {
    base_price: basePrice,
    condition_factor: adjustmentFactor,
    adjustment_amount: Math.round(basePrice - adjustedPrice),
    adjusted_price: Math.round(adjustedPrice)
  };
}

async function calculateAssetValue(vehicleData, conditionScore) {
  const { make, model, year } = vehicleData;

  const marketPrice = await getBaseMarketPrice(make, model, year);
  const conditionAdjusted = applyConditionAdjustment(marketPrice.price, conditionScore);
  const confidenceLevel = calculateConfidenceLevel(marketPrice, conditionScore);

  return {
    base_market_price: marketPrice.price,
    price_range: marketPrice.price_range,
    price_source: marketPrice.source,
    price_confidence: marketPrice.confidence,
    data_points: marketPrice.data_points,
    market_analysis: marketPrice.market_analysis,
    condition_adjustment: {
      factor: conditionScore.final_score,
      deduction: conditionAdjusted.adjustment_amount
    },
    asset_value: conditionAdjusted.adjusted_price,
    confidence_level: confidenceLevel
  };
}

function calculateConfidenceLevel(marketPrice, conditionScore) {
  let score = 0.5;

  if (marketPrice.success && marketPrice.confidence === 'HIGH') {
    score += 0.3;
  } else if (marketPrice.success && marketPrice.confidence === 'MEDIUM') {
    score += 0.2;
  } else if (marketPrice.success) {
    score += 0.1;
  }

  if (conditionScore.issue_count === 0) {
    score += 0.15;
  } else if (conditionScore.issue_count <= 3) {
    score += 0.05;
  }

  const finalScore = parseFloat(Math.min(score, 0.95).toFixed(2));

  return {
    score: finalScore,
    level: finalScore >= 0.8 ? 'HIGH' : finalScore >= 0.6 ? 'MEDIUM' : 'LOW',
    factors: {
      price_data_quality: marketPrice.confidence,
      condition_assessment: conditionScore.issue_count <= 3 ? 'reliable' : 'uncertain'
    }
  };
}

function calculateEffectiveCollateralValue(assetValue, tenorDays) {
  const months = tenorDays / 30;
  const depreciationRate = SHORT_TERM_DEPRECIATION_RATE * months;
  const effectiveValue = assetValue * (1 - depreciationRate);

  return {
    asset_value: assetValue,
    tenor_days: tenorDays,
    depreciation_rate_per_month: `${(SHORT_TERM_DEPRECIATION_RATE * 100).toFixed(1)}%`,
    total_depreciation: `${(depreciationRate * 100).toFixed(2)}%`,
    effective_collateral_value: Math.round(effectiveValue)
  };
}

function calculateAppraisalValue(effectiveCollateralValue, ltvPolicy = DEFAULT_LTV_POLICY) {
  const appraisalValue = effectiveCollateralValue * ltvPolicy;

  return {
    effective_collateral_value: effectiveCollateralValue,
    ltv_policy: `${(ltvPolicy * 100).toFixed(0)}%`,
    appraisal_value: Math.round(appraisalValue)
  };
}

async function generatePricingBreakdown(vehicleIdentification, conditionScore, province, tenorDays = 30) {
  const vehicleData = {
    make: vehicleIdentification.make,
    model: vehicleIdentification.model,
    year: vehicleIdentification.year || new Date().getFullYear() - 2
  };

  const assetValuation = await calculateAssetValue(vehicleData, conditionScore);
  const ecv = calculateEffectiveCollateralValue(assetValuation.asset_value, tenorDays);
  const appraisal = calculateAppraisalValue(ecv.effective_collateral_value);

  return {
    vehicle: vehicleData,
    location: {
      province: province,
      display_text: `Estimasi harga untuk wilayah ${province}`
    },
    pricing_breakdown: {
      base_market_price: {
        value: assetValuation.base_market_price,
        range: assetValuation.price_range,
        source: assetValuation.price_source,
        confidence: assetValuation.price_confidence,
        data_points: assetValuation.data_points,
        analysis: assetValuation.market_analysis
      },
      condition_adjustment: {
        factor: `${(assetValuation.condition_adjustment.factor * 100).toFixed(0)}%`,
        deduction: -assetValuation.condition_adjustment.deduction
      },
      asset_value: assetValuation.asset_value
    },
    confidence_level: assetValuation.confidence_level,
    collateral_calculation: {
      asset_value: assetValuation.asset_value,
      tenor_days: tenorDays,
      depreciation: ecv.total_depreciation,
      effective_collateral_value: ecv.effective_collateral_value,
      ltv_policy: appraisal.ltv_policy,
      appraisal_value: appraisal.appraisal_value
    },
    ui_notes: {
      appraisal_explanation: 'Nilai taksiran sudah memperhitungkan risiko penurunan nilai selama periode gadai'
    }
  };
}

module.exports = {
  searchMarketPrice,
  getBaseMarketPrice,
  applyConditionAdjustment,
  calculateAssetValue,
  calculateEffectiveCollateralValue,
  calculateAppraisalValue,
  generatePricingBreakdown
};
