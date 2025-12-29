const { scanVehicleImages, getMockVehicleScan, calculateConditionScore } = require('../../src/services/vehicleScanService');

jest.mock('../../src/config/gemini');

describe('VehicleScanService', () => {
  describe('getMockVehicleScan', () => {
    test('should return mock vehicle scan data with editable flag', () => {
      const result = getMockVehicleScan();

      expect(result.success).toBe(true);
      expect(result.is_editable).toBe(true);
      expect(result.scanned_data).toBeDefined();
      expect(result.scanned_data.vehicle_identification).toBeDefined();
      expect(result.scanned_data.physical_condition).toBeDefined();
    });

    test('should include vehicle identification details', () => {
      const result = getMockVehicleScan();
      const { vehicle_identification } = result.scanned_data;

      expect(vehicle_identification.vehicle_type).toBeDefined();
      expect(vehicle_identification.make).toBeDefined();
      expect(vehicle_identification.model).toBeDefined();
      expect(vehicle_identification.color).toBeDefined();
    });

    test('should include physical condition with defects', () => {
      const result = getMockVehicleScan();
      const { physical_condition } = result.scanned_data;

      expect(physical_condition.overall_grade).toBeDefined();
      expect(physical_condition.detected_defects).toBeInstanceOf(Array);
      expect(physical_condition.detected_defects.length).toBeGreaterThan(0);
    });

    test('should include editable fields list', () => {
      const result = getMockVehicleScan();

      expect(result.editable_fields).toBeDefined();
      expect(result.editable_fields.vehicle_identification).toBeInstanceOf(Array);
      expect(result.editable_fields.physical_condition).toBeInstanceOf(Array);
    });
  });

  describe('calculateConditionScore', () => {
    test('should calculate score for Excellent condition', () => {
      const condition = {
        overall_grade: 'Excellent',
        detected_defects: []
      };

      const result = calculateConditionScore(condition);

      expect(result.base_score).toBe(1.0);
      expect(result.deduction).toBe(0);
      expect(result.final_score).toBe(1.0);
      expect(result.defect_count).toBe(0);
    });

    test('should calculate score for Good condition with no defects', () => {
      const condition = {
        overall_grade: 'Good',
        detected_defects: []
      };

      const result = calculateConditionScore(condition);

      expect(result.base_score).toBe(0.85);
      expect(result.final_score).toBe(0.85);
    });

    test('should deduct for Minor defects', () => {
      const condition = {
        overall_grade: 'Good',
        detected_defects: [
          { defect_type: 'Scratch', severity: 'Minor' },
          { defect_type: 'Dent', severity: 'Minor' }
        ]
      };

      const result = calculateConditionScore(condition);

      expect(result.base_score).toBe(0.85);
      expect(result.deduction).toBe(0.04); // 2 * 0.02
      expect(result.final_score).toBe(0.81);
      expect(result.defect_count).toBe(2);
    });

    test('should deduct for Major defects', () => {
      const condition = {
        overall_grade: 'Good',
        detected_defects: [
          { defect_type: 'Rust', severity: 'Major' }
        ]
      };

      const result = calculateConditionScore(condition);

      expect(result.deduction).toBe(0.10);
      expect(result.final_score).toBe(0.75);
    });

    test('should cap total deduction at 0.5', () => {
      const condition = {
        overall_grade: 'Good',
        detected_defects: [
          { defect_type: 'Major damage', severity: 'Severe' },
          { defect_type: 'Major damage', severity: 'Severe' },
          { defect_type: 'Major damage', severity: 'Severe' },
          { defect_type: 'Major damage', severity: 'Severe' },
          { defect_type: 'Major damage', severity: 'Severe' }
        ]
      };

      const result = calculateConditionScore(condition);

      expect(result.deduction).toBe(0.5);
      expect(result.final_score).toBe(0.35);
    });

    test('should enforce minimum score of 0.3', () => {
      const condition = {
        overall_grade: 'Poor',
        detected_defects: [
          { defect_type: 'Major damage', severity: 'Severe' },
          { defect_type: 'Major damage', severity: 'Severe' },
          { defect_type: 'Major damage', severity: 'Severe' },
          { defect_type: 'Major damage', severity: 'Severe' }
        ]
      };

      const result = calculateConditionScore(condition);

      expect(result.final_score).toBeGreaterThanOrEqual(0.3);
    });

    test('should handle Fair grade', () => {
      const condition = {
        overall_grade: 'Fair',
        detected_defects: []
      };

      const result = calculateConditionScore(condition);

      expect(result.base_score).toBe(0.65);
      expect(result.final_score).toBe(0.65);
    });

    test('should handle Poor grade', () => {
      const condition = {
        overall_grade: 'Poor',
        detected_defects: []
      };

      const result = calculateConditionScore(condition);

      expect(result.base_score).toBe(0.45);
      expect(result.final_score).toBe(0.45);
    });

    test('should handle mixed severity defects', () => {
      const condition = {
        overall_grade: 'Good',
        detected_defects: [
          { defect_type: 'Scratch', severity: 'Minor' },
          { defect_type: 'Dent', severity: 'Moderate' },
          { defect_type: 'Rust', severity: 'Major' }
        ]
      };

      const result = calculateConditionScore(condition);

      // 0.02 + 0.05 + 0.10 = 0.17
      expect(result.deduction).toBe(0.17);
      expect(result.final_score).toBe(0.68);
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
          overall_grade: 'Good',
          detected_defects: []
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

      expect(result.success).toBe(true);
      expect(result.scanned_data).toBeDefined();
      expect(result.is_editable).toBe(true);
    });

    test('should return error on failure', async () => {
      getVisionModel.mockReturnValue({
        generateContent: jest.fn().mockRejectedValue(new Error('API error'))
      });

      const result = await scanVehicleImages([Buffer.from('test')]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API error');
      expect(result.is_editable).toBe(true);
    });
  });
});
