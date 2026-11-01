const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = ['staff', 'services', 'appointments', 'invoices', 'packages', 'revenues', 'appointment_consumables'];
  for (const t of tables) {
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = '${t}'
      ORDER BY ordinal_position;
    `);
    console.log(`=== TABLE: ${t} ===`);
    console.table(cols);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
