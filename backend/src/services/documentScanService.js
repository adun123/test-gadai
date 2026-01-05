const { getModel } = require('../config/gemini');

// JSON Schema for SLIK document (valid document)
const SLIK_VALID_SCHEMA = {
  type: "object",
  properties: {
    is_valid_document: {
      type: "boolean",
      description: "Whether this is a valid SLIK document"
    },
    detected_type: {
      type: "string",
      description: "Type of document detected if not SLIK",
      nullable: true
    },
    error: {
      type: "string",
      description: "Error message if not a valid SLIK document",
      nullable: true
    },
    full_name: {
      type: "string",
      description: "Full name of the person",
      nullable: true
    },
    credit_status: {
      type: "string",
      description: "Credit status: Lancar, Dalam Perhatian Khusus, Kurang Lancar, Diragukan, or Macet",
      nullable: true
    },
    collectibility: {
      type: "integer",
      description: "Collectibility score from 1 to 5",
      nullable: true
    },
    total_credit_facilities: {
      type: "integer",
      description: "Total number of credit facilities",
      nullable: true
    },
    existing_loans: {
      type: "array",
      items: {
        type: "object",
        properties: {
          creditor: { type: "string", description: "Bank or institution name" },
          type: { type: "string", description: "Loan type" },
          outstanding: { type: "number", description: "Outstanding amount" },
          status: { type: "string", description: "Loan status" }
        }
      },
      description: "List of existing loans",
      nullable: true
    },
    last_updated: {
      type: "string",
      description: "Last update date",
      nullable: true
    },
    confidence: {
      type: "number",
      description: "Confidence score between 0 and 1"
    }
  },
  required: ["is_valid_document", "confidence"]
};

// JSON Schema for Salary Slip document
const SALARY_SLIP_SCHEMA = {
  type: "object",
  properties: {
    is_valid_document: {
      type: "boolean",
      description: "Whether this is a valid salary slip document"
    },
    detected_type: {
      type: "string",
      description: "Type of document detected if not salary slip",
      nullable: true
    },
    error: {
      type: "string",
      description: "Error message if not a valid salary slip",
      nullable: true
    },
    full_name: {
      type: "string",
      description: "Employee full name",
      nullable: true
    },
    employee_id: {
      type: "string",
      description: "Employee ID",
      nullable: true
    },
    company_name: {
      type: "string",
      description: "Company name",
      nullable: true
    },
    position: {
      type: "string",
      description: "Job position",
      nullable: true
    },
    department: {
      type: "string",
      description: "Department",
      nullable: true
    },
    employment_status: {
      type: "string",
      description: "Employment status: Karyawan Tetap, Kontrak, Honorer, etc.",
      nullable: true
    },
    pay_period: {
      type: "string",
      description: "Pay period (month/year)",
      nullable: true
    },
    gross_income: {
      type: "number",
      description: "Gross income amount",
      nullable: true
    },
    deductions: {
      type: "object",
      properties: {
        tax: { type: "number", description: "Tax deduction", nullable: true },
        bpjs: { type: "number", description: "BPJS deduction", nullable: true },
        other: { type: "number", description: "Other deductions", nullable: true }
      },
      nullable: true
    },
    net_income: {
      type: "number",
      description: "Net income (take home pay)",
      nullable: true
    },
    confidence: {
      type: "number",
      description: "Confidence score between 0 and 1"
    }
  },
  required: ["is_valid_document", "confidence"]
};

const SLIK_SCAN_PROMPT = `You are a document OCR specialist. Analyze this document image.

First, verify if this is a SLIK OJK (credit report) document.
- If NOT a SLIK document, set is_valid_document to false and provide detected_type and error.
- If it IS a SLIK document, set is_valid_document to true and extract all visible information.

For SLIK documents, extract: full_name, credit_status (Lancar/Dalam Perhatian Khusus/Kurang Lancar/Diragukan/Macet), collectibility (1-5), total_credit_facilities, existing_loans array, and last_updated date.

Set any unclear or invisible fields to null.`;

const SALARY_SLIP_SCAN_PROMPT = `You are a document OCR specialist. Analyze this document image.

First, verify if this is a salary slip (slip gaji) document.
- If NOT a salary slip, set is_valid_document to false and provide detected_type and error.
- If it IS a salary slip, set is_valid_document to true and extract all visible information.

For salary slips, extract: full_name, employee_id, company_name, position, department, employment_status (Karyawan Tetap/Kontrak/Honorer/etc), pay_period, gross_income, deductions (tax, bpjs, other), and net_income.

Set any unclear or invisible fields to null.`;

async function scanSlikDocument(fileBuffer, mimeType = 'image/jpeg') {
  try {
    const model = getModel();

    const filePart = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: SLIK_SCAN_PROMPT }, filePart] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: SLIK_VALID_SCHEMA
      }
    });

    const response = await result.response;
    const text = response.text();
    const parsed = JSON.parse(text);

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

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: SALARY_SLIP_SCAN_PROMPT }, filePart] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: SALARY_SLIP_SCHEMA
      }
    });

    const response = await result.response;
    const text = response.text();
    const parsed = JSON.parse(text);

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
