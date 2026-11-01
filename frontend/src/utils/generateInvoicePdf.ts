import { toJpeg } from 'html-to-image';
import { PrintReceiptData } from './printReceipt';

/**
 * Captures an invoice as a crisp, lightweight JPEG base64 image (image/jpeg)
 * with full native browser Arabic text shaping (RTL + HarfBuzz ligatures).
 * Uses html-to-image (SVG foreignObject) so Chromium/browser renders Arabic natively.
 */
export async function generateInvoiceImageBase64(
  data: PrintReceiptData,
  elementToCapture?: HTMLElement | null
): Promise<string> {
  const invNumber = data.invoiceNumber || `AUR-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = data.appointmentDate || new Date().toISOString().split('T')[0];
  const timeStr = data.time || new Date().toLocaleTimeString('ar-EG');
  const clientNameStr = data.clientName || 'عميل غير مسجل';
  const clientPhoneStr = data.clientPhone || '—';
  const serviceNameStr = data.serviceName || data.packageName || 'جلسة علاجية / سبا';
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

  let container: HTMLDivElement | null = null;
  let targetElement: HTMLElement;

  if (elementToCapture) {
    targetElement = elementToCapture;
  } else {
    // Create dedicated invoice card with exact dimensions and native system typography
    container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.zIndex = '-9999';
    container.style.pointerEvents = 'none';
    container.style.opacity = '1';
    container.style.width = '420px';
    container.style.background = '#ffffff';
    container.style.color = '#111827';
    container.style.padding = '24px';
    container.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, 'Cairo', 'Tajawal', sans-serif";
    container.style.direction = 'rtl';
    container.style.textAlign = 'right';
    container.style.borderRadius = '16px';
    container.style.boxSizing = 'border-box';
    container.style.boxShadow = 'none';

    container.innerHTML = `
      <div style="border-bottom: 2px dashed #0f3b2c; padding-bottom: 16px; margin-bottom: 16px; text-align: center;">
        <div style="font-size: 22px; font-weight: 900; color: #0f3b2c; letter-spacing: -0.5px;">أوريا كلينيك & سبا</div>
        <div style="font-size: 11px; color: #6b7280; margin-top: 2px; font-weight: 500;">Aurea Clinic & Luxury Medical Spa</div>
        <div style="display: inline-block; margin-top: 8px; padding: 4px 12px; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 9999px; font-size: 11px; font-weight: 700;">
          فاتورة سداد رسمية معتمدة ✓
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #4b5563; margin-bottom: 6px;">
        <span>رقم الفاتورة:</span>
        <strong style="color: #0f3b2c; font-family: monospace; font-size: 13px;" dir="ltr">${invNumber}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #4b5563; margin-bottom: 14px;">
        <span>تاريخ المعاملة:</span>
        <strong>${dateStr} (${timeStr})</strong>
      </div>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; margin-bottom: 14px; font-size: 12px;">
        <div style="font-weight: 800; color: #0f3b2c; margin-bottom: 8px; font-size: 12.5px;">بيانات العميل:</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #6b7280;">الاسم:</span>
          <strong style="color: #111827;">${clientNameStr}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">رقم الهاتف:</span>
          <strong style="color: #111827; font-family: monospace; font-size: 13px;" dir="ltr">${clientPhoneStr}</strong>
        </div>
      </div>

      <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 14px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f0fdf4; border-bottom: 1px solid #bbf7d0; color: #166534; font-weight: 700;">
              <th style="padding: 8px 10px; text-align: right;">الخدمة / البند</th>
              <th style="padding: 8px 10px; text-align: center;">الأخصائي</th>
              <th style="padding: 8px 10px; text-align: left;">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; font-weight: 700; color: #111827;">
                ${serviceNameStr}
                ${data.categoryName ? `<br><small style="color: #6b7280; font-weight: normal;">قسم: ${data.categoryName}</small>` : ''}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; text-align: center; color: #4b5563;">
                ${staffNameStr}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; text-align: left; font-weight: 800; color: #0f3b2c;" dir="ltr">
                ${finalPriceNum.toLocaleString()} ج.م
              </td>
            </tr>
            ${
              data.consumables && data.consumables.length > 0
                ? data.consumables
                    .map(
                      (c) => `
            <tr>
              <td colspan="2" style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 11px;">
                • مستهلك: ${c.name || 'مستلزمات'} (الكمية: ${c.quantity || 1})
              </td>
              <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; text-align: left; color: #6b7280; font-size: 11px;" dir="ltr">
                ${c.price ? `${c.price} ج.م` : 'مشمول'}
              </td>
            </tr>`
                    )
                    .join('')
                : ''
            }
          </tbody>
        </table>
      </div>

      <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 12px; margin-bottom: 16px;">
        ${
          Number(data.discountApplied || 0) > 0
            ? `
        <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: #4b5563; margin-bottom: 4px;">
          <span>الإجمالي قبل الخصم:</span>
          <span>${Number(data.totalAmount || (finalPriceNum + Number(data.discountApplied))).toLocaleString()} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: #dc2626; font-weight: 700; margin-bottom: 6px;">
          <span>الخصم الممنوح ${data.discountType === 'percentage' ? `(${data.discountValue}%)` : ''}:</span>
          <span>- ${Number(data.discountApplied).toLocaleString()} ج.م</span>
        </div>`
            : ''
        }
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; ${Number(data.discountApplied || 0) > 0 ? 'border-top: 1px dashed #bbf7d0; padding-top: 6px;' : ''}">
          <span style="font-weight: 800; color: #166534; font-size: 13px;">صافي المبلغ المسدد:</span>
          <span style="font-size: 17px; font-weight: 900; color: #0f3b2c;" dir="ltr">${finalPriceNum.toLocaleString()} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: #4b5563; border-top: 1px dashed #bbf7d0; padding-top: 6px;">
          <span>طريقة السداد:</span>
          <strong style="color: #166534;">${paymentMethodLabel}</strong>
        </div>
      </div>

      <div style="text-align: center; border-top: 1px dashed #d1d5db; padding-top: 12px; font-size: 11px; color: #6b7280; line-height: 1.6;">
        <div style="font-weight: 700; color: #0f3b2c;">شكراً لثقتكم واختياركم أوريا كلينيك & سبا ✨</div>
        <div>نتمنى لكم دوام الصحة والعافية والراحة دائماً 🤍</div>
        <div style="font-family: monospace; letter-spacing: 2px; font-size: 9.5px; margin-top: 4px; color: #9ca3af;">* ${invNumber} *</div>
      </div>
    `;

    document.body.appendChild(container);
    targetElement = container;
  }

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Capture using browser-native SVG foreignObject via html-to-image (preserves complete Arabic shaping)
    const dataUri = await toJpeg(targetElement, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      style: {
        position: 'static',
        left: '0',
        top: '0',
        margin: '0',
        transform: 'none',
      },
    });

    const cleanBase64 = dataUri.replace(/^data:image\/[a-z]+;base64,/, '').trim();
    return cleanBase64;
  } finally {
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

// Backward compatibility alias
export const generateInvoicePdfBase64 = generateInvoiceImageBase64;
