const { getModel } = require('../config/gemini');

const DOCUMENT_EXTRACTION_PROMPT = `You are a professional document OCR and data extraction system for a financial institution.
Analyze the uploaded document image(s) and extract relevant information.

For SLIK OJK documents, extract:
- Full name of the person
- Credit status (Lancar/Kurang Lancar/Diragukan/Macet)
- Collectibility score (1-5)
- Any existing credit obligations

For Salary Slip documents, extract:
- Full name of the employee
- Company name
- Position/Job title
- Employment status (Karyawan Tetap/Kontrak/Honorer)
- Gross income
- Net income (take home pay)
- Pay period

Return the data in the following JSON structure:
{
  "document_type": "SLIK" or "SALARY_SLIP",
  "extracted_data": {
    "full_name": "string",
    "credit_status": "string (for SLIK only)",
    "collectibility": number (for SLIK only, 1-5),
    "existing_obligations": [array of strings] (for SLIK only),
    "company_name": "string (for SALARY_SLIP only)",
    "position": "string (for SALARY_SLIP only)",
    "employment_status": "string (for SALARY_SLIP only)",
    "gross_income": number (for SALARY_SLIP only),
    "net_income": number (for SALARY_SLIP only),
    "pay_period": "string (for SALARY_SLIP only)"
  },
  "confidence_score": number (0-1),
  "extraction_notes": "any issues or observations during extraction"
}`;

async function extractDocumentData(imageBuffer, documentType = null) {
  try {
    const model = getModel();

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    };

    const contextPrompt = documentType
      ? `${DOCUMENT_EXTRACTION_PROMPT}\n\nExpected document type: ${documentType}`
      : DOCUMENT_EXTRACTION_PROMPT;

    const result = await model.generateContent([contextPrompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      document_type: 'UNKNOWN',
      extracted_data: {},
      confidence_score: 0,
      extraction_notes: 'Failed to parse extraction result'
    };
  } catch (error) {
    throw new Error(`Document extraction failed: ${error.message}`);
  }
}

async function processMultipleDocuments(documents) {
  const results = {
    slik: null,
    salary_slip: null,
    validation_summary: {
      all_documents_processed: false,
      name_consistency: null,
      issues: []
    }
  };

  for (const doc of documents) {
    const extracted = await extractDocumentData(doc.buffer, doc.type);

    if (extracted.document_type === 'SLIK' || doc.type === 'SLIK') {
      results.slik = extracted;
    } else if (extracted.document_type === 'SALARY_SLIP' || doc.type === 'SALARY_SLIP') {
      results.salary_slip = extracted;
    }
  }

  results.validation_summary.all_documents_processed = !!(results.slik && results.salary_slip);

  if (results.slik && results.salary_slip) {
    const slikName = results.slik.extracted_data?.full_name?.toLowerCase().trim();
    const salaryName = results.salary_slip.extracted_data?.full_name?.toLowerCase().trim();

    if (slikName && salaryName) {
      const similarity = calculateNameSimilarity(slikName, salaryName);
      results.validation_summary.name_consistency = similarity >= 0.8 ? 'MATCH' : 'MISMATCH';

      if (similarity < 0.8) {
        results.validation_summary.issues.push({
          type: 'NAME_MISMATCH',
          message: `Names do not match between documents`,
          severity: 'HIGH'
        });
      }
    }
  }

  return results;
}

function calculateNameSimilarity(str1, str2) {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);

  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || (word1.length > 2 && word2.includes(word1)) || (word2.length > 2 && word1.includes(word2))) {
        matches++;
        break;
      }
    }
  }

  return matches / Math.max(words1.length, words2.length);
}

function summarizeFinancialProfile(ocrResults) {
  const profile = {
    applicant_name: null,
    document_type: null,
    credit_status: null,
    income_range: null,
    employment_status: null,
    risk_indicators: []
  };

  if (ocrResults.slik?.extracted_data) {
    const slik = ocrResults.slik.extracted_data;
    profile.applicant_name = slik.full_name;
    profile.credit_status = slik.credit_status;

    if (slik.collectibility && slik.collectibility > 2) {
      profile.risk_indicators.push({
        type: 'CREDIT_HISTORY',
        message: `Collectibility score: ${slik.collectibility}`,
        severity: 'HIGH'
      });
    }
  }

  if (ocrResults.salary_slip?.extracted_data) {
    const salary = ocrResults.salary_slip.extracted_data;
    if (!profile.applicant_name) {
      profile.applicant_name = salary.full_name;
    }
    profile.employment_status = salary.employment_status;

    const netIncome = salary.net_income;
    if (netIncome) {
      if (netIncome < 3000000) {
        profile.income_range = 'Below 3 million / month';
      } else if (netIncome < 5000000) {
        profile.income_range = '3-5 million / month';
      } else if (netIncome < 7000000) {
        profile.income_range = '5-7 million / month';
      } else if (netIncome < 10000000) {
        profile.income_range = '7-10 million / month';
      } else if (netIncome < 15000000) {
        profile.income_range = '10-15 million / month';
      } else {
        profile.income_range = 'Above 15 million / month';
      }
    }
  }

  if (ocrResults.validation_summary?.issues?.length > 0) {
    profile.risk_indicators.push(...ocrResults.validation_summary.issues);
  }

  return profile;
}

module.exports = {
  extractDocumentData,
  processMultipleDocuments,
  summarizeFinancialProfile,
  calculateNameSimilarity
};
