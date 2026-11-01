const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { status: response.status, data, ok: response.ok };
}

describe('Integration Tests: End-to-End Clinic ERP Lifecycle', () => {
  let authToken = null;
  let testCategoryId = null;
  let testServiceId = null;
  let testStaffId = null;
  let testClientId = null;
  let testAppointmentId = null;
  let testInvoiceId = null;
  let testExpenseId = null;

  before(async () => {
    // Authenticate as admin to obtain JWT
    const loginRes = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'admin',
        password: '123',
      }),
    });

    if (loginRes.ok && loginRes.data?.token) {
      authToken = loginRes.data.token;
    }
  });

  after(async () => {
    const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    // Clean up test entities created during integration tests
    try {
      if (testExpenseId) {
        await apiRequest(`/api/expenses/${testExpenseId}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
      }

      if (testAppointmentId) {
        await apiRequest(`/api/appointments/${testAppointmentId}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
      }

      if (testClientId) {
        await apiRequest(`/api/clients/${testClientId}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
      }

      if (testStaffId) {
        await apiRequest(`/api/staff/${testStaffId}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
      }

      if (testServiceId) {
        await apiRequest(`/api/services/${testServiceId}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
      }

      if (testCategoryId) {
        await apiRequest(`/api/categories/${testCategoryId}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
      }
    } catch (e) {
      // Best-effort cleanup
    }
  });

  // 1. Health check
  it('GET /api/health should return ok and connected database', async () => {
    const res = await apiRequest('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'ok');
    assert.equal(res.data.database, 'connected');
  });

  // 2. Authentication Login
  it('POST /api/auth/login should authenticate valid admin user and return JWT', async () => {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'admin',
        password: '123',
      }),
    });

    assert.equal(res.status, 200);
    assert.ok(res.data.token, 'Should receive JWT token');
    assert.equal(res.data.role, 'ADMIN');
  });

  it('POST /api/auth/login should reject invalid credentials', async () => {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'admin',
        password: 'definitelyWrongPassword',
      }),
    });

    assert.equal(res.status, 401);
  });

  // 3. Category & Service Creation
  it('POST /api/categories & POST /api/services should create category and service', async () => {
    const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    // Create Category
    const catRes = await apiRequest('/api/categories', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `قسم تجارب تكامل ${Date.now()}`,
      }),
    });

    assert.ok([200, 201].includes(catRes.status), `Expected 200 or 201, got ${catRes.status}`);
    assert.ok(catRes.data.id);
    testCategoryId = catRes.data.id;

    // Create Service under Category
    const srvRes = await apiRequest('/api/services', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'جلسة تدليك استرخائي تكاملي',
        categoryId: testCategoryId,
        minPrice: 600,
        durationMinutes: 60,
        sessionsCount: 1,
      }),
    });

    assert.ok([200, 201].includes(srvRes.status), `Expected 200 or 201, got ${srvRes.status}`);
    assert.ok(srvRes.data.id);
    assert.equal(srvRes.data.minPrice, 600);
    testServiceId = srvRes.data.id;
  });

  // 4. Specialist Staff Creation with 25% Commission
  it('POST /api/staff should create a specialist with 25% commission contract', async () => {
    const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    const staffRes = await apiRequest('/api/staff', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `د. متخصص تجارب تكامل ${Date.now()}`,
        specialty: 'علاج طبيعي وسبا',
        phone: '01011223344',
        commissionType: 'نسبة',
        commissionValue: 25,
      }),
    });

    assert.ok([200, 201].includes(staffRes.status), `Expected 200 or 201, got ${staffRes.status}`);
    assert.ok(staffRes.data.id);
    assert.equal(staffRes.data.commissionType, 'نسبة');
    assert.equal(staffRes.data.commissionValue, 25);
    testStaffId = staffRes.data.id;
  });

  // 5. Client Creation
  it('POST /api/clients should register a new client', async () => {
    const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    const clientRes = await apiRequest('/api/clients', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'عميل اختبار النظام الشامل',
        phone: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
      }),
    });

    assert.ok([200, 201].includes(clientRes.status), `Expected 200 or 201, got ${clientRes.status}`);
    assert.ok(clientRes.data.id);
    testClientId = clientRes.data.id;
  });

  // 6. Complete Booking -> Invoicing -> Revenue & Commission Flow
  it('Full Flow: Book Appointment -> Pay Invoice -> Verify Commission & Center Net Profit', async () => {
    const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    // A. Book Appointment
    const aptRes = await apiRequest('/api/appointments', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientId: testClientId,
        staffId: testStaffId,
        serviceId: testServiceId,
        appointmentDate: new Date().toISOString().split('T')[0],
        time: '15:00',
        status: 'مؤكد',
        finalPrice: 600,
      }),
    });

    assert.ok([200, 201].includes(aptRes.status), `Appointment booking should succeed, got ${aptRes.status}: ${JSON.stringify(aptRes.data)}`);
    assert.ok(aptRes.data.id);
    testAppointmentId = aptRes.data.id;
    assert.equal(aptRes.data.status, 'مؤكد');

    // B. Pay and Finalize Invoice (600 EGP Cash)
    const invoiceRes = await apiRequest('/api/invoices', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        appointmentId: testAppointmentId,
        clientId: testClientId,
        totalAmount: 600,
        discountApplied: 0,
        netAmount: 600,
        paymentMethod: 'كاش',
      }),
    });

    assert.ok([200, 201].includes(invoiceRes.status), `Invoice payment must succeed, got ${invoiceRes.status}`);
    const resolvedInvId = invoiceRes.data.invoiceId || invoiceRes.data.id;
    assert.ok(resolvedInvId, 'Invoice response must include an invoiceId or id');
    testInvoiceId = resolvedInvId;
    assert.equal(invoiceRes.data.netAmount ?? invoiceRes.data.net_amount, 600);

    // C. Verify Appointment is updated to 'مكتمل'
    const checkAptRes = await apiRequest(`/api/appointments`, {
      method: 'GET',
      headers: authHeaders,
    });
    const updatedApt = checkAptRes.data.find(a => a.id === testAppointmentId);
    assert.ok(updatedApt, 'Appointment must be in the list');
    assert.equal(updatedApt.status, 'مكتمل');
    assert.equal(updatedApt.finalPrice ?? updatedApt.final_price, 600);

    // D. Verify Specialist 25% Commission in Staff Reports!
    const reportsRes = await apiRequest(`/api/reports/staff`, {
      method: 'GET',
      headers: authHeaders,
    });
    assert.equal(reportsRes.status, 200);

    const specialistReport = reportsRes.data.find(s => s.id === testStaffId);
    assert.ok(specialistReport, 'Specialist report must exist');
    assert.equal(specialistReport.totalRevenue, 600, 'Total revenue must reflect 600 EGP');
    
    // 25% of 600 = 150 EGP for Specialist
    assert.equal(specialistReport.staffDue, 150, 'Specialist 25% commission must strictly evaluate to 150 EGP');
    
    // 75% of 600 = 450 EGP for Center Net Profit
    assert.equal(specialistReport.centerProfit, 450, 'Center net profit must strictly evaluate to 450 EGP');
  });

  // 6.5. Discount Flow: Book Appointment -> Pay with Discount -> Specialist 25% Commission stays untouched on gross
  it('Discount Flow: Book Appointment -> Pay with Discount -> Specialist 25% Commission stays untouched on gross, center absorbs discount', async () => {
    const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    // 1. Create a dedicated specialist with 25% commission
    const staffRes = await apiRequest('/api/staff', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `د. أخصائي اختبار الخصم ${Date.now()}`,
        specialty: 'جلدية وتجميل',
        phone: '01099887766',
        commissionType: 'نسبة',
        commissionValue: 25,
      }),
    });
    assert.ok([200, 201].includes(staffRes.status));
    const discountStaffId = staffRes.data.id;

    // 2. Book an appointment with 1000 EGP gross price
    const aptRes = await apiRequest('/api/appointments', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientId: testClientId,
        staffId: discountStaffId,
        serviceId: testServiceId,
        appointmentDate: new Date().toISOString().split('T')[0],
        time: '17:00',
        status: 'مؤكد',
        finalPrice: 1000,
      }),
    });
    assert.ok([200, 201].includes(aptRes.status));
    const discountAptId = aptRes.data.id;

    // 3. Checkout with 200 EGP discount (Net = 800 EGP)
    const invRes = await apiRequest('/api/invoices', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        appointmentId: discountAptId,
        clientId: testClientId,
        totalAmount: 1000,
        discountApplied: 200,
        discountType: 'amount',
        discountValue: 200,
        netAmount: 800,
        paymentMethod: 'كاش',
      }),
    });
    assert.ok([200, 201].includes(invRes.status));
    assert.equal(invRes.data.netAmount, 800);
    assert.equal(invRes.data.discountApplied, 200);
    // Specialist commission in invoice response is based on gross 1000 EGP: 25% of 1000 = 250 EGP
    assert.equal(invRes.data.doctorCommission, 250);

    // 4. Verify in Staff Reports:
    // Total Revenue collected = 800 EGP
    // Specialist Due = 250 EGP (strictly 25% of gross 1000, NOT 25% of 800!)
    // Center Profit = 800 - 250 = 550 EGP (center absorbed the full 200 discount!)
    const reportsRes = await apiRequest('/api/reports/staff', {
      method: 'GET',
      headers: authHeaders,
    });
    assert.equal(reportsRes.status, 200);

    const specialistReport = reportsRes.data.find(s => s.id === discountStaffId);
    assert.ok(specialistReport, 'Specialist report must exist');
    assert.equal(specialistReport.totalRevenue, 800, 'Collected revenue must be 800 EGP');
    assert.equal(specialistReport.commissionableBase, 1000, 'Commissionable base must remain original 1000 EGP');
    assert.equal(specialistReport.staffDue, 250, 'Specialist due must strictly be 250 EGP (25% of 1000)');
    assert.equal(specialistReport.centerProfit, 550, 'Center net profit must be 550 EGP (800 - 250)');
  });

  // 6.6. Booking Screen Discount: Book directly with discount -> Specialist 25% Commission stays untouched on gross
  it('Booking Screen Discount: POST /api/appointments with discount -> Specialist 25% Commission stays untouched on gross, center absorbs discount', async () => {
    const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    // 1. Create specialist with 25% commission
    const staffRes = await apiRequest('/api/staff', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `د. أخصائي حجز الخصم ${Date.now()}`,
        specialty: 'علاج طبيعي',
        phone: '01011223344',
        commissionType: 'نسبة',
        commissionValue: 25,
      }),
    });
    assert.ok([200, 201].includes(staffRes.status));
    const bookingStaffId = staffRes.data.id;

    // 2. Book appointment with discount directly via POST /api/appointments
    // Service base price is 600, discount is 100 EGP, net is 500 EGP
    const aptRes = await apiRequest('/api/appointments', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientId: testClientId,
        staffId: bookingStaffId,
        serviceId: testServiceId,
        appointmentDate: new Date().toISOString().split('T')[0],
        time: '18:00',
        status: 'مؤكد',
        totalAmount: 600,
        discountApplied: 100,
        discountType: 'amount',
        discountValue: 100,
        finalPrice: 500,
        paymentMethod: 'CASH',
      }),
    });

    assert.ok([200, 201].includes(aptRes.status), `Booking with discount should succeed: ${JSON.stringify(aptRes.data)}`);
    assert.ok(aptRes.data.id);
    assert.equal(aptRes.data.totalAmount, 600, 'Gross total must be 600');
    assert.equal(aptRes.data.discountApplied, 100, 'Discount applied must be 100');
    assert.equal(aptRes.data.finalPrice, 500, 'Final net price collected must be 500');
    // Specialist commission is 25% of gross 600 = 150 (NOT 25% of 500 = 125!)
    assert.equal(aptRes.data.doctorCommission, 150, 'Doctor commission must strictly be 150 (25% of 600)');
    assert.ok(aptRes.data.invoice, 'Invoice object must be returned');
    assert.equal(aptRes.data.invoice.totalAmount, 600, 'Invoice total must be gross 600');
    assert.equal(aptRes.data.invoice.discountApplied, 100, 'Invoice discount must be 100');
    assert.equal(aptRes.data.invoice.netAmount, 500, 'Invoice net amount must be 500');

    // 3. Verify in Staff Reports:
    // Revenue collected = 500
    // Commissionable base = 600
    // Specialist due = 150
    // Center profit = 500 - 150 = 350
    const reportsRes = await apiRequest('/api/reports/staff', {
      method: 'GET',
      headers: authHeaders,
    });
    assert.equal(reportsRes.status, 200);

    const specialistReport = reportsRes.data.find(s => s.id === bookingStaffId);
    assert.ok(specialistReport, 'Specialist report must exist');
    assert.equal(specialistReport.totalRevenue, 500, 'Collected revenue must be 500 EGP');
    assert.equal(specialistReport.commissionableBase, 600, 'Commissionable base must remain gross 600 EGP');
    assert.equal(specialistReport.staffDue, 150, 'Specialist due must strictly be 150 EGP (25% of gross 600)');
    assert.equal(specialistReport.centerProfit, 350, 'Center net profit must be 350 EGP (500 - 150)');
  });

  // 7. Expense Creation and Financial Summary
  it('POST /api/expenses should record an expense and reflect in financial summary', async () => {
    const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    const expRes = await apiRequest('/api/expenses', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        amount: 150,
        category: 'صيانة ومستلزمات تشغيل',
        description: 'فاتورة صيانة اختبار تكامل',
        paymentMethod: 'كاش',
      }),
    });

    assert.ok([200, 201].includes(expRes.status), `Expected 200 or 201, got ${expRes.status}`);
    assert.ok(expRes.data.id);
    testExpenseId = expRes.data.id;

    // Verify Financial Summary
    const summaryRes = await apiRequest('/api/reports/financial', {
      method: 'GET',
      headers: authHeaders,
    });
    assert.equal(summaryRes.status, 200);
    assert.ok(summaryRes.data.totalExpenses >= 150, 'Financial report should include expenses');
    assert.ok(summaryRes.data.totalRevenue >= 600, 'Financial report should include revenues');
  });

  // 8. Inventory Stock Flow
  it('GET /api/inventory should list clinic products', async () => {
    const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    const invRes = await apiRequest('/api/inventory', {
      method: 'GET',
      headers: authHeaders,
    });

    assert.equal(invRes.status, 200);
    assert.ok(Array.isArray(invRes.data));
  });

});
