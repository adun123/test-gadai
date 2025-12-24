const { getModel } = require('../config/gemini');
const stringSimilarity = require('string-similarity');

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
  const formName = formData.full_name.toLowerCase().trim();
  const formIncome = formData.monthly_income;
  
  const issues = [];
  
  for (const doc of documents) {
    if (doc.nik && doc.nik !== formNIK) {
      issues.push({
        type: 'NIK_MISMATCH',
        message: `NIK mismatch: Form (${formNIK}) vs Document (${doc.nik})`,
        severity: 'CRITICAL'
      });
    }
    
    if (doc.full_name) {
      const docName = doc.full_name.toLowerCase().trim();
      const similarity = stringSimilarity.compareTwoStrings(formName, docName);
      
      if (similarity < 0.8) {
        issues.push({
          type: 'NAME_MISMATCH',
          message: `Name mismatch: Form (${formData.full_name}) vs Document (${doc.full_name}, ${(similarity * 100).toFixed(0)}% similar)`,
          severity: 'CRITICAL'
        });
      }
    }
    
    if (doc.net_income && doc.detected_document_type === 'SALARY_SLIP') {
      const incomeDiff = Math.abs(formIncome - doc.net_income);
      const diffPercentage = (incomeDiff / doc.net_income) * 100;
      
      if (diffPercentage > 10) {
        issues.push({
          type: 'INCOME_MISMATCH',
          message: `Income discrepancy: Form claims ${formIncome} but slip shows ${doc.net_income} (${diffPercentage.toFixed(1)}% difference)`,
          severity: 'HIGH'
        });
      }
    }
  }
  
  const documentNames = documents
    .filter(d => d.full_name)
    .map(d => d.full_name.toLowerCase().trim());
  
  if (documentNames.length > 1) {
    for (let i = 0; i < documentNames.length - 1; i++) {
      for (let j = i + 1; j < documentNames.length; j++) {
        const similarity = stringSimilarity.compareTwoStrings(documentNames[i], documentNames[j]);
        if (similarity < 0.8) {
          issues.push({
            type: 'CROSS_DOCUMENT_MISMATCH',
            message: `Documents show different names: ${documents[i].full_name} vs ${documents[j].full_name}`,
            severity: 'CRITICAL'
          });
        }
      }
    }
  }
  
  const hasCritical = issues.some(i => i.severity === 'CRITICAL');
  
  return {
    match_status: hasCritical ? 'MISMATCH' : (issues.length > 0 ? 'WARNING' : 'MATCH'),
    message: hasCritical ? 'Critical validation errors found' : (issues.length > 0 ? 'Minor discrepancies detected' : 'All data verified'),
    issues: issues.length > 0 ? issues : undefined
  };
}

function calculateCreditScore(formData, extractedData, verification = null) {
  if (verification && verification.match_status === 'MISMATCH') {
    return {
      risk_score: 'REJECT',
      reason: 'Document verification failed - Critical data mismatch detected',
      validation_issues: verification.issues,
      collectibility: null,
      dbr: null,
      monthly_installment: null
    };
  }
  
  const slik = extractedData.find(d => d.detected_document_type === 'SLIK');
  const salarySlip = extractedData.find(d => d.detected_document_type === 'SALARY_SLIP');
  
  const collectibility = slik?.collectibility || 1;
  const documentedIncome = salarySlip?.net_income;
  const claimedIncome = formData.monthly_income;
  const loanAmount = formData.loan_amount;
  const tenor = formData.tenor || 12;
  
  if (!documentedIncome) {
    return {
      risk_score: 'REJECT',
      reason: 'No valid salary slip detected - Cannot verify income claim',
      collectibility,
      dbr: null,
      monthly_installment: null,
      income_used: 'none'
    };
  }
  
  const salary = documentedIncome;
  
  if (collectibility > 2) {
    return {
      risk_score: 'REJECT',
      reason: 'Collectibility > 2 (Bad debt history)',
      collectibility,
      dbr: null,
      monthly_installment: null
    };
  }
  
  const interestRate = 0.02;
  const monthlyInterest = loanAmount * interestRate;
  const principal = loanAmount / tenor;
  const monthlyInstallment = principal + monthlyInterest;
  
  const dbr = (monthlyInstallment / salary) * 100;
  
  if (dbr > 40) {
    return {
      risk_score: 'HIGH_RISK',
      reason: `DBR ${dbr.toFixed(1)}% > 40% (Monthly installment ${monthlyInstallment.toLocaleString()} exceeds safe limit for income ${salary.toLocaleString()})`,
      collectibility,
      dbr: parseFloat(dbr.toFixed(2)),
      monthly_installment: Math.round(monthlyInstallment),
      tenor,
      documented_income: documentedIncome,
      income_used: 'documented'
    };
  }
  
  const warningNote = verification?.match_status === 'WARNING' ? ' (Minor discrepancies detected)' : '';
  
  return {
    risk_score: 'LOW_RISK',
    reason: `DBR ${dbr.toFixed(1)}% within safe limit${warningNote}`,
    collectibility,
    dbr: parseFloat(dbr.toFixed(2)),
    monthly_installment: Math.round(monthlyInstallment),
    tenor,
    documented_income: documentedIncome,
    income_used: 'documented',
    validation_warnings: verification?.issues
  };
}

module.exports = {
  extractTextFromDocument,
  verifyData,
  calculateCreditScore
};
