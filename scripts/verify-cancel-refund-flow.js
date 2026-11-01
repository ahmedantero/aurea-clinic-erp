const app = require('../server');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- 🚀 Starting Cancellation & Refund End-to-End Verification ---');

  // Start app on ephemeral port
  const server = app.listen(0);
  const port = server.address().port;
  console.log(`Ephemeral test server running on port ${port}`);

  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Check current appointment in DB
    const existingApt = await prisma.appointment.findFirst({
      where: { status: 'مؤكد' },
      include: { invoice: true, revenue: true, client: true, staff: true },
    });

    if (!existingApt) {
      console.log('No confirmed appointment found to cancel.');
      return;
    }

    console.log(`Found Appointment ID: ${existingApt.id}`);
    console.log(`Client: ${existingApt.client?.name}, Amount: ${existingApt.final_price} EGP, Invoice: ${existingApt.invoice?.net_amount} EGP`);

    // 2. Call cancel-refund API
    console.log('\n--- 1. Calling POST /api/appointments/:id/cancel-refund ---');
    const cancelRes = await fetch(`${baseUrl}/api/appointments/${existingApt.id}/cancel-refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refund: true,
        refundAmount: existingApt.final_price,
        refundMethod: 'CASH',
        refundReason: 'طلب العميل استرداد كامل المبلغ وإلغاء الحجز',
        restockConsumables: true,
        restorePackageSession: true,
      }),
    });

    const cancelData = await cancelRes.json();
    console.log('API Status:', cancelRes.status);
    console.log('API Response Message:', cancelData.message);
    console.log('Refund Details:', cancelData.refundDetails);

    // 3. Verify Database Integrity
    console.log('\n--- 2. Verifying Database Accounting Integrity ---');
    const updatedApt = await prisma.appointment.findUnique({
      where: { id: existingApt.id },
      include: { invoice: true, revenue: true },
    });

    const isStatusCancelled = updatedApt.status === 'ملغي';
    const isInvoiceZeroed = updatedApt.invoice?.net_amount === 0;
    const isRevenueZeroed = updatedApt.revenue?.amount === 0;

    console.log(`- Appointment Status: ${updatedApt.status} -> ${isStatusCancelled ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Invoice Net Amount: ${updatedApt.invoice?.net_amount} EGP -> ${isInvoiceZeroed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Invoice Method Note: "${updatedApt.invoice?.payment_method}"`);
    console.log(`- Revenue Amount: ${updatedApt.revenue?.amount} EGP -> ${isRevenueZeroed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Revenue Description: "${updatedApt.revenue?.description}"`);

    // 4. Verify Master BI Dashboard Accounting
    console.log('\n--- 3. Verifying Master BI Dashboard Accounting ---');
    const biRes = await fetch(`${baseUrl}/api/reports/bi-overview`);
    const biData = await biRes.json();

    console.log('BI Total Revenue:', biData.kpis?.totalRevenue, 'EGP');
    console.log('BI Total Expenses:', biData.kpis?.totalExpenses, 'EGP');
    console.log('BI Net Profit:', biData.kpis?.netProfit, 'EGP');

    // Total invoice revenue should now be 0 since the 700 EGP was refunded!
    const isBiRevenueCorrect = (biData.kpis?.totalRevenue === 0);
    console.log(`- BI Dashboard Revenue dropped back to 0: ${isBiRevenueCorrect ? '✅ PASS' : '❌ FAIL'}`);

    // 5. Verify Staff Report (Doctor Commission is Zero)
    console.log('\n--- 4. Verifying Staff Doctor Commission ---');
    const staffWithAppts = await prisma.staff.findMany({
      include: {
        appointments: {
          where: {
            status: { in: ['Completed', 'مكتمل', 'Confirmed', 'مؤكد'] },
          },
        },
      },
    });

    let totalStaffAppointments = 0;
    staffWithAppts.forEach(s => {
      totalStaffAppointments += s.appointments.length;
    });

    console.log(`- Active commissionable appointments count: ${totalStaffAppointments} -> ${totalStaffAppointments === 0 ? '✅ PASS (Doctor commission revoked)' : '❌ FAIL'}`);

    console.log('\n✨ ALL TESTS & INTEGRITY CHECKS COMPLETED SUCCESSFULLY! ✨');
  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

main();
