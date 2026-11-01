const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMultiService() {
  console.log('Testing Multi-Service in DB...');
  const client = await prisma.client.findFirst();
  const staff = await prisma.staff.findFirst();
  const services = await prisma.service.findMany({ take: 2 });

  if (!client || !staff || services.length < 2) {
    console.log('Not enough data to run multi-service test');
    return;
  }

  console.log('Client:', client.name, 'Staff:', staff.name);
  console.log('Service 1:', services[0].name, 'Price:', services[0].min_price);
  console.log('Service 2:', services[1].name, 'Price:', services[1].min_price);

  const totalBase = services[0].min_price + services[1].min_price;

  const apt = await prisma.appointment.create({
    data: {
      client_id: client.id,
      staff_id: staff.id,
      service_id: services[0].id,
      appointment_date: new Date(),
      status: 'مؤكد',
      final_price: totalBase,
      paymentMethod: 'CASH',
      appointmentServices: {
        create: [
          {
            service_id: services[0].id,
            service_name: services[0].name,
            price: services[0].min_price,
            duration_minutes: services[0].duration_minutes,
            staff_id: staff.id,
          },
          {
            service_id: services[1].id,
            service_name: services[1].name,
            price: services[1].min_price,
            duration_minutes: services[1].duration_minutes,
            staff_id: staff.id,
          },
        ],
      },
    },
    include: {
      appointmentServices: true,
      service: true,
    },
  });

  console.log('Created appointment ID:', apt.id);
  console.log('Associated services count:', apt.appointmentServices.length);
  console.log('Services names:', apt.appointmentServices.map(s => s.service_name).join(' + '));

  if (apt.appointmentServices.length !== 2) {
    throw new Error('Expected 2 appointmentServices!');
  }

  // Clean up
  await prisma.appointmentService.deleteMany({ where: { appointment_id: apt.id } });
  await prisma.appointment.delete({ where: { id: apt.id } });
  console.log('Multi-service DB test passed and cleaned up successfully!');
}

testMultiService().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
