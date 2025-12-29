const { 
  scanSlikDocument, 
  scanSalarySlipDocument, 
  getMockSlikScan, 
  getMockSalarySlipScan, 
  summarizeDocuments 
} = require('../../src/services/documentScanService');

jest.mock('../../src/config/gemini');

describe('DocumentScanService', () => {
  describe('getMockSlikScan', () => {
    test('should return mock SLIK scan data with editable flag', () => {
      const result = getMockSlikScan();

      expect(result.success).toBe(true);
      expect(result.document_type).toBe('SLIK');
      expect(result.is_editable).toBe(true);
      expect(result.scanned_data).toBeDefined();
    });

    test('should include all SLIK fields', () => {
      const result = getMockSlikScan();
      const { scanned_data } = result;

      expect(scanned_data.full_name).toBeDefined();
      expect(scanned_data.credit_status).toBeDefined();
      expect(scanned_data.collectibility).toBeDefined();
      expect(scanned_data.total_credit_facilities).toBeDefined();
      expect(scanned_data.existing_loans).toBeInstanceOf(Array);
    });

    test('should have valid collectibility range', () => {
      const result = getMockSlikScan();
      
      expect(result.scanned_data.collectibility).toBeGreaterThanOrEqual(1);
      expect(result.scanned_data.collectibility).toBeLessThanOrEqual(5);
    });
  });

  describe('getMockSalarySlipScan', () => {
    test('should return mock salary slip scan data with editable flag', () => {
      const result = getMockSalarySlipScan();

      expect(result.success).toBe(true);
      expect(result.document_type).toBe('SALARY_SLIP');
      expect(result.is_editable).toBe(true);
      expect(result.scanned_data).toBeDefined();
    });

    test('should include all salary slip fields', () => {
      const result = getMockSalarySlipScan();
      const { scanned_data } = result;

      expect(scanned_data.full_name).toBeDefined();
      expect(scanned_data.company_name).toBeDefined();
      expect(scanned_data.position).toBeDefined();
      expect(scanned_data.employment_status).toBeDefined();
      expect(scanned_data.gross_income).toBeDefined();
      expect(scanned_data.net_income).toBeDefined();
      expect(scanned_data.deductions).toBeDefined();
    });

    test('should have valid income values', () => {
      const result = getMockSalarySlipScan();
      const { scanned_data } = result;

      expect(scanned_data.net_income).toBeLessThanOrEqual(scanned_data.gross_income);
      expect(scanned_data.net_income).toBeGreaterThan(0);
    });
  });

  describe('summarizeDocuments', () => {
    test('should summarize SLIK and salary data together', () => {
      const slikData = {
        full_name: 'Budi Santoso',
        credit_status: 'Lancar',
        collectibility: 1
      };

      const salaryData = {
        full_name: 'Budi Santoso',
        company_name: 'PT Test',
        position: 'Staff',
        employment_status: 'Karyawan Tetap',
        net_income: 8000000
      };

      const result = summarizeDocuments(slikData, salaryData);

      expect(result.applicant_name).toBe('Budi Santoso');
      expect(result.credit_status).toBe('Lancar');
      expect(result.collectibility).toBe(1);
      expect(result.employment_status).toBe('Karyawan Tetap');
      expect(result.net_income).toBe(8000000);
    });

    test('should calculate income range correctly', () => {
      const slikData = { full_name: 'Test' };
      
      // Below 3 million
      let result = summarizeDocuments(slikData, { net_income: 2500000 });
      expect(result.income_range).toBe('Below 3 million / month');

      // 3-5 million
      result = summarizeDocuments(slikData, { net_income: 4000000 });
      expect(result.income_range).toBe('3-5 million / month');

      // 5-7 million
      result = summarizeDocuments(slikData, { net_income: 6000000 });
      expect(result.income_range).toBe('5-7 million / month');

      // 7-10 million
      result = summarizeDocuments(slikData, { net_income: 8500000 });
      expect(result.income_range).toBe('7-10 million / month');

      // 10-15 million
      result = summarizeDocuments(slikData, { net_income: 12000000 });
      expect(result.income_range).toBe('10-15 million / month');

      // Above 15 million
      result = summarizeDocuments(slikData, { net_income: 20000000 });
      expect(result.income_range).toBe('Above 15 million / month');
    });

    test('should add risk indicator for bad collectibility', () => {
      const slikData = {
        full_name: 'Test',
        credit_status: 'Kurang Lancar',
        collectibility: 3
      };

      const result = summarizeDocuments(slikData, null);

      expect(result.risk_indicators.length).toBeGreaterThan(0);
      expect(result.risk_indicators[0].type).toBe('CREDIT_HISTORY');
      expect(result.risk_indicators[0].severity).toBe('HIGH');
    });

    test('should not add risk indicator for good collectibility', () => {
      const slikData = {
        full_name: 'Test',
        credit_status: 'Lancar',
        collectibility: 1
      };

      const result = summarizeDocuments(slikData, null);

      expect(result.risk_indicators.length).toBe(0);
    });

    test('should handle null SLIK data', () => {
      const salaryData = {
        full_name: 'Test User',
        company_name: 'PT Test',
        net_income: 5000000
      };

      const result = summarizeDocuments(null, salaryData);

      expect(result.applicant_name).toBe('Test User');
      expect(result.credit_status).toBeNull();
      expect(result.net_income).toBe(5000000);
    });

    test('should handle null salary data', () => {
      const slikData = {
        full_name: 'Test User',
        credit_status: 'Lancar',
        collectibility: 1
      };

      const result = summarizeDocuments(slikData, null);

      expect(result.applicant_name).toBe('Test User');
      expect(result.credit_status).toBe('Lancar');
      expect(result.net_income).toBeNull();
    });
  });

  describe('scanSlikDocument', () => {
    const { getModel } = require('../../src/config/gemini');

    test('should return scan result when AI responds correctly', async () => {
      const mockResponse = {
        full_name: 'Test User',
        credit_status: 'Lancar',
        collectibility: 1,
        confidence: 0.9
      };

      getModel.mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse)
          }
        })
      });

      const result = await scanSlikDocument(Buffer.from('test'));

      expect(result.success).toBe(true);
      expect(result.document_type).toBe('SLIK');
      expect(result.scanned_data).toBeDefined();
      expect(result.is_editable).toBe(true);
    });

    test('should return error on failure', async () => {
      getModel.mockReturnValue({
        generateContent: jest.fn().mockRejectedValue(new Error('API error'))
      });

      const result = await scanSlikDocument(Buffer.from('test'));

      expect(result.success).toBe(false);
      expect(result.error).toBe('API error');
      expect(result.is_editable).toBe(true);
    });
  });

  describe('scanSalarySlipDocument', () => {
    const { getModel } = require('../../src/config/gemini');

    test('should return scan result when AI responds correctly', async () => {
      const mockResponse = {
        full_name: 'Test User',
        company_name: 'PT Test',
        net_income: 5000000,
        confidence: 0.85
      };

      getModel.mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse)
          }
        })
      });

      const result = await scanSalarySlipDocument(Buffer.from('test'));

      expect(result.success).toBe(true);
      expect(result.document_type).toBe('SALARY_SLIP');
      expect(result.scanned_data).toBeDefined();
      expect(result.is_editable).toBe(true);
    });

    test('should return error on failure', async () => {
      getModel.mockReturnValue({
        generateContent: jest.fn().mockRejectedValue(new Error('API error'))
      });

      const result = await scanSalarySlipDocument(Buffer.from('test'));

      expect(result.success).toBe(false);
      expect(result.error).toBe('API error');
      expect(result.is_editable).toBe(true);
    });
  });
});
