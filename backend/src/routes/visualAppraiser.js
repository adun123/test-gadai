const express = require('express');
const router = express.Router();
const { upload, validateFileContent } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateRegion } = require('../middleware/validator');
const { analyzeCollateral } = require('../services/visualAppraiserService');

router.post('/assess', uploadLimiter, validateRegion, upload.array('images', 10), validateFileContent, async (req, res) => {
  try {
    const region = req.body.region || 'Jakarta';
    const riskScore = req.body.risk_score || 'LOW_RISK';
    const mockMode = req.body.mock_mode === 'true';

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded. At least 1 image is required.' });
    }

    const additionalDefects = req.body.additional_defects ? JSON.parse(req.body.additional_defects) : [];

    const imageBuffers = req.files.map(file => file.buffer);

    const assessment = await analyzeCollateral(imageBuffers, region, riskScore, additionalDefects);

    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
