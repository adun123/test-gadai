const PAWN_PRODUCTS = {
  REGULAR: {
    name: 'Gadai Kendaraan Reguler',
    min_loan: 50000,
    max_loan: null,
    min_tenor_days: 1,
    max_tenor_days: 120,
    sewa_modal_per_15_days: 0.012,
    sewa_modal_minimum: 0.01  // 1% minimum
  },
  DAILY: {
    name: 'Gadai Kendaraan Harian',
    min_loan: 50000,
    max_loan: 20000000,
    min_tenor_days: 1,
    max_tenor_days: 60,
    sewa_modal_per_day: 0.0009,
    sewa_modal_minimum: 0.0009  // 0.09% minimum (1 day)
  }
};

const ADMIN_FEE = 50000;  // Biaya administrasi tetap Rp50.000

function calculateSewaModalRegular(loanAmount, tenorDays) {
  const periods = Math.ceil(tenorDays / 15);
  const sewaModalRate = PAWN_PRODUCTS.REGULAR.sewa_modal_per_15_days;
  const minRate = PAWN_PRODUCTS.REGULAR.sewa_modal_minimum;
  
  // Calculate sewa modal with minimum check
  const calculatedRate = sewaModalRate * periods;
  const effectiveRate = Math.max(calculatedRate, minRate);
  const sewaModal = loanAmount * effectiveRate;

  return {
    periods: periods,
    rate_per_period: sewaModalRate,
    minimum_rate: minRate,
    total_rate: parseFloat((effectiveRate * 100).toFixed(2)),
    sewa_modal_amount: Math.round(sewaModal)
  };
}

function calculateSewaModalDaily(loanAmount, tenorDays) {
  const dailyRate = PAWN_PRODUCTS.DAILY.sewa_modal_per_day;
  const minRate = PAWN_PRODUCTS.DAILY.sewa_modal_minimum;
  
  // Calculate sewa modal with minimum check
  const calculatedRate = dailyRate * tenorDays;
  const effectiveRate = Math.max(calculatedRate, minRate);
  const sewaModal = loanAmount * effectiveRate;

  return {
    days: tenorDays,
    rate_per_day: dailyRate,
    minimum_rate: minRate,
    total_rate: parseFloat((effectiveRate * 100).toFixed(2)),
    sewa_modal_amount: Math.round(sewaModal)
  };
}

function calculateDueDate(startDate, tenorDays) {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const dueDate = new Date(start);
  dueDate.setDate(dueDate.getDate() + tenorDays);

  return {
    start_date: start.toISOString().split('T')[0],
    tenor_days: tenorDays,
    due_date: dueDate.toISOString().split('T')[0]
  };
}

function calculatePawnLoan(appraisalValue, requestedLoanAmount, productType, tenorDays, startDate = new Date()) {
  const product = PAWN_PRODUCTS[productType];
  if (!product) throw new Error(`Invalid product type: ${productType}`);

  if (tenorDays < product.min_tenor_days || tenorDays > product.max_tenor_days) {
    throw new Error(
      `Tenor must be between ${product.min_tenor_days} and ${product.max_tenor_days} days for ${product.name}`
    );
  }

  // Batas maksimal dari appraisal (collateral)
  let maxLoanAmount = appraisalValue;
  if (product.max_loan && maxLoanAmount > product.max_loan) {
    maxLoanAmount = product.max_loan;
  }

  // Loan yang diminta user (default = appraisal)
  const requested = requestedLoanAmount ?? appraisalValue;

  // Loan disetujui = min(requested, max)
  const approvedLoanAmount = Math.min(requested, maxLoanAmount);

  // sewa modal harus dihitung dari approved loan, bukan max loan
  const sewaModal = productType === 'REGULAR'
    ? calculateSewaModalRegular(approvedLoanAmount, tenorDays)
    : calculateSewaModalDaily(approvedLoanAmount, tenorDays);

  const dueDate = calculateDueDate(startDate, tenorDays);

  const totalRepayment = approvedLoanAmount + sewaModal.sewa_modal_amount + ADMIN_FEE;

  return {
    product: { type: productType, name: product.name },
    appraisal_value: appraisalValue,

    // ✅ bedakan semua angka
    max_loan_amount: maxLoanAmount,
    requested_loan_amount: requested,
    approved_loan_amount: approvedLoanAmount,

    sewa_modal: sewaModal,
    admin_fee: ADMIN_FEE,
    total_repayment: totalRepayment,
    schedule: dueDate
  };
}


function comparePawnProducts(appraisalValue, loanAmount, tenorDays, startDate = new Date()) {
  const results = {};
  const requestedLoan = loanAmount ?? appraisalValue;

  // REGULAR
  if (tenorDays <= PAWN_PRODUCTS.REGULAR.max_tenor_days) {
    try {
      results.regular = calculatePawnLoan(appraisalValue, requestedLoan, 'REGULAR', tenorDays, startDate);
    } catch (e) {
      results.regular = { available: false, reason: e.message };
    }
  } else {
    results.regular = { available: false, reason: `Tenor exceeds maximum ${PAWN_PRODUCTS.REGULAR.max_tenor_days} days` };
  }

  // DAILY
  if (tenorDays <= PAWN_PRODUCTS.DAILY.max_tenor_days) {
    try {
      results.daily = calculatePawnLoan(appraisalValue, requestedLoan, 'DAILY', tenorDays, startDate);
    } catch (e) {
      results.daily = { available: false, reason: e.message };
    }
  } else {
    results.daily = { available: false, reason: `Tenor exceeds maximum ${PAWN_PRODUCTS.DAILY.max_tenor_days} days` };
  }

  // recommendation
  if (results.regular?.total_repayment && results.daily?.total_repayment) {
    results.recommendation = results.regular.total_repayment < results.daily.total_repayment ? 'REGULAR' : 'DAILY';
    results.recommendation_reason = 'Lower total repayment amount';
  } else if (results.regular?.total_repayment) {
    results.recommendation = 'REGULAR';
    results.recommendation_reason = 'Daily product not available for this configuration';
  } else if (results.daily?.total_repayment) {
    results.recommendation = 'DAILY';
    results.recommendation_reason = 'Regular product not available for this configuration';
  }

  return results;
}


function generatePawnSimulation(appraisalValue, productType, tenorOptions, startDate = new Date()) {
  const simulations = [];

  for (const tenor of tenorOptions) {
    try {
      const calculation = calculatePawnLoan(appraisalValue, appraisalValue, productType, tenor, startDate);

      simulations.push({
        tenor_days: tenor,
        ...calculation,
        available: true
      });
    } catch (e) {
      simulations.push({
        tenor_days: tenor,
        available: false,
        reason: e.message
      });
    }
  }

  return {
    product_type: productType,
    product_name: PAWN_PRODUCTS[productType]?.name,
    appraisal_value: appraisalValue,
    simulations
  };
}

function generateFullPawnDecision(pricingResult, tenorDays, productType, startDate = new Date()) {
  const appraisalValue = pricingResult.collateral_calculation?.appraisal_value || pricingResult.appraisal_value;

  const pawnCalculation = calculatePawnLoan(appraisalValue, appraisalValue, productType, tenorDays, startDate);


 const comparison = comparePawnProducts(appraisalValue, null, tenorDays, startDate);


  return {
    vehicle_info: pricingResult.vehicle_info,
    region: pricingResult.region,
    pricing_summary: {
      asset_value: pricingResult.pricing_breakdown?.asset_value || pricingResult.asset_value,
      effective_collateral_value: pricingResult.collateral_calculation?.effective_collateral_value,
      appraisal_value: appraisalValue
    },
    selected_product: pawnCalculation,
    product_comparison: comparison,
    decision_summary: {
      max_disbursement: pawnCalculation.max_loan_amount,
      total_cost: pawnCalculation.sewa_modal.sewa_modal_amount,
      total_repayment: pawnCalculation.total_repayment,
      due_date: pawnCalculation.schedule.due_date,
      notes: [
        'Appraisal value already accounts for depreciation risk during pawn period',
        `Sewa modal rate: ${pawnCalculation.sewa_modal.total_rate}%`,
        'All calculations are estimates and subject to final verification'
      ]
    }
  };
}

module.exports = {
  PAWN_PRODUCTS,
  ADMIN_FEE,
  calculateSewaModalRegular,
  calculateSewaModalDaily,
  calculateDueDate,
  calculatePawnLoan,
  comparePawnProducts,
  generatePawnSimulation,
  generateFullPawnDecision
};
