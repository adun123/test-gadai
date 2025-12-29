const { calculateConditionScore, mergeManualOverrides, validateImageQuality } = require('../../src/services/vehicleVisionService');
const { validVehicleAnalysis, poorConditionVehicle } = require('../fixtures/testData');

jest.mock('../../src/config/gemini', () => ({
  getVisionModel: jest.fn(() => ({
    generateContent: jest.fn()
  }))
}));

describe('Vehicle Vision Service', () => {
  describe('calculateConditionScore()', () => {
    test('should calculate score for Excellent condition', () => {
      const condition = { overall_grade: 'Excellent', detected_issues: [] };
      const result = calculateConditionScore(condition);

      expect(result.base_score).toBe(1.0);
      expect(result.deduction).toBe(0);
      expect(result.final_score).toBe(1.0);
      expect(result.grade).toBe('Excellent');
    });

    test('should calculate score for Good condition with minor issues', () => {
      const condition = validVehicleAnalysis.physical_condition;
      const result = calculateConditionScore(condition);

      expect(result.base_score).toBe(0.85);
      expect(result.deduction).toBe(0.02);
      expect(result.final_score).toBe(0.83);
      expect(result.issue_count).toBe(1);
    });

    test('should calculate score for Poor condition with severe issues', () => {
      const condition = poorConditionVehicle.physical_condition;
      const result = calculateConditionScore(condition);

      expect(result.base_score).toBe(0.5);
      expect(result.deduction).toBeGreaterThan(0.2);
      expect(result.final_score).toBeLessThan(0.5);
      expect(result.issue_count).toBe(4);
    });

    test('should not go below minimum score', () => {
      const condition = {
        overall_grade: 'Poor',
        detected_issues: Array(20).fill({ severity: 'Severe' })
      };
      const result = calculateConditionScore(condition);

      expect(result.final_score).toBeGreaterThanOrEqual(0.3);
    });

    test('should deduct correctly based on severity', () => {
      const conditionMinor = {
        overall_grade: 'Good',
        detected_issues: [{ severity: 'Minor' }]
      };
      const conditionModerate = {
        overall_grade: 'Good',
        detected_issues: [{ severity: 'Moderate' }]
      };
      const conditionSevere = {
        overall_grade: 'Good',
        detected_issues: [{ severity: 'Severe' }]
      };

      const minorResult = calculateConditionScore(conditionMinor);
      const moderateResult = calculateConditionScore(conditionModerate);
      const severeResult = calculateConditionScore(conditionSevere);

      expect(minorResult.deduction).toBe(0.02);
      expect(moderateResult.deduction).toBe(0.05);
      expect(severeResult.deduction).toBe(0.10);
    });
  });

  describe('mergeManualOverrides()', () => {
    test('should override vehicle type', () => {
      const result = mergeManualOverrides(validVehicleAnalysis, { vehicle_type: 'Sport' });

      expect(result.vehicle_identification.vehicle_type).toBe('Sport');
      expect(result.has_manual_overrides).toBe(true);
    });

    test('should override make and model', () => {
      const result = mergeManualOverrides(validVehicleAnalysis, {
        make: 'Yamaha',
        model: 'NMAX'
      });

      expect(result.vehicle_identification.make).toBe('Yamaha');
      expect(result.vehicle_identification.model).toBe('NMAX');
    });

    test('should add additional defects', () => {
      const result = mergeManualOverrides(validVehicleAnalysis, {
        additional_defects: ['Hidden rust', 'Oil leak']
      });

      expect(result.physical_condition.detected_issues.length).toBe(3);
      expect(result.physical_condition.detected_issues.some(
        i => i.issue_type === 'Hidden rust'
      )).toBe(true);
    });

    test('should preserve original data when no overrides', () => {
      const result = mergeManualOverrides(validVehicleAnalysis, {});

      expect(result.vehicle_identification.make).toBe('Honda');
      expect(result.vehicle_identification.model).toBe('Beat');
    });

    test('should add year field', () => {
      const result = mergeManualOverrides(validVehicleAnalysis, { year: 2022 });

      expect(result.vehicle_identification.year).toBe(2022);
    });
  });

  describe('validateImageQuality()', () => {
    test('should validate good quality images', () => {
      const result = validateImageQuality(validVehicleAnalysis);

      expect(result.is_valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('should flag unclear images', () => {
      const analysis = {
        ...validVehicleAnalysis,
        image_quality: {
          is_clear: false,
          requires_retake: false
        }
      };
      const result = validateImageQuality(analysis);

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('should invalidate when retake required', () => {
      const analysis = {
        ...validVehicleAnalysis,
        image_quality: {
          is_clear: true,
          requires_retake: true,
          retake_reason: 'Vehicle not fully visible'
        }
      };
      const result = validateImageQuality(analysis);

      expect(result.is_valid).toBe(false);
      expect(result.issues).toContain('Vehicle not fully visible');
    });

    test('should handle missing image quality data', () => {
      const analysis = { vehicle_identification: {} };
      const result = validateImageQuality(analysis);

      expect(result.is_valid).toBe(false);
      expect(result.issues).toContain('Unable to assess image quality');
    });
  });
});
