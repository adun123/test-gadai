module.exports = {
  validSLIKDocument: {
    document_type: 'SLIK',
    extracted_data: {
      full_name: 'Budi Santoso',
      credit_status: 'Lancar',
      collectibility: 1,
      existing_obligations: []
    },
    confidence_score: 0.92
  },

  validSalarySlipDocument: {
    document_type: 'SALARY_SLIP',
    extracted_data: {
      full_name: 'Budi Santoso',
      company_name: 'PT Maju Bersama',
      position: 'Staff IT',
      employment_status: 'Karyawan Tetap',
      gross_income: 9500000,
      net_income: 8500000,
      pay_period: 'Monthly'
    },
    confidence_score: 0.89
  },

  mismatchedNameDocument: {
    document_type: 'SALARY_SLIP',
    extracted_data: {
      full_name: 'Andi Wijaya',
      company_name: 'PT Lain',
      net_income: 5000000
    },
    confidence_score: 0.85
  },

  badCollectibilitySLIK: {
    document_type: 'SLIK',
    extracted_data: {
      full_name: 'Budi Santoso',
      credit_status: 'Macet',
      collectibility: 4
    },
    confidence_score: 0.88
  },

  validVehicleAnalysis: {
    vehicle_identification: {
      vehicle_type: 'Matic',
      make: 'Honda',
      model: 'Beat',
      color: 'Hitam',
      license_plate: 'D 1234 ABC',
      confidence_score: 0.88
    },
    physical_condition: {
      overall_grade: 'Good',
      detected_issues: [
        { issue_type: 'Minor scratch', location: 'Left side panel', severity: 'Minor' }
      ],
      body_condition: 'Minor scratches on side panel',
      paint_condition: 'Good with slight fading',
      tire_condition: 'Good',
      visible_modifications: []
    },
    image_quality: {
      is_clear: true,
      angle_captured: 'Side view',
      requires_retake: false
    }
  },

  poorConditionVehicle: {
    vehicle_identification: {
      vehicle_type: 'Matic',
      make: 'Honda',
      model: 'Beat',
      color: 'Merah',
      license_plate: 'B 5678 XYZ',
      confidence_score: 0.75
    },
    physical_condition: {
      overall_grade: 'Poor',
      detected_issues: [
        { issue_type: 'Major dent', location: 'Front fender', severity: 'Severe' },
        { issue_type: 'Broken light', location: 'Headlight', severity: 'Severe' },
        { issue_type: 'Rust', location: 'Frame', severity: 'Moderate' },
        { issue_type: 'Cracked paint', location: 'Body', severity: 'Moderate' }
      ],
      body_condition: 'Multiple dents and rust',
      paint_condition: 'Severely faded and cracked'
    },
    image_quality: {
      is_clear: true,
      angle_captured: 'Multiple angles',
      requires_retake: false
    }
  },

  validPricingData: {
    vehicle_info: { make: 'Honda', model: 'Beat', year: 2022 },
    region: 'Jawa Barat',
    pricing_breakdown: {
      base_market_price: 12500000,
      condition_adjustment: -2125000,
      regional_adjustment: 0,
      asset_value: 10375000
    },
    collateral_calculation: {
      asset_value: 10375000,
      tenor_days: 30,
      effective_collateral_value: 10322500,
      appraisal_value: 7741875
    }
  },

  validPawnCalculation: {
    product: { type: 'REGULAR', name: 'Gadai Kendaraan Reguler' },
    appraisal_value: 7741875,
    max_loan_amount: 7741875,
    sewa_modal: {
      periods: 2,
      rate_per_period: 0.012,
      total_rate: 2.4,
      sewa_modal_amount: 185805
    },
    admin_fee: 50000,
    total_repayment: 7977680
  }
};

