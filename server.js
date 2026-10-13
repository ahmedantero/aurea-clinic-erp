const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
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
    const { name, categoryId, category, minPrice, maxPrice, durationMinutes, type } = req.body;
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
    const { name, categoryId, category, minPrice, maxPrice, durationMinutes, type } = req.body;

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name.trim();
    if (minPrice !== undefined) dataToUpdate.min_price = parseFloat(minPrice);
    if (maxPrice !== undefined) dataToUpdate.max_price = maxPrice ? parseFloat(maxPrice) : null;
    if (durationMinutes !== undefined) dataToUpdate.duration_minutes = parseInt(durationMinutes) || 45;
    if (type) dataToUpdate.type = type.trim();

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
      }))
    );
  } catch (err) {
    console.error('Error fetching packages:', err);
    res.status(500).json({ error: 'Failed to fetch packages' });
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

// 4. GET ALL CLIENTS WITH CRM METRICS (VISITS, SPENT, APPOINTMENTS, INVOICES)
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        appointments: {
          include: {
            service: { include: { category: true } },
            staff: true,
            invoice: true,
          },
          orderBy: { appointment_date: 'desc' },
        },
        invoices: {
          include: {
            appointment: { include: { service: true } },
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
          appointments: (c.appointments || []).map((apt) => ({
            id: apt.id,
            date: apt.appointment_date.toISOString().split('T')[0],
            time: '11:00 ص',
            serviceName: apt.service?.name || 'جلسة',
            categoryName: apt.service?.category?.name || 'عام',
            staffName: apt.staff?.name || 'أخصائي',
            status: apt.status,
            finalPrice: apt.final_price,
            hasInvoice: !!apt.invoice,
          })),
          invoices: (c.invoices || []).map((inv) => ({
            id: inv.id,
            invoiceNumber: `INV-${inv.id.slice(0, 8).toUpperCase()}`,
            date: inv.createdAt.toISOString().split('T')[0],
            amount: inv.net_amount,
            paymentMethod: inv.payment_method,
            serviceName: inv.appointment?.service?.name || 'جلسة',
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
          include: { service: { include: { category: true } }, staff: true, invoice: true },
          orderBy: { appointment_date: 'desc' },
        },
        invoices: {
          include: { appointment: { include: { service: true } } },
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
      appointments: (updated.appointments || []).map((apt) => ({
        id: apt.id,
        date: apt.appointment_date.toISOString().split('T')[0],
        time: '11:00 ص',
        serviceName: apt.service?.name || 'خدمة',
        categoryName: apt.service?.category?.name || 'عام',
        staffName: apt.staff?.name || 'أخصائي',
        status: apt.status,
        finalPrice: apt.final_price,
        hasInvoice: !!apt.invoice,
      })),
      invoices: (updated.invoices || []).map((inv) => ({
        id: inv.id,
        invoiceNumber: `INV-${inv.id.slice(0, 8).toUpperCase()}`,
        date: inv.createdAt.toISOString().split('T')[0],
        amount: inv.net_amount,
        paymentMethod: inv.payment_method,
        serviceName: inv.appointment?.service?.name || 'جلسة',
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
    const appointments = await prisma.appointment.findMany({
      include: {
        client: true,
        staff: true,
        service: {
          include: { category: true },
        },
      },
      orderBy: { appointment_date: 'desc' },
    });

    res.json(
      appointments.map((a) => ({
        id: a.id,
        clientName: a.client?.name || 'غير معروف',
        clientPhone: a.client?.phone || '',
        staffName: a.staff?.name || 'غير محدد',
        serviceName: a.service?.name || 'خدمة محددة',
        categoryName: a.service?.category?.name || 'عام',
        appointmentDate: a.appointment_date.toISOString().split('T')[0],
        time: a.appointment_date.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: a.status,
        finalPrice: a.final_price,
      }))
    );
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// 6. CREATE NEW APPOINTMENT (With database persistence!)
app.post('/api/appointments', async (req, res) => {
  try {
    const {
      clientId,
      newClientName,
      newClientPhone,
      staffId,
      serviceId,
      appointmentDate,
      time,
      status = 'مؤكد',
      finalPrice,
    } = req.body;

    let targetClientId = clientId;

    // If new client specified
    if (!targetClientId && newClientName) {
      let existingClient = await prisma.client.findFirst({
        where: { phone: newClientPhone },
      });

      if (!existingClient) {
        existingClient = await prisma.client.create({
          data: {
            name: newClientName,
            phone: newClientPhone || '01000000000',
            loyalty_points: 10,
          },
        });
      }
      targetClientId = existingClient.id;
    }

    if (!targetClientId) {
      return res.status(400).json({ error: 'العميل مطلوب' });
    }

    // Resolve date and time
    const dateTimeString = `${appointmentDate}T${time || '10:00'}:00.000Z`;
    const parsedDate = new Date(dateTimeString);
    const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    // Create Appointment in PostgreSQL
    const created = await prisma.appointment.create({
      data: {
        client_id: targetClientId,
        staff_id: staffId,
        service_id: serviceId,
        appointment_date: validDate,
        status: status,
        final_price: parseFloat(finalPrice) || 0,
      },
      include: {
        client: true,
        staff: true,
        service: {
          include: { category: true },
        },
      },
    });

    res.status(201).json({
      id: created.id,
      clientName: created.client?.name,
      clientPhone: created.client?.phone,
      staffName: created.staff?.name,
      serviceName: created.service?.name,
      categoryName: created.service?.category?.name || 'عام',
      appointmentDate: created.appointment_date.toISOString().split('T')[0],
      time: time || '11:00 صباحاً',
      status: created.status,
      finalPrice: created.final_price,
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
    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });
    res.json(updated);
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({ error: 'Failed to update appointment' });
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
    const { name, unitCost, quantityInStock, unitType = 'قطعة' } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم المنتج مطلوب' });

    const created = await prisma.inventoryItem.create({
      data: {
        item_name: name,
        unit_cost: parseFloat(unitCost) || 0,
        quantity_in_stock: parseFloat(quantityInStock) || 0,
        unit_type: unitType,
      },
    });

    res.status(201).json({
      id: created.id,
      name: created.item_name,
      unitCost: created.unit_cost,
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
    const { quantityInStock, quantityToAdd, unitCost, name } = req.body;

    const dataToUpdate = {};
    if (quantityInStock !== undefined) {
      dataToUpdate.quantity_in_stock = parseFloat(quantityInStock);
    } else if (quantityToAdd !== undefined) {
      dataToUpdate.quantity_in_stock = { increment: parseFloat(quantityToAdd) };
    }
    if (unitCost !== undefined) dataToUpdate.unit_cost = parseFloat(unitCost);
    if (name !== undefined) dataToUpdate.item_name = name;

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({
      id: updated.id,
      name: updated.item_name,
      unitCost: updated.unit_cost,
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
      include: { client: true, service: true },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'الحجز غير موجود' });
    }

    const resolvedClientId = clientId || appointment.client_id;

    // Check if invoice already exists for this appointment
    let invoice = await prisma.invoice.findUnique({
      where: { appointment_id: appointmentId },
    });

    if (invoice) {
      invoice = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          total_amount: parseFloat(totalAmount) || 0,
          discount_applied: parseFloat(discountApplied) || 0,
          net_amount: parseFloat(netAmount) || 0,
          payment_method: paymentMethod,
        },
      });
    } else {
      invoice = await prisma.invoice.create({
        data: {
          client_id: resolvedClientId,
          appointment_id: appointmentId,
          total_amount: parseFloat(totalAmount) || 0,
          discount_applied: parseFloat(discountApplied) || 0,
          net_amount: parseFloat(netAmount) || 0,
          payment_method: paymentMethod,
        },
      });
    }

    // Update appointment status to 'مكتمل'
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'مكتمل' },
    });

    // Deduct inventory stock for used items (whether charged to client or internal consumption)
    if (Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        const targetId = it && (it.id || it.itemId);
        const deductQty = parseFloat(it?.quantity) || 0;
        if (targetId && deductQty > 0) {
          try {
            await prisma.inventoryItem.update({
              where: { id: targetId },
              data: {
                quantity_in_stock: { decrement: deductQty },
              },
            });
            console.log(`[Inventory] Deducted ${deductQty} from item ${targetId} (chargeToClient: ${it.chargeToClient !== false})`);
          } catch (stockErr) {
            console.warn(`Could not update stock for item ${targetId}:`, stockErr.message);
          }
        }
      }
    }

    res.status(201).json({
      invoiceId: invoice.id,
      invoiceNumber: `INV-${invoice.id.slice(0, 8).toUpperCase()}`,
      appointmentId,
      clientName: appointment.client?.name,
      clientPhone: appointment.client?.phone,
      serviceName: appointment.service?.name,
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

// 11. GET ALL INVOICES
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
        appointment: {
          include: { service: true, staff: true },
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
            client: true,
            invoice: true,
          },
          orderBy: { appointment_date: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const report = staffMembers.map((st) => {
      const appointments = st.appointments || [];
      const sessionsCount = appointments.length;

      // Calculate total generated revenue from paid invoices / appointments
      const totalRevenue = appointments.reduce((sum, apt) => {
        const amount = apt.invoice ? apt.invoice.net_amount : apt.final_price;
        return sum + (parseFloat(amount) || 0);
      }, 0);

      const commType = st.commission_type || 'نسبة';
      const commValue = parseFloat(st.commission_value) || 0;

      let staffDue = 0;
      let centerProfit = 0;

      const isPercentage = commType === 'نسبة' || commType.includes('%') || commType.toLowerCase() === 'percentage';
      const isFixedRent = commType === 'ثابت' || commType === 'إيجار' || commType.includes('إيجار') || commType.includes('راتب');

      if (isPercentage) {
        // 1. Percentage Contract (نسبة مئوية):
        // Staff Due = Total Revenue * (Commission Value / 100)
        // Center Profit = Total Revenue - Staff Due
        staffDue = (totalRevenue * commValue) / 100;
        centerProfit = totalRevenue - staffDue;
      } else if (isFixedRent) {
        // 2. Fixed Rent Contract (إيجار ثابت):
        // The clinic/center does NOT take a cut from the sessions. The center ONLY takes the fixed rent amount.
        // Staff Due = Total Revenue (The doctor keeps 100% of their session revenue).
        // Center Profit = The Fixed Rent Amount (e.g., 4000 EGP). The center's profit from this doctor is solely the rent they pay.
        staffDue = totalRevenue;
        centerProfit = commValue;
      } else {
        // Fallback default (30% percentage)
        staffDue = (totalRevenue * 30) / 100;
        centerProfit = totalRevenue - staffDue;
      }

      return {
        id: st.id,
        name: st.name,
        specialty: st.specialty,
        commissionType: commType,
        commissionValue: commValue,
        sessionsCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        staffDue: Math.round(staffDue * 100) / 100,
        centerProfit: Math.round(centerProfit * 100) / 100,
        appointments: appointments.map((apt) => ({
          id: apt.id,
          date: apt.appointment_date.toISOString().split('T')[0],
          clientName: apt.client?.name || 'عميل',
          serviceName: apt.service?.name || 'جلسة',
          finalPrice: apt.final_price,
          invoiceNumber: apt.invoice ? `INV-${apt.invoice.id.slice(0, 8).toUpperCase()}` : 'N/A',
          invoiceTotal: apt.invoice ? apt.invoice.net_amount : apt.final_price,
          paymentMethod: apt.invoice?.payment_method || 'كاش',
        })),
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
          include: { invoice: true },
        },
      },
    });

    let totalStaffDue = 0;
    const staffBreakdown = [];
    staffMembers.forEach((st) => {
      const appointments = st.appointments || [];
      const staffRev = appointments.reduce((sum, apt) => {
        const amt = apt.invoice ? apt.invoice.net_amount : apt.final_price;
        return sum + (parseFloat(amt) || 0);
      }, 0);

      const commType = st.commission_type || 'نسبة';
      const commValue = parseFloat(st.commission_value) || 0;

      const isPercentage = commType === 'نسبة' || commType.includes('%') || commType.toLowerCase() === 'percentage';
      const isFixedRent = commType === 'ثابت' || commType === 'إيجار' || commType.includes('إيجار') || commType.includes('راتب');

      let due = 0;
      let centerProf = 0;

      if (isPercentage) {
        due = (staffRev * commValue) / 100;
        centerProf = staffRev - due;
      } else if (isFixedRent) {
        due = staffRev;
        centerProf = commValue;
      } else {
        due = (staffRev * 30) / 100;
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
        invoice: true,
      },
    });

    const serviceMap = {};
    const categoryMap = {};
    let totalServicesRevenue = 0;

    completedAppointments.forEach((apt) => {
      const sId = apt.service_id || 'unknown';
      const sName = apt.service?.name || 'جلسة طبية';
      const catName = apt.service?.category?.name || 'عام';
      const basePrice = apt.service?.min_price || apt.final_price || 0;
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

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend API server running on port ${PORT}`);
  });
}

module.exports = app;

