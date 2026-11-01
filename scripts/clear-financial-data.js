const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetAllFinancialData() {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `financial-reset-backup-${timestamp}.json`);

  console.log('1. Exporting backup of financial data before clearing...');
  const [expenses, revenues, apts, invoices, consumables, dispatches, transactions, payrolls] = await Promise.all([
    prisma.expense.findMany(),
    prisma.revenue.findMany(),
    prisma.appointment.findMany({ include: { consumables: true, invoice: true } }),
    prisma.invoice.findMany(),
    prisma.appointmentConsumable.findMany(),
    prisma.internalDispatch.findMany(),
    prisma.staffTransaction.findMany(),
    prisma.payrollRecord.findMany(),
  ]);

  const backupData = {
    createdAt: new Date().toISOString(),
    expenses,
    revenues,
    appointments: apts,
    invoices,
    appointmentConsumables: consumables,
    internalDispatches: dispatches,
    staffTransactions: transactions,
    payrollRecords: payrolls,
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`✓ Backup successfully saved to: ${backupFile}`);

  console.log('2. Executing atomic financial reset transaction...');
  const result = await prisma.$transaction(async (tx) => {
    // A. Clear Invoices
    const delInvoices = await tx.invoice.deleteMany({});

    // B. Unlink revenueId from appointments
    await tx.appointment.updateMany({
      data: { revenueId: null }
    });

    // C. Clear Appointment Consumables
    const delAptConsumables = await tx.appointmentConsumable.deleteMany({});

    // D. Clear Appointments
    const delApts = await tx.appointment.deleteMany({});

    // E. Clear Revenues
    const delRevs = await tx.revenue.deleteMany({});

    // F. Clear Expenses
    const delExpenses = await tx.expense.deleteMany({});

    // G. Clear Internal Dispatches (since they represent internal expense tracking)
    const delDispatches = await tx.internalDispatch.deleteMany({});

    // H. Clear Staff Transactions (Advances, Bonuses, Deductions)
    const delStaffTrans = await tx.staffTransaction.deleteMany({});

    // I. Clear Payroll Records
    const delPayrolls = await tx.payrollRecord.deleteMany({});

    // J. Reset active client package sessions
    const resetPkgs = await tx.clientPackage.updateMany({
      data: { used_sessions: 0 }
    });

    return {
      deletedExpenses: delExpenses.count,
      deletedRevenues: delRevs.count,
      deletedInvoices: delInvoices.count,
      deletedAppointments: delApts.count,
      deletedAppointmentConsumables: delAptConsumables.count,
      deletedInternalDispatches: delDispatches.count,
      deletedStaffTransactions: delStaffTrans.count,
      deletedPayrollRecords: delPayrolls.count,
      resetClientPackages: resetPkgs.count,
    };
  });

  console.log('✓ Financial reset completed successfully:');
  console.log(JSON.stringify(result, null, 2));

  await prisma.$disconnect();
}

resetAllFinancialData().catch(async (err) => {
  console.error('Error during financial reset:', err);
  await prisma.$disconnect();
  process.exit(1);
});
