/**
 * Domain Input Validation Rules & Helpers
 * Provides strict validation rules for the entire Clinic & Spa ERP
 */

function validateClientInput({ name, phone, email }) {
  const errors = [];
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('اسم العميل مطلوب');
  } else if (name.trim().length < 2) {
    errors.push('يجب أن يحتوي اسم العميل على حرفين على الأقل');
  }

  if (phone) {
    const cleanedPhone = String(phone).replace(/\s+/g, '');
    // Egyptian / Arab phone check: must contain at least 8 digits
    if (!/^\+?[0-9]{8,15}$/.test(cleanedPhone)) {
      errors.push('رقم الهاتف غير صالح، يجب أن يحتوي على أرقام صحيحة بين 8 إلى 15 رقماً');
    }
  }

  if (email && email.trim().length > 0) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push('البريد الإلكتروني غير صالح');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateServiceInput({ name, min_price, duration_minutes, sessions_count }) {
  const errors = [];
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('اسم الخدمة مطلوب');
  }

  const price = parseFloat(min_price);
  if (isNaN(price) || price < 0) {
    errors.push('السعر الأساسي للخدمة يجب أن يكون رقماً موجباً أو صفراً');
  }

  if (duration_minutes !== undefined) {
    const duration = parseInt(duration_minutes, 10);
    if (isNaN(duration) || duration <= 0) {
      errors.push('مدة الجلسة يجب أن تكون أكبر من صفر دقيقة');
    }
  }

  if (sessions_count !== undefined) {
    const sessions = parseInt(sessions_count, 10);
    if (isNaN(sessions) || sessions < 1) {
      errors.push('عدد الجلسات للخدمة يجب أن يكون 1 على الأقل');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateAppointmentInput({ clientId, staffId, serviceId, packageId, services, appointmentDate, time }) {
  const errors = [];

  if (!clientId) {
    errors.push('يجب تحديد العميل للحجز');
  }

  const hasMultipleServices = Array.isArray(services) && services.length > 0;
  if (!serviceId && !packageId && !hasMultipleServices) {
    errors.push('يجب تحديد خدمة أو باقة للحجز');
  }

  if (!appointmentDate) {
    errors.push('تاريخ الحجز مطلوب');
  } else {
    const parsedDate = new Date(appointmentDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push('تاريخ الحجز غير صالح');
    }
  }

  if (time && typeof time === 'string') {
    // 24h format HH:MM or 12h format
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9](\s*(AM|PM|am|pm|ص|م))?$/.test(time.trim())) {
      errors.push('صيغة الوقت غير صالحة');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateInvoicePayment({ totalAmount, netAmount, paymentMethod, discountApplied = 0 }) {
  const errors = [];
  const total = parseFloat(totalAmount);
  const net = parseFloat(netAmount);
  const discount = parseFloat(discountApplied) || 0;

  if (isNaN(total) || total < 0) {
    errors.push('المبلغ الإجمالي للفاتورة يجب أن يكون صفراً أو رقماً موجباً');
  }

  if (isNaN(net) || net < 0) {
    errors.push('صافي المبلغ المدفوع يجب أن يكون رقماً موجباً');
  }

  if (discount < 0) {
    errors.push('قيمة الخصم لا يمكن أن تكون سالبة');
  }

  if (discount > total && total > 0) {
    errors.push('قيمة الخصم لا يمكن أن تتجاوز إجمالي الفاتورة');
  }

  const validMethods = ['كاش', 'فيزا', 'تحويل', 'نقاط', 'باقة', 'محفظة'];
  if (paymentMethod && !validMethods.includes(paymentMethod.trim())) {
    errors.push(`طريقة الدفع غير مدعومة. الطرق المتاحة: ${validMethods.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateFinancialTransaction({ amount, category, date }) {
  const errors = [];
  const amt = parseFloat(amount);

  if (isNaN(amt) || amt <= 0) {
    errors.push('المبلغ المالي يجب أن يكون أكبر من صفر');
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('التصنيف المالي مطلوب');
  }

  if (date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      errors.push('التاريخ غير صالح');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateUserInput({ username, password, role, isEdit = false }) {
  const errors = [];

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    errors.push('اسم المستخدم مطلوب');
  } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(username.trim())) {
    errors.push('اسم المستخدم يجب أن يتكون من 3 إلى 30 حرفاً بالإنجليزية أو أرقام وشرطة سفلية فقط');
  }

  if (!isEdit && (!password || typeof password !== 'string' || password.trim().length < 3)) {
    errors.push('كلمة المرور يجب أن تكون 3 أحرف على الأقل');
  }

  const validRoles = ['ADMIN', 'RECEPTIONIST'];
  if (role && !validRoles.includes(role.toUpperCase())) {
    errors.push('صلاحية المستخدم يجب أن تكون ADMIN أو RECEPTIONIST');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateClientInput,
  validateServiceInput,
  validateAppointmentInput,
  validateInvoicePayment,
  validateFinancialTransaction,
  validateUserInput,
};
