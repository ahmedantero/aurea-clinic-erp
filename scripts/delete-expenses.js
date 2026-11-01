const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanExpenses() {
  const del = await prisma.expense.deleteMany({});
  console.log('DELETED EXPENSES:', del.count);
  await prisma.$disconnect();
}

cleanExpenses().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
