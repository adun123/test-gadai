const PAWN_PRODUCTS = {
  REGULAR: {
    name: 'Gadai Kendaraan Reguler',
    min_loan: 50000,
    max_loan: null,
    min_tenor_days: 1,
    max_tenor_days: 120,
    sewa_modal_per_15_days: 0.012
  },
  DAILY: {
    name: 'Gadai Kendaraan Harian',
    min_loan: 50000,
    max_loan: 20000000,
    min_tenor_days: 1,
    max_tenor_days: 60,
    sewa_modal_per_day: 0.0009
  }
};

function calculateSewaModalRegular(loanAmount, tenorDays) {
  const periods = Math.ceil(tenorDays / 15);
  const sewaModalRate = 0.012;
  const sewaModal = loanAmount * sewaModalRate * periods;

  return {
    periods: periods,
    rate_per_period: sewaModalRate,
    total_rate: parseFloat((sewaModalRate * periods * 100).toFixed(2)),
    sewa_modal_amount: Math.round(sewaModal)
  };
}

function calculateSewaModalDaily(loanAmount, tenorDays) {
  const dailyRate = PAWN_PRODUCTS.DAILY.sewa_modal_per_day;
  const sewaModal = loanAmount * dailyRate * tenorDays;

  return {
    days: tenorDays,
    rate_per_day: dailyRate,
    total_rate: parseFloat((dailyRate * tenorDays * 100).toFixed(2)),
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

function calculatePawnLoan(appraisalValue, productType, tenorDays, startDate = new Date()) {
  const product = PAWN_PRODUCTS[productType];
  if (!product) {
    throw new Error(`Invalid product type: ${productType}`);
  }

  if (tenorDays < product.min_tenor_days || tenorDays > product.max_tenor_days) {
    throw new Error(`Tenor must be between ${product.min_tenor_days} and ${product.max_tenor_days} days for ${product.name}`);
  }

  let maxLoanAmount = appraisalValue;
  if (product.max_loan && maxLoanAmount > product.max_loan) {
    maxLoanAmount = product.max_loan;
  }

  const sewaModal = productType === 'REGULAR'
    ? calculateSewaModalRegular(maxLoanAmount, tenorDays)
    : calculateSewaModalDaily(maxLoanAmount, tenorDays);

  const dueDate = calculateDueDate(startDate, tenorDays);

  const totalRepayment = maxLoanAmount + sewaModal.sewa_modal_amount;

  return {
    product: {
      type: productType,
      name: product.name
    },
    appraisal_value: appraisalValue,
    max_loan_amount: maxLoanAmount,
    sewa_modal: sewaModal,
    total_repayment: totalRepayment,
    schedule: dueDate
  };
}

function comparePawnProducts(appraisalValue, loanAmount, tenorDays, startDate = new Date()) {
  const results = {};
  
  const requestedLoan = loanAmount || appraisalValue;

  if (tenorDays <= PAWN_PRODUCTS.REGULAR.max_tenor_days) {
    try {
      results.regular = calculatePawnLoan(requestedLoan, 'REGULAR', tenorDays, startDate);
      results.regular.appraisal_value = appraisalValue;
    } catch (e) {
      results.regular = { available: false, reason: e.message };
    }
  } else {
    results.regular = { available: false, reason: `Tenor exceeds maximum ${PAWN_PRODUCTS.REGULAR.max_tenor_days} days` };
  }

  if (tenorDays <= PAWN_PRODUCTS.DAILY.max_tenor_days && requestedLoan <= (PAWN_PRODUCTS.DAILY.max_loan || Infinity)) {
    try {
      results.daily = calculatePawnLoan(requestedLoan, 'DAILY', tenorDays, startDate);
      results.daily.appraisal_value = appraisalValue;
    } catch (e) {
      results.daily = { available: false, reason: e.message };
    }
  } else {
    let reason = '';
    if (tenorDays > PAWN_PRODUCTS.DAILY.max_tenor_days) {
      reason = `Tenor exceeds maximum ${PAWN_PRODUCTS.DAILY.max_tenor_days} days`;
    } else if (requestedLoan > PAWN_PRODUCTS.DAILY.max_loan) {
      reason = `Loan amount exceeds maximum Rp${PAWN_PRODUCTS.DAILY.max_loan.toLocaleString('id-ID')}`;
    }
    results.daily = { available: false, reason };
  }

  if (results.regular.total_repayment && results.daily.total_repayment) {
    results.recommendation = results.regular.total_repayment < results.daily.total_repayment ? 'REGULAR' : 'DAILY';
    results.recommendation_reason = results.recommendation === 'REGULAR'
      ? 'Lower total repayment amount'
      : 'Lower total repayment amount with daily product';
  } else if (results.regular.total_repayment) {
    results.recommendation = 'REGULAR';
    results.recommendation_reason = 'Daily product not available for this configuration';
  } else if (results.daily.total_repayment) {
    results.recommendation = 'DAILY';
    results.recommendation_reason = 'Regular product not available for this configuration';
  }

  return results;
}

function generatePawnSimulation(appraisalValue, productType, tenorOptions, startDate = new Date()) {
  const simulations = [];

  for (const tenor of tenorOptions) {
    try {
      const calculation = calculatePawnLoan(appraisalValue, productType, tenor, startDate);
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

  const pawnCalculation = calculatePawnLoan(appraisalValue, productType, tenorDays, startDate);

  const comparison = comparePawnProducts(appraisalValue, tenorDays, startDate);

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
      total_cost: pawnCalculation.sewa_modal.sewa_modal_amount + pawnCalculation.admin_fee,
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
  calculateSewaModalRegular,
  calculateSewaModalDaily,
  calculateDueDate,
  calculatePawnLoan,
  comparePawnProducts,
  generatePawnSimulation,
  generateFullPawnDecision
};
