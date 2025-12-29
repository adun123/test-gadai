jest.mock('../../src/config/gemini', () => ({
  getModel: jest.fn(() => ({
    generateContent: jest.fn()
  }))
}));

const { calculateNameSimilarity, summarizeFinancialProfile } = require('../../src/services/documentOcrService');

describe('Document OCR Service', () => {
  describe('calculateNameSimilarity()', () => {
    test('should return 1 for identical names', () => {
      const result = calculateNameSimilarity('budi santoso', 'budi santoso');
      expect(result).toBe(1);
    });

    test('should return high similarity for names with matching words', () => {
      const result = calculateNameSimilarity('budi santoso', 'budi s');
      expect(result).toBeGreaterThanOrEqual(0.5);
    });

    test('should return low similarity for completely different names', () => {
      const result = calculateNameSimilarity('budi santoso', 'andi wijaya');
      expect(result).toBeLessThan(0.5);
    });

    test('should handle partial name matches', () => {
      const result = calculateNameSimilarity('muhammad budi santoso', 'budi santoso');
      expect(result).toBeGreaterThan(0.6);
    });
  });

  describe('summarizeFinancialProfile()', () => {
    test('should extract profile from SLIK data', () => {
      const ocrResults = {
        slik: {
          extracted_data: {
            full_name: 'Budi Santoso',
            credit_status: 'Lancar',
            collectibility: 1
          }
        },
        salary_slip: null,
        validation_summary: { issues: [] }
      };

      const profile = summarizeFinancialProfile(ocrResults);

      expect(profile.applicant_name).toBe('Budi Santoso');
      expect(profile.credit_status).toBe('Lancar');
      expect(profile.risk_indicators).toHaveLength(0);
    });

    test('should add risk indicator for bad collectibility', () => {
      const ocrResults = {
        slik: {
          extracted_data: {
            full_name: 'Budi Santoso',
            credit_status: 'Macet',
            collectibility: 4
          }
        },
        salary_slip: null,
        validation_summary: { issues: [] }
      };

      const profile = summarizeFinancialProfile(ocrResults);

      expect(profile.risk_indicators.length).toBeGreaterThan(0);
      expect(profile.risk_indicators.some(r => r.type === 'CREDIT_HISTORY')).toBe(true);
    });

    test('should calculate income range correctly', () => {
      const testCases = [
        { income: 2500000, expected: 'Below 3 million / month' },
        { income: 4000000, expected: '3-5 million / month' },
        { income: 6000000, expected: '5-7 million / month' },
        { income: 8500000, expected: '7-10 million / month' },
        { income: 12000000, expected: '10-15 million / month' },
        { income: 20000000, expected: 'Above 15 million / month' }
      ];

      for (const tc of testCases) {
        const ocrResults = {
          slik: null,
          salary_slip: {
            extracted_data: {
              full_name: 'Test User',
              net_income: tc.income
            }
          },
          validation_summary: { issues: [] }
        };

        const profile = summarizeFinancialProfile(ocrResults);
        expect(profile.income_range).toBe(tc.expected);
      }
    });

    test('should extract employment status from salary slip', () => {
      const ocrResults = {
        slik: null,
        salary_slip: {
          extracted_data: {
            full_name: 'Budi Santoso',
            employment_status: 'Karyawan Tetap',
            net_income: 8000000
          }
        },
        validation_summary: { issues: [] }
      };

      const profile = summarizeFinancialProfile(ocrResults);

      expect(profile.employment_status).toBe('Karyawan Tetap');
    });

    test('should include validation issues in risk indicators', () => {
      const ocrResults = {
        slik: {
          extracted_data: { full_name: 'Budi Santoso', collectibility: 1 }
        },
        salary_slip: {
          extracted_data: { full_name: 'Andi Wijaya', net_income: 5000000 }
        },
        validation_summary: {
          issues: [
            { type: 'NAME_MISMATCH', message: 'Names do not match', severity: 'HIGH' }
          ]
        }
      };

      const profile = summarizeFinancialProfile(ocrResults);

      expect(profile.risk_indicators.some(r => r.type === 'NAME_MISMATCH')).toBe(true);
    });
  });
});
