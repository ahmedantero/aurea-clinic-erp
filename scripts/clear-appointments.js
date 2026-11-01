const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetAppointments() {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `appointments-backup-${timestamp}.json`);

  console.log('1. Exporting backup of appointments data before deletion...');
  const [apts, invoices, revs, aptConsumables] = await Promise.all([
    prisma.appointment.findMany({ include: { consumables: true, invoice: true } }),
    prisma.invoice.findMany(),
    prisma.revenue.findMany({ where: { source: 'APPOINTMENT' } }),
    prisma.appointmentConsumable.findMany(),
  ]);

  const backupData = {
    createdAt: new Date().toISOString(),
    appointmentsCount: apts.length,
    invoicesCount: invoices.length,
    revenuesCount: revs.length,
    consumablesCount: aptConsumables.length,
    appointments: apts,
    invoices,
    revenues: revs,
    appointmentConsumables: aptConsumables,
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`✓ Backup successfully saved to: ${backupFile}`);

  console.log('2. Performing atomic clean-up transaction...');
  const result = await prisma.$transaction(async (tx) => {
    // A. Delete invoices tied to appointments
    const delInvoices = await tx.invoice.deleteMany({});

    // B. Unlink revenueId from appointments to prevent foreign key constraint issues
    await tx.appointment.updateMany({
      data: { revenueId: null }
    });

    // C. Delete appointment consumables
    const delConsumables = await tx.appointmentConsumable.deleteMany({});

    // D. Delete appointment records
    const delApts = await tx.appointment.deleteMany({});

    // E. Delete revenues generated from appointments
    const delRevs = await tx.revenue.deleteMany({
      where: { source: 'APPOINTMENT' }
    });

    // F. Reset used_sessions to 0 on any active client packages so clients can start fresh
    const resetPackages = await tx.clientPackage.updateMany({
      data: { used_sessions: 0 }
    });

    return {
      deletedInvoices: delInvoices.count,
      deletedConsumables: delConsumables.count,
      deletedAppointments: delApts.count,
      deletedRevenues: delRevs.count,
      resetClientPackages: resetPackages.count,
    };
  });

  console.log('✓ Clean-up completed successfully:');
  console.log(JSON.stringify(result, null, 2));

  await prisma.$disconnect();
}

resetAppointments().catch(async (err) => {
  console.error('Error during reset:', err);
  await prisma.$disconnect();
  process.exit(1);
});
