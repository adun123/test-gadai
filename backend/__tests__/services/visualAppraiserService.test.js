const { evaluateGradeByDefects, calculateLoanOffer, getGradeReasoning } = require('../../src/services/visualAppraiserService');
const { validCollateralAnalysis } = require('../fixtures/testData');

describe('Visual Appraiser Service', () => {
  describe('evaluateGradeByDefects()', () => {
    test('should return Grade A with 0 defects', () => {
      const result = evaluateGradeByDefects([]);
      
      expect(result.grade).toBe('A');
      expect(result.total_defects).toBe(0);
    });

    test('should return Grade B with 1-3 defects', () => {
      const defects = ['Minor scratch', 'Small dent'];
      const result = evaluateGradeByDefects(defects);
      
      expect(result.grade).toBe('B');
      expect(result.total_defects).toBe(2);
    });

    test('should return Grade C with 4-6 defects', () => {
      const defects = ['Scratch', 'Dent', 'Discoloration', 'Wear', 'Stain'];
      const result = evaluateGradeByDefects(defects);
      
      expect(result.grade).toBe('C');
      expect(result.total_defects).toBe(5);
    });

    test('should return Grade D with 7+ defects', () => {
      const defects = Array(8).fill('Defect');
      const result = evaluateGradeByDefects(defects);
      
      expect(result.grade).toBe('D');
      expect(result.total_defects).toBe(8);
    });

    test('should return Grade D with critical defect', () => {
      const defects = ['Broken screen'];
      const result = evaluateGradeByDefects(defects);
      
      expect(result.grade).toBe('D');
      expect(result.has_critical_defect).toBe(true);
    });

    test('should detect critical defects correctly', () => {
      const criticalKeywords = ['broken', 'crack', 'dead', 'not working', 'missing'];
      
      criticalKeywords.forEach(keyword => {
        const defects = [`Item has ${keyword} part`];
        const result = evaluateGradeByDefects(defects);
        expect(result.has_critical_defect).toBe(true);
      });
    });

    test('should merge AI and manual defects', () => {
      const aiDefects = ['Scratch', 'Dent'];
      const manualDefects = ['Rust spot', 'Paint chip'];
      const result = evaluateGradeByDefects(aiDefects, manualDefects);
      
      expect(result.total_defects).toBe(4);
      expect(result.grade).toBe('C');
    });

    test('should handle empty arrays', () => {
      const result = evaluateGradeByDefects([], []);
      
      expect(result.grade).toBe('A');
      expect(result.total_defects).toBe(0);
    });

    test('should handle undefined additional defects', () => {
      const result = evaluateGradeByDefects(['Minor scratch'], undefined);
      
      expect(result.grade).toBe('B');
      expect(result.total_defects).toBe(1);
    });
  });

  describe('calculateLoanOffer()', () => {
    test('should calculate 70% loan for Grade A', () => {
      const marketPrice = 10000000;
      const result = calculateLoanOffer('A', marketPrice);
      
      expect(result.loan_percentage).toBe(70);
      expect(result.loan_amount).toBe(7000000);
    });

    test('should calculate 60% loan for Grade B', () => {
      const marketPrice = 10000000;
      const result = calculateLoanOffer('B', marketPrice);
      
      expect(result.loan_percentage).toBe(60);
      expect(result.loan_amount).toBe(6000000);
    });

    test('should calculate 40% loan for Grade C', () => {
      const marketPrice = 10000000;
      const result = calculateLoanOffer('C', marketPrice);
      
      expect(result.loan_percentage).toBe(40);
      expect(result.loan_amount).toBe(4000000);
    });

    test('should return 0% loan for Grade D', () => {
      const marketPrice = 10000000;
      const result = calculateLoanOffer('D', marketPrice);
      
      expect(result.loan_percentage).toBe(0);
      expect(result.loan_amount).toBe(0);
    });

    test('should handle decimal market prices', () => {
      const marketPrice = 15750000;
      const result = calculateLoanOffer('B', marketPrice);
      
      expect(result.loan_amount).toBe(9450000);
    });

    test('should return 0 for invalid grades', () => {
      const result = calculateLoanOffer('X', 10000000);
      
      expect(result.loan_percentage).toBe(0);
      expect(result.loan_amount).toBe(0);
    });
  });

  describe('getGradeReasoning()', () => {
    test('should provide reasoning for Grade A', () => {
      const evaluation = { grade: 'A', total_defects: 0, has_critical_defect: false };
      const result = getGradeReasoning(evaluation);
      
      expect(result).toContain('Perfect condition');
      expect(result).toContain('Grade A');
    });

    test('should provide reasoning for Grade B', () => {
      const evaluation = { grade: 'B', total_defects: 2, has_critical_defect: false };
      const result = getGradeReasoning(evaluation);
      
      expect(result).toContain('Good condition');
      expect(result).toContain('2 minor defects');
    });

    test('should provide reasoning for Grade C', () => {
      const evaluation = { grade: 'C', total_defects: 5, has_critical_defect: false };
      const result = getGradeReasoning(evaluation);
      
      expect(result).toContain('Fair condition');
      expect(result).toContain('5 defects');
    });

    test('should provide reasoning for Grade D with critical defect', () => {
      const evaluation = { grade: 'D', total_defects: 1, has_critical_defect: true };
      const result = getGradeReasoning(evaluation);
      
      expect(result).toContain('Poor condition');
      expect(result).toContain('critical defect');
    });

    test('should provide reasoning for Grade D with many defects', () => {
      const evaluation = { grade: 'D', total_defects: 8, has_critical_defect: false };
      const result = getGradeReasoning(evaluation);
      
      expect(result).toContain('Poor condition');
      expect(result).toContain('8 defects');
    });
  });

  describe('Grade downgrade scenarios', () => {
    test('should downgrade from A to B when manual defects added', () => {
      const aiDefects = [];
      const manualDefects = ['Employee noted: Small scratch'];
      const result = evaluateGradeByDefects(aiDefects, manualDefects);
      
      expect(result.grade).toBe('B');
    });

    test('should downgrade from B to C when manual defects added', () => {
      const aiDefects = ['Minor scratch'];
      const manualDefects = ['Dent', 'Scuff', 'Wear'];
      const result = evaluateGradeByDefects(aiDefects, manualDefects);
      
      expect(result.grade).toBe('C');
    });

    test('should downgrade to D when adding critical manual defect', () => {
      const aiDefects = ['Minor scratch'];
      const manualDefects = ['Broken hinge'];
      const result = evaluateGradeByDefects(aiDefects, manualDefects);
      
      expect(result.grade).toBe('D');
    });
  });

  describe('Loan calculation integration', () => {
    test('should reduce loan offer when grade downgrades', () => {
      const marketPrice = 10000000;
      
      const gradeALoan = calculateLoanOffer('A', marketPrice);
      const gradeBLoan = calculateLoanOffer('B', marketPrice);
      const gradeCLoan = calculateLoanOffer('C', marketPrice);
      
      expect(gradeALoan.loan_amount).toBeGreaterThan(gradeBLoan.loan_amount);
      expect(gradeBLoan.loan_amount).toBeGreaterThan(gradeCLoan.loan_amount);
    });

    test('should calculate correct final offer after defect merge', () => {
      const aiDefects = ['Scratch'];
      const manualDefects = ['Dent', 'Discoloration'];
      const marketPrice = 15000000;
      
      const evaluation = evaluateGradeByDefects(aiDefects, manualDefects);
      const loanOffer = calculateLoanOffer(evaluation.grade, marketPrice);
      
      expect(evaluation.grade).toBe('B');
      expect(loanOffer.loan_amount).toBe(9000000);
    });
  });
});
