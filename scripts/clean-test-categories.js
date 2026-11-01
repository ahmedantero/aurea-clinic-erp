const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  const testCats = await prisma.category.findMany({
    where: {
      OR: [
        { name: { contains: 'تجارب' } },
        { name: { contains: '1792' } },
        { name: { contains: '1793' } },
      ]
    }
  });
  console.log('Found test categories:', testCats.map(c => c.name));
  
  for (const cat of testCats) {
    // Delete any appointments on these test services first if any
    const services = await prisma.service.findMany({ where: { category_id: cat.id } });
    for (const s of services) {
      await prisma.appointment.deleteMany({ where: { service_id: s.id } });
      await prisma.serviceConsumable.deleteMany({ where: { service_id: s.id } });
      await prisma.service.delete({ where: { id: s.id } });
    }
    await prisma.category.delete({ where: { id: cat.id } });
    console.log(`Deleted category ${cat.name}`);
  }

  // Also verify valid categories remaining
  const remaining = await prisma.category.findMany();
  console.log('Remaining categories:', remaining.map(c => c.name));

  await prisma.$disconnect();
}

clean().catch(console.error);
