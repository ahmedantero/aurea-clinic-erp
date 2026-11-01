const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateClientInput,
  validateServiceInput,
  validateAppointmentInput,
  validateInvoicePayment,
  validateFinancialTransaction,
  validateUserInput,
} = require('../../utils/validators');

describe('Validation Tests: Input Rules and Integrity Constraints', () => {

  describe('1. Client Validation', () => {
    it('should validate a correct client with name and valid phone', () => {
      const res = validateClientInput({
        name: 'سارة عبد الله',
        phone: '01012345678',
        email: 'sara@example.com',
      });
      assert.equal(res.isValid, true);
      assert.equal(res.errors.length, 0);
    });

    it('should reject missing or empty client name', () => {
      const res = validateClientInput({ name: '   ', phone: '01012345678' });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('اسم العميل مطلوب')));
    });

    it('should reject invalid phone format', () => {
      const res = validateClientInput({ name: 'أحمد محمود', phone: '123' });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('رقم الهاتف غير صالح')));
    });

    it('should reject invalid email format', () => {
      const res = validateClientInput({ name: 'أحمد محمود', phone: '01099887766', email: 'not-an-email' });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('البريد الإلكتروني غير صالح')));
    });
  });

  describe('2. Service Validation', () => {
    it('should validate service with correct name, positive price, and sessions count', () => {
      const res = validateServiceInput({
        name: 'جلسة تنظيف وتغذية البشرة',
        min_price: 450,
        duration_minutes: 45,
        sessions_count: 1,
      });
      assert.equal(res.isValid, true);
    });

    it('should reject negative price', () => {
      const res = validateServiceInput({
        name: 'مساج استرخائي',
        min_price: -50,
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('رقماً موجباً أو صفراً')));
    });

    it('should reject sessions count less than 1', () => {
      const res = validateServiceInput({
        name: 'باقة ليزر',
        min_price: 1200,
        sessions_count: 0,
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('1 على الأقل')));
    });

    it('should reject non-positive duration minutes', () => {
      const res = validateServiceInput({
        name: 'كشف',
        min_price: 200,
        duration_minutes: 0,
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('مدة الجلسة')));
    });
  });

  describe('3. Appointment Booking Validation', () => {
    it('should validate complete appointment payload', () => {
      const res = validateAppointmentInput({
        clientId: 'client-1',
        staffId: 'staff-1',
        serviceId: 'srv-1',
        appointmentDate: '2026-10-25',
        time: '14:30',
      });
      assert.equal(res.isValid, true);
    });

    it('should reject appointment with missing client', () => {
      const res = validateAppointmentInput({
        serviceId: 'srv-1',
        appointmentDate: '2026-10-25',
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('تحديد العميل')));
    });

    it('should reject appointment missing both service and package', () => {
      const res = validateAppointmentInput({
        clientId: 'client-1',
        appointmentDate: '2026-10-25',
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('خدمة أو باقة')));
    });

    it('should reject invalid appointment date', () => {
      const res = validateAppointmentInput({
        clientId: 'client-1',
        serviceId: 'srv-1',
        appointmentDate: 'invalid-date-string',
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('تاريخ الحجز غير صالح')));
    });
  });

  describe('4. Invoice Payment Validation', () => {
    it('should validate standard cash invoice payment', () => {
      const res = validateInvoicePayment({
        totalAmount: 500,
        netAmount: 450,
        discountApplied: 50,
        paymentMethod: 'كاش',
      });
      assert.equal(res.isValid, true);
    });

    it('should reject discount larger than total amount', () => {
      const res = validateInvoicePayment({
        totalAmount: 300,
        netAmount: 0,
        discountApplied: 500,
        paymentMethod: 'فيزا',
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('تتجاوز إجمالي الفاتورة')));
    });

    it('should reject negative total or net amounts', () => {
      const res = validateInvoicePayment({
        totalAmount: -100,
        netAmount: -100,
        paymentMethod: 'كاش',
      });
      assert.equal(res.isValid, false);
    });

    it('should reject unsupported payment method', () => {
      const res = validateInvoicePayment({
        totalAmount: 300,
        netAmount: 300,
        paymentMethod: 'bitcoin',
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('طريقة الدفع غير مدعومة')));
    });
  });

  describe('5. Financial Transaction (Expenses & Revenues) Validation', () => {
    it('should validate positive financial transaction', () => {
      const res = validateFinancialTransaction({
        amount: 350.5,
        category: 'مستلزمات طبية',
        date: '2026-10-21',
      });
      assert.equal(res.isValid, true);
    });

    it('should reject zero or negative transaction amounts', () => {
      const res = validateFinancialTransaction({
        amount: 0,
        category: 'إيجار',
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('أكبر من صفر')));
    });

    it('should reject missing transaction category', () => {
      const res = validateFinancialTransaction({
        amount: 500,
        category: '   ',
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('التصنيف المالي مطلوب')));
    });
  });

  describe('6. User Management Validation', () => {
    it('should validate valid new user credentials', () => {
      const res = validateUserInput({
        username: 'reception_ahmed',
        password: 'securePassword123',
        role: 'RECEPTIONIST',
      });
      assert.equal(res.isValid, true);
    });

    it('should reject short or special-character usernames', () => {
      const res = validateUserInput({
        username: 'dr@clinic!',
        password: '123',
        role: 'ADMIN',
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('اسم المستخدم')));
    });

    it('should reject invalid role', () => {
      const res = validateUserInput({
        username: 'manager_1',
        password: '123',
        role: 'SUPER_HERO',
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('ADMIN أو RECEPTIONIST')));
    });
  });

});
