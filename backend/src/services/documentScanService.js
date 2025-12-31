const { getModel } = require('../config/gemini');

const SLIK_SCAN_PROMPT = `You are a document OCR specialist. First, verify if this is a SLIK OJK (credit report) document.

If this is NOT a SLIK document (e.g., salary slip, KTP, or other document), return:
{
  "is_valid_document": false,
  "detected_type": "type of document you see",
  "error": "This is not a SLIK document"
}

If this IS a SLIK document, extract all visible information and return:
{
  "is_valid_document": true,
  "full_name": "extracted name",
  "credit_status": "Lancar/Dalam Perhatian Khusus/Kurang Lancar/Diragukan/Macet",
  "collectibility": number (1-5),
  "total_credit_facilities": number,
  "existing_loans": [
    {
      "creditor": "bank/institution name",
      "type": "loan type",
      "outstanding": number,
      "status": "status"
    }
  ],
  "last_updated": "date if visible",
  "confidence": number (0-1)
}

If a field is not visible or unclear, set it to null.`;

const SALARY_SLIP_SCAN_PROMPT = `You are a document OCR specialist. First, verify if this is a salary slip (slip gaji) document.

If this is NOT a salary slip (e.g., SLIK, KTP, or other document), return:
{
  "is_valid_document": false,
  "detected_type": "type of document you see",
  "error": "This is not a salary slip document"
}

If this IS a salary slip, extract all visible information and return:
{
  "is_valid_document": true,
  "full_name": "employee name",
  "employee_id": "ID if visible",
  "company_name": "company name",
  "position": "job position",
  "department": "department if visible",
  "employment_status": "Karyawan Tetap/Kontrak/Honorer/etc",
  "pay_period": "month/year",
  "gross_income": number,
  "deductions": {
    "tax": number,
    "bpjs": number,
    "other": number
  },
  "net_income": number,
  "confidence": number (0-1)
}

If a field is not visible or unclear, set it to null.`;

async function scanSlikDocument(fileBuffer, mimeType = 'image/jpeg') {
  try {
    const model = getModel();

    const filePart = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    const result = await model.generateContent([SLIK_SCAN_PROMPT, filePart]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Check if document type is valid
      if (parsed.is_valid_document === false) {
        return {
          success: false,
          document_type: 'SLIK',
          detected_type: parsed.detected_type,
          error: parsed.error || 'Wrong document type uploaded',
          scanned_at: new Date().toISOString()
        };
      }
      
      return {
        success: true,
        document_type: 'SLIK',
        scanned_data: parsed,
        scanned_at: new Date().toISOString(),
        is_editable: true
      };
    }

    return {
      success: false,
      document_type: 'SLIK',
      scanned_data: null,
      error: 'Failed to parse document',
      is_editable: true
    };
  } catch (error) {
    return {
      success: false,
      document_type: 'SLIK',
      scanned_data: null,
      error: error.message,
      is_editable: true
    };
  }
}

async function scanSalarySlipDocument(fileBuffer, mimeType = 'image/jpeg') {
  try {
    const model = getModel();

    const filePart = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    const result = await model.generateContent([SALARY_SLIP_SCAN_PROMPT, filePart]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Check if document type is valid
      if (parsed.is_valid_document === false) {
        return {
          success: false,
          document_type: 'SALARY_SLIP',
          detected_type: parsed.detected_type,
          error: parsed.error || 'Wrong document type uploaded',
          scanned_at: new Date().toISOString()
        };
      }
      
      return {
        success: true,
        document_type: 'SALARY_SLIP',
        scanned_data: parsed,
        scanned_at: new Date().toISOString(),
        is_editable: true
      };
    }

    return {
      success: false,
      document_type: 'SALARY_SLIP',
      scanned_data: null,
      error: 'Failed to parse document',
      is_editable: true
    };
  } catch (error) {
    return {
      success: false,
      document_type: 'SALARY_SLIP',
      scanned_data: null,
      error: error.message,
      is_editable: true
    };
  }
}

function getMockSlikScan() {
  return {
    success: true,
    document_type: 'SLIK',
    scanned_data: {
      full_name: 'Budi Santoso',
      credit_status: 'Lancar',
      collectibility: 1,
      total_credit_facilities: 2,
      existing_loans: [
        {
          creditor: 'Bank BCA',
          type: 'KPR',
          outstanding: 150000000,
          status: 'Lancar'
        }
      ],
      last_updated: '2025-12-01',
      confidence: 0.92
    },
    scanned_at: new Date().toISOString(),
    is_editable: true
  };
}

function getMockSalarySlipScan() {
  return {
    success: true,
    document_type: 'SALARY_SLIP',
    scanned_data: {
      full_name: 'Budi Santoso',
      employee_id: 'EMP-2024-001',
      company_name: 'PT Maju Bersama',
      position: 'Staff IT',
      department: 'Technology',
      employment_status: 'Karyawan Tetap',
      pay_period: 'Desember 2025',
      gross_income: 10000000,
      deductions: {
        tax: 500000,
        bpjs: 400000,
        other: 100000
      },
      net_income: 9000000,
      confidence: 0.89
    },
    scanned_at: new Date().toISOString(),
    is_editable: true
  };
}

function summarizeDocuments(slikData, salaryData) {
  const summary = {
    applicant_name: slikData?.full_name || salaryData?.full_name || null,
    credit_status: slikData?.credit_status || null,
    collectibility: slikData?.collectibility || null,
    employment_status: salaryData?.employment_status || null,
    company_name: salaryData?.company_name || null,
    position: salaryData?.position || null,
    net_income: salaryData?.net_income || null,
    income_range: null,
    risk_indicators: []
  };

  if (summary.net_income) {
    const income = summary.net_income;
    if (income < 3000000) summary.income_range = 'Below 3 million / month';
    else if (income < 5000000) summary.income_range = '3-5 million / month';
    else if (income < 7000000) summary.income_range = '5-7 million / month';
    else if (income < 10000000) summary.income_range = '7-10 million / month';
    else if (income < 15000000) summary.income_range = '10-15 million / month';
    else summary.income_range = 'Above 15 million / month';
  }

  if (summary.collectibility && summary.collectibility > 2) {
    summary.risk_indicators.push({
      type: 'CREDIT_HISTORY',
      message: `Collectibility score: ${summary.collectibility}`,
      severity: 'HIGH'
    });
  }

  return summary;
}

module.exports = {
  scanSlikDocument,
  scanSalarySlipDocument,
  getMockSlikScan,
  getMockSalarySlipScan,
  summarizeDocuments
};
