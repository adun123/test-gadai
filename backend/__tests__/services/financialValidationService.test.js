const { verifyData, calculateCreditScore } = require('../../src/services/financialValidationService');
const {
  validFormData,
  validSLIKDocument,
  validSalarySlipDocument,
  mismatchedNameDocument,
  badCollectibilitySLIK,
  lowIncomeSalarySlip,
  noIncomeSalarySlip
} = require('../fixtures/testData');

describe('Financial Validation Service', () => {
  describe('verifyData()', () => {
    test('should return MATCH when all data matches', async () => {
      const result = await verifyData(validFormData, [validSLIKDocument, validSalarySlipDocument]);
      
      expect(result.match_status).toBe('MATCH');
      expect(result.message).toBe('All data verified');
      expect(result.issues).toBeUndefined();
    });

    test('should return MISMATCH when names differ significantly', async () => {
      const result = await verifyData(validFormData, [validSLIKDocument, mismatchedNameDocument]);
      
      expect(result.match_status).toBe('MISMATCH');
      expect(result.issues).toBeDefined();
      expect(result.issues.some(i => i.type === 'NAME_MISMATCH')).toBe(true);
      expect(result.issues.some(i => i.severity === 'CRITICAL')).toBe(true);
    });

    test('should return MISMATCH when NIK does not match', async () => {
      const wrongNIKDoc = { ...validSLIKDocument, nik: '9999999999999999' };
      const result = await verifyData(validFormData, [wrongNIKDoc, validSalarySlipDocument]);
      
      expect(result.match_status).toBe('MISMATCH');
      expect(result.issues.some(i => i.type === 'NIK_MISMATCH')).toBe(true);
    });

    test('should return WARNING when income differs by more than 10%', async () => {
      const highIncomeForm = { ...validFormData, monthly_income: 10000000 };
      const result = await verifyData(highIncomeForm, [validSLIKDocument, validSalarySlipDocument]);
      
      expect(result.match_status).toBe('WARNING');
      expect(result.issues.some(i => i.type === 'INCOME_MISMATCH')).toBe(true);
    });

    test('should detect cross-document name mismatch', async () => {
      const doc1 = { ...validSLIKDocument, full_name: 'John Doe' };
      const doc2 = { ...validSalarySlipDocument, full_name: 'Jane Smith' };
      const result = await verifyData(validFormData, [doc1, doc2]);
      
      expect(result.match_status).toBe('MISMATCH');
      expect(result.issues.some(i => i.type === 'CROSS_DOCUMENT_MISMATCH')).toBe(true);
    });

    test('should handle documents without names gracefully', async () => {
      const noNameDoc = { ...validSLIKDocument, full_name: null };
      const result = await verifyData(validFormData, [noNameDoc, validSalarySlipDocument]);
      
      expect(result).toBeDefined();
      expect(result.match_status).toBeDefined();
    });
  });

  describe('calculateCreditScore()', () => {
    test('should return REJECT when verification status is MISMATCH', () => {
      const verification = {
        match_status: 'MISMATCH',
        issues: [{ type: 'NAME_MISMATCH', severity: 'CRITICAL' }]
      };
      const result = calculateCreditScore(validFormData, [validSLIKDocument, validSalarySlipDocument], verification);
      
      expect(result.risk_score).toBe('REJECT');
      expect(result.reason).toContain('verification failed');
      expect(result.validation_issues).toBeDefined();
    });

    test('should return REJECT when no valid salary slip', () => {
      const result = calculateCreditScore(validFormData, [validSLIKDocument, noIncomeSalarySlip]);
      
      expect(result.risk_score).toBe('REJECT');
      expect(result.reason).toContain('No valid salary slip');
      expect(result.income_used).toBe('none');
    });

    test('should return REJECT when collectibility > 2', () => {
      const result = calculateCreditScore(validFormData, [badCollectibilitySLIK, validSalarySlipDocument]);
      
      expect(result.risk_score).toBe('REJECT');
      expect(result.reason).toContain('Bad debt history');
      expect(result.collectibility).toBe(3);
    });

    test('should return HIGH_RISK when DBR > 40%', () => {
      const result = calculateCreditScore(validFormData, [validSLIKDocument, lowIncomeSalarySlip]);
      
      expect(result.risk_score).toBe('HIGH_RISK');
      expect(result.reason).toContain('DBR');
      expect(result.dbr).toBeGreaterThan(40);
      expect(result.monthly_installment).toBeDefined();
    });

    test('should return LOW_RISK when all criteria met', () => {
      const result = calculateCreditScore(validFormData, [validSLIKDocument, validSalarySlipDocument]);
      
      expect(result.risk_score).toBe('LOW_RISK');
      expect(result.dbr).toBeLessThanOrEqual(40);
      expect(result.collectibility).toBeLessThanOrEqual(2);
      expect(result.documented_income).toBe(8000000);
      expect(result.income_used).toBe('documented');
    });

    test('should calculate DBR correctly with monthly installments', () => {
      const result = calculateCreditScore(validFormData, [validSLIKDocument, validSalarySlipDocument]);
      
      const loanAmount = 20000000;
      const tenor = 12;
      const interestRate = 0.02;
      const expectedMonthlyInterest = loanAmount * interestRate;
      const expectedPrincipal = loanAmount / tenor;
      const expectedInstallment = expectedPrincipal + expectedMonthlyInterest;
      const expectedDBR = (expectedInstallment / 8000000) * 100;
      
      expect(result.monthly_installment).toBeCloseTo(expectedInstallment, 0);
      expect(result.dbr).toBeCloseTo(expectedDBR, 1);
      expect(result.tenor).toBe(12);
    });

    test('should only use documented income, never claimed', () => {
      const highClaimForm = { ...validFormData, monthly_income: 50000000 };
      const result = calculateCreditScore(highClaimForm, [validSLIKDocument, validSalarySlipDocument]);
      
      expect(result.documented_income).toBe(8000000);
      expect(result.income_used).toBe('documented');
    });

    test('should include validation warnings when verification has issues', () => {
      const verification = {
        match_status: 'WARNING',
        issues: [{ type: 'INCOME_MISMATCH', severity: 'HIGH' }]
      };
      const result = calculateCreditScore(validFormData, [validSLIKDocument, validSalarySlipDocument], verification);
      
      expect(result.validation_warnings).toBeDefined();
      expect(result.reason).toContain('discrepancies');
    });
  });
});
