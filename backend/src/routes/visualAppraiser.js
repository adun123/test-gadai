const express = require('express');
const router = express.Router();
const { upload, validateFileContent } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateRegion } = require('../middleware/validator');
const { analyzeCollateral, evaluateGradeByDefects, calculateLoanOffer, getGradeReasoning } = require('../services/visualAppraiserService');

router.post('/assess', uploadLimiter, upload.array('collateral_images', 10), validateFileContent, async (req, res) => {
  try {
    const mockMode = req.body.mock_mode === 'true';
    const region = req.body.region || 'Jakarta';

    if (mockMode) {
      const mockAssessment = {
        category: 'Electronics',
        brand: 'Apple',
        model: 'iPhone 14 Pro',
        estimated_market_price: 15000000,
        defects: []
      };

      const gradeEval = evaluateGradeByDefects(mockAssessment.defects, []);
      const loanOffer = calculateLoanOffer(gradeEval.grade, mockAssessment.estimated_market_price);
      
      return res.json({
        region,
        collateral_assessment: mockAssessment,
        grade_evaluation: gradeEval,
        final_loan_offer: loanOffer,
        grade_reasoning: getGradeReasoning(gradeEval),
        mock: true
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded. At least 1 image is required.' });
    }

    let additionalDefects = [];
    if (req.body.additional_defects) {
      try {
        additionalDefects = JSON.parse(req.body.additional_defects);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid additional_defects format. Must be valid JSON array.' });
      }
    }

    const imageBuffers = req.files.map(file => file.buffer);
    const aiAssessment = await analyzeCollateral(imageBuffers, region);

    const aiDefects = aiAssessment.defects || [];
    const gradeEval = evaluateGradeByDefects(aiDefects, additionalDefects);
    const loanOffer = calculateLoanOffer(gradeEval.grade, aiAssessment.estimated_market_price);

    const response = {
      region,
      collateral_assessment: {
        ...aiAssessment,
        ai_detected_defects: aiDefects,
        employee_reported_defects: additionalDefects
      },
      grade_evaluation: gradeEval,
      final_loan_offer: loanOffer,
      grade_reasoning: getGradeReasoning(gradeEval)
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
