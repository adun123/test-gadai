const express = require('express');
const router = express.Router();
const { validatePawnDecision, validateSimulation } = require('../middleware/validator');
const {
  calculatePawnLoan,
  comparePawnProducts,
  generatePawnSimulation,
  generateFullPawnDecision,
  PAWN_PRODUCTS
} = require('../services/pawnDecisionEngineService');

router.post('/calculate', validatePawnDecision, async (req, res) => {
  try {
    const { appraisal_value, product_type, tenor_days, start_date } = req.body;

    const startDate = start_date ? new Date(start_date) : new Date();
    const calculation = calculatePawnLoan(appraisal_value, product_type, tenor_days, startDate);

    res.json(calculation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/compare', async (req, res) => {
  try {
    const { appraisal_value, tenor_days, start_date } = req.body;

    if (!appraisal_value || !tenor_days) {
      return res.status(400).json({ error: 'appraisal_value and tenor_days are required' });
    }

    const startDate = start_date ? new Date(start_date) : new Date();
    const comparison = comparePawnProducts(appraisal_value, tenor_days, startDate);

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/simulate', validateSimulation, async (req, res) => {
  try {
    const { appraisal_value, product_type, tenor_options, start_date } = req.body;

    const startDate = start_date ? new Date(start_date) : new Date();
    const simulation = generatePawnSimulation(appraisal_value, product_type, tenor_options, startDate);

    res.json(simulation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const products = Object.entries(PAWN_PRODUCTS).map(([key, product]) => ({
      type: key,
      ...product
    }));

    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/full-decision', async (req, res) => {
  try {
    const { pricing_result, tenor_days, product_type, start_date } = req.body;

    if (!pricing_result || !tenor_days || !product_type) {
      return res.status(400).json({
        error: 'pricing_result, tenor_days, and product_type are required'
      });
    }

    const startDate = start_date ? new Date(start_date) : new Date();
    const decision = generateFullPawnDecision(pricing_result, tenor_days, product_type, startDate);

    res.json(decision);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
