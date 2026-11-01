/**
 * Pure Business Logic and Financial Calculation Engine
 * Used for Specialist Commissions, Invoices, Packages, Inventory & Payroll
 */

/**
 * Calculates specialist commission and center net profit.
 * Note: Specialist percentage is strictly applied to commissionable base price
 * (service base price excluding consumables) AND is completely UNTOUCHED by center discounts to clients.
 * Center receives the net collected revenue minus staff due, absorbing 100% of any discount.
 */
function calculateSpecialistCommission(options = {}) {
  const {
    commissionType,
    commissionValue,
    baseRevenue = 0,
    consumablesRevenue = 0,
    discountAmount = 0, // Discount granted to client (absorbed 100% by the center)
  } = options;

  const commType = (commissionType && commissionType !== 'undefined') ? String(commissionType).trim() : 'نسبة';
  const hasExplicitValue = commissionValue !== undefined && commissionValue !== null && !isNaN(parseFloat(commissionValue));
  const commVal = hasExplicitValue ? parseFloat(commissionValue) : 30;
  const base = Math.max(0, parseFloat(baseRevenue) || 0);
  const consumables = Math.max(0, parseFloat(consumablesRevenue) || 0);
  const discount = Math.max(0, parseFloat(discountAmount) || 0);
  // Total collected revenue from client after discount
  const totalRevenue = Math.max(0, base + consumables - discount);

  let staffDue = 0;
  let centerProfit = 0;

  if (commType === 'نسبة') {
    // Percentage cut applied strictly to original gross base service amount (unaffected by discount)
    staffDue = Math.round(((base * commVal) / 100) * 100) / 100;
    // Center keeps collected revenue minus staff due (absorbing the discount)
    centerProfit = Math.round((totalRevenue - staffDue) * 100) / 100;
  } else if (commType === 'ثابت') {
    // Fixed rent: Specialist receives 100% of session base fees,
    // while center retains the fixed rent amount + any consumables minus discount
    staffDue = base;
    centerProfit = Math.round((commVal + consumables - discount) * 100) / 100;
  } else {
    // Safe fallback: 30% default commission
    staffDue = Math.round(((base * 30) / 100) * 100) / 100;
    centerProfit = Math.round((totalRevenue - staffDue) * 100) / 100;
  }

  return {
    baseRevenue: base,
    consumablesRevenue: consumables,
    discountAmount: discount,
    totalRevenue,
    commissionType: commType,
    commissionValue: commVal,
    staffDue,
    centerProfit,
  };
}

/**
 * Calculates invoice totals, discounts (percentage or fixed amount),
 * consumables, tax and final net payable amount.
 */
function calculateInvoiceAmounts({
  subtotal = 0,
  discountType = 'fixed', // 'fixed' | 'percentage' | 'amount' | 'نسبة' | 'قيمة'
  discountValue = 0,
  consumablesTotal = 0,
  taxRate = 0, // e.g. 0.14 for 14%
}) {
  const rawSubtotal = Math.max(0, parseFloat(subtotal) || 0);
  const rawDiscountVal = Math.max(0, parseFloat(discountValue) || 0);
  const consumables = Math.max(0, parseFloat(consumablesTotal) || 0);
  const rate = Math.max(0, parseFloat(taxRate) || 0);

  const isPercentage = String(discountType).toLowerCase() === 'percentage' || discountType === 'نسبة' || discountType === '%';

  let discountAmount = 0;
  if (isPercentage) {
    discountAmount = Math.round(((rawSubtotal * Math.min(100, rawDiscountVal)) / 100) * 100) / 100;
  } else {
    // Fixed amount discount cannot exceed subtotal
    discountAmount = Math.min(rawSubtotal, rawDiscountVal);
  }

  const taxableSubtotal = Math.max(0, rawSubtotal - discountAmount + consumables);
  const taxAmount = Math.round(taxableSubtotal * rate * 100) / 100;
  const netAmount = Math.round((taxableSubtotal + taxAmount) * 100) / 100;

  return {
    subtotal: rawSubtotal,
    discountAmount,
    discountType: isPercentage ? 'percentage' : 'fixed',
    discountValue: rawDiscountVal,
    consumablesTotal: consumables,
    taxAmount,
    netAmount,
  };
}

/**
 * Evaluates remaining package sessions, progress percentage, and active status.
 */
function calculatePackageBalance({
  totalSessions = 1,
  completedSessions = 0,
}) {
  const total = Math.max(1, parseInt(totalSessions, 10) || 1);
  const completed = Math.max(0, parseInt(completedSessions, 10) || 0);
  const remaining = Math.max(0, total - completed);
  const progressPercent = Math.min(100, Math.round((completed / total) * 100));
  const isCompleted = remaining === 0;

  return {
    totalSessions: total,
    completedSessions: completed,
    remainingSessions: remaining,
    progressPercent,
    status: isCompleted ? 'completed' : 'active',
  };
}

/**
 * Calculates payroll net salary after bonuses and deductions.
 */
function calculatePayrollNet({
  baseSalary = 0,
  bonuses = 0,
  deductions = 0,
}) {
  const base = Math.max(0, parseFloat(baseSalary) || 0);
  const bonus = Math.max(0, parseFloat(bonuses) || 0);
  const deduct = Math.max(0, parseFloat(deductions) || 0);
  const net = Math.max(0, Math.round((base + bonus - deduct) * 100) / 100);

  return {
    baseSalary: base,
    bonuses: bonus,
    deductions: deduct,
    netSalary: net,
  };
}

/**
 * Calculates inventory stock movement and minimum alert threshold.
 */
function calculateInventoryStockDelta({
  currentStock = 0,
  quantityChange = 0,
  movementType = 'IN', // 'IN' | 'OUT' | 'ADJUST'
  minStockAlert = 5,
}) {
  const current = parseInt(currentStock, 10) || 0;
  const change = Math.max(0, parseInt(quantityChange, 10) || 0);
  const minAlert = parseInt(minStockAlert, 10) || 0;

  let newStock = current;
  if (movementType === 'IN') {
    newStock = current + change;
  } else if (movementType === 'OUT') {
    if (change > current) {
      throw new Error(`الكمية المطلوبة (${change}) تتجاوز المخزون الحالي (${current})`);
    }
    newStock = current - change;
  } else if (movementType === 'ADJUST') {
    newStock = change;
  }

  const isLowStock = newStock <= minAlert;

  return {
    previousStock: current,
    change,
    movementType,
    newStock,
    isLowStock,
  };
}

module.exports = {
  calculateSpecialistCommission,
  calculateInvoiceAmounts,
  calculatePackageBalance,
  calculatePayrollNet,
  calculateInventoryStockDelta,
};
