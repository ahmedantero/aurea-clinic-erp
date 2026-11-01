const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runWeeklyAudit() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [revenues, expenses, appointments] = await Promise.all([
    prisma.revenue.findMany({
      where: { date: { gte: sevenDaysAgo } }
    }),
    prisma.expense.findMany({
      where: { expense_date: { gte: sevenDaysAgo } }
    }),
    prisma.appointment.findMany({
      where: { appointment_date: { gte: sevenDaysAgo } },
      include: { staff: true, invoice: true }
    })
  ]);

  const totalRevenue = revenues.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  let totalStaffCommissions = 0;
  for (const apt of appointments) {
    if (apt.staff) {
      const grossPrice = apt.invoice ? (Number(apt.invoice.total_amount) || Number(apt.final_price)) : Number(apt.final_price);
      const isPercentage = apt.staff.commission_type === 'نسبة' || (apt.staff.commission_type && apt.staff.commission_type.includes('%'));
      if (isPercentage) {
        totalStaffCommissions += (grossPrice * (Number(apt.staff.commission_value) || 0)) / 100;
      }
    }
  }

  const centerGrossOperatingProfit = totalRevenue - totalStaffCommissions;
  const centerNetProfit = centerGrossOperatingProfit - totalExpenses;

  const result = {
    period: 'Last 7 Days',
    generatedAt: now.toISOString(),
    totalRevenue,
    totalExpenses,
    totalStaffCommissions: Math.round(totalStaffCommissions * 100) / 100,
    centerGrossOperatingProfit: Math.round(centerGrossOperatingProfit * 100) / 100,
    centerNetProfit: Math.round(centerNetProfit * 100) / 100,
    transactionsCount: {
      revenuesCount: revenues.length,
      expensesCount: expenses.length,
      appointmentsCount: appointments.length
    }
  };

  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

runWeeklyAudit().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
