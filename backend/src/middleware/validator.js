const { body, query, validationResult } = require('express-validator');

const VALID_PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan',
  'Bengkulu', 'Lampung', 'Kepulauan Bangka Belitung', 'Kepulauan Riau',
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat',
  'Maluku', 'Maluku Utara',
  'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan', 'Papua Barat Daya'
];


const VALID_VEHICLE_TYPES = ['Manual', 'Matic', 'Sport', 'Vespa', 'Trail', 'Cruiser', 'Electric'];
const VALID_PAWN_PRODUCTS = ['REGULAR', 'DAILY'];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateDocumentUpload = [
  body('province').optional().trim().isIn(VALID_PROVINCES).withMessage('Invalid province'),
  handleValidationErrors
];

const validateVehicleAnalysis = [
  body('province').optional().trim().isIn(VALID_PROVINCES).withMessage('Invalid province'),
  body('vehicle_type').optional().trim().isIn(VALID_VEHICLE_TYPES).withMessage('Invalid vehicle type'),
  body('make').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Make must be 2-50 characters'),
  body('model').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Model must be 2-50 characters'),
  body('year').optional().isInt({ min: 2000, max: new Date().getFullYear() }).withMessage('Invalid year'),
  body('color').optional().trim().isLength({ min: 2, max: 30 }).withMessage('Color must be 2-30 characters'),
  body('license_plate').optional().trim().isLength({ min: 4, max: 15 }).withMessage('Invalid license plate format'),
  body('additional_defects').optional().isJSON().withMessage('Additional defects must be valid JSON'),
  handleValidationErrors
];

const validatePricingRequest = [
  body('province').trim().notEmpty().isIn(VALID_PROVINCES).withMessage('Valid province is required'),
  body('make').trim().notEmpty().isLength({ min: 2, max: 50 }).withMessage('Vehicle make is required'),
  body('model').trim().notEmpty().isLength({ min: 2, max: 50 }).withMessage('Vehicle model is required'),
  body('year').isInt({ min: 2000, max: new Date().getFullYear() }).withMessage('Valid year is required'),
  body('condition_grade').optional().isIn(['Excellent', 'Good', 'Fair', 'Poor']).withMessage('Invalid condition grade'),
  handleValidationErrors
];

const validatePawnDecision = [
  body('appraisal_value').isFloat({ min: 50000 }).withMessage('Appraisal value must be at least 50,000'),
  body('product_type').isIn(VALID_PAWN_PRODUCTS).withMessage('Product type must be REGULAR or DAILY'),
  body('tenor_days').isInt({ min: 1, max: 120 }).withMessage('Tenor must be between 1 and 120 days'),
  body('start_date').optional().isISO8601().withMessage('Invalid start date format'),
  handleValidationErrors
];

const validateSimulation = [
  body('appraisal_value').isFloat({ min: 50000 }).withMessage('Appraisal value must be at least 50,000'),
  body('product_type').isIn(VALID_PAWN_PRODUCTS).withMessage('Product type must be REGULAR or DAILY'),
  body('tenor_options').isArray({ min: 1 }).withMessage('At least one tenor option is required'),
  body('tenor_options.*').isInt({ min: 1, max: 120 }).withMessage('Each tenor must be between 1 and 120 days'),
  handleValidationErrors
];

const validateFullAssessment = [
  body('province').optional().trim().isIn(VALID_PROVINCES).withMessage('Invalid province'),
  body('tenor_days').optional().isInt({ min: 1, max: 120 }).withMessage('Tenor must be between 1 and 120 days'),
  body('product_type').optional().isIn(VALID_PAWN_PRODUCTS).withMessage('Product type must be REGULAR or DAILY'),
  handleValidationErrors
];

module.exports = {
  validateDocumentUpload,
  validateVehicleAnalysis,
  validatePricingRequest,
  validatePawnDecision,
  validateSimulation,
  validateFullAssessment,
  VALID_PROVINCES,
  VALID_VEHICLE_TYPES,
  VALID_PAWN_PRODUCTS
};
