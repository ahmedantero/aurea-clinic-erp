try { if (process.loadEnvFile) process.loadEnvFile(); } catch (e) {}

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Strict Cache-Busting Headers for Real-Time ERP (No Caching Anywhere)
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json({ status: 'ok', database: 'connected' });
});

// 0. GET ALL CATEGORIES
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        services: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        servicesCount: c.services.length,
      }))
    );
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// 0.1 CREATE CATEGORY
app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'اسم التصنيف مطلوب' });
    }

    const existing = await prisma.category.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } },
    });
    if (existing) {
      return res.status(400).json({ error: 'هذا التصنيف مسجل مسبقاً' });
    }

    const created = await prisma.category.create({
      data: { name: name.trim() },
    });

    res.status(201).json({
      id: created.id,
      name: created.name,
      servicesCount: 0,
    });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'فشل إضافة التصنيف', details: err.message });
  }
});

// 0.2 UPDATE CATEGORY
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'اسم التصنيف مطلوب' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name: name.trim() },
      include: { services: true },
    });

    res.json({
      id: updated.id,
      name: updated.name,
      servicesCount: updated.services.length,
    });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'فشل تحديث التصنيف', details: err.message });
  }
});

// 0.3 DELETE CATEGORY
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const servicesCount = await prisma.service.count({
      where: { category_id: id },
    });

    if (servicesCount > 0) {
      return res.status(400).json({
        error: `لا يمكن حذف هذا التصنيف لأنه يحتوي على ${servicesCount} خدمة. يرجى حذف أو نقل الخدمات أولاً.`,
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({ success: true, message: 'تم حذف التصنيف بنجاح' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'فشل حذف التصنيف', details: err.message });
  }
});

// 1. GET ALL SERVICES (with categories)
app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    res.json(
      services.map((s) => ({
        id: s.id,
        name: s.name,
        categoryId: s.category_id,
        category: s.category?.name || 'عام',
        minPrice: s.min_price,
        maxPrice: s.max_price,
        durationMinutes: s.duration_minutes,
        type: s.type,
        sessionsCount: s.sessions_count || 1,
      }))
    );
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// 1.1 CREATE SERVICE
app.post('/api/services', async (req, res) => {
  try {
    const { name, categoryId, category, minPrice, maxPrice, durationMinutes, type, sessionsCount } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'اسم الخدمة مطلوب' });
    }

    let cat = null;
    if (categoryId) {
      cat = await prisma.category.findUnique({ where: { id: categoryId } });
    }
    if (!cat && category) {
      cat = await prisma.category.findFirst({
        where: { name: { equals: category.trim(), mode: 'insensitive' } },
      });
    }
    if (!cat) {
      cat = await prisma.category.findFirst();
      if (!cat) {
        cat = await prisma.category.create({ data: { name: 'عام' } });
      }
    }

    const price = parseFloat(minPrice) || 0;
    const dur = parseInt(durationMinutes) || 45;

    const created = await prisma.service.create({
      data: {
        name: name.trim(),
        category_id: cat.id,
        min_price: price,
        max_price: maxPrice ? parseFloat(maxPrice) : null,
        duration_minutes: dur,
        type: type ? type.trim() : cat.name,
        sessions_count: parseInt(sessionsCount, 10) || 1,
      },
      include: { category: true },
    });

    res.status(201).json({
      id: created.id,
      name: created.name,
      categoryId: created.category_id,
      category: created.category?.name || 'عام',
      minPrice: created.min_price,
      maxPrice: created.max_price,
      durationMinutes: created.duration_minutes,
      type: created.type,
      sessionsCount: created.sessions_count || 1,
    });
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).json({ error: 'فشل إضافة الخدمة', details: err.message });
  }
});

// 1.2 UPDATE SERVICE
app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId, category, minPrice, maxPrice, durationMinutes, type, sessionsCount } = req.body;

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name.trim();
    if (minPrice !== undefined) dataToUpdate.min_price = parseFloat(minPrice);
    if (maxPrice !== undefined) dataToUpdate.max_price = maxPrice ? parseFloat(maxPrice) : null;
    if (durationMinutes !== undefined) dataToUpdate.duration_minutes = parseInt(durationMinutes) || 45;
    if (type) dataToUpdate.type = type.trim();
    if (sessionsCount !== undefined) dataToUpdate.sessions_count = parseInt(sessionsCount, 10) || 1;

    if (categoryId || category) {
      let cat = null;
      if (categoryId) {
        cat = await prisma.category.findUnique({ where: { id: categoryId } });
      }
      if (!cat && category) {
        cat = await prisma.category.findFirst({
          where: { name: { equals: category.trim(), mode: 'insensitive' } },
        });
      }
      if (cat) {
        dataToUpdate.category_id = cat.id;
        if (!type) dataToUpdate.type = cat.name;
      }
    }

    const updated = await prisma.service.update({
      where: { id },
      data: dataToUpdate,
      include: { category: true },
    });

    res.json({
      id: updated.id,
      name: updated.name,
      categoryId: updated.category_id,
      category: updated.category?.name || 'عام',
      minPrice: updated.min_price,
      maxPrice: updated.max_price,
      durationMinutes: updated.duration_minutes,
      type: updated.type,
      sessionsCount: updated.sessions_count || 1,
    });
  } catch (err) {
    console.error('Error updating service:', err);
    res.status(500).json({ error: 'فشل تحديث الخدمة', details: err.message });
  }
});

// 1.3 DELETE SERVICE
app.delete('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const appointmentCount = await prisma.appointment.count({
      where: { service_id: id },
    });

    if (appointmentCount > 0) {
      return res.status(400).json({
        error: `لا يمكن حذف هذه الخدمة لوجود ${appointmentCount} حجز مسجل بها في السجلات.`,
      });
    }

    await prisma.serviceConsumable.deleteMany({
      where: { service_id: id },
    });

    await prisma.service.delete({
      where: { id },
    });

    res.json({ success: true, message: 'تم حذف الخدمة بنجاح' });
  } catch (err) {
    console.error('Error deleting service:', err);
    res.status(500).json({ error: 'فشل حذف الخدمة', details: err.message });
  }
});

// 2. GET ALL PACKAGES
app.get('/api/packages', async (req, res) => {
  try {
    const packages = await prisma.package.findMany({
      where: { is_active: true },
      orderBy: { package_name: 'asc' },
    });
    res.json(
      packages.map((p) => ({
        id: p.id,
        name: p.package_name,
        fixedPrice: p.fixed_price,
        discountPercentage: p.discount_percentage,
        sessionsCount: p.sessions_count || 1,
      }))
    );
  } catch (err) {
    console.error('Error fetching packages:', err);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// 2.1 CREATE PACKAGE
app.post('/api/packages', async (req, res) => {
  try {
    const { name, fixedPrice, discountPercentage, sessionsCount } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'اسم الباقة مطلوب' });
    }
    const created = await prisma.package.create({
      data: {
        package_name: name.trim(),
        fixed_price: fixedPrice ? parseFloat(fixedPrice) : null,
        discount_percentage: discountPercentage ? parseFloat(discountPercentage) : null,
        sessions_count: parseInt(sessionsCount, 10) || 1,
        is_active: true,
      },
    });
    res.status(201).json({
      id: created.id,
      name: created.package_name,
      fixedPrice: created.fixed_price,
      discountPercentage: created.discount_percentage,
      sessionsCount: created.sessions_count || 1,
    });
  } catch (err) {
    console.error('Error creating package:', err);
    res.status(500).json({ error: 'فشل إنشاء الباقة' });
  }
});

// 2.2 UPDATE PACKAGE
app.put('/api/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fixedPrice, discountPercentage, sessionsCount, isActive } = req.body;
    const dataToUpdate = {};
    if (name) dataToUpdate.package_name = name.trim();
    if (fixedPrice !== undefined) dataToUpdate.fixed_price = fixedPrice ? parseFloat(fixedPrice) : null;
    if (discountPercentage !== undefined) dataToUpdate.discount_percentage = discountPercentage ? parseFloat(discountPercentage) : null;
    if (sessionsCount !== undefined) dataToUpdate.sessions_count = parseInt(sessionsCount, 10) || 1;
    if (isActive !== undefined) dataToUpdate.is_active = !!isActive;

    const updated = await prisma.package.update({
      where: { id },
      data: dataToUpdate,
    });
    res.json({
      id: updated.id,
      name: updated.package_name,
      fixedPrice: updated.fixed_price,
      discountPercentage: updated.discount_percentage,
      sessionsCount: updated.sessions_count || 1,
    });
  } catch (err) {
    console.error('Error updating package:', err);
    res.status(500).json({ error: 'فشل تحديث الباقة' });
  }
});

// 2.3 DELETE PACKAGE
app.delete('/api/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.package.update({
      where: { id },
      data: { is_active: false },
    });
    res.json({ success: true, message: 'تم إلغاء تفعيل الباقة بنجاح' });
  } catch (err) {
    console.error('Error deleting package:', err);
    res.status(500).json({ error: 'فشل حذف الباقة' });
  }
});

// ==========================================
// 2.5 CLIENT PACKAGES & MULTI-SESSION TRACKING
// ==========================================

// Helper: Auto-increment used_sessions when an appointment is completed
async function handlePackageDeductionOnCompletion(appointmentId) {
  try {
    const apt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { clientPackage: true },
    });

    if (apt && apt.client_package_id && apt.clientPackage) {
      const currentUsed = apt.clientPackage.used_sessions || 0;
      const totalSessions = apt.clientPackage.total_sessions || 0;
      const newUsed = currentUsed + 1;
      const newStatus = newUsed >= totalSessions ? 'COMPLETED' : 'ACTIVE';

      await prisma.clientPackage.update({
        where: { id: apt.client_package_id },
        data: {
          used_sessions: newUsed,
          status: newStatus,
        },
      });
      console.log(`[ClientPackage] Incremented used_sessions for package ${apt.client_package_id}: ${newUsed}/${totalSessions} (Status: ${newStatus})`);
    }
  } catch (err) {
    console.warn('[ClientPackage] Error auto-incrementing package sessions:', err.message);
  }
}

// GET all client packages (optionally filter by clientId or status)
app.get('/api/client-packages', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { clientId, status } = req.query;
    const where = {};
    if (clientId) where.client_id = clientId;
    if (status) where.status = status;

    const packages = await prisma.clientPackage.findMany({
      where,
      include: {
        client: true,
        service: true,
        package: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      packages.map((cp) => ({
        id: cp.id,
        clientId: cp.client_id,
        clientName: cp.client?.name || 'عميل غير محدد',
        clientPhone: cp.client?.phone || '',
        packageId: cp.package_id,
        serviceId: cp.service_id,
        packageName: cp.package_name || cp.package?.package_name || cp.service?.name || 'باقة جلسات',
        totalSessions: cp.total_sessions,
        usedSessions: cp.used_sessions,
        remainingSessions: Math.max(0, cp.total_sessions - cp.used_sessions),
        pricePaid: cp.price_paid,
        status: cp.status,
        notes: cp.notes || '',
        createdAt: cp.createdAt ? cp.createdAt.toISOString().split('T')[0] : '',
      }))
    );
  } catch (err) {
    console.error('Error fetching client packages:', err);
    res.status(500).json({ error: 'Failed to fetch client packages' });
  }
});

// POST assign new package to client
app.post('/api/client-packages', async (req, res) => {
  try {
    const {
      clientId,
      packageId,
      serviceId,
      packageName,
      totalSessions,
      pricePaid = 0,
      notes = '',
    } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: 'العميل مطلوب' });
    }

    const sessionsCount = parseInt(totalSessions, 10);
    if (isNaN(sessionsCount) || sessionsCount <= 0) {
      return res.status(400).json({ error: 'عدد الجلسات الإجمالي يجب أن يكون رقماً أكبر من صفر' });
    }

    let resolvedName = packageName;
    if (!resolvedName && packageId) {
      const p = await prisma.package.findUnique({ where: { id: packageId } });
      if (p) resolvedName = p.package_name;
    }
    if (!resolvedName && serviceId) {
      const s = await prisma.service.findUnique({ where: { id: serviceId } });
      if (s) resolvedName = `باقة ${s.name}`;
    }
    if (!resolvedName) {
      resolvedName = 'باقة جلسات متعددة';
    }

    const created = await prisma.clientPackage.create({
      data: {
        client_id: clientId,
        package_id: packageId || null,
        service_id: serviceId || null,
        package_name: resolvedName,
        total_sessions: sessionsCount,
        used_sessions: 0,
        price_paid: parseFloat(pricePaid) || 0,
        status: 'ACTIVE',
        notes: notes || null,
      },
      include: {
        client: true,
        service: true,
        package: true,
      },
    });

    res.status(201).json({
      id: created.id,
      clientId: created.client_id,
      clientName: created.client?.name,
      packageId: created.package_id,
      serviceId: created.service_id,
      packageName: created.package_name,
      totalSessions: created.total_sessions,
      usedSessions: created.used_sessions,
      remainingSessions: created.total_sessions,
      pricePaid: created.price_paid,
      status: created.status,
      notes: created.notes || '',
      createdAt: created.createdAt ? created.createdAt.toISOString().split('T')[0] : '',
    });
  } catch (err) {
    console.error('Error creating client package:', err);
    res.status(500).json({ error: 'Failed to create client package', details: err.message });
  }
});

// PATCH update client package (sessions, status, notes)
app.patch('/api/client-packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { usedSessions, totalSessions, status, notes } = req.body;

    const existing = await prisma.clientPackage.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'باقة العميل غير موجودة' });
    }

    const updateData = {};
    if (typeof usedSessions === 'number') {
      updateData.used_sessions = Math.max(0, usedSessions);
    }
    if (typeof totalSessions === 'number') {
      updateData.total_sessions = Math.max(1, totalSessions);
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const newUsed = updateData.used_sessions !== undefined ? updateData.used_sessions : existing.used_sessions;
    const newTotal = updateData.total_sessions !== undefined ? updateData.total_sessions : existing.total_sessions;

    if (status) {
      updateData.status = status;
    } else if (newUsed >= newTotal) {
      updateData.status = 'COMPLETED';
    } else {
      updateData.status = 'ACTIVE';
    }

    const updated = await prisma.clientPackage.update({
      where: { id },
      data: updateData,
      include: { client: true, service: true, package: true },
    });

    res.json({
      id: updated.id,
      clientId: updated.client_id,
      clientName: updated.client?.name,
      packageId: updated.package_id,
      serviceId: updated.service_id,
      packageName: updated.package_name,
      totalSessions: updated.total_sessions,
      usedSessions: updated.used_sessions,
      remainingSessions: Math.max(0, updated.total_sessions - updated.used_sessions),
      pricePaid: updated.price_paid,
      status: updated.status,
      notes: updated.notes || '',
    });
  } catch (err) {
    console.error('Error updating client package:', err);
    res.status(500).json({ error: 'Failed to update client package' });
  }
});

// DELETE client package
app.delete('/api/client-packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.clientPackage.delete({
      where: { id },
    });
    res.json({ success: true, message: 'تم حذف الباقة بنجاح' });
  } catch (err) {
    console.error('Error deleting client package:', err);
    res.status(500).json({ error: 'Failed to delete client package' });
  }
});

// 3. GET ALL STAFF
app.get('/api/staff', async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(
      staff.map((st) => ({
        id: st.id,
        name: st.name,
        specialty: st.specialty,
        phone: st.phone || '',
        commissionType: st.commission_type,
        commissionValue: st.commission_value,
      }))
    );
  } catch (err) {
    console.error('Error fetching staff:', err);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// 3.1 CREATE STAFF MEMBER
app.post('/api/staff', async (req, res) => {
  try {
    const { name, specialty, phone, commissionType, commissionValue } = req.body;
    if (!name || !specialty) {
      return res.status(400).json({ error: 'الاسم والتخصص مطلوبان' });
    }

    const created = await prisma.staff.create({
      data: {
        name: name.trim(),
        specialty: specialty.trim(),
        phone: phone ? phone.trim() : null,
        commission_type: commissionType || 'نسبة',
        commission_value: parseFloat(commissionValue) || 0,
      },
    });

    res.status(201).json({
      id: created.id,
      name: created.name,
      specialty: created.specialty,
      phone: created.phone || '',
      commissionType: created.commission_type,
      commissionValue: created.commission_value,
    });
  } catch (err) {
    console.error('Error creating staff member:', err);
    res.status(500).json({ error: 'Failed to create staff member', details: err.message });
  }
});

// 3.2 UPDATE STAFF MEMBER
app.put('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialty, phone, commissionType, commissionValue } = req.body;

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name.trim();
    if (specialty) dataToUpdate.specialty = specialty.trim();
    if (phone !== undefined) dataToUpdate.phone = phone ? phone.trim() : null;
    if (commissionType) dataToUpdate.commission_type = commissionType;
    if (commissionValue !== undefined) dataToUpdate.commission_value = parseFloat(commissionValue);

    const updated = await prisma.staff.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({
      id: updated.id,
      name: updated.name,
      specialty: updated.specialty,
      phone: updated.phone || '',
      commissionType: updated.commission_type,
      commissionValue: updated.commission_value,
    });
  } catch (err) {
    console.error('Error updating staff member:', err);
    res.status(500).json({ error: 'Failed to update staff member', details: err.message });
  }
});

// 3.3 DELETE STAFF MEMBER
app.delete('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const appointmentCount = await prisma.appointment.count({
      where: { staff_id: id },
    });

    if (appointmentCount > 0) {
      return res.status(400).json({
        error: `لا يمكن حذف هذا الأخصائي لوجود ${appointmentCount} حجز مرتبط باسمه في السجلات.`,
      });
    }

    await prisma.staff.delete({
      where: { id },
    });

    res.json({ success: true, message: 'تم حذف الأخصائي بنجاح' });
  } catch (err) {
    console.error('Error deleting staff member:', err);
    res.status(500).json({ error: 'Failed to delete staff member', details: err.message });
  }
});

// 4. GET ALL CLIENTS WITH CRM METRICS (VISITS, SPENT, APPOINTMENTS, INVOICES, PACKAGES)
app.get('/api/clients', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const clients = await prisma.client.findMany({
      include: {
        appointments: {
          include: {
            service: { include: { category: true } },
            package: true,
            clientPackage: true,
            staff: true,
            invoice: true,
          },
          orderBy: { appointment_date: 'desc' },
        },
        invoices: {
          include: {
            appointment: {
              include: { service: true, package: true, clientPackage: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        clientPackages: {
          include: {
            service: true,
            package: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(
      clients.map((c) => {
        const totalVisits = c.appointments?.length || 0;
        const totalSpent = (c.invoices || []).reduce(
          (sum, inv) => sum + (parseFloat(inv.net_amount) || 0),
          0
        );

        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          medicalHistory: c.medical_history || '',
          loyaltyPoints: c.loyalty_points,
          totalVisits,
          totalSpent: Math.round(totalSpent * 100) / 100,
          joinDate: c.createdAt ? c.createdAt.toISOString().split('T')[0] : '',
          appointments: (c.appointments || []).map((apt) => {
            const aptServiceName = apt.package?.package_name || apt.service?.name || apt.clientPackage?.package_name || 'موعد';
            const aptCatName = apt.service?.category?.name || (apt.package_id ? 'عروض وباقات' : 'عام');
            return {
              id: apt.id,
              date: apt.appointment_date.toISOString().split('T')[0],
              time: '11:00 ص',
              serviceName: aptServiceName,
              categoryName: aptCatName,
              staffName: apt.staff?.name || 'أخصائي',
              status: apt.status,
              finalPrice: apt.final_price,
              hasInvoice: !!apt.invoice,
            };
          }),
          invoices: (c.invoices || []).map((inv) => {
            const invServiceName = inv.appointment?.package?.package_name || inv.appointment?.service?.name || inv.appointment?.clientPackage?.package_name || 'فاتورة';
            return {
              id: inv.id,
              invoiceNumber: `INV-${inv.id.slice(0, 8).toUpperCase()}`,
              date: inv.createdAt.toISOString().split('T')[0],
              amount: inv.net_amount,
              paymentMethod: inv.payment_method,
              serviceName: invServiceName,
            };
          }),
          clientPackages: (c.clientPackages || []).map((cp) => ({
            id: cp.id,
            clientId: cp.client_id,
            packageId: cp.package_id,
            serviceId: cp.service_id,
            packageName: cp.package_name || cp.package?.package_name || cp.service?.name || 'باقة جلسات',
            totalSessions: cp.total_sessions,
            usedSessions: cp.used_sessions,
            remainingSessions: Math.max(0, cp.total_sessions - cp.used_sessions),
            pricePaid: cp.price_paid,
            status: cp.status,
            notes: cp.notes || '',
            createdAt: cp.createdAt ? cp.createdAt.toISOString().split('T')[0] : '',
          })),
        };
      })
    );
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// 4.1 CREATE CLIENT
app.post('/api/clients', async (req, res) => {
  try {
    const { name, phone, medicalHistory } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'اسم العميل ورقم الهاتف مطلوبان' });
    }

    const created = await prisma.client.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        medical_history: medicalHistory ? medicalHistory.trim() : null,
        loyalty_points: 10,
      },
    });

    res.status(201).json({
      id: created.id,
      name: created.name,
      phone: created.phone,
      medicalHistory: created.medical_history || '',
      loyaltyPoints: created.loyalty_points,
      totalVisits: 0,
      totalSpent: 0,
      joinDate: created.createdAt.toISOString().split('T')[0],
      appointments: [],
      invoices: [],
      clientPackages: [],
    });
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(500).json({ error: 'Failed to create client', details: err.message });
  }
});

// 4.2 UPDATE CLIENT
app.put('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, medicalHistory } = req.body;

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name.trim();
    if (phone) dataToUpdate.phone = phone.trim();
    if (medicalHistory !== undefined) dataToUpdate.medical_history = medicalHistory ? medicalHistory.trim() : null;

    const updated = await prisma.client.update({
      where: { id },
      data: dataToUpdate,
      include: {
        appointments: {
          include: {
            service: { include: { category: true } },
            package: true,
            clientPackage: true,
            staff: true,
            invoice: true,
          },
          orderBy: { appointment_date: 'desc' },
        },
        invoices: {
          include: {
            appointment: {
              include: { service: true, package: true, clientPackage: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        clientPackages: {
          include: { service: true, package: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const totalVisits = updated.appointments?.length || 0;
    const totalSpent = (updated.invoices || []).reduce(
      (sum, inv) => sum + (parseFloat(inv.net_amount) || 0),
      0
    );

    res.json({
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      medicalHistory: updated.medical_history || '',
      loyaltyPoints: updated.loyalty_points,
      totalVisits,
      totalSpent: Math.round(totalSpent * 100) / 100,
      joinDate: updated.createdAt.toISOString().split('T')[0],
      appointments: (updated.appointments || []).map((apt) => {
        const aptServiceName = apt.package?.package_name || apt.service?.name || apt.clientPackage?.package_name || 'موعد';
        const aptCatName = apt.service?.category?.name || (apt.package_id ? 'عروض وباقات' : 'عام');
        return {
          id: apt.id,
          date: apt.appointment_date.toISOString().split('T')[0],
          time: '11:00 ص',
          serviceName: aptServiceName,
          categoryName: aptCatName,
          staffName: apt.staff?.name || 'أخصائي',
          status: apt.status,
          finalPrice: apt.final_price,
          hasInvoice: !!apt.invoice,
        };
      }),
      invoices: (updated.invoices || []).map((inv) => {
        const invServiceName = inv.appointment?.package?.package_name || inv.appointment?.service?.name || inv.appointment?.clientPackage?.package_name || 'فاتورة';
        return {
          id: inv.id,
          invoiceNumber: `INV-${inv.id.slice(0, 8).toUpperCase()}`,
          date: inv.createdAt.toISOString().split('T')[0],
          amount: inv.net_amount,
          paymentMethod: inv.payment_method,
          serviceName: invServiceName,
        };
      }),
      clientPackages: (updated.clientPackages || []).map((cp) => ({
        id: cp.id,
        clientId: cp.client_id,
        packageId: cp.package_id,
        serviceId: cp.service_id,
        packageName: cp.package_name || cp.package?.package_name || cp.service?.name || 'باقة جلسات',
        totalSessions: cp.total_sessions,
        usedSessions: cp.used_sessions,
        remainingSessions: Math.max(0, cp.total_sessions - cp.used_sessions),
        pricePaid: cp.price_paid,
        status: cp.status,
        notes: cp.notes || '',
        createdAt: cp.createdAt ? cp.createdAt.toISOString().split('T')[0] : '',
      })),
    });
  } catch (err) {
    console.error('Error updating client:', err);
    res.status(500).json({ error: 'Failed to update client', details: err.message });
  }
});

// 4.3 DELETE CLIENT
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const aptCount = await prisma.appointment.count({ where: { client_id: id } });
    const invCount = await prisma.invoice.count({ where: { client_id: id } });

    if (aptCount > 0 || invCount > 0) {
      return res.status(400).json({
        error: `لا يمكن حذف هذا العميل لوجود ${aptCount} حجز و ${invCount} فاتورة مسجلة باسمه في السجلات.`,
      });
    }

    await prisma.client.delete({ where: { id } });
    res.json({ success: true, message: 'تم حذف العميل بنجاح' });
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json({ error: 'Failed to delete client', details: err.message });
  }
});

// 5. GET ALL APPOINTMENTS
app.get('/api/appointments', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { status, date } = req.query;

    const where = {};

    // Remove any hidden default date filters or limits!
    // If status filter is "All" or "الكل" or empty, return ALL appointments!
    if (status && status !== 'All' && status !== 'الكل' && status !== 'all') {
      if (status === 'Pending' || status === 'قيد الانتظار') {
        where.status = { in: ['Pending', 'قيد الانتظار'] };
      } else if (status === 'Confirmed' || status === 'مؤكد') {
        where.status = { in: ['Confirmed', 'مؤكد'] };
      } else if (status === 'Completed' || status === 'مكتمل') {
        where.status = { in: ['Completed', 'مكتمل'] };
      } else if (status === 'Cancelled' || status === 'ملغي') {
        where.status = { in: ['Cancelled', 'ملغي'] };
      } else {
        where.status = status;
      }
    }

    // Only filter by date if explicitly passed and valid
    if (date && date !== 'All' && date !== 'الكل' && date !== 'all') {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        const startOfDay = new Date(parsed);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(parsed);
        endOfDay.setUTCHours(23, 59, 59, 999);
        where.appointment_date = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    // Completely unrestricted findMany: No hidden limits, no default date constraints
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: true,
        staff: true,
        service: {
          include: { category: true },
        },
        package: true,
        clientPackage: true,
        invoice: true,
        consumables: {
          include: { product: true },
        },
      },
      orderBy: { appointment_date: 'desc' },
    });

    res.json(
      appointments.map((a) => {
        let normalizedStatus = a.status || 'قيد الانتظار';
        if (normalizedStatus === 'Pending') normalizedStatus = 'قيد الانتظار';
        else if (normalizedStatus === 'Confirmed') normalizedStatus = 'مؤكد';
        else if (normalizedStatus === 'Completed') normalizedStatus = 'مكتمل';
        else if (normalizedStatus === 'Cancelled') normalizedStatus = 'ملغي';

        let aptDate = '';
        let aptTime = '';
        if (a.appointment_date) {
          try {
            const d = new Date(a.appointment_date);
            if (!isNaN(d.getTime())) {
              aptDate = d.toISOString().split('T')[0];
              aptTime = d.toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
              });
            }
          } catch {
            aptDate = '';
            aptTime = '';
          }
        }

        const resolvedItemName = a.service?.name || a.package?.package_name || a.clientPackage?.package_name || 'خدمة غير محددة';
        const resolvedCategoryName = a.service?.category?.name || (a.package_id ? 'عروض وباقات' : 'عام');

        const consumablesTotal = (a.consumables || []).reduce((sum, c) => sum + (parseFloat(c.priceCharged) || 0), 0);
        const totalAptPrice = typeof a.final_price === 'number' ? a.final_price : Number(a.final_price) || 0;
        const baseSessionPrice = Math.max(0, Math.round((totalAptPrice - consumablesTotal) * 100) / 100);

        let invoiceData = null;
        if (a.invoice) {
          invoiceData = {
            invoiceId: a.invoice.id,
            invoiceNumber: `INV-${a.invoice.id.slice(0, 8).toUpperCase()}`,
            appointmentId: a.id,
            clientName: a.client?.name || 'عميل غير مسجل',
            clientPhone: a.client?.phone || '',
            serviceName: resolvedItemName,
            basePrice: baseSessionPrice,
            consumablesPrice: consumablesTotal,
            totalAmount: Number(a.invoice.total_amount) || totalAptPrice,
            discountApplied: Number(a.invoice.discount_applied) || 0,
            netAmount: Number(a.invoice.net_amount) || totalAptPrice,
            paymentMethod: a.invoice.payment_method || 'كاش',
            createdAt: a.invoice.createdAt ? a.invoice.createdAt.toISOString() : new Date().toISOString(),
            items: (a.consumables || []).map((c) => ({
              id: c.productId,
              name: c.product?.item_name || 'مستهلك إضافي',
              price: c.priceCharged,
              quantity: c.quantity,
              chargeToClient: true,
            })),
          };
        }

        return {
          id: a.id,
          clientName: a.client?.name || 'عميل غير مسجل',
          clientPhone: a.client?.phone || '',
          staffName: a.staff?.name || 'غير محدد',
          serviceName: resolvedItemName,
          categoryName: resolvedCategoryName,
          appointmentDate: aptDate,
          time: aptTime,
          status: normalizedStatus,
          basePrice: baseSessionPrice,
          totalConsumablesPrice: consumablesTotal,
          finalPrice: totalAptPrice,
          clientPackageId: a.client_package_id || null,
          packageName: a.clientPackage?.package_name || a.package?.package_name || null,
          isPackageSession: !!a.client_package_id && (Number(a.final_price) === 0),
          consumables: (a.consumables || []).map((c) => ({
            id: c.id,
            productId: c.productId,
            productName: c.product?.item_name || 'مستهلك غير معروف',
            quantity: c.quantity,
            priceCharged: c.priceCharged,
          })),
          invoice: invoiceData,
        };
      })
    );
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// 6. CREATE NEW APPOINTMENT (With POS Automated Package Assignment!)
app.post('/api/appointments', async (req, res) => {
  try {
    const {
      clientId,
      clientName,
      clientPhone,
      newClientName,
      newClientPhone,
      staffId,
      packageId: explicitPackageId,
      serviceId: explicitServiceId,
      itemType,
      itemId,
      itemCompositeId,
      appointmentDate,
      time,
      status = 'مؤكد',
      finalPrice: requestedFinalPrice,
      consumables = [],
    } = req.body;

    // ── Determine target packageId or serviceId ──────────────────────────────
    let packageId = null;
    let serviceId = null;

    if (explicitPackageId && String(explicitPackageId).trim() !== '' && explicitPackageId !== 'null') {
      packageId = String(explicitPackageId).trim();
    } else if (explicitServiceId && String(explicitServiceId).trim() !== '' && explicitServiceId !== 'null') {
      serviceId = String(explicitServiceId).trim();
    } else if (itemType === 'package' && itemId) {
      packageId = String(itemId).trim();
    } else if (itemType === 'service' && itemId) {
      serviceId = String(itemId).trim();
    } else if (itemCompositeId) {
      if (itemCompositeId.startsWith('package_')) {
        packageId = itemCompositeId.replace('package_', '').trim();
      } else if (itemCompositeId.startsWith('service_')) {
        serviceId = itemCompositeId.replace('service_', '').trim();
      }
    }

    if (!packageId && !serviceId) {
      return res.status(400).json({ error: 'يجب اختيار خدمة أو باقة صالحة' });
    }

    // ── Resolve client with guaranteed DB verification (Prevents P2003) ───────
    let targetClient = null;

    if (clientId) {
      targetClient = await prisma.client.findUnique({
        where: { id: clientId },
      });
    }

    const candidatePhone = (clientPhone || newClientPhone || '').trim();
    const candidateName = (clientName || newClientName || '').trim();

    if (!targetClient && candidatePhone) {
      targetClient = await prisma.client.findFirst({
        where: { phone: candidatePhone },
      });
    }

    if (!targetClient && candidateName) {
      targetClient = await prisma.client.findFirst({
        where: { name: candidateName },
      });
    }

    if (!targetClient && (newClientName || candidateName)) {
      targetClient = await prisma.client.create({
        data: {
          name: (newClientName || candidateName).trim(),
          phone: candidatePhone || '01000000000',
          loyalty_points: 10,
        },
      });
    }

    if (!targetClient) {
      targetClient = await prisma.client.findFirst();
      if (!targetClient) {
        targetClient = await prisma.client.create({
          data: {
            name: candidateName || 'عميل مسجل',
            phone: candidatePhone || '01000000000',
            loyalty_points: 10,
          },
        });
      }
    }

    const targetClientId = targetClient.id;

    // ── Resolve staff with guaranteed DB existence (Prevents P2003) ───────────
    let targetStaff = null;
    if (staffId) {
      targetStaff = await prisma.staff.findUnique({ where: { id: staffId } });
    }
    if (!targetStaff) {
      targetStaff = await prisma.staff.findFirst();
      if (!targetStaff) {
        targetStaff = await prisma.staff.create({
          data: {
            name: 'الأخصائي المعالج',
            specialty: 'عام',
            commission_type: 'نسبة',
            commission_value: 30,
          },
        });
      }
    }
    const resolvedStaffId = targetStaff.id;

    // ── Bulletproof Package or Service Handling ─────────────────────────────────
    let resolvedItemName = '';
    let resolvedCategoryName = 'عام';
    let effectivePrice = 0;
    let resolvedClientPackageId = null;
    let autoCreatedPackage = false;
    let isPackageBooking = false;

    if (packageId) {
      // 1. Fetch the exact Package from DB
      isPackageBooking = true;
      const pkg = await prisma.package.findUnique({
        where: { id: packageId },
      });

      if (!pkg) {
        return res.status(404).json({ error: 'الباقة المختارة غير موجودة في قاعدة البيانات' });
      }

      // Real Package Name & Real Price — NEVER fallback to generic string like "جلسة"
      resolvedItemName = pkg.package_name;
      resolvedCategoryName = 'عروض وباقات';

      let totalSessions = pkg.sessions_count || 1;
      // If sessions_count was default 1, check if name has a number (e.g., "عرض 8 جلسات" -> 8)
      if (totalSessions <= 1 && pkg.package_name) {
        const match = pkg.package_name.match(/(\d+)\s*جلس/);
        if (match && match[1]) {
          totalSessions = parseInt(match[1], 10);
        } else if (pkg.package_name.includes('عرض') || pkg.package_name.includes('باكدج') || pkg.package_name.includes('باقة')) {
          totalSessions = 6;
        }
      }

      // Update package in DB so future lookups have the correct sessions_count
      if (totalSessions > 1 && (pkg.sessions_count || 1) <= 1) {
        try {
          await prisma.package.update({
            where: { id: pkg.id },
            data: { sessions_count: totalSessions },
          });
        } catch (_) {}
      }

      const realPackagePrice = pkg.fixed_price != null ? pkg.fixed_price : (parseFloat(requestedFinalPrice) || 0);

      // Check if client ALREADY has an active ClientPackage for this packageId
      const existingActivePkg = await prisma.clientPackage.findFirst({
        where: {
          client_id: targetClientId,
          package_id: packageId,
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingActivePkg && existingActivePkg.used_sessions < existingActivePkg.total_sessions) {
        // ── SCENARIO B: Deduct from existing active package ───────────────────
        resolvedClientPackageId = existingActivePkg.id;
        effectivePrice = 0; // Prepaid — this visit costs 0 EGP

        const newUsed = existingActivePkg.used_sessions + 1;
        const newStatus = newUsed >= existingActivePkg.total_sessions ? 'COMPLETED' : 'ACTIVE';

        await prisma.clientPackage.update({
          where: { id: existingActivePkg.id },
          data: {
            used_sessions: newUsed,
            status: newStatus,
          },
        });

        console.log(`[POS Package Deduct] Client ${targetClientId} deducted 1 session from ${pkg.package_name}. Used: ${newUsed}/${existingActivePkg.total_sessions}`);
      } else {
        // ── SCENARIO A: CREATE the ClientPackage record explicitly linked ────
        const newClientPkg = await prisma.clientPackage.create({
          data: {
            client_id: targetClientId,
            package_id: packageId,
            service_id: null,
            package_name: pkg.package_name,
            total_sessions: totalSessions,
            used_sessions: 1, // First visit counts as session 1
            price_paid: realPackagePrice,
            status: totalSessions > 1 ? 'ACTIVE' : 'COMPLETED',
            notes: 'تم تفعيل الباقة تلقائياً عبر حجز الموعد',
          },
        });

        resolvedClientPackageId = newClientPkg.id;
        effectivePrice = realPackagePrice;
        autoCreatedPackage = true;

        console.log(`[POS Package Create] Created ClientPackage ${newClientPkg.id} for client ${targetClientId}: ${pkg.package_name} (${totalSessions} sessions, used: 1)`);
      }
    } else if (serviceId) {
      // 2. Fetch the exact Service from DB
      const srv = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { category: true },
      });

      if (!srv) {
        return res.status(404).json({ error: 'الخدمة المختارة غير موجودة في قاعدة البيانات' });
      }

      resolvedItemName = srv.name;
      resolvedCategoryName = srv.category?.name || 'عام';
      const srvSessionsCount = Math.max(1, srv.sessions_count || 1);
      const srvPrice = srv.min_price != null ? srv.min_price : (parseFloat(requestedFinalPrice) || 0);

      if (srvSessionsCount > 1) {
        // Multi-session service behaves like a package
        const existingActivePkg = await prisma.clientPackage.findFirst({
          where: {
            client_id: targetClientId,
            service_id: serviceId,
            status: 'ACTIVE',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (existingActivePkg && existingActivePkg.used_sessions < existingActivePkg.total_sessions) {
          resolvedClientPackageId = existingActivePkg.id;
          effectivePrice = 0;
          const newUsed = existingActivePkg.used_sessions + 1;
          const newStatus = newUsed >= existingActivePkg.total_sessions ? 'COMPLETED' : 'ACTIVE';

          await prisma.clientPackage.update({
            where: { id: existingActivePkg.id },
            data: { used_sessions: newUsed, status: newStatus },
          });
        } else {
          const newClientPkg = await prisma.clientPackage.create({
            data: {
              client_id: targetClientId,
              service_id: serviceId,
              package_id: null,
              package_name: `باقة ${srv.name} (${srvSessionsCount} جلسات)`,
              total_sessions: srvSessionsCount,
              used_sessions: 1,
              price_paid: srvPrice,
              status: 'ACTIVE',
              notes: 'تم إنشاء باقة الخدمة تلقائياً عبر حجز الموعد',
            },
          });

          resolvedClientPackageId = newClientPkg.id;
          effectivePrice = srvPrice;
          autoCreatedPackage = true;
        }
      } else {
        effectivePrice = srvPrice;
        resolvedClientPackageId = null;
      }
    }

    // ── Safe date parsing ───────────────────────────────────────────────────────
    let validDate = new Date();
    if (appointmentDate) {
      const parts = appointmentDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        validDate = new Date(Date.UTC(y, m, d, 9, 0, 0));
      }
    }

    // ── Process Consumables (Add-ons charged to client) ─────────────────────────
    const validConsumables = [];
    let consumablesTotal = 0;
    if (Array.isArray(consumables) && consumables.length > 0) {
      for (const item of consumables) {
        if (!item || !item.productId) continue;
        const qty = parseFloat(item.quantity) || 1;
        if (qty <= 0) continue;
        const prod = await prisma.inventoryItem.findUnique({
          where: { id: String(item.productId) },
        });
        if (prod) {
          const unitSellingPrice = prod.selling_price || 0;
          const linePrice = unitSellingPrice * qty;
          consumablesTotal += linePrice;
          validConsumables.push({
            productId: prod.id,
            productName: prod.item_name,
            quantity: qty,
            priceCharged: linePrice,
            unitCost: prod.unit_cost || 0,
            sellingPrice: unitSellingPrice,
          });
        }
      }
    }

    const baseServicePrice = effectivePrice;
    const totalConsumablesPrice = consumablesTotal;
    const finalAppointmentPrice = baseServicePrice + totalConsumablesPrice;

    // ── Calculate Doctor's Commission (Strictly on base service price ONLY) ────
    const staffCommType = targetStaff.commission_type || 'نسبة';
    const staffCommValue = parseFloat(targetStaff.commission_value) || 0;
    const isPercentage = staffCommType === 'نسبة' || staffCommType.includes('%') || staffCommType.toLowerCase() === 'percentage';

    let doctorCommission = 0;
    if (isPercentage) {
      doctorCommission = Math.round(((baseServicePrice * staffCommValue) / 100) * 100) / 100;
    } else {
      doctorCommission = baseServicePrice;
    }

    // ── Create Appointment & Auto-Revenue in DB ────────────────────────────────
    let created = null;

    if (finalAppointmentPrice > 0) {
      const clientDisplayName = targetClient.name || clientName || newClientName || 'عميل مسجل';
      const revenueDesc = `حجز: ${resolvedItemName}${validConsumables.length > 0 ? ` (+ مستهلكات: ${totalConsumablesPrice} ج.م)` : ''} - العميل: ${clientDisplayName}`;

      created = await prisma.$transaction(async (tx) => {
        const rev = await tx.revenue.create({
          data: {
            amount: finalAppointmentPrice,
            date: validDate,
            category: 'حجوزات وباقات',
            description: revenueDesc,
            source: 'APPOINTMENT',
          },
        });

        const apt = await tx.appointment.create({
          data: {
            client_id: targetClientId,
            staff_id: resolvedStaffId,
            package_id: packageId ? packageId : null,
            service_id: serviceId ? serviceId : null,
            client_package_id: resolvedClientPackageId ? resolvedClientPackageId : null,
            revenueId: rev.id,
            appointment_date: validDate,
            status: status,
            final_price: finalAppointmentPrice,
          },
          include: {
            client: true,
            staff: true,
            service: { include: { category: true } },
            package: true,
            clientPackage: true,
            revenue: true,
          },
        });

        // Decrement inventory stock & create AppointmentConsumable records
        for (const c of validConsumables) {
          await tx.inventoryItem.update({
            where: { id: c.productId },
            data: {
              quantity_in_stock: { decrement: c.quantity },
            },
          });
          await tx.appointmentConsumable.create({
            data: {
              appointmentId: apt.id,
              productId: c.productId,
              quantity: c.quantity,
              priceCharged: c.priceCharged,
            },
          });
        }

        await tx.revenue.update({
          where: { id: rev.id },
          data: { referenceId: apt.id },
        });

        return apt;
      });
    } else {
      // 0 EGP Session (Scenario B / active package deduction with 0 consumables charge)
      created = await prisma.$transaction(async (tx) => {
        const apt = await tx.appointment.create({
          data: {
            client_id: targetClientId,
            staff_id: resolvedStaffId,
            package_id: packageId ? packageId : null,
            service_id: serviceId ? serviceId : null,
            client_package_id: resolvedClientPackageId ? resolvedClientPackageId : null,
            revenueId: null,
            appointment_date: validDate,
            status: status,
            final_price: finalAppointmentPrice,
          },
          include: {
            client: true,
            staff: true,
            service: {
              include: { category: true },
            },
            package: true,
            clientPackage: true,
          },
        });

        for (const c of validConsumables) {
          await tx.inventoryItem.update({
            where: { id: c.productId },
            data: {
              quantity_in_stock: { decrement: c.quantity },
            },
          });
          await tx.appointmentConsumable.create({
            data: {
              appointmentId: apt.id,
              productId: c.productId,
              quantity: c.quantity,
              priceCharged: c.priceCharged,
            },
          });
        }

        return apt;
      });
    }

    // ── Create Invoice in DB ───────────────────────────────────────────────────
    const invoicePaymentMethod = finalAppointmentPrice === 0 ? 'باقة مسبقة الدفع' : 'كاش';
    const createdInvoice = await prisma.invoice.create({
      data: {
        client_id: targetClientId,
        appointment_id: created.id,
        total_amount: finalAppointmentPrice,
        discount_applied: 0,
        net_amount: finalAppointmentPrice,
        payment_method: invoicePaymentMethod,
      },
    });

    const invoiceItems = [
      ...(baseServicePrice > 0 || isPackageBooking
        ? [
            {
              id: isPackageBooking ? (packageId || 'pkg') : (serviceId || 'srv'),
              name: resolvedItemName,
              price: baseServicePrice,
              quantity: 1,
              chargeToClient: true,
            },
          ]
        : []),
      ...validConsumables.map((c) => ({
        id: c.productId,
        name: c.productName,
        price: c.priceCharged,
        quantity: c.quantity,
        chargeToClient: true,
      })),
    ];

    const invoiceData = {
      invoiceId: createdInvoice.id,
      invoiceNumber: `INV-${createdInvoice.id.slice(0, 8).toUpperCase()}`,
      appointmentId: created.id,
      clientName: created.client?.name || 'عميل مسجل',
      clientPhone: created.client?.phone || '',
      serviceName: resolvedItemName,
      basePrice: baseServicePrice,
      consumablesPrice: totalConsumablesPrice,
      doctorCommission: doctorCommission,
      doctorCommissionPercentage: staffCommValue,
      totalAmount: finalAppointmentPrice,
      discountApplied: 0,
      netAmount: finalAppointmentPrice,
      paymentMethod: invoicePaymentMethod,
      createdAt: new Date().toISOString(),
      items: invoiceItems,
    };

    // ── Return Complete Live Object to Frontend ────────────────────────────────
    res.status(201).json({
      id: created.id,
      clientName: created.client?.name || 'عميل مسجل',
      clientPhone: created.client?.phone || '',
      staffName: created.staff?.name || 'الأخصائي المعالج',
      serviceName: resolvedItemName,
      categoryName: resolvedCategoryName,
      appointmentDate: appointmentDate || created.appointment_date.toISOString().split('T')[0],
      time: time || '11:00 صباحاً',
      status: created.status,
      basePrice: baseServicePrice,
      totalConsumablesPrice: totalConsumablesPrice,
      finalPrice: created.final_price,
      doctorCommission: doctorCommission,
      doctorCommissionPercentage: staffCommValue,
      clientPackageId: created.client_package_id || null,
      packageName: isPackageBooking ? resolvedItemName : (created.clientPackage?.package_name || null),
      isPackageSession: !!created.client_package_id && (Number(created.final_price) === 0),
      autoCreatedPackage,
      consumables: validConsumables,
      invoice: invoiceData,
    });
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment in database', details: err.message });
  }
});

// 7. UPDATE APPOINTMENT STATUS
app.patch('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const oldAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: { clientPackage: true },
    });

    if (!oldAppointment) {
      return res.status(404).json({ error: 'الحجز غير موجود' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        staff: true,
        service: {
          include: { category: true },
        },
        clientPackage: true,
        invoice: true,
      },
    });

    // Auto-increment client package session if transitioning to Completed
    const isBecomingCompleted = (status === 'Completed' || status === 'مكتمل') &&
                                (oldAppointment.status !== 'Completed' && oldAppointment.status !== 'مكتمل');
    if (isBecomingCompleted && oldAppointment.client_package_id) {
      // Only increment if this was a subsequent deduction visit (final_price === 0).
      // The initial package purchase visit (final_price > 0) already initialized used_sessions to 1 upon creation!
      if (oldAppointment.final_price === 0) {
        await handlePackageDeductionOnCompletion(id);
      }
    }

    res.json(updated);
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// 8. DELETE APPOINTMENT
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if appointment exists
    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'الحجز غير موجود أو تم حذفه مسبقاً' });
    }

    // Cascade delete any related invoices first to prevent foreign key constraint violations
    await prisma.invoice.deleteMany({
      where: { appointment_id: id },
    });

    // Delete associated revenue record if one was created for this appointment
    if (existing.revenueId) {
      await prisma.revenue.deleteMany({
        where: { id: existing.revenueId },
      });
    }
    await prisma.revenue.deleteMany({
      where: { referenceId: id },
    });

    // Delete the appointment record
    await prisma.appointment.delete({
      where: { id },
    });

    res.json({ success: true, message: 'تم حذف الحجز بنجاح' });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ error: 'فشل حذف الحجز', details: err.message });
  }
});

// 9. GET ALL INVENTORY ITEMS
app.get('/api/inventory', async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { item_name: 'asc' },
    });
    res.json(
      items.map((it) => ({
        id: it.id,
        name: it.item_name,
        unitCost: it.unit_cost,
        sellingPrice: it.selling_price || 0,
        quantityInStock: it.quantity_in_stock,
        unitType: it.unit_type,
      }))
    );
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// 9.1 CREATE INVENTORY ITEM
app.post('/api/inventory', async (req, res) => {
  try {
    const { name, unitCost, sellingPrice = 0, quantityInStock, unitType = 'قطعة' } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم المنتج مطلوب' });

    const created = await prisma.inventoryItem.create({
      data: {
        item_name: name,
        unit_cost: parseFloat(unitCost) || 0,
        selling_price: parseFloat(sellingPrice) || 0,
        quantity_in_stock: parseFloat(quantityInStock) || 0,
        unit_type: unitType,
      },
    });

    res.status(201).json({
      id: created.id,
      name: created.item_name,
      unitCost: created.unit_cost,
      sellingPrice: created.selling_price,
      quantityInStock: created.quantity_in_stock,
      unitType: created.unit_type,
    });
  } catch (err) {
    console.error('Error creating inventory item:', err);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// 9.2 UPDATE INVENTORY ITEM (STOCK ADJUSTMENT OR DETAILS)
app.patch('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityInStock, quantityToAdd, unitCost, sellingPrice, name } = req.body;

    const dataToUpdate = {};
    if (quantityInStock !== undefined) {
      dataToUpdate.quantity_in_stock = parseFloat(quantityInStock);
    } else if (quantityToAdd !== undefined) {
      dataToUpdate.quantity_in_stock = { increment: parseFloat(quantityToAdd) };
    }
    if (unitCost !== undefined) dataToUpdate.unit_cost = parseFloat(unitCost);
    if (sellingPrice !== undefined) dataToUpdate.selling_price = parseFloat(sellingPrice);
    if (name !== undefined) dataToUpdate.item_name = name;

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({
      id: updated.id,
      name: updated.item_name,
      unitCost: updated.unit_cost,
      sellingPrice: updated.selling_price,
      quantityInStock: updated.quantity_in_stock,
      unitType: updated.unit_type,
    });
  } catch (err) {
    console.error('Error updating inventory item:', err);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// 9.3 DELETE INVENTORY ITEM
app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.inventoryItem.delete({
      where: { id },
    });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    console.error('Error deleting inventory item:', err);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// 9.4 INTERNAL DISPATCH (Clinic Internal Consumption -> Inventory Decrement + Expense Entry)
app.post('/api/inventory/dispatch', async (req, res) => {
  try {
    const { productId, quantity, notes } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'يجب تحديد المنتج المصروف' });
    }
    const qty = parseFloat(quantity) || 1;
    if (qty <= 0) {
      return res.status(400).json({ error: 'الكمية يجب أن تكون أكبر من صفر' });
    }

    const product = await prisma.inventoryItem.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return res.status(404).json({ error: 'المنتج غير موجود في المخزن' });
    }

    const totalCost = (product.unit_cost || 0) * qty;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Decrement stock
      const updatedProduct = await tx.inventoryItem.update({
        where: { id: productId },
        data: {
          quantity_in_stock: { decrement: qty },
        },
      });

      // 2. Create InternalDispatch record
      const dispatch = await tx.internalDispatch.create({
        data: {
          productId,
          quantity: qty,
          totalCost,
          notes: notes || null,
          date: new Date(),
        },
        include: {
          product: true,
        },
      });

      // 3. Create Expense record (linked to clinic operating consumables)
      const expenseNotes = `إذن صرف مستهلكات: ${product.item_name} (كمية: ${qty} ${product.unit_type || 'قطعة'})${notes ? ` - ${notes}` : ''}`;
      const expense = await tx.expense.create({
        data: {
          expense_type: 'مستهلكات تشغيل العيادة',
          amount: totalCost,
          notes: expenseNotes,
          expense_date: new Date(),
        },
      });

      return { dispatch, updatedProduct, expense };
    });

    res.status(201).json({
      success: true,
      dispatch: {
        id: result.dispatch.id,
        productId: result.dispatch.productId,
        productName: result.dispatch.product?.item_name || product.item_name,
        unitType: product.unit_type || 'قطعة',
        quantity: result.dispatch.quantity,
        unitCost: product.unit_cost || 0,
        totalCost: result.dispatch.totalCost,
        date: result.dispatch.date,
        notes: result.dispatch.notes,
      },
      updatedStock: result.updatedProduct.quantity_in_stock,
      expenseId: result.expense.id,
    });
  } catch (err) {
    console.error('Error dispatching inventory:', err);
    res.status(500).json({ error: 'فشل صرف المستهلكات', details: err.message });
  }
});

// 9.5 GET INTERNAL DISPATCHES HISTORY
app.get('/api/inventory/dispatches', async (req, res) => {
  try {
    const dispatches = await prisma.internalDispatch.findMany({
      orderBy: { date: 'desc' },
      include: {
        product: true,
      },
    });

    res.json(
      dispatches.map((d) => ({
        id: d.id,
        productId: d.productId,
        productName: d.product?.item_name || 'غير معروف',
        unitType: d.product?.unit_type || 'قطعة',
        quantity: d.quantity,
        unitCost: d.product?.unit_cost || 0,
        totalCost: d.totalCost,
        date: d.date,
        notes: d.notes,
      }))
    );
  } catch (err) {
    console.error('Error fetching internal dispatches:', err);
    res.status(500).json({ error: 'فشل جلب أذونات الصرف' });
  }
});

// 10. CREATE INVOICE & COMPLETE APPOINTMENT
app.post('/api/invoices', async (req, res) => {
  try {
    const {
      appointmentId,
      clientId,
      totalAmount,
      discountApplied,
      netAmount,
      paymentMethod = 'كاش',
      items = [],
    } = req.body;

    // Check if appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true, service: true, package: true, clientPackage: true, revenue: true, consumables: true },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'الحجز غير موجود' });
    }

    const resolvedClientId = clientId || appointment.client_id;
    const finalTotal = parseFloat(totalAmount) || 0;
    const finalDiscount = parseFloat(discountApplied) || 0;
    const finalNet = parseFloat(netAmount) || 0;

    // Check if invoice already exists for this appointment
    let invoice = await prisma.invoice.findUnique({
      where: { appointment_id: appointmentId },
    });

    if (invoice) {
      invoice = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          total_amount: finalTotal,
          discount_applied: finalDiscount,
          net_amount: finalNet,
          payment_method: paymentMethod,
        },
      });
    } else {
      invoice = await prisma.invoice.create({
        data: {
          client_id: resolvedClientId,
          appointment_id: appointmentId,
          total_amount: finalTotal,
          discount_applied: finalDiscount,
          net_amount: finalNet,
          payment_method: paymentMethod,
        },
      });
    }

    const invoiceServiceName = appointment.service?.name || appointment.package?.package_name || appointment.clientPackage?.package_name || 'خدمة غير محددة';

    // Synchronize Revenue record to reflect the final net collected amount
    if (appointment.revenueId) {
      await prisma.revenue.update({
        where: { id: appointment.revenueId },
        data: { amount: finalNet },
      });
    } else if (finalNet > 0) {
      const rev = await prisma.revenue.create({
        data: {
          amount: finalNet,
          date: new Date(),
          category: 'حجوزات وباقات',
          description: `تسوية فاتورة حجز: ${invoiceServiceName} - العميل: ${appointment.client?.name || 'عميل'}`,
          source: 'APPOINTMENT',
          referenceId: appointment.id,
        },
      });
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { revenueId: rev.id, final_price: finalNet, status: 'مكتمل' },
      });
    } else {
      // Update appointment status to 'مكتمل'
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'مكتمل' },
      });
    }

    // Deduct inventory stock for used items (whether charged to client or internal consumption)
    let addedConsumablesTotal = 0;
    if (Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        const targetId = it && (it.id || it.itemId);
        const deductQty = parseFloat(it?.quantity) || 0;
        const itemPrice = parseFloat(it?.price) || 0;
        const isCharged = it.chargeToClient !== false;
        if (isCharged) {
          addedConsumablesTotal += itemPrice * deductQty;
        }

        if (targetId && deductQty > 0) {
          try {
            await prisma.inventoryItem.update({
              where: { id: targetId },
              data: {
                quantity_in_stock: { decrement: deductQty },
              },
            });
            console.log(`[Inventory] Deducted ${deductQty} from item ${targetId} (chargeToClient: ${isCharged})`);
          } catch (stockErr) {
            console.warn(`Could not update stock for item ${targetId}:`, stockErr.message);
          }
        }
      }
    }

    const baseSessionPrice = Math.max(0, finalTotal - addedConsumablesTotal);

    res.status(201).json({
      invoiceId: invoice.id,
      invoiceNumber: `INV-${invoice.id.slice(0, 8).toUpperCase()}`,
      appointmentId,
      clientName: appointment.client?.name,
      clientPhone: appointment.client?.phone,
      serviceName: invoiceServiceName,
      basePrice: baseSessionPrice,
      consumablesPrice: addedConsumablesTotal,
      totalAmount: invoice.total_amount,
      discountApplied: invoice.discount_applied,
      netAmount: invoice.net_amount,
      paymentMethod: invoice.payment_method,
      createdAt: invoice.createdAt,
      items,
    });
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).json({ error: 'Failed to create invoice in database', details: err.message });
  }
});

// 10.5 GET REAL-TIME DASHBOARD METRICS
app.get('/api/dashboard', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const [totalAppointments, completedCount, pendingCount, confirmedCount, clientsCount, invoices] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: { in: ['Completed', 'مكتمل'] } } }),
      prisma.appointment.count({ where: { status: { in: ['Pending', 'قيد الانتظار'] } } }),
      prisma.appointment.count({ where: { status: { in: ['Confirmed', 'مؤكد'] } } }),
      prisma.client.count(),
      prisma.invoice.findMany({ select: { net_amount: true } }),
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.net_amount) || 0), 0);

    res.json({
      totalAppointments,
      completedCount,
      pendingCount,
      confirmedCount,
      clientsCount,
      totalRevenue,
    });
  } catch (err) {
    console.error('Error fetching dashboard metrics:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// 11. GET ALL INVOICES
app.get('/api/invoices', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
        appointment: {
          include: { service: true, package: true, staff: true, clientPackage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invoices);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// 12. GET STAFF COMMISSIONS & REVENUE REPORT
app.get('/api/reports/staff', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const appointmentWhere = {
      status: { in: ['Completed', 'مكتمل'] },
      invoice: { isNot: null },
    };

    if (startDate || endDate) {
      appointmentWhere.appointment_date = {};
      if (startDate) {
        appointmentWhere.appointment_date.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        appointmentWhere.appointment_date.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    // Fetch staff with completed appointments and invoices joined
    const staffMembers = await prisma.staff.findMany({
      include: {
        appointments: {
          where: appointmentWhere,
          include: {
            service: true,
            package: true,
            clientPackage: true,
            client: true,
            invoice: true,
            consumables: true,
          },
          orderBy: { appointment_date: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const report = staffMembers.map((st) => {
      const appointments = st.appointments || [];
      const sessionsCount = appointments.length;

      let totalRevenue = 0;
      let totalCommissionableBase = 0;
      let totalConsumablesRevenue = 0;

      const commType = st.commission_type || 'نسبة';
      const commValue = parseFloat(st.commission_value) || 0;
      const isPercentage = commType === 'نسبة' || commType.includes('%') || commType.toLowerCase() === 'percentage';
      const isFixedRent = commType === 'ثابت' || commType === 'إيجار' || commType.includes('إيجار') || commType.includes('راتب');

      const appointmentDetails = appointments.map((apt) => {
        const aptTotal = parseFloat(apt.invoice ? apt.invoice.net_amount : apt.final_price) || 0;
        const aptConsumables = (apt.consumables || []).reduce((cSum, c) => cSum + (parseFloat(c.priceCharged) || 0), 0);
        // Base service price strictly excludes consumables
        const aptBase = Math.max(0, aptTotal - aptConsumables);

        totalRevenue += aptTotal;
        totalCommissionableBase += aptBase;
        totalConsumablesRevenue += aptConsumables;

        const aptDoctorComm = isPercentage
          ? Math.round(((aptBase * commValue) / 100) * 100) / 100
          : aptBase;

        return {
          id: apt.id,
          date: apt.appointment_date.toISOString().split('T')[0],
          clientName: apt.client?.name || 'عميل',
          serviceName: apt.package?.package_name || apt.service?.name || apt.clientPackage?.package_name || 'خدمة',
          basePrice: aptBase,
          consumablesPrice: aptConsumables,
          doctorCommission: aptDoctorComm,
          finalPrice: apt.final_price,
          invoiceNumber: apt.invoice ? `INV-${apt.invoice.id.slice(0, 8).toUpperCase()}` : 'N/A',
          invoiceTotal: aptTotal,
          paymentMethod: apt.invoice?.payment_method || 'كاش',
        };
      });

      let staffDue = 0;
      let centerProfit = 0;

      if (isPercentage) {
        // Staff Due is calculated strictly on base session price (EXCLUDING consumables)
        staffDue = Math.round(((totalCommissionableBase * commValue) / 100) * 100) / 100;
        // Center keeps 100% of consumables revenue + center's share of service price
        centerProfit = Math.round((totalRevenue - staffDue) * 100) / 100;
      } else if (isFixedRent) {
        staffDue = totalCommissionableBase;
        centerProfit = commValue + totalConsumablesRevenue;
      } else {
        staffDue = Math.round(((totalCommissionableBase * 30) / 100) * 100) / 100;
        centerProfit = Math.round((totalRevenue - staffDue) * 100) / 100;
      }

      return {
        id: st.id,
        name: st.name,
        specialty: st.specialty,
        commissionType: commType,
        commissionValue: commValue,
        sessionsCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        commissionableBase: Math.round(totalCommissionableBase * 100) / 100,
        consumablesRevenue: Math.round(totalConsumablesRevenue * 100) / 100,
        staffDue: Math.round(staffDue * 100) / 100,
        centerProfit: Math.round(centerProfit * 100) / 100,
        appointments: appointmentDetails,
      };
    });

    res.json(report);
  } catch (err) {
    console.error('Error generating staff reports:', err);
    res.status(500).json({ error: 'Failed to generate staff reports', details: err.message });
  }
});

// 12.1 UPDATE STAFF COMMISSION CONFIGURATION
app.patch('/api/staff/:id/commission', async (req, res) => {
  try {
    const { id } = req.params;
    const { commissionType, commissionValue } = req.body;
    const updated = await prisma.staff.update({
      where: { id },
      data: {
        ...(commissionType && { commission_type: commissionType }),
        ...(commissionValue !== undefined && { commission_value: parseFloat(commissionValue) }),
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('Error updating staff commission:', err);
    res.status(500).json({ error: 'Failed to update commission settings' });
  }
});

// ==========================================
// 13. EXPENSES CRUD
// ==========================================

// 13.1 GET ALL EXPENSES
app.get('/api/expenses', async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const where = {};

    if (startDate || endDate) {
      where.expense_date = {};
      if (startDate) {
        where.expense_date.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        where.expense_date.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    if (category && category !== 'الكل') {
      where.expense_type = category;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expense_date: 'desc' },
    });

    res.json(
      expenses.map((e) => ({
        id: e.id,
        expenseDate: e.expense_date.toISOString().split('T')[0],
        expenseType: e.expense_type,
        amount: e.amount,
        notes: e.notes || '',
        createdAt: e.createdAt,
      }))
    );
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Failed to fetch expenses', details: err.message });
  }
});

// 13.2 CREATE EXPENSE
app.post('/api/expenses', async (req, res) => {
  try {
    const { expenseDate, expenseType, category, amount, notes, description } = req.body;
    const resolvedType = (expenseType || category || '').trim();
    const numAmount = parseFloat(amount);

    if (!resolvedType) {
      return res.status(400).json({ error: 'بند المصروف مطلوب' });
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'المبلغ يجب أن يكون رقماً موجباً أكبر من صفر' });
    }

    const resolvedDate = expenseDate ? new Date(`${expenseDate}T12:00:00.000Z`) : new Date();

    const created = await prisma.expense.create({
      data: {
        expense_date: resolvedDate,
        expense_type: resolvedType,
        amount: numAmount,
        notes: (notes || description || '').trim() || null,
      },
    });

    res.status(201).json({
      id: created.id,
      expenseDate: created.expense_date.toISOString().split('T')[0],
      expenseType: created.expense_type,
      amount: created.amount,
      notes: created.notes || '',
      createdAt: created.createdAt,
    });
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ error: 'Failed to create expense', details: err.message });
  }
});

// 13.3 UPDATE EXPENSE
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { expenseDate, expenseType, category, amount, notes, description } = req.body;

    const dataToUpdate = {};
    if (expenseDate) {
      dataToUpdate.expense_date = new Date(`${expenseDate}T12:00:00.000Z`);
    }
    if (expenseType || category) {
      dataToUpdate.expense_type = (expenseType || category).trim();
    }
    if (amount !== undefined) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount) && numAmount >= 0) {
        dataToUpdate.amount = numAmount;
      }
    }
    if (notes !== undefined || description !== undefined) {
      dataToUpdate.notes = (notes !== undefined ? notes : description || '').trim() || null;
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({
      id: updated.id,
      expenseDate: updated.expense_date.toISOString().split('T')[0],
      expenseType: updated.expense_type,
      amount: updated.amount,
      notes: updated.notes || '',
      createdAt: updated.createdAt,
    });
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ error: 'Failed to update expense', details: err.message });
  }
});

// 13.4 DELETE EXPENSE
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({
      where: { id },
    });
    res.json({ success: true, message: 'تم حذف المصروف بنجاح' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Failed to delete expense', details: err.message });
  }
});

// ==========================================
// 13.5 REVENUES API (الإيرادات)
// ==========================================

// GET /api/revenues (fetch all revenues descending)
app.get('/api/revenues', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { startDate, endDate, category, source } = req.query;

    const where = {};
    if (category && category !== 'الكل') {
      where.category = category;
    }
    if (source && source !== 'الكل') {
      where.source = source;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        where.date.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    const revenues = await prisma.revenue.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        appointment: {
          include: {
            client: true,
            service: true,
            package: true,
          },
        },
      },
    });

    res.json(
      revenues.map((r) => ({
        id: r.id,
        amount: r.amount,
        date: r.date ? r.date.toISOString().split('T')[0] : '',
        category: r.category,
        description: r.description || '',
        source: r.source,
        referenceId: r.referenceId || null,
        appointment: r.appointment
          ? {
              id: r.appointment.id,
              clientName: r.appointment.client?.name || '',
              serviceName: r.appointment.package?.package_name || r.appointment.service?.name || '',
            }
          : null,
        createdAt: r.createdAt ? r.createdAt.toISOString() : '',
      }))
    );
  } catch (err) {
    console.error('Error fetching revenues:', err);
    res.status(500).json({ error: 'Failed to fetch revenues', details: err.message });
  }
});

// POST /api/revenues (manual revenue creation)
app.post('/api/revenues', async (req, res) => {
  try {
    const { amount, date, category, description } = req.body;
    const numAmount = parseFloat(amount);
    const resolvedCategory = (category || '').trim();

    if (!resolvedCategory) {
      return res.status(400).json({ error: 'تصنيف الإيراد مطلوب' });
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'المبلغ يجب أن يكون رقماً موجباً أكبر من صفر' });
    }

    const resolvedDate = date ? new Date(`${date}T12:00:00.000Z`) : new Date();

    const created = await prisma.revenue.create({
      data: {
        amount: numAmount,
        date: resolvedDate,
        category: resolvedCategory,
        description: (description || '').trim() || null,
        source: 'MANUAL',
      },
    });

    res.status(201).json({
      id: created.id,
      amount: created.amount,
      date: created.date ? created.date.toISOString().split('T')[0] : '',
      category: created.category,
      description: created.description || '',
      source: created.source,
      referenceId: created.referenceId,
      createdAt: created.createdAt ? created.createdAt.toISOString() : '',
    });
  } catch (err) {
    console.error('Error creating revenue:', err);
    res.status(500).json({ error: 'Failed to create revenue', details: err.message });
  }
});

// DELETE /api/revenues/:id (prevent deletion if source is APPOINTMENT)
app.delete('/api/revenues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.revenue.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'سجل الإيراد غير موجود' });
    }

    if (existing.source === 'APPOINTMENT') {
      return res.status(400).json({
        error: 'لا يمكن حذف إيراد تم توليده تلقائياً من حجز موعد. لإلغاء هذا الإيراد، قم بإلغاء الحجز نفسه من جدول الحجوزات.',
      });
    }

    await prisma.revenue.delete({
      where: { id },
    });

    res.json({ success: true, message: 'تم حذف الإيراد بنجاح' });
  } catch (err) {
    console.error('Error deleting revenue:', err);
    res.status(500).json({ error: 'Failed to delete revenue', details: err.message });
  }
});

// ==========================================
// 14. COMPREHENSIVE FINANCIAL ANALYTICS & P&L REPORT
// ==========================================
app.get('/api/reports/financial', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 1. Invoices filter
    const invoiceWhere = {};
    if (startDate || endDate) {
      invoiceWhere.createdAt = {};
      if (startDate) {
        invoiceWhere.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        invoiceWhere.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      include: {
        appointment: {
          include: { staff: true, service: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.net_amount) || 0), 0);
    const invoicesCount = invoices.length;

    // 2. Staff Due calculation (using accurate commission & fixed rent logic)
    const staffMembers = await prisma.staff.findMany({
      include: {
        appointments: {
          where: {
            status: { in: ['Completed', 'مكتمل'] },
            invoice: { isNot: null },
            ...(startDate || endDate ? {
              appointment_date: {
                ...(startDate && { gte: new Date(`${startDate}T00:00:00.000Z`) }),
                ...(endDate && { lte: new Date(`${endDate}T23:59:59.999Z`) }),
              },
            } : {}),
          },
          include: { invoice: true, consumables: true },
        },
      },
    });

    let totalStaffDue = 0;
    const staffBreakdown = [];
    staffMembers.forEach((st) => {
      const appointments = st.appointments || [];
      let staffRev = 0;
      let commissionableBase = 0;
      let consumablesRev = 0;

      appointments.forEach((apt) => {
        const amt = parseFloat(apt.invoice ? apt.invoice.net_amount : apt.final_price) || 0;
        const cPrice = (apt.consumables || []).reduce((cSum, c) => cSum + (parseFloat(c.priceCharged) || 0), 0);
        const base = Math.max(0, amt - cPrice);
        staffRev += amt;
        commissionableBase += base;
        consumablesRev += cPrice;
      });

      const commType = st.commission_type || 'نسبة';
      const commValue = parseFloat(st.commission_value) || 0;

      const isPercentage = commType === 'نسبة' || commType.includes('%') || commType.toLowerCase() === 'percentage';
      const isFixedRent = commType === 'ثابت' || commType === 'إيجار' || commType.includes('إيجار') || commType.includes('راتب');

      let due = 0;
      let centerProf = 0;

      if (isPercentage) {
        due = (commissionableBase * commValue) / 100;
        centerProf = staffRev - due;
      } else if (isFixedRent) {
        due = commissionableBase;
        centerProf = commValue + consumablesRev;
      } else {
        due = (commissionableBase * 30) / 100;
        centerProf = staffRev - due;
      }

      totalStaffDue += due;
      staffBreakdown.push({
        id: st.id,
        name: st.name,
        specialty: st.specialty,
        commissionType: commType,
        commissionValue: commValue,
        sessionsCount: appointments.length,
        totalRevenue: Math.round(staffRev * 100) / 100,
        commissionableBase: Math.round(commissionableBase * 100) / 100,
        consumablesRevenue: Math.round(consumablesRev * 100) / 100,
        staffDue: Math.round(due * 100) / 100,
        centerProfit: Math.round(centerProf * 100) / 100,
      });
    });

    // 3. Expenses Filter & Aggregations
    const expenseWhere = {};
    if (startDate || endDate) {
      expenseWhere.expense_date = {};
      if (startDate) {
        expenseWhere.expense_date.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        expenseWhere.expense_date.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
      orderBy: { expense_date: 'desc' },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // Group expenses by category
    const expCatMap = {};
    expenses.forEach((e) => {
      const cat = e.expense_type || 'نثريات';
      expCatMap[cat] = (expCatMap[cat] || 0) + (parseFloat(e.amount) || 0);
    });

    const expensesByCategory = Object.keys(expCatMap)
      .map((cat) => ({
        category: cat,
        amount: Math.round(expCatMap[cat] * 100) / 100,
        percentage: totalExpenses > 0 ? Math.round((expCatMap[cat] / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 4. Net Profit = Total Revenue - Total Staff Due - Total Expenses
    const netProfit = Math.round((totalRevenue - totalStaffDue - totalExpenses) * 100) / 100;

    // 5. Daily Trend Aggregation
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dateMap = {};

    invoices.forEach((inv) => {
      const dStr = inv.createdAt.toISOString().split('T')[0];
      if (!dateMap[dStr]) {
        const dObj = new Date(inv.createdAt);
        dateMap[dStr] = {
          date: dStr,
          dayName: arabicDays[dObj.getDay()] || '',
          revenue: 0,
          staffDue: 0,
          expenses: 0,
          netProfit: 0,
        };
      }
      dateMap[dStr].revenue += parseFloat(inv.net_amount) || 0;
    });

    expenses.forEach((e) => {
      const dStr = e.expense_date.toISOString().split('T')[0];
      if (!dateMap[dStr]) {
        const dObj = new Date(e.expense_date);
        dateMap[dStr] = {
          date: dStr,
          dayName: arabicDays[dObj.getDay()] || '',
          revenue: 0,
          staffDue: 0,
          expenses: 0,
          netProfit: 0,
        };
      }
      dateMap[dStr].expenses += parseFloat(e.amount) || 0;
    });

    const dailyTrend = Object.values(dateMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => {
        const proportionalStaffDue = totalRevenue > 0
          ? Math.round((item.revenue / totalRevenue) * totalStaffDue * 100) / 100
          : 0;
        const dayNet = Math.round((item.revenue - proportionalStaffDue - item.expenses) * 100) / 100;
        return {
          ...item,
          revenue: Math.round(item.revenue * 100) / 100,
          staffDue: proportionalStaffDue,
          expenses: Math.round(item.expenses * 100) / 100,
          netProfit: dayNet,
        };
      });

    // 6. Top Services & Sales Aggregation
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        status: { in: ['Completed', 'مكتمل'] },
        ...(startDate || endDate ? {
          appointment_date: {
            ...(startDate && { gte: new Date(`${startDate}T00:00:00.000Z`) }),
            ...(endDate && { lte: new Date(`${endDate}T23:59:59.999Z`) }),
          },
        } : {}),
      },
      include: {
        service: { include: { category: true } },
        package: true,
        clientPackage: true,
        invoice: true,
      },
    });

    const serviceMap = {};
    const categoryMap = {};
    let totalServicesRevenue = 0;

    completedAppointments.forEach((apt) => {
      const sId = apt.service_id || (apt.package_id ? `package_${apt.package_id}` : 'unknown');
      const sName = apt.package?.package_name || apt.service?.name || apt.clientPackage?.package_name || 'خدمة طبية';
      const catName = apt.service?.category?.name || (apt.package_id ? 'عروض وباقات' : 'عام');
      const basePrice = apt.package?.fixed_price || apt.service?.min_price || apt.final_price || 0;
      const amount = apt.invoice ? (parseFloat(apt.invoice.net_amount) || 0) : (parseFloat(apt.final_price) || 0);

      totalServicesRevenue += amount;

      if (!serviceMap[sId]) {
        serviceMap[sId] = {
          id: sId,
          name: sName,
          category: catName,
          basePrice,
          bookingsCount: 0,
          totalRevenue: 0,
        };
      }
      serviceMap[sId].bookingsCount += 1;
      serviceMap[sId].totalRevenue += amount;

      categoryMap[catName] = (categoryMap[catName] || 0) + amount;
    });

    const topServices = Object.values(serviceMap)
      .map((s) => ({
        ...s,
        totalRevenue: Math.round(s.totalRevenue * 100) / 100,
        percentage: totalServicesRevenue > 0 ? Math.round((s.totalRevenue / totalServicesRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const topCategories = Object.keys(categoryMap)
      .map((cat) => ({
        category: cat,
        revenue: Math.round(categoryMap[cat] * 100) / 100,
        percentage: totalServicesRevenue > 0 ? Math.round((categoryMap[cat] / totalServicesRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // 7. Inventory Analytics & Low Stock Alerts
    const inventoryItems = await prisma.inventoryItem.findMany({
      orderBy: { quantity_in_stock: 'asc' },
    });

    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const inventoryList = inventoryItems.map((item) => {
      const qty = parseFloat(item.quantity_in_stock) || 0;
      const cost = parseFloat(item.unit_cost) || 0;
      const valuation = Math.round(qty * cost * 100) / 100;
      totalValuation += valuation;

      let status = 'in_stock';
      if (qty <= 0) {
        status = 'out_of_stock';
        outOfStockCount += 1;
      } else if (qty <= 10) {
        status = 'low_stock';
        lowStockCount += 1;
      }

      return {
        id: item.id,
        name: item.item_name,
        unitCost: cost,
        quantityInStock: qty,
        unitType: item.unit_type,
        valuation,
        status,
      };
    });

    const inventoryAnalytics = {
      totalItems: inventoryItems.length,
      totalValuation: Math.round(totalValuation * 100) / 100,
      lowStockCount,
      outOfStockCount,
      items: inventoryList,
    };

    res.json({
      period: {
        startDate: startDate || '',
        endDate: endDate || '',
      },
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      invoicesCount,
      totalStaffDue: Math.round(totalStaffDue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit,
      expensesByCategory,
      staffBreakdown,
      dailyTrend,
      topServices,
      topCategories,
      inventoryAnalytics,
    });
  } catch (err) {
    console.error('Error generating financial analytics:', err);
    res.status(500).json({ error: 'Failed to generate financial analytics', details: err.message });
  }
});

// ==========================================
// AUTHENTICATION & USER MANAGEMENT ENDPOINTS
// ==========================================

// 1. LOGIN ENDPOINT
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    }

    const cleanUsername = username.trim();
    const user = await prisma.user.findFirst({
      where: {
        username: { equals: cleanUsername, mode: 'insensitive' },
      },
    });

    if (!user || user.password !== password.trim()) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const roleUpper = user.role.toUpperCase();
    const defaultName = roleUpper === 'ADMIN' ? 'د. خالد عبد الرحمن' : 'سارة أحمد';

    res.json({
      id: user.id,
      username: user.username,
      name: user.name || defaultName,
      role: roleUpper,
      title: roleUpper === 'ADMIN' ? 'المدير العام' : 'موظف الاستقبال',
    });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ error: 'فشل تسجيل الدخول', details: err.message });
  }
});

// 2. GET ALL USERS
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
    res.json(
      users.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name || (u.role.toUpperCase() === 'ADMIN' ? 'المدير العام' : 'موظف الاستقبال'),
        role: u.role.toUpperCase(),
        password: u.password,
        createdAt: u.createdAt,
      }))
    );
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

// 3. CREATE NEW USER
app.post('/api/users', async (req, res) => {
  try {
    const { username, password, role, name } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: 'كلمة المرور مطلوبة' });
    }
    const cleanRole = (role || 'RECEPTIONIST').toUpperCase();
    if (!['ADMIN', 'RECEPTIONIST'].includes(cleanRole)) {
      return res.status(400).json({ error: 'الصلاحية غير صحيحة. يجب أن تكون ADMIN أو RECEPTIONIST' });
    }

    const cleanUsername = username.trim();
    const existing = await prisma.user.findFirst({
      where: { username: { equals: cleanUsername, mode: 'insensitive' } },
    });
    if (existing) {
      return res.status(400).json({ error: 'اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم آخر' });
    }

    const created = await prisma.user.create({
      data: {
        username: cleanUsername,
        password: password.trim(),
        role: cleanRole,
        name: name && name.trim() ? name.trim() : (cleanRole === 'ADMIN' ? 'المدير' : 'موظف استقبال'),
      },
    });

    res.status(201).json({
      id: created.id,
      username: created.username,
      name: created.name,
      role: created.role.toUpperCase(),
      password: created.password,
      createdAt: created.createdAt,
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'فشل إضافة المستخدم', details: err.message });
  }
});

// 4. UPDATE USER
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const updateData = {};
    if (username && username.trim()) {
      const cleanUsername = username.trim();
      const duplicate = await prisma.user.findFirst({
        where: {
          username: { equals: cleanUsername, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (duplicate) {
        return res.status(400).json({ error: 'اسم المستخدم مسجل لمستخدم آخر' });
      }
      updateData.username = cleanUsername;
    }

    if (password && password.trim()) {
      updateData.password = password.trim();
    }

    if (role) {
      const cleanRole = role.toUpperCase();
      if (!['ADMIN', 'RECEPTIONIST'].includes(cleanRole)) {
        return res.status(400).json({ error: 'الصلاحية غير صحيحة' });
      }
      updateData.role = cleanRole;
    }

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    res.json({
      id: updated.id,
      username: updated.username,
      name: updated.name,
      role: updated.role.toUpperCase(),
      password: updated.password,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'فشل تعديل المستخدم', details: err.message });
  }
});

// 5. DELETE USER
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    if (user.username.toLowerCase() === 'admin') {
      return res.status(400).json({ error: 'لا يمكن حذف حساب المسؤول الرئيسي (admin)' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'فشل حذف المستخدم', details: err.message });
  }
});

// Auto-seed initial users if none exist
async function ensureSeedUsers() {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      console.log('[Seed] Seeding initial admin and receptionist users...');
      await prisma.user.createMany({
        data: [
          {
            username: 'admin',
            password: '123',
            role: 'ADMIN',
            name: 'د. خالد عبد الرحمن',
          },
          {
            username: 'reception',
            password: '123',
            role: 'RECEPTIONIST',
            name: 'سارة أحمد',
          },
        ],
      });
      console.log('[Seed] Seeded default users successfully.');
    }
  } catch (seedErr) {
    console.warn('[Seed] User seeding check skipped:', seedErr.message);
  }
}
ensureSeedUsers();

// Auto-seed initial expenses if none exist
async function ensureSeedExpenses() {
  try {
    const count = await prisma.expense.count();
    if (count === 0) {
      console.log('[Seed] Seeding realistic initial expenses...');
      await prisma.expense.createMany({
        data: [
          {
            expense_date: new Date('2026-10-01T10:00:00.000Z'),
            expense_type: 'إيجار',
            amount: 4000,
            notes: 'إيجار مقر المركز الطبي والسبا لشهر أكتوبر',
          },
          {
            expense_date: new Date('2026-10-05T12:00:00.000Z'),
            expense_type: 'كهرباء ومرافق',
            amount: 950,
            notes: 'فاتورة الكهرباء وتشغيل أجهزة التكييف والساونا',
          },
          {
            expense_date: new Date('2026-10-08T14:00:00.000Z'),
            expense_type: 'مستلزمات',
            amount: 620,
            notes: 'شراء كحول ومفارش طبية وقفازات معقمة',
          },
          {
            expense_date: new Date('2026-10-10T16:00:00.000Z'),
            expense_type: 'صيانة',
            amount: 450,
            notes: 'صيانة وتعديل أجهزة العلاج الطبيعي الكهربائية',
          },
          {
            expense_date: new Date('2026-10-12T11:00:00.000Z'),
            expense_type: 'نثريات وضيافة',
            amount: 300,
            notes: 'مشروبات وضيافة العملاء ومستلزمات نظافة',
          },
        ],
      });
      console.log('[Seed] Seeded 5 initial expenses successfully.');
    }
  } catch (seedErr) {
    console.warn('[Seed] Expense seeding skipped:', seedErr.message);
  }
}
ensureSeedExpenses();

// Auto-seed initial appointments if fewer than 4 exist
async function ensureSeedAppointments() {
  try {
    const count = await prisma.appointment.count();
    if (count < 4) {
      console.log('[Seed] Seeding initial appointments...');
      const clients = await prisma.client.findMany();
      const staff = await prisma.staff.findMany();
      const services = await prisma.service.findMany();

      if (clients.length > 0 && staff.length > 0 && services.length > 0) {
        const c1 = clients.find(c => c.name.includes('نورا')) || clients[0];
        const c2 = clients.find(c => c.name.includes('أحمد')) || clients[1] || clients[0];
        const c3 = clients.find(c => c.name.includes('ليلى')) || clients[2] || clients[0];
        const c4 = clients.find(c => c.name.includes('طارق')) || clients[3] || clients[0];

        const s1 = staff.find(s => s.name.includes('سارة')) || staff[0];
        const s2 = staff.find(s => s.name.includes('يوسف')) || staff[1] || staff[0];
        const s3 = staff.find(s => s.name.includes('مها')) || staff[2] || staff[0];

        const sv1 = services.find(s => s.name.includes('ديرما')) || services[0];
        const sv2 = services.find(s => s.name.includes('طبيعي')) || services[1] || services[0];
        const sv3 = services.find(s => s.name.includes('المغربي')) || services[2] || services[0];
        const sv4 = services.find(s => s.name.includes('كاسات')) || services[3] || services[0];

        const defaultApts = [
          { client_id: c1.id, staff_id: s1.id, service_id: sv1.id, appointment_date: new Date('2026-10-14T08:00:00.000Z'), status: 'مؤكد', final_price: 500 },
          { client_id: c2.id, staff_id: s2.id, service_id: sv2.id, appointment_date: new Date('2026-10-14T10:30:00.000Z'), status: 'قيد الانتظار', final_price: 150 },
          { client_id: c3.id, staff_id: s3.id, service_id: sv3.id, appointment_date: new Date('2026-10-15T12:00:00.000Z'), status: 'مؤكد', final_price: 750 },
          { client_id: c4.id, staff_id: s1.id, service_id: sv4.id, appointment_date: new Date('2026-10-13T14:00:00.000Z'), status: 'مكتمل', final_price: 500 }
        ];

        for (const apt of defaultApts) {
          const exists = await prisma.appointment.findFirst({
            where: { client_id: apt.client_id, service_id: apt.service_id }
          });
          if (!exists) {
            await prisma.appointment.create({ data: apt });
          }
        }
        console.log('[Seed] Appointments ensured successfully.');
      }
    }
  } catch (seedErr) {
    console.warn('[Seed] Appointment seeding check skipped:', seedErr.message);
  }
}
// Note: ensureSeedAppointments() disabled on runtime startup to respect empty/cleared database state
// ensureSeedAppointments();

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend API server running on port ${PORT}`);
  });
}

module.exports = app;

