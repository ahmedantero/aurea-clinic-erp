const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentData() {
  const [apts, invoices, revs] = await Promise.all([
    prisma.appointment.findMany({ select: { id: true, final_price: true, revenueId: true, status: true, appointment_date: true } }),
    prisma.invoice.findMany({ select: { id: true, appointment_id: true, total_amount: true, discount_applied: true, net_amount: true } }),
    prisma.revenue.findMany({ select: { id: true, amount: true, source: true, referenceId: true, description: true } })
  ]);

  console.log('APPOINTMENTS:', JSON.stringify(apts, null, 2));
  console.log('INVOICES:', JSON.stringify(invoices, null, 2));
  console.log('REVENUES:', JSON.stringify(revs, null, 2));

  await prisma.$disconnect();
}

checkCurrentData().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
