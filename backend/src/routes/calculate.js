const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { searchMarketPrice, calculateEffectiveCollateralValue, calculateAppraisalValue, generatePricingBreakdown } = require('../services/pricingEngineService');
const { calculateConditionScore } = require('../services/vehicleScanService');
const { comparePawnProducts } = require('../services/pawnDecisionEngineService');
const { summarizeDocuments } = require('../services/documentScanService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route POST /api/calculate/pricing
 * @desc Calculate market price based on vehicle data (user can edit before submitting)
 * @access Public
 * 
 * This endpoint receives the edited vehicle data from the scan step
 * and calculates the pricing/appraisal value
 */
const pricingValidation = [
  body('vehicle_identification.make').notEmpty().withMessage('Vehicle make is required'),
  body('vehicle_identification.model').notEmpty().withMessage('Vehicle model is required'),
  body('vehicle_identification.year').optional().isInt({ min: 1990, max: new Date().getFullYear() + 1 }),
  body('physical_condition.defects').optional().isArray(),
  body('province').optional().isString()
];

// helper sederhana: ambil severity dari string defects "Rust (Minor)"
function parseSeverity(defectStr = "") {
  const m = String(defectStr).match(/\((Minor|Moderate|Major|Severe)\)/i);
  return m ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() : "Moderate";
}

router.post('/pricing', pricingValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { vehicle_identification, physical_condition, province } = req.body;
  const useMock = req.query.mock === 'true' || process.env.USE_MOCK === 'true';
  const tenorDays = Number(req.body.tenor_days ?? 30);

  const conditionScore = physical_condition 
    ? calculateConditionScore(physical_condition)
    : { final_score: 1.0, defect_count: 0, base_score: 1.0, deduction: 0 };

  const vehicleInfo = {
    make: vehicle_identification.make,
    model: vehicle_identification.model,
    year: vehicle_identification.year || new Date().getFullYear() - 2,
    vehicle_type: vehicle_identification.vehicle_type || 'Matic',
    province: province || 'Indonesia',
  };

  const breakdown = await generatePricingBreakdown(
    { make: vehicleInfo.make, model: vehicleInfo.model, year: vehicleInfo.year },
    conditionScore,
    vehicleInfo.province,
    tenorDays
  );

  const pricingBreak = breakdown.pricing_breakdown || {};
  const coll = breakdown.collateral_calculation || {};

  res.json({
    success: true,
    message: 'Pricing calculated successfully. You can adjust values before proceeding to pawn simulation.',
    data: {
      vehicle: vehicleInfo,
      condition: conditionScore,
      pricing: {
        market_price: pricingBreak.base_market_price?.value ?? 0,
        price_range: pricingBreak.base_market_price?.range ?? null,
        price_confidence: pricingBreak.base_market_price?.confidence ?? 'LOW',
        data_points: pricingBreak.base_market_price?.data_points ?? 0,
        condition_adjustment: conditionScore.final_score,
        effective_collateral_value: coll.effective_collateral_value ?? 0,
        appraisal_value: coll.appraisal_value ?? 0,
        tenor_days: coll.tenor_days ?? tenorDays,
      },
      breakdown,
      calculated_at: new Date().toISOString(),
      is_editable: true,
      editable_fields: ['appraisal_value', 'condition_adjustment'],
    },
    next_step: {
      action: 'CALCULATE_PAWN',
      description: 'Proceed to pawn simulation with current or adjusted appraisal value',
      endpoint: 'POST /api/calculate/pawn'
    }
  });
}));

/**
 * @route POST /api/calculate/pawn
 * @desc Calculate pawn loan options based on appraisal value
 * @access Public
 * 
 * Receives the appraisal value (can be edited) and calculates pawn options
 */
const pawnValidation = [
  body('appraisal_value').isNumeric().withMessage('Appraisal value is required'),
  body('loan_amount').optional().isNumeric(),
  body('loan_period_days').optional().isInt({ min: 1, max: 120 }),
  body('tenor_days').optional().isInt({ min: 1, max: 120 })
];

router.post('/pawn', pawnValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { appraisal_value, loan_amount, loan_period_days, tenor_days } = req.body;

  const requestedLoanAmount = loan_amount || appraisal_value;
  const period = tenor_days || loan_period_days || 30;

  const productComparison = comparePawnProducts(appraisal_value, requestedLoanAmount, period);

  res.json({
    success: true,
    message: 'Pawn simulation completed. You can adjust loan amount or period to recalculate.',
    data: {
      input: {
        appraisal_value: appraisal_value,
        loan_amount: requestedLoanAmount,
        period_days: period
      },
      products: productComparison,
      calculated_at: new Date().toISOString(),
      is_editable: true,
      editable_fields: ['loan_amount', 'loan_period_days']
    },
    next_step: {
      action: 'FINALIZE_OR_RECALCULATE',
      description: 'Adjust parameters and recalculate, or proceed to finalize',
      recalculate_endpoint: 'POST /api/calculate/pawn'
    }
  });
}));

/**
 * @route POST /api/calculate/full-assessment
 * @desc Complete assessment combining documents + vehicle + pricing + pawn
 * @access Public
 * 
 * This is an optional endpoint for getting a complete assessment in one call
 * All data should be the EDITED/CONFIRMED data from previous scan steps
 */
const fullAssessmentValidation = [
  body('vehicle_identification.make').notEmpty().withMessage('Vehicle make is required'),
  body('vehicle_identification.model').notEmpty().withMessage('Vehicle model is required'),
  body('physical_condition').optional().isObject(),
  body('slik_data').optional().isObject(),
  body('salary_data').optional().isObject(),
  body('loan_amount').optional().isNumeric(),
  body('loan_period_days').optional().isInt({ min: 1, max: 120 })
];

router.post('/full-assessment', fullAssessmentValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { 
    vehicle_identification, 
    physical_condition, 
    slik_data, 
    salary_data,
    loan_amount,
    loan_period_days,
    province
  } = req.body;

  const useMock = req.query.mock === 'true' || process.env.USE_MOCK === 'true';

  const documentSummary = summarizeDocuments(slik_data, salary_data);

  const conditionScore = physical_condition 
    ? calculateConditionScore(physical_condition)
    : { final_score: 1.0, defect_count: 0, base_score: 1.0, deduction: 0 };

  const vehicleInfo = {
    make: vehicle_identification.make,
    model: vehicle_identification.model,
    year: vehicle_identification.year || new Date().getFullYear() - 2,
    vehicle_type: vehicle_identification.vehicle_type || 'Matic',
    province: province || 'Indonesia'
  };

  let marketPriceResult;
  if (useMock) {
    marketPriceResult = {
      base_price: 15000000,
      search_confidence: 0.85,
      price_range: { min: 13000000, max: 17000000 },
      source: 'mock_data'
    };
  } else {
    marketPriceResult = await searchMarketPrice(vehicleInfo);
  }

  const assetValue = marketPriceResult.base_price;
  const effectiveCollateralValue = calculateEffectiveCollateralValue(assetValue);
  const appraisalValue = calculateAppraisalValue(effectiveCollateralValue);

  const requestedLoan = loan_amount || appraisalValue;
  const period = loan_period_days || 30;
  const productComparison = comparePawnProducts(appraisalValue, requestedLoan, period);

  res.json({
    success: true,
    message: 'Full assessment completed. All values can be adjusted for recalculation.',
    data: {
      applicant: documentSummary,
      vehicle: {
        identification: vehicle_identification,
        condition: conditionScore
      },
      pricing: {
        market_price: marketPriceResult.base_price,
        price_range: marketPriceResult.price_range,
        effective_collateral_value: effectiveCollateralValue,
        appraisal_value: appraisalValue
      },
      pawn_options: productComparison,
      assessment_id: `ASM-${Date.now()}`,
      assessed_at: new Date().toISOString(),
      is_editable: true
    }
  });
}));

module.exports = router;
