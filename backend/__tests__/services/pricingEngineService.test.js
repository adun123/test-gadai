const {
  searchMarketPrice,
  getBaseMarketPrice,
  applyConditionAdjustment,
  calculateAssetValue,
  calculateEffectiveCollateralValue,
  calculateAppraisalValue,
  generatePricingBreakdown
} = require('../../src/services/pricingEngineService');

const { getModel } = require('../../src/config/gemini');

describe('Pricing Engine Service (Google Search Grounding)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchMarketPrice()', () => {
    test('should search market price using Google Search and return result', async () => {
      const mockResponse = {
        make: 'Honda',
        model: 'Beat',
        year: 2022,
        price_range: { low: 13000000, high: 17000000 },
        average_price: 15000000,
        data_points: 8,
        confidence: 'HIGH',
        market_analysis: 'Price based on OLX and FB Marketplace data',
        sources: ['OLX', 'Facebook Marketplace']
      };

      getModel.mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse)
          }
        })
      });

      const result = await searchMarketPrice('Honda', 'Beat', 2022);

      expect(result.success).toBe(true);
      expect(result.average_price).toBe(15000000);
      expect(result.confidence).toBe('HIGH');
      expect(result.source).toBe('google_search');
    });

    test('should return fallback estimate when search fails', async () => {
      getModel.mockReturnValue({
        generateContent: jest.fn().mockRejectedValue(new Error('API error'))
      });

      const result = await searchMarketPrice('Honda', 'Beat', 2020);

      expect(result.success).toBe(false);
      expect(result.source).toBe('fallback_estimate');
      expect(result.confidence).toBe('LOW');
      expect(result.average_price).toBeGreaterThan(0);
    });

    test('should return fallback when response cannot be parsed', async () => {
      getModel.mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Invalid response without JSON'
          }
        })
      });

      const result = await searchMarketPrice('Honda', 'Beat', 2022);

      expect(result.success).toBe(false);
      expect(result.source).toBe('fallback_estimate');
    });
  });

  describe('getBaseMarketPrice()', () => {
    test('should return base market price from search', async () => {
      const mockResponse = {
        average_price: 16000000,
        price_range: { low: 14000000, high: 18000000 },
        confidence: 'MEDIUM',
        data_points: 3
      };

      getModel.mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse)
          }
        })
      });

      const result = await getBaseMarketPrice('Honda', 'Beat', 2023);

      expect(result.price).toBe(16000000);
      expect(result.source).toBe('google_search');
      expect(result.confidence).toBe('MEDIUM');
    });
  });

  describe('applyConditionAdjustment()', () => {
    test('should apply condition factor to base price', () => {
      const conditionScore = { final_score: 0.85 };

      const result = applyConditionAdjustment(10000000, conditionScore);

      expect(result.base_price).toBe(10000000);
      expect(result.condition_factor).toBe(0.85);
      expect(result.adjusted_price).toBe(8500000);
      expect(result.adjustment_amount).toBe(1500000);
    });

    test('should use default factor when condition score missing', () => {
      const conditionScore = {};

      const result = applyConditionAdjustment(10000000, conditionScore);

      expect(result.condition_factor).toBe(0.7);
      expect(result.adjusted_price).toBe(7000000);
    });

    test('should handle perfect condition (1.0)', () => {
      const conditionScore = { final_score: 1.0 };

      const result = applyConditionAdjustment(10000000, conditionScore);

      expect(result.adjusted_price).toBe(10000000);
      expect(result.adjustment_amount).toBe(0);
    });
  });

  describe('calculateEffectiveCollateralValue()', () => {
    test('should calculate ECV with depreciation for 30 days', () => {
      const result = calculateEffectiveCollateralValue(10000000, 30);

      expect(result.asset_value).toBe(10000000);
      expect(result.tenor_days).toBe(30);
      expect(result.depreciation_rate_per_month).toBe('0.5%');
      expect(result.total_depreciation).toBe('0.50%');
      expect(result.effective_collateral_value).toBe(9950000);
    });

    test('should calculate ECV for 60 days (2 months)', () => {
      const result = calculateEffectiveCollateralValue(10000000, 60);

      expect(result.total_depreciation).toBe('1.00%');
      expect(result.effective_collateral_value).toBe(9900000);
    });

    test('should calculate ECV for 120 days (4 months)', () => {
      const result = calculateEffectiveCollateralValue(10000000, 120);

      expect(result.total_depreciation).toBe('2.00%');
      expect(result.effective_collateral_value).toBe(9800000);
    });
  });

  describe('calculateAppraisalValue()', () => {
    test('should apply default 75% LTV', () => {
      const result = calculateAppraisalValue(10000000);

      expect(result.ltv_policy).toBe('75%');
      expect(result.appraisal_value).toBe(7500000);
    });

    test('should apply custom LTV of 80%', () => {
      const result = calculateAppraisalValue(10000000, 0.8);

      expect(result.ltv_policy).toBe('80%');
      expect(result.appraisal_value).toBe(8000000);
    });

    test('should apply custom LTV of 70%', () => {
      const result = calculateAppraisalValue(10000000, 0.7);

      expect(result.ltv_policy).toBe('70%');
      expect(result.appraisal_value).toBe(7000000);
    });
  });

  describe('calculateAssetValue()', () => {
    test('should calculate full asset value with market price and condition', async () => {
      const mockResponse = {
        average_price: 15000000,
        price_range: { low: 13000000, high: 17000000 },
        confidence: 'HIGH',
        data_points: 5
      };

      getModel.mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse)
          }
        })
      });

      const vehicleData = { make: 'Honda', model: 'Beat', year: 2022 };
      const conditionScore = { final_score: 0.85, issue_count: 2 };

      const result = await calculateAssetValue(vehicleData, conditionScore);

      expect(result.base_market_price).toBe(15000000);
      expect(result.condition_adjustment.factor).toBe(0.85);
      expect(result.asset_value).toBe(12750000);
      expect(result.confidence_level).toBeDefined();
    });
  });

  describe('generatePricingBreakdown()', () => {
    test('should generate complete pricing breakdown', async () => {
      const mockResponse = {
        average_price: 15000000,
        price_range: { low: 13000000, high: 17000000 },
        confidence: 'MEDIUM',
        data_points: 4,
        market_analysis: 'Based on marketplace data'
      };

      getModel.mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse)
          }
        })
      });

      const vehicleId = { make: 'Honda', model: 'Beat', year: 2022 };
      const conditionScore = { final_score: 0.85, issue_count: 1 };

      const result = await generatePricingBreakdown(vehicleId, conditionScore, 'Jawa Barat', 30);

      expect(result.vehicle.make).toBe('Honda');
      expect(result.vehicle.model).toBe('Beat');
      expect(result.location.province).toBe('Jawa Barat');
      expect(result.pricing_breakdown.base_market_price.value).toBe(15000000);
      expect(result.collateral_calculation.appraisal_value).toBeGreaterThan(0);
    });

    test('should include location display text', async () => {
      const mockResponse = {
        average_price: 12000000,
        price_range: { low: 10000000, high: 14000000 },
        confidence: 'LOW'
      };

      getModel.mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse)
          }
        })
      });

      const result = await generatePricingBreakdown(
        { make: 'Yamaha', model: 'Mio', year: 2020 },
        { final_score: 0.8, issue_count: 0 },
        'DKI Jakarta',
        30
      );

      expect(result.location.display_text).toBe('Estimasi harga untuk wilayah DKI Jakarta');
    });
  });
});
