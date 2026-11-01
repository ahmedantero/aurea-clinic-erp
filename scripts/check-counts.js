const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectData() {
  const apts = await prisma.appointment.count();
  const invoices = await prisma.invoice.count();
  const revsFromApt = await prisma.revenue.count({ where: { source: 'APPOINTMENT' } });
  const allRevs = await prisma.revenue.count();
  const aptConsumables = await prisma.appointmentConsumable.count();
  const clientPkgs = await prisma.clientPackage.count();
  const clients = await prisma.client.count();
  const services = await prisma.service.count();
  const staff = await prisma.staff.count();

  console.log(JSON.stringify({
    appointments: apts,
    invoices: invoices,
    appointmentRevenues: revsFromApt,
    allRevenues: allRevs,
    appointmentConsumables: aptConsumables,
    clientPackages: clientPkgs,
    clients: clients,
    services: services,
    staff: staff
  }, null, 2));

  await prisma.$disconnect();
}

inspectData().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
