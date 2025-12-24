const { body, validationResult } = require('express-validator');

const validateFinancialInput = [
  body('region').trim().notEmpty().withMessage('Region is required'),
  body('nik').trim().isLength({ min: 16, max: 16 }).isNumeric().withMessage('NIK must be 16 digit number'),
  body('full_name').trim().notEmpty().isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters'),
  body('monthly_income').isFloat({ min: 0 }).withMessage('Monthly income must be a positive number'),
  body('loan_amount').isFloat({ min: 0 }).withMessage('Loan amount must be a positive number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

const validateRegion = [
  body('region').optional().trim().isLength({ min: 3, max: 50 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateFinancialInput, validateRegion };
