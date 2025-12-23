module.exports = {
  validFormData: {
    region: 'Jakarta',
    nik: '3174012501950001',
    full_name: 'John Doe',
    monthly_income: 8000000,
    loan_amount: 20000000,
    tenor: 12
  },

  validSLIKDocument: {
    nik: '3174012501950001',
    full_name: 'John Doe',
    collectibility: 1,
    detected_document_type: 'SLIK'
  },

  validSalarySlipDocument: {
    full_name: 'John Doe',
    net_income: 8000000,
    detected_document_type: 'SALARY_SLIP'
  },

  mismatchedNameDocument: {
    full_name: 'Jane Smith',
    net_income: 5000000,
    detected_document_type: 'SALARY_SLIP'
  },

  badCollectibilitySLIK: {
    nik: '3174012501950001',
    full_name: 'John Doe',
    collectibility: 3,
    detected_document_type: 'SLIK'
  },

  lowIncomeSalarySlip: {
    full_name: 'John Doe',
    net_income: 2000000,
    detected_document_type: 'SALARY_SLIP'
  },

  noIncomeSalarySlip: {
    full_name: 'John Doe',
    net_income: null,
    detected_document_type: 'SALARY_SLIP'
  },

  validCollateralAnalysis: {
    category: 'Electronics',
    brand: 'Apple',
    model: 'iPhone 14 Pro',
    estimated_market_price: 15000000,
    defects: [
      {
        type: 'Screen damage',
        severity: 'minor',
        location: 'Top right corner',
        impact_on_value: '5%'
      }
    ],
    condition_grade: 'B',
    loan_offer_percentage: 60
  }
};
