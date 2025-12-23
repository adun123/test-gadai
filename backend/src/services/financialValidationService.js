const { getModel } = require('../config/gemini');

async function extractTextFromDocument(imageBuffer) {
  try {
    const model = getModel();
    
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    };

    const prompt = `Extract all text from this document. Return structured JSON with:
{
  "nik": "extracted NIK number",
  "full_name": "extracted name",
  "net_income": "net income amount as number",
  "collectibility": "collectibility score as number (1-5)",
  "detected_document_type": "SLIK or SALARY_SLIP"
}`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { extracted: text };
  } catch (error) {
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
}

async function verifyData(formData, documents) {
  const formNIK = formData.nik;
  
  for (const doc of documents) {
    if (doc.nik && doc.nik !== formNIK) {
      return {
        match_status: 'MISMATCH',
        message: 'NIK on form does not match document'
      };
    }
  }
  
  return {
    match_status: 'MATCH',
    message: 'All data verified'
  };
}

function calculateCreditScore(formData, extractedData) {
  const slik = extractedData.find(d => d.detected_document_type === 'SLIK');
  const salarySlip = extractedData.find(d => d.detected_document_type === 'SALARY_SLIP');
  
  const collectibility = slik?.collectibility || 1;
  const salary = salarySlip?.net_income || formData.monthly_income;
  const loanAmount = formData.loan_amount;
  
  if (collectibility > 2) {
    return {
      risk_score: 'REJECT',
      reason: 'Collectibility > 2 (Bad debt)',
      collectibility,
      dbr: null
    };
  }
  
  const dbr = (loanAmount / salary) * 100;
  
  if (dbr > 40) {
    return {
      risk_score: 'HIGH_RISK',
      reason: 'DBR (Debt to Income Ratio) > 40%',
      collectibility,
      dbr
    };
  }
  
  return {
    risk_score: 'LOW_RISK',
    reason: 'Meets all criteria',
    collectibility,
    dbr
  };
}

module.exports = {
  extractTextFromDocument,
  verifyData,
  calculateCreditScore
};
