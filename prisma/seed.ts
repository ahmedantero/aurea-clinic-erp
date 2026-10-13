import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. SEED CATEGORIES
  const categoryNames = [
    'علاج طبيعي',
    'حجامة',
    'عناية بالبشرة',
    'عناية بالشعر',
    'سبا وتدليك',
    'أسنان',
  ];

  const categoryMap = new Map<string, string>();

  for (const name of categoryNames) {
    let category = await prisma.category.findFirst({
      where: { name },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name },
      });
    }

    categoryMap.set(name, category.id);
  }

  console.log(`✓ Seeded ${categoryMap.size} categories.`);

  // 2. SEED SERVICES
  const servicesData = [
    // Skin Care ('عناية بالبشرة')
    {
      name: 'تقشير خفيف وتجديد البشرة',
      category: 'عناية بالبشرة',
      min_price: 250,
      max_price: 400,
      duration_minutes: 45,
      type: 'عناية بالبشرة',
    },
    {
      name: 'ديرما بيل',
      category: 'عناية بالبشرة',
      min_price: 350,
      max_price: 650,
      duration_minutes: 60,
      type: 'عناية بالبشرة',
    },

    // Hair Care ('عناية بالشعر')
    {
      name: 'صبغة',
      category: 'عناية بالشعر',
      min_price: 400,
      max_price: null,
      duration_minutes: 90,
      type: 'عناية بالشعر',
    },
    {
      name: 'معالجة وفرد - شعر قصير ضعيف',
      category: 'عناية بالشعر',
      min_price: 1200,
      max_price: null,
      duration_minutes: 120,
      type: 'عناية بالشعر',
    },
    {
      name: 'فرد نانو كافيار - قصير',
      category: 'عناية بالشعر',
      min_price: 500,
      max_price: null,
      duration_minutes: 90,
      type: 'عناية بالشعر',
    },
    {
      name: 'مكواة وسيشوار',
      category: 'عناية بالشعر',
      min_price: 150,
      max_price: null,
      duration_minutes: 45,
      type: 'عناية بالشعر',
    },

    // Spa ('سبا وتدليك')
    {
      name: 'سبا اليد الأساسي',
      category: 'سبا وتدليك',
      min_price: 100,
      max_price: null,
      duration_minutes: 30,
      type: 'سبا وتدليك',
    },
    {
      name: 'الحمام المغربي',
      category: 'سبا وتدليك',
      min_price: 500,
      max_price: 1000,
      duration_minutes: 90,
      type: 'سبا وتدليك',
    },

    // Physical Therapy ('علاج طبيعي')
    {
      name: 'جلسة علاج طبيعي أجهزة',
      category: 'علاج طبيعي',
      min_price: 150,
      max_price: null,
      duration_minutes: 45,
      type: 'علاج طبيعي',
    },
    {
      name: 'تدليك علاجي أجهزة كهربائية - كامل',
      category: 'علاج طبيعي',
      min_price: 1000,
      max_price: null,
      duration_minutes: 60,
      type: 'علاج طبيعي',
    },
    {
      name: 'شوكة عظمية',
      category: 'علاج طبيعي',
      min_price: 150,
      max_price: null,
      duration_minutes: 30,
      type: 'علاج طبيعي',
    },

    // Cupping ('حجامة')
    {
      name: 'كاسات زجاجي - جسم كامل',
      category: 'حجامة',
      min_price: 500,
      max_price: null,
      duration_minutes: 60,
      type: 'حجامة',
    },
    {
      name: 'حجامة بالموكسا - نصف جسم',
      category: 'حجامة',
      min_price: 500,
      max_price: null,
      duration_minutes: 45,
      type: 'حجامة',
    },
    {
      name: 'حجامة كؤوس خشبية - أماكن محددة',
      category: 'حجامة',
      min_price: 100,
      max_price: null,
      duration_minutes: 30,
      type: 'حجامة',
    },

    // Teeth ('أسنان')
    {
      name: 'ابتسامة هوليوود للفكين',
      category: 'أسنان',
      min_price: 6000,
      max_price: null,
      duration_minutes: 120,
      type: 'أسنان',
    },
  ];

  for (const s of servicesData) {
    const category_id = categoryMap.get(s.category);
    if (!category_id) continue;

    const existingService = await prisma.service.findFirst({
      where: { name: s.name, category_id },
    });

    if (!existingService) {
      await prisma.service.create({
        data: {
          name: s.name,
          category_id,
          min_price: s.min_price,
          max_price: s.max_price,
          duration_minutes: s.duration_minutes,
          type: s.type,
        },
      });
    }
  }

  console.log(`✓ Seeded ${servicesData.length} clinic and spa services.`);

  // 3. SEED PACKAGES
  const packagesData = [
    {
      package_name: 'باكدج العروسة',
      fixed_price: 4000,
      discount_percentage: null,
    },
    {
      package_name: 'عرض 8 جلسات علاج طبيعي',
      fixed_price: 1100,
      discount_percentage: null,
    },
    {
      package_name: 'باكدج الصحاب - 3 أفراد',
      fixed_price: null,
      discount_percentage: 5,
    },
    {
      package_name: 'باكدج الصحاب - 10 أفراد',
      fixed_price: null,
      discount_percentage: 15,
    },
  ];

  for (const pkg of packagesData) {
    const existingPackage = await prisma.package.findFirst({
      where: { package_name: pkg.package_name },
    });

    if (!existingPackage) {
      await prisma.package.create({
        data: {
          package_name: pkg.package_name,
          fixed_price: pkg.fixed_price,
          discount_percentage: pkg.discount_percentage,
          is_active: true,
        },
      });
    }
  }

  console.log(`✓ Seeded ${packagesData.length} packages.`);

  // 4. SEED INVENTORY ITEMS
  const inventoryData = [
    {
      item_name: 'ماسك تهدئة وترطيب',
      unit_cost: 150,
      quantity_in_stock: 50,
      unit_type: 'قطعة',
    },
    {
      item_name: 'ليفة الحمام المغربي',
      unit_cost: 80,
      quantity_in_stock: 100,
      unit_type: 'قطعة',
    },
  ];

  for (const item of inventoryData) {
    const existingItem = await prisma.inventoryItem.findFirst({
      where: { item_name: item.item_name },
    });

    if (!existingItem) {
      await prisma.inventoryItem.create({
        data: {
          item_name: item.item_name,
          unit_cost: item.unit_cost,
          quantity_in_stock: item.quantity_in_stock,
          unit_type: item.unit_type,
        },
      });
    }
  }

  // 5. SEED STAFF
  const staffData = [
    { name: 'د. سارة المنصوري', specialty: 'عناية بالبشرة', commission_type: 'نسبة', commission_value: 20 },
    { name: 'أ. يوسف الشامي', specialty: 'علاج طبيعي', commission_type: 'نسبة', commission_value: 25 },
    { name: 'مها عبد الرحمن', specialty: 'سبا وتدليك', commission_type: 'ثابت', commission_value: 50 },
    { name: 'د. كريم عبد الله', specialty: 'طب الأسنان', commission_type: 'نسبة', commission_value: 30 },
  ];

  for (const st of staffData) {
    const existing = await prisma.staff.findFirst({ where: { name: st.name } });
    if (!existing) {
      await prisma.staff.create({ data: st });
    }
  }
  console.log(`✓ Seeded ${staffData.length} staff members.`);

  // 6. SEED CLIENTS
  const clientsData = [
    { name: 'نورا السعيد', phone: '01012345678', medical_history: 'حساسية من بعض مقشرات الأحماض', loyalty_points: 120 },
    { name: 'أحمد محمود', phone: '01123456789', medical_history: 'انزلاق غضروفي قطني خفيف', loyalty_points: 85 },
    { name: 'ليلى إبراهيم', phone: '01234567890', medical_history: 'لا يوجد ملاحظات', loyalty_points: 210 },
    { name: 'طارق حسام', phone: '01545678901', medical_history: 'ارتفاع ضغط دم منضبط', loyalty_points: 40 },
  ];

  for (const cl of clientsData) {
    const existing = await prisma.client.findFirst({ where: { phone: cl.phone } });
    if (!existing) {
      await prisma.client.create({ data: cl });
    }
  }
  console.log(`✓ Seeded ${clientsData.length} clients.`);

  // 7. SEED USERS
  const usersData = [
    { username: 'admin', password: '123', role: 'ADMIN', name: 'د. خالد عبد الرحمن' },
    { username: 'reception', password: '123', role: 'RECEPTIONIST', name: 'سارة أحمد' },
  ];

  for (const u of usersData) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (!existing) {
      await prisma.user.create({ data: u });
    } else {
      await prisma.user.update({
        where: { username: u.username },
        data: { password: u.password, role: u.role, name: u.name },
      });
    }
  }
  console.log(`✓ Seeded ${usersData.length} users (Admin & Receptionist).`);

  console.log(`✓ Seeded ${inventoryData.length} inventory items.`);
  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
