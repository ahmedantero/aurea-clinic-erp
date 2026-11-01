const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectFinance() {
  const [expenses, revenues, dispatches, transactions, payrolls, apts, invoices] = await Promise.all([
    prisma.expense.count(),
    prisma.revenue.count(),
    prisma.internalDispatch.count(),
    prisma.staffTransaction.count(),
    prisma.payrollRecord.count(),
    prisma.appointment.count(),
    prisma.invoice.count(),
  ]);

  console.log(JSON.stringify({
    expenses,
    revenues,
    internalDispatches: dispatches,
    staffTransactions: transactions,
    payrollRecords: payrolls,
    appointments: apts,
    invoices: invoices
  }, null, 2));

  await prisma.$disconnect();
}

inspectFinance().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
