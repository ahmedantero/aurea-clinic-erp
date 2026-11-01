const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const appts = await prisma.appointment.findMany({
    include: {
      invoice: true,
      revenue: true,
      consumables: { include: { product: true } },
      client: true,
      staff: true,
      clientPackage: true,
    },
  });

  const revenues = await prisma.revenue.findMany();
  const invoices = await prisma.invoice.findMany();
  const expenses = await prisma.expense.findMany();

  console.log('=== Current Database State ===');
  console.log(`Appointments (${appts.length}):`, appts.map(a => ({
    id: a.id,
    client: a.client?.name,
    staff: a.staff?.name,
    status: a.status,
    final_price: a.final_price,
    revenueId: a.revenueId,
    invoiceId: a.invoice?.id,
    invoiceNet: a.invoice?.net_amount,
    consumablesCount: a.consumables.length,
    packageId: a.client_package_id,
  })));

  console.log(`Revenues (${revenues.length}):`, revenues.map(r => ({
    id: r.id,
    amount: r.amount,
    source: r.source,
    referenceId: r.referenceId,
    category: r.category,
    paymentMethod: r.paymentMethod,
  })));

  console.log(`Invoices (${invoices.length}):`, invoices.map(i => ({
    id: i.id,
    appointment_id: i.appointment_id,
    total: i.total_amount,
    net: i.net_amount,
    method: i.payment_method,
  })));

  console.log(`Expenses (${expenses.length}):`, expenses.map(e => ({
    id: e.id,
    type: e.expense_type,
    amount: e.amount,
    date: e.expense_date,
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
