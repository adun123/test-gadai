const express = require('express');
const router = express.Router();
const { upload, validateFileContent } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateFinancialInput } = require('../middleware/validator');
const { extractTextFromDocument, verifyData, calculateCreditScore } = require('../services/financialValidationService');

router.post('/process', uploadLimiter, upload.fields([
  { name: 'slik', maxCount: 1 },
  { name: 'salary_slip', maxCount: 1 }
]), validateFileContent, validateFinancialInput, async (req, res) => {
  try {
    const mockMode = req.body.mock_mode === 'true';

    const formData = {
      region: req.body.region || 'Jakarta',
      nik: req.body.nik || '3174012501950001',
      full_name: req.body.full_name || 'John Doe',
      monthly_income: parseFloat(req.body.monthly_income) || 8000000,
      loan_amount: parseFloat(req.body.loan_amount) || 20000000
    };

    if (mockMode) {
      const mockExtractedData = [
        { 
          detected_document_type: 'SLIK', 
          nik: formData.nik, 
          collectibility: 1 
        },
        { 
          detected_document_type: 'SALARY_SLIP', 
          net_income: formData.monthly_income 
        }
      ];

      const mockCreditScore = calculateCreditScore(formData, mockExtractedData);

      return res.json({
        region: formData.region,
        applicant: {
          nik: formData.nik,
          full_name: formData.full_name,
          monthly_income: formData.monthly_income,
          loan_amount: formData.loan_amount
        },
        documents_verification: {
          slik_detected: true,
          salary_slip_detected: true,
          data_match_status: "MATCH"
        },
        risk_assessment: mockCreditScore,
        extracted_data: mockExtractedData,
        mock: true
      });
    }

    if (!req.files || !req.files.slik || !req.files.salary_slip) {
      return res.status(400).json({ 
        error: 'Both SLIK and salary_slip files are required. Use mock_mode=true for testing without files.' 
      });
    }

    const extractedData = [];
    
    if (req.files.slik) {
      const slikData = await extractTextFromDocument(req.files.slik[0].buffer);
      slikData.detected_document_type = 'SLIK';
      extractedData.push(slikData);
    }
    
    if (req.files.salary_slip) {
      const salarySlipData = await extractTextFromDocument(req.files.salary_slip[0].buffer);
      salarySlipData.detected_document_type = 'SALARY_SLIP';
      extractedData.push(salarySlipData);
    }

    const verification = await verifyData(formData, extractedData);
    
    const creditScore = calculateCreditScore(formData, extractedData, verification);

    const response = {
      region: formData.region,
      applicant: {
        nik: formData.nik,
        full_name: formData.full_name,
        monthly_income: formData.monthly_income,
        loan_amount: formData.loan_amount
      },
      documents_verification: {
        slik_detected: !!req.files.slik,
        salary_slip_detected: !!req.files.salary_slip,
        data_match_status: verification.match_status,
        message: verification.message,
        issues: verification.issues
      },
      risk_assessment: creditScore,
      extracted_data: extractedData
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
