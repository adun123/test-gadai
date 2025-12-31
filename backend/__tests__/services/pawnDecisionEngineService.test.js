const {
  calculateSewaModalRegular,
  calculateSewaModalDaily,
  calculateDueDate,
  calculatePawnLoan,
  comparePawnProducts,
  generatePawnSimulation,
  PAWN_PRODUCTS,
  ADMIN_FEE
} = require('../../src/services/pawnDecisionEngineService');

describe('Pawn Decision Engine Service', () => {
  describe('calculateSewaModalRegular()', () => {
    test('should calculate sewa modal for 15 days (1 period)', () => {
      const result = calculateSewaModalRegular(7500000, 15);

      expect(result.periods).toBe(1);
      expect(result.rate_per_period).toBe(0.012);
      expect(result.total_rate).toBe(1.2);
      expect(result.sewa_modal_amount).toBe(90000);
    });

    test('should calculate sewa modal for 30 days (2 periods)', () => {
      const result = calculateSewaModalRegular(7500000, 30);

      expect(result.periods).toBe(2);
      expect(result.total_rate).toBe(2.4);
      expect(result.sewa_modal_amount).toBe(180000);
    });

    test('should calculate sewa modal for 120 days (8 periods)', () => {
      const result = calculateSewaModalRegular(7500000, 120);

      expect(result.periods).toBe(8);
      expect(result.total_rate).toBe(9.6);
      expect(result.sewa_modal_amount).toBe(720000);
    });

    test('should round up partial periods', () => {
      const result = calculateSewaModalRegular(7500000, 16);

      expect(result.periods).toBe(2);
    });
  });

  describe('calculateSewaModalDaily()', () => {
    test('should calculate sewa modal for 1 day', () => {
      const result = calculateSewaModalDaily(7500000, 1);

      expect(result.days).toBe(1);
      expect(result.rate_per_day).toBe(0.0009);
      expect(result.total_rate).toBe(0.09);
      expect(result.sewa_modal_amount).toBe(6750);
    });

    test('should calculate sewa modal for 30 days', () => {
      const result = calculateSewaModalDaily(7500000, 30);

      expect(result.days).toBe(30);
      expect(result.total_rate).toBe(2.7);
      expect(result.sewa_modal_amount).toBe(202500);
    });

    test('should calculate sewa modal for 60 days (max)', () => {
      const result = calculateSewaModalDaily(7500000, 60);

      expect(result.days).toBe(60);
      expect(result.total_rate).toBe(5.4);
      expect(result.sewa_modal_amount).toBe(405000);
    });
  });

  describe('calculateDueDate()', () => {
    test('should calculate due date correctly', () => {
      const startDate = new Date('2024-01-01');
      const result = calculateDueDate(startDate, 30);

      expect(result.start_date).toBe('2024-01-01');
      expect(result.tenor_days).toBe(30);
      expect(result.due_date).toBe('2024-01-31');
    });

    test('should handle month rollover', () => {
      const startDate = new Date('2024-01-15');
      const result = calculateDueDate(startDate, 30);

      expect(result.due_date).toBe('2024-02-14');
    });

    test('should handle string date input', () => {
      const result = calculateDueDate('2024-06-01', 60);

      expect(result.start_date).toBe('2024-06-01');
      expect(result.due_date).toBe('2024-07-31');
    });
  });

  describe('calculatePawnLoan()', () => {
    test('should calculate regular pawn loan correctly', () => {
      const result = calculatePawnLoan(7500000, 7500000, 'REGULAR', 30, new Date('2024-01-01'));

      expect(result.product.type).toBe('REGULAR');
      expect(result.product.name).toBe('Gadai Kendaraan Reguler');
      expect(result.appraisal_value).toBe(7500000);
      expect(result.max_loan_amount).toBe(7500000);
      expect(result.admin_fee).toBe(50000);
      expect(result.sewa_modal).toBeDefined();
      expect(result.total_repayment).toBe(7500000 + result.sewa_modal.sewa_modal_amount + 50000);
    });

    test('should calculate daily pawn loan correctly', () => {
      const result = calculatePawnLoan(7500000, 7500000, 'DAILY', 30, new Date('2024-01-01'));

      expect(result.product.type).toBe('DAILY');
      expect(result.product.name).toBe('Gadai Kendaraan Harian');
      expect(result.sewa_modal.days).toBe(30);
    });

    test('should throw error for invalid product type', () => {
      expect(() => {
        calculatePawnLoan(7500000, 7500000, 'INVALID', 30);
      }).toThrow('Invalid product type');
    });

    test('should throw error for tenor exceeding regular max', () => {
      expect(() => {
        calculatePawnLoan(7500000, 7500000, 'REGULAR', 150);
      }).toThrow(/between 1 and 120/);
    });

    test('should throw error for tenor exceeding daily max', () => {
      expect(() => {
        calculatePawnLoan(7500000, 7500000, 'DAILY', 70);
      }).toThrow(/between 1 and 60/);
    });

    test('should cap daily product at max loan', () => {
      const result = calculatePawnLoan(25000000, 25000000, 'DAILY', 30);

      expect(result.max_loan_amount).toBe(20000000);
    });
  });

  describe('comparePawnProducts()', () => {
    test('should compare both products for eligible tenor', () => {
      const result = comparePawnProducts(7500000, 7500000, 30);

      expect(result.regular).toBeDefined();
      expect(result.daily).toBeDefined();
      expect(result.regular.total_repayment).toBeDefined();
      expect(result.daily.total_repayment).toBeDefined();
      expect(result.recommendation).toBeDefined();
    });

    test('should mark daily as unavailable for long tenor', () => {
      const result = comparePawnProducts(7500000, 7500000, 90);

      expect(result.regular.total_repayment).toBeDefined();
      expect(result.daily.available).toBe(false);
      expect(result.recommendation).toBe('REGULAR');
    });

    test('should cap daily product at max loan amount', () => {
      const result = comparePawnProducts(25000000, 25000000, 30);

      expect(result.daily.max_loan_amount).toBe(20000000);
      expect(result.daily.approved_loan_amount).toBe(20000000);
    });

    test('should recommend based on lower total repayment', () => {
      const result = comparePawnProducts(5000000, 5000000, 15);

      expect(['REGULAR', 'DAILY']).toContain(result.recommendation);
    });
  });

  describe('generatePawnSimulation()', () => {
    test('should generate simulations for multiple tenors', () => {
      const tenorOptions = [15, 30, 60, 90];
      const result = generatePawnSimulation(7500000, 'REGULAR', tenorOptions);

      expect(result.product_type).toBe('REGULAR');
      expect(result.appraisal_value).toBe(7500000);
      expect(result.simulations).toHaveLength(4);

      result.simulations.forEach((sim, index) => {
        expect(sim.tenor_days).toBe(tenorOptions[index]);
        expect(sim.available).toBe(true);
      });
    });

    test('should mark unavailable tenors', () => {
      const tenorOptions = [30, 60, 90];
      const result = generatePawnSimulation(7500000, 'DAILY', tenorOptions);

      expect(result.simulations[2].available).toBe(false);
    });

    test('should show increasing sewa modal with tenor', () => {
      const tenorOptions = [15, 30, 45, 60];
      const result = generatePawnSimulation(7500000, 'REGULAR', tenorOptions);

      for (let i = 1; i < result.simulations.length; i++) {
        expect(result.simulations[i].sewa_modal.sewa_modal_amount)
          .toBeGreaterThan(result.simulations[i - 1].sewa_modal.sewa_modal_amount);
      }
    });
  });

  describe('PAWN_PRODUCTS configuration', () => {
    test('should have correct regular product config', () => {
      const regular = PAWN_PRODUCTS.REGULAR;

      expect(regular.min_loan).toBe(50000);
      expect(regular.max_loan).toBeNull();
      expect(regular.min_tenor_days).toBe(1);
      expect(regular.max_tenor_days).toBe(120);
      expect(regular.sewa_modal_per_15_days).toBe(0.012);
    });

    test('should have correct daily product config', () => {
      const daily = PAWN_PRODUCTS.DAILY;

      expect(daily.min_loan).toBe(50000);
      expect(daily.max_loan).toBe(20000000);
      expect(daily.min_tenor_days).toBe(1);
      expect(daily.max_tenor_days).toBe(60);
      expect(daily.sewa_modal_per_day).toBe(0.0009);
    });

    test('should have correct admin fee constant', () => {
      expect(ADMIN_FEE).toBe(50000);
    });
  });
});
