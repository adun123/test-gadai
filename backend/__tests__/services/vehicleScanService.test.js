const { scanVehicleImages, getMockVehicleScan, calculateConditionScore, SEVERITY_DEDUCTIONS, MAX_DEDUCTION, MIN_SCORE } = require('../../src/services/vehicleScanService');

jest.mock('../../src/config/gemini');

describe('VehicleScanService', () => {
  describe('Constants', () => {
    test('should export correct severity deductions', () => {
      expect(SEVERITY_DEDUCTIONS.Minor).toBe(0.02);
      expect(SEVERITY_DEDUCTIONS.Moderate).toBe(0.05);
      expect(SEVERITY_DEDUCTIONS.Major).toBe(0.10);
      expect(SEVERITY_DEDUCTIONS.Severe).toBe(0.15);
    });

    test('should export correct limits', () => {
      expect(MAX_DEDUCTION).toBe(0.50);
      expect(MIN_SCORE).toBe(0.30);
    });
  });

  describe('getMockVehicleScan', () => {
    test('should return mock vehicle scan data', () => {
      const result = getMockVehicleScan();

      expect(result.vehicle_identification).toBeDefined();
      expect(result.physical_condition).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    test('should include vehicle identification details', () => {
      const result = getMockVehicleScan();
      const { vehicle_identification } = result;

      expect(vehicle_identification.vehicle_type).toBeDefined();
      expect(vehicle_identification.make).toBeDefined();
      expect(vehicle_identification.model).toBeDefined();
      expect(vehicle_identification.color).toBeDefined();
    });

    test('should include physical condition with defects array', () => {
      const result = getMockVehicleScan();
      const { physical_condition } = result;

      expect(physical_condition.defects).toBeInstanceOf(Array);
    });

    test('should NOT include overall_grade (removed)', () => {
      const result = getMockVehicleScan();

      expect(result.physical_condition.overall_grade).toBeUndefined();
    });
  });

  describe('calculateConditionScore', () => {
    test('should start from 100% with no defects', () => {
      const condition = { defects: [] };

      const result = calculateConditionScore(condition);

      expect(result.base_score).toBe(1.0);
      expect(result.deduction).toBe(0);
      expect(result.final_score).toBe(1.0);
      expect(result.defect_count).toBe(0);
    });

    test('should deduct 2% for each Minor defect', () => {
      const condition = {
        defects: [
          'Scratch on panel (Minor)',
          'Paint fading (Minor)'
        ]
      };

      const result = calculateConditionScore(condition);

      expect(result.base_score).toBe(1.0);
      expect(result.deduction).toBe(0.04);
      expect(result.final_score).toBe(0.96);
      expect(result.defect_count).toBe(2);
    });

    test('should deduct 5% for each Moderate defect', () => {
      const condition = {
        defects: ['Dent on tank (Moderate)']
      };

      const result = calculateConditionScore(condition);

      expect(result.deduction).toBe(0.05);
      expect(result.final_score).toBe(0.95);
    });

    test('should deduct 10% for each Major defect', () => {
      const condition = {
        defects: ['Cracked body (Major)']
      };

      const result = calculateConditionScore(condition);

      expect(result.deduction).toBe(0.10);
      expect(result.final_score).toBe(0.90);
    });

    test('should deduct 15% for each Severe defect', () => {
      const condition = {
        defects: ['Broken frame (Severe)']
      };

      const result = calculateConditionScore(condition);

      expect(result.deduction).toBe(0.15);
      expect(result.final_score).toBe(0.85);
    });

    test('should handle mixed severity defects', () => {
      const condition = {
        defects: [
          'Scratch (Minor)',
          'Dent (Moderate)',
          'Crack (Major)'
        ]
      };

      const result = calculateConditionScore(condition);

      expect(result.deduction).toBe(0.17);
      expect(result.final_score).toBe(0.83);
      expect(result.defect_count).toBe(3);
    });

    test('should cap total deduction at 50%', () => {
      const condition = {
        defects: [
          'Damage 1 (Severe)',
          'Damage 2 (Severe)',
          'Damage 3 (Severe)',
          'Damage 4 (Severe)'
        ]
      };

      const result = calculateConditionScore(condition);

      expect(result.deduction).toBe(0.60);
      expect(result.deduction_capped).toBe(0.50);
      expect(result.final_score).toBe(0.50);
      expect(result.limits.deduction_was_capped).toBe(true);
    });

    test('should enforce minimum score of 30%', () => {
      const condition = {
        defects: [
          'Damage 1 (Severe)',
          'Damage 2 (Severe)',
          'Damage 3 (Severe)',
          'Damage 4 (Severe)',
          'Damage 5 (Severe)'
        ]
      };

      const result = calculateConditionScore(condition);

      expect(result.final_score).toBeGreaterThanOrEqual(0.30);
    });

    test('should parse defect string format correctly', () => {
      const condition = {
        defects: ['Paint fading on front panel (Minor)']
      };

      const result = calculateConditionScore(condition);

      expect(result.defects_applied[0].description).toBe('Paint fading on front panel');
      expect(result.defects_applied[0].severity).toBe('Minor');
      expect(result.defects_applied[0].deduction).toBe(0.02);
    });

    test('should handle unknown format with default deduction', () => {
      const condition = {
        defects: ['Some damage without severity']
      };

      const result = calculateConditionScore(condition);

      expect(result.defects_applied[0].severity).toBe('Unknown');
      expect(result.defects_applied[0].deduction).toBe(0.03);
    });

    test('should allow user override of final_score', () => {
      const condition = { defects: ['Damage (Severe)'] };
      const overrides = { final_score: 0.75 };

      const result = calculateConditionScore(condition, overrides);

      expect(result.final_score).toBe(0.75);
      expect(result.is_overridden).toBe(true);
      expect(result.override_source).toBe('user');
    });

    test('should clamp override between 30% and 100%', () => {
      const condition = { defects: [] };
      
      const tooHigh = calculateConditionScore(condition, { final_score: 1.5 });
      expect(tooHigh.final_score).toBe(1.0);

      const tooLow = calculateConditionScore(condition, { final_score: 0.1 });
      expect(tooLow.final_score).toBe(0.30);
    });
  });

  describe('scanVehicleImages', () => {
    const { getVisionModel } = require('../../src/config/gemini');

    test('should return scan result when AI responds correctly', async () => {
      const mockResponse = {
        vehicle_identification: {
          vehicle_type: 'Matic',
          make: 'Honda',
          model: 'Vario'
        },
        physical_condition: {
          defects: ['Scratch (Minor)']
        },
        confidence: 0.9
      };

      getVisionModel.mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse)
          }
        })
      });

      const result = await scanVehicleImages([Buffer.from('test')]);

      expect(result.vehicle_identification).toBeDefined();
      expect(result.physical_condition).toBeDefined();
      expect(result.images_processed).toBe(1);
    });

    test('should return error on failure', async () => {
      getVisionModel.mockReturnValue({
        generateContent: jest.fn().mockRejectedValue(new Error('API error'))
      });

      const result = await scanVehicleImages([Buffer.from('test')]);

      expect(result.error).toBe('API error');
    });
  });
});
