const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateSpecialistCommission,
  calculateInvoiceAmounts,
  calculatePackageBalance,
  calculatePayrollNet,
  calculateInventoryStockDelta,
} = require('../../utils/calculations');

describe('Unit Tests: Financial & Business Calculations', () => {

  describe('1. Specialist Commission & Center Profit', () => {
    it('should correctly calculate 25% percentage-based specialist commission with no consumables', () => {
      const result = calculateSpecialistCommission({
        commissionType: 'نسبة',
        commissionValue: 25,
        baseRevenue: 1000,
        consumablesRevenue: 0,
      });

      assert.equal(result.totalRevenue, 1000);
      assert.equal(result.staffDue, 250);
      assert.equal(result.centerProfit, 750);
    });

    it('should keep specialist 25% commission untouched when a discount is granted to the client, absorbing discount into center profit', () => {
      // Original service base price: 1000 EGP. Specialist commission: 25% (250 EGP).
      // Clinic grants a 200 EGP discount to client.
      // Client pays: 800 EGP net revenue.
      // Specialist STILL receives 250 EGP (25% of gross 1000).
      // Center absorbs discount: 800 - 250 = 550 EGP (instead of 750 EGP).
      const result = calculateSpecialistCommission({
        commissionType: 'نسبة',
        commissionValue: 25,
        baseRevenue: 1000,
        consumablesRevenue: 0,
        discountAmount: 200,
      });

      assert.equal(result.baseRevenue, 1000);
      assert.equal(result.discountAmount, 200);
      assert.equal(result.totalRevenue, 800);
      assert.equal(result.staffDue, 250, 'Specialist commission must remain based on original 1000 EGP base price');
      assert.equal(result.centerProfit, 550, 'Center net profit absorbs the 200 EGP discount: 800 - 250 = 550');
    });

    it('should exclude consumables from specialist commission percentage and award 100% consumables to center', () => {
      // Service base: 800, Consumables: 200. Total = 1000.
      // Specialist gets 25% of 800 = 200.
      // Center gets (1000 - 200) = 800 (600 remaining service + 200 consumables).
      const result = calculateSpecialistCommission({
        commissionType: 'نسبة',
        commissionValue: 25,
        baseRevenue: 800,
        consumablesRevenue: 200,
      });

      assert.equal(result.totalRevenue, 1000);
      assert.equal(result.baseRevenue, 800);
      assert.equal(result.consumablesRevenue, 200);
      assert.equal(result.staffDue, 200);
      assert.equal(result.centerProfit, 800);
    });

    it('should handle Fixed/Rent contract: specialist gets 100% of base sessions, center gets fixed rent + consumables', () => {
      const result = calculateSpecialistCommission({
        commissionType: 'ثابت',
        commissionValue: 3000, // Monthly fixed rent
        baseRevenue: 12000,
        consumablesRevenue: 500,
      });

      assert.equal(result.staffDue, 12000);
      assert.equal(result.centerProfit, 3500); // 3000 rent + 500 consumables
    });

    it('should fallback to 30% default commission when commission type is unknown or missing', () => {
      const result = calculateSpecialistCommission({
        commissionType: undefined,
        baseRevenue: 1000,
        consumablesRevenue: 0,
      });

      assert.equal(result.staffDue, 300);
      assert.equal(result.centerProfit, 700);
    });

    it('should safely handle 0 revenue and negative edge cases without throwing or NaN', () => {
      const result = calculateSpecialistCommission({
        commissionType: 'نسبة',
        commissionValue: 50,
        baseRevenue: 0,
        consumablesRevenue: 0,
      });

      assert.equal(result.staffDue, 0);
      assert.equal(result.centerProfit, 0);
    });
  });

  describe('2. Invoice Amounts & Discount Rules', () => {
    it('should calculate fixed discount correctly', () => {
      const result = calculateInvoiceAmounts({
        subtotal: 500,
        discountType: 'fixed',
        discountValue: 100,
        consumablesTotal: 50,
        taxRate: 0,
      });

      assert.equal(result.subtotal, 500);
      assert.equal(result.discountAmount, 100);
      assert.equal(result.consumablesTotal, 50);
      assert.equal(result.netAmount, 450); // (500 - 100) + 50
    });

    it('should calculate percentage discount correctly', () => {
      const result = calculateInvoiceAmounts({
        subtotal: 1000,
        discountType: 'percentage',
        discountValue: 20, // 20%
        consumablesTotal: 0,
        taxRate: 0,
      });

      assert.equal(result.discountAmount, 200);
      assert.equal(result.netAmount, 800);
    });

    it('should cap fixed discount at subtotal so net amount never becomes negative', () => {
      const result = calculateInvoiceAmounts({
        subtotal: 200,
        discountType: 'fixed',
        discountValue: 500, // discount larger than subtotal
      });

      assert.equal(result.discountAmount, 200);
      assert.equal(result.netAmount, 0);
    });

    it('should calculate tax rate on taxable subtotal after discount', () => {
      const result = calculateInvoiceAmounts({
        subtotal: 1000,
        discountType: 'fixed',
        discountValue: 200, // net subtotal = 800
        taxRate: 0.14, // 14% tax on 800 = 112
      });

      assert.equal(result.taxAmount, 112);
      assert.equal(result.netAmount, 912);
    });

    it('should support Arabic percentage and amount discount types', () => {
      const resPercent = calculateInvoiceAmounts({
        subtotal: 1000,
        discountType: 'نسبة',
        discountValue: 15,
      });
      assert.equal(resPercent.discountAmount, 150);
      assert.equal(resPercent.netAmount, 850);
      assert.equal(resPercent.discountType, 'percentage');

      const resAmount = calculateInvoiceAmounts({
        subtotal: 1000,
        discountType: 'قيمة',
        discountValue: 250,
      });
      assert.equal(resAmount.discountAmount, 250);
      assert.equal(resAmount.netAmount, 750);
      assert.equal(resAmount.discountType, 'fixed');
    });
  });

  describe('3. Client Package Session Balances', () => {
    it('should calculate package progress and remaining sessions correctly', () => {
      const result = calculatePackageBalance({
        totalSessions: 6,
        completedSessions: 2,
      });

      assert.equal(result.totalSessions, 6);
      assert.equal(result.completedSessions, 2);
      assert.equal(result.remainingSessions, 4);
      assert.equal(result.progressPercent, 33);
      assert.equal(result.status, 'active');
    });

    it('should mark package as completed when all sessions are consumed', () => {
      const result = calculatePackageBalance({
        totalSessions: 8,
        completedSessions: 8,
      });

      assert.equal(result.remainingSessions, 0);
      assert.equal(result.progressPercent, 100);
      assert.equal(result.status, 'completed');
    });

    it('should prevent negative remaining sessions if completed exceeds total', () => {
      const result = calculatePackageBalance({
        totalSessions: 5,
        completedSessions: 7,
      });

      assert.equal(result.remainingSessions, 0);
      assert.equal(result.status, 'completed');
    });
  });

  describe('4. Inventory Stock Movement & Alert System', () => {
    it('should increase stock on incoming shipment (IN)', () => {
      const result = calculateInventoryStockDelta({
        currentStock: 10,
        quantityChange: 15,
        movementType: 'IN',
        minStockAlert: 5,
      });

      assert.equal(result.previousStock, 10);
      assert.equal(result.newStock, 25);
      assert.equal(result.isLowStock, false);
    });

    it('should decrease stock and flag low stock alert on consumption (OUT)', () => {
      const result = calculateInventoryStockDelta({
        currentStock: 8,
        quantityChange: 5,
        movementType: 'OUT',
        minStockAlert: 5,
      });

      assert.equal(result.newStock, 3);
      assert.equal(result.isLowStock, true); // 3 <= 5
    });

    it('should throw an error when attempting to dispatch more than current stock', () => {
      assert.throws(
        () => {
          calculateInventoryStockDelta({
            currentStock: 4,
            quantityChange: 10,
            movementType: 'OUT',
          });
        },
        /تتجاوز المخزون الحالي/
      );
    });

    it('should set exact stock on manual audit adjustment (ADJUST)', () => {
      const result = calculateInventoryStockDelta({
        currentStock: 25,
        quantityChange: 12,
        movementType: 'ADJUST',
        minStockAlert: 15,
      });

      assert.equal(result.newStock, 12);
      assert.equal(result.isLowStock, true);
    });
  });

  describe('5. HR Payroll Net Calculation', () => {
    it('should compute net salary with base, bonuses, and deductions', () => {
      const result = calculatePayrollNet({
        baseSalary: 6000,
        bonuses: 1200,
        deductions: 400,
      });

      assert.equal(result.netSalary, 6800);
    });

    it('should never produce negative net salary even if deductions exceed salary', () => {
      const result = calculatePayrollNet({
        baseSalary: 2000,
        bonuses: 0,
        deductions: 3500,
      });

      assert.equal(result.netSalary, 0);
    });
  });

});
