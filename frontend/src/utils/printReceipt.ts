export interface PrintReceiptData {
  invoiceNumber?: string;
  clientName?: string;
  clientPhone?: string;
  serviceName?: string;
  categoryName?: string;
  packageName?: string;
  staffName?: string;
  appointmentDate?: string;
  time?: string;
  finalPrice?: number | string;
  basePrice?: number | string;
  totalAmount?: number | string;
  discountApplied?: number | string;
  discountType?: string;
  discountValue?: number | string;
  paymentMethod?: string;
  items?: Array<{ name: string; staffName?: string; price: number; durationMinutes?: number; categoryName?: string }>;
  consumables?: Array<{ name?: string; quantity?: number; price?: number }>;
  createdByName?: string;
}

/**
 * Isolated Receipt Printer using a temporary invisible iframe.
 * Ensures ONLY the targeted invoice is sent to the printer,
 * completely hiding the background dashboard, sidebar, and modals.
 */
export const printReceipt = (data: PrintReceiptData): Promise<void> => {
  return new Promise((resolve) => {
    // 1. Generate unique invoice identifier if not provided
    const invNumber =
      data.invoiceNumber ||
      `AUR-${Math.floor(100000 + Math.random() * 900000)}`;

    const dateStr =
      data.appointmentDate || new Date().toISOString().split('T')[0];
    const timeStr = data.time || new Date().toLocaleTimeString('ar-EG');
    const clientNameStr = data.clientName || 'عميل غير مسجل';
    const clientPhoneStr = data.clientPhone || '—';
    const serviceNameStr =
      data.serviceName || data.packageName || 'جلسة علاجية / سبا';
    const staffNameStr = data.staffName || 'الكادر الطبي المختص';
    const finalPriceNum = Number(data.finalPrice ?? 0);
    const paymentMethodLabel =
      data.paymentMethod === 'CASH'
        ? 'نقداً (كاش)'
        : data.paymentMethod === 'WALLET'
        ? 'محفظة إلكترونية'
        : data.paymentMethod === 'INSTAPAY'
        ? 'تحويل إنستاباي'
        : data.paymentMethod || 'نقداً (كاش)';

    // 2. Build isolated HTML document for thermal receipt (80mm) or standard printer
    const receiptHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>فاتورة حجز - ${invNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 3mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
    }
    body {
      width: 74mm;
      margin: 0 auto;
      padding: 6px;
      color: #1a1a1a;
      background: #fff;
      font-size: 11px;
      line-height: 1.4;
      direction: rtl;
      text-align: right;
    }
    .header {
      text-align: center;
      padding-bottom: 8px;
      border-bottom: 1.5px dashed #0f3b2c;
      margin-bottom: 8px;
    }
    .logo-title {
      font-size: 15px;
      font-weight: 900;
      color: #0f3b2c;
      letter-spacing: -0.3px;
    }
    .logo-sub {
      font-size: 9px;
      color: #666;
      margin-top: 1px;
    }
    .badge-pill {
      display: inline-block;
      margin-top: 4px;
      padding: 2px 8px;
      background: #e8f5e9;
      color: #0f3b2c;
      border-radius: 12px;
      font-size: 9px;
      font-weight: 700;
    }
    .meta-box {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin-bottom: 4px;
      color: #444;
    }
    .meta-box strong {
      color: #000;
    }
    .divider {
      border-top: 1px dashed #bbb;
      margin: 6px 0;
    }
    .double-divider {
      border-top: 1.5px solid #0f3b2c;
      border-bottom: 1px solid #0f3b2c;
      height: 3px;
      margin: 8px 0;
    }
    .section-title {
      font-size: 10px;
      font-weight: 800;
      color: #0f3b2c;
      margin-bottom: 4px;
    }
    .table-details {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
    }
    .table-details td {
      padding: 3px 0;
      vertical-align: top;
      font-size: 10.5px;
    }
    .table-details td.label {
      color: #555;
      width: 32%;
    }
    .table-details td.value {
      color: #111;
      font-weight: 700;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
    }
    .items-table th {
      background: #f4fbf7;
      color: #0f3b2c;
      font-size: 9.5px;
      padding: 3px;
      border-bottom: 1px solid #ddd;
      text-align: right;
    }
    .items-table td {
      padding: 4px 3px;
      border-bottom: 1px dotted #eee;
      font-size: 10px;
    }
    .total-card {
      background: #f9fbf9;
      border: 1px solid #d4ebd8;
      border-radius: 6px;
      padding: 6px 8px;
      margin: 8px 0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      font-weight: 900;
      color: #0f3b2c;
    }
    .total-amount {
      font-size: 15px;
      color: #0b2e24;
    }
    .footer-note {
      text-align: center;
      font-size: 8.5px;
      color: #777;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dashed #bbb;
    }
    .barcode {
      text-align: center;
      font-family: monospace;
      letter-spacing: 2px;
      font-size: 9px;
      margin-top: 4px;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-title">أوريا كلينيك & سبا</div>
    <div class="logo-sub">Aurea Clinic & Luxury Medical Spa</div>
    <div class="badge-pill">إيصال حجز معتمد</div>
  </div>

  <div class="meta-box">
    <span>رقم الفاتورة:</span>
    <strong>${invNumber}</strong>
  </div>
  <div class="meta-box">
    <span>التاريخ:</span>
    <strong>${dateStr} (${timeStr})</strong>
  </div>

  <div class="divider"></div>

  <div class="section-title">بيانات العميل:</div>
  <table class="table-details">
    <tr>
      <td class="label">العميل:</td>
      <td class="value">${clientNameStr}</td>
    </tr>
    <tr>
      <td class="label">الهاتف:</td>
      <td class="value" dir="ltr" style="text-align: right;">${clientPhoneStr}</td>
    </tr>
  </table>

  <div class="divider"></div>

  <div class="section-title">تفاصيل الحجز والخدمة:</div>
  <table class="items-table">
    <thead>
      <tr>
        <th>الخدمة / الباقة</th>
        <th style="text-align: center;">الأخصائي</th>
        <th style="text-align: left;">المبلغ</th>
      </tr>
    </thead>
    <tbody>
      ${
        data.items && data.items.length > 0
          ? data.items
              .map(
                (item) => `
      <tr>
        <td style="font-weight: bold;">
          ${item.name}
          ${item.categoryName ? `<br><small style="color: #666; font-weight: normal;">قسم: ${item.categoryName}</small>` : ''}
          ${item.durationMinutes ? `<br><small style="color: #888; font-weight: normal;">⏱️ ${item.durationMinutes} دقيقة</small>` : ''}
        </td>
        <td style="text-align: center;">${item.staffName || staffNameStr}</td>
        <td style="text-align: left; font-weight: bold;">${item.price} ج.م</td>
      </tr>`
              )
              .join('')
          : `
      <tr>
        <td style="font-weight: bold;">
          ${serviceNameStr}
          ${data.categoryName ? `<br><small style="color: #666; font-weight: normal;">قسم: ${data.categoryName}</small>` : ''}
        </td>
        <td style="text-align: center;">${staffNameStr}</td>
        <td style="text-align: left; font-weight: bold;">${finalPriceNum} ج.م</td>
      </tr>`
      }
      ${
        data.consumables && data.consumables.length > 0
          ? data.consumables
              .map(
                (c) => `
      <tr>
        <td colspan="2" style="color: #555;">
          • مستهلك: ${c.name || 'مستلزمات'} (الكمية: ${c.quantity || 1})
        </td>
        <td style="text-align: left; color: #555;">
          ${c.price ? `${c.price} ج.م` : 'مشمول'}
        </td>
      </tr>`
              )
              .join('')
          : ''
      }
    </tbody>
  </table>

  <div class="total-card">
    ${
      Number(data.discountApplied || 0) > 0
        ? `
    <div style="font-size: 10px; color: #555; display: flex; justify-content: space-between; margin-bottom: 2px;">
      <span>الإجمالي قبل الخصم:</span>
      <span>${Number(data.totalAmount || (finalPriceNum + Number(data.discountApplied))).toLocaleString()} ج.م</span>
    </div>
    <div style="font-size: 10px; color: #b91c1c; display: flex; justify-content: space-between; margin-bottom: 4px; font-weight: bold;">
      <span>الخصم الممنوح ${data.discountType === 'percentage' ? `(${data.discountValue}%)` : ''}:</span>
      <span>- ${Number(data.discountApplied).toLocaleString()} ج.م</span>
    </div>`
        : ''
    }
    <div class="total-row">
      <span>صافي الإجمالي المسدد:</span>
      <span class="total-amount">${finalPriceNum.toLocaleString()} ج.م</span>
    </div>
    <div style="font-size: 9.5px; color: #555; margin-top: 3px; display: flex; justify-content: space-between;">
      <span>طريقة الدفع:</span>
      <strong style="color: #0f3b2c;">${paymentMethodLabel}</strong>
    </div>
  </div>

  <div class="footer-note">
    <div>شكراً لثقتكم بنا في أوريا كلينيك & سبا</div>
    <div>نتمنى لكم دوام الصحة والعافية والجمال ✨</div>
    <div class="barcode">* ${invNumber} *</div>
  </div>
</body>
</html>
`;

    // 3. Create invisible isolated iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      document.body.removeChild(iframe);
      resolve();
      return;
    }

    doc.open();
    doc.write(receiptHtml);
    doc.close();

    // 4. Trigger print once loaded, then remove frame from DOM
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Error during isolated printing:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          resolve();
        }, 1000);
      }
    }, 250);
  });
};
