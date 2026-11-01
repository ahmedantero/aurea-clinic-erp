import { generateInvoiceImageBase64 } from './generateInvoicePdf';
import { PrintReceiptData } from './printReceipt';
import { getWhatsAppConfig, getEffectiveWhatsAppMode, getWhatsAppApiBaseUrl } from './whatsappSettings';

/**
 * Extracts clean international digits from phone numbers.
 * Handles Egyptian local formats (010..., 011..., 012..., 015..., +20...) and international numbers.
 */
export function cleanWhatsAppPhone(phone?: string | null): string {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (!cleaned) return '';

  // Handle Egyptian numbers: 010..., 011..., 012..., 015...
  if (cleaned.startsWith('0020')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '20' + cleaned.substring(1);
  } else if (cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = '20' + cleaned;
  } else if (!cleaned.startsWith('20') && cleaned.length === 10 && cleaned.startsWith('1')) {
    cleaned = '20' + cleaned;
  }

  return cleaned;
}

/**
 * Triggers safe browser download of a base64 image (Blob-based for optimal memory & zero URL length truncation).
 */
export function downloadBase64Image(base64Data: string, filename: string): void {
  try {
    let cleanBase64 = base64Data;
    if (cleanBase64.includes('base64,')) {
      cleanBase64 = cleanBase64.split('base64,')[1];
    }
    cleanBase64 = cleanBase64.trim().replace(/\s+/g, '');

    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? filename : `${filename}.jpg`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  } catch (err) {
    console.error('Error downloading base64 image:', err);
  }
}

/**
 * Formats a luxury Arabic appointment reminder message.
 * Uses safe Unicode symbols (✦, •, ✓) and WhatsApp bold formatting (*text*)
 * to guarantee 100% crisp rendering across all browsers, WhatsApp Web, Desktop, and Mobile without any encoding issues.
 */
export function buildReminderMessage(data: {
  clientName?: string;
  staffName?: string;
  serviceName?: string;
  appointmentDate?: string;
  time?: string;
  clinicMapUrl?: string;
}): string {
  const cName = data.clientName?.trim() || 'عميلنا العزيز';
  const sName = data.staffName?.trim() || 'الكادر الطبي المختص';
  const srvName = data.serviceName?.trim() || 'جلستك العلاجية / سبا';
  const dDate = data.appointmentDate?.trim() || 'الموعد المحدد';
  const aTime = data.time?.trim() || '11:00 صباحاً';
  const mapUrl = data.clinicMapUrl || 'https://maps.google.com/?q=Aurea+Clinic';

  return (
    `مرحباً بك: *${cName}* ✦\n\n` +
    `نود تذكيرك بموعدك القادم في أوريا كلينيك & سبا:\n` +
    `*Aurea Clinic & Luxury Medical Spa*\n\n` +
    `• *التاريخ:* ${dDate}\n` +
    `• *التوقيت:* ${aTime}\n` +
    `• *الخدمة:* ${srvName}\n` +
    `• *الأخصائي:* ${sName}\n\n` +
    `يسعدنا دائماً استقبالك لتجربة استثنائية ✦\n` +
    `• *موقع العيادة:* ${mapUrl}\n\n` +
    `لتأكيد أو تعديل موعدك، يسعدنا تواصلك بالرد على هذه الرسالة ✓`
  );
}

/**
 * Formats a luxury Arabic invoice summary message.
 * Uses safe Unicode symbols (✦, •, ✓) and WhatsApp bold formatting (*text*)
 * to guarantee 100% crisp rendering across all browsers, WhatsApp Web, Desktop, and Mobile without any encoding issues.
 */
export function buildInvoiceMessage(data: {
  clientName?: string;
  invoiceNumber?: string;
  serviceName?: string;
  finalPrice?: number | string;
  paymentMethod?: string;
  appointmentDate?: string;
  time?: string;
}): string {
  const cName = data.clientName?.trim() || 'عميلنا العزيز';
  const invNum = data.invoiceNumber?.trim() || 'AUR-INVOICE';
  const srvName = data.serviceName?.trim() || 'جلسة علاجية / سبا';
  const price = data.finalPrice !== undefined ? `${Number(data.finalPrice).toLocaleString()} ج.م` : '';
  const payMethod = data.paymentMethod?.trim() || 'نقداً (كاش)';
  const dDate = data.appointmentDate?.trim() || '';
  const aTime = data.time?.trim() || '';

  return (
    `مرحباً بك: *${cName}* ✦\n\n` +
    `مرفق تفاصيل فاتورة زيارتك لعيادة وسبا أوريا:\n` +
    `*Aurea Clinic & Luxury Medical Spa*\n\n` +
    `• *رقم الفاتورة:* ${invNum}\n` +
    (dDate ? `• *تاريخ الزيارة:* ${dDate}${aTime ? ` (${aTime})` : ''}\n` : '') +
    `• *الخدمات المحجوزة:* ${srvName}\n` +
    (price ? `• *صافي المبلغ:* ${price} (${payMethod})\n\n` : '\n') +
    `نتمنى لك دوام الصحة والراحة دائماً ✦\n` +
    `شكراً لاختيارك أوريا كلينيك ✓`
  );
}

/**
 * Universal WhatsApp launcher: opens chat with pre-filled message.
 * Uses api.whatsapp.com for robust cross-platform UTF-8 encoding support.
 */
export function openWhatsAppChat(phone: string, text: string): void {
  const cleanPhone = cleanWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  const win = window.open(url, '_blank');
  if (!win) {
    window.location.href = url;
  }
}

export interface WhatsAppDispatchResult {
  success: boolean;
  mode: 'bot' | 'direct';
  message: string;
}

/**
 * Dual-Mode WhatsApp Reminder Dispatcher:
 * 1. Checks configured mode (Local, Bridge to Clinic PC, or Direct).
 * 2. Attempts automatic silent dispatch via local bot or clinic bridge tunnel.
 * 3. Gracefully falls back to direct WhatsApp link if the local bot / bridge is offline.
 */
export async function dispatchWhatsAppReminder(params: {
  phone: string;
  clientName?: string;
  staffName?: string;
  serviceName?: string;
  appointmentDate?: string;
  time?: string;
}): Promise<WhatsAppDispatchResult> {
  const reminderText = buildReminderMessage(params);
  const config = getWhatsAppConfig();
  const effectiveMode = getEffectiveWhatsAppMode(config);
  const baseUrl = getWhatsAppApiBaseUrl(config);

  if (effectiveMode !== 'direct') {
    try {
      const res = await fetch(`${baseUrl}/api/whatsapp/send-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: params.phone,
          clientName: params.clientName,
          staffName: params.staffName,
          serviceName: params.serviceName,
          appointmentDate: params.appointmentDate,
          time: params.time,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && !data.fallback) {
        return {
          success: true,
          mode: 'bot',
          message:
            effectiveMode === 'bridge'
              ? 'تم إرسال تذكير الموعد تلقائياً عبر جسر العيادة السحابي 🚀✨'
              : 'تم إرسال تذكير الموعد تلقائياً عبر بوت واتساب 🚀✨',
        };
      }
    } catch (err) {
      console.warn('WhatsApp reminder dispatch failed, using direct fallback:', err);
    }
  }

  // Graceful Fallback: Open WhatsApp directly with the pre-filled reminder text
  openWhatsAppChat(params.phone, reminderText);
  return {
    success: true,
    mode: 'direct',
    message: `تم فتح محادثة واتساب للعميل (${params.clientName || params.phone}) مع نص التذكير جاهزاً 💬✨`,
  };
}

/**
 * Dual-Mode WhatsApp Invoice Dispatcher:
 * 1. Generates the high-res luxury invoice JPEG.
 * 2. Checks configured mode (Local, Bridge to Clinic PC, or Direct).
 * 3. Attempts automatic silent dispatch via local bot or clinic bridge tunnel.
 * 4. If offline or unreachable, downloads invoice image & opens direct WhatsApp chat.
 */
export async function dispatchWhatsAppInvoice(
  receiptData: PrintReceiptData
): Promise<WhatsAppDispatchResult> {
  const phone = receiptData.clientPhone?.trim() || '';
  const invNum = receiptData.invoiceNumber || `AUR-${Math.floor(100000 + Math.random() * 900000)}`;
  const filename = `فاتورة_أوريا_${invNum}.jpg`;

  const invoiceText = buildInvoiceMessage({
    clientName: receiptData.clientName,
    invoiceNumber: invNum,
    serviceName: receiptData.serviceName || receiptData.packageName,
    finalPrice: receiptData.finalPrice,
    paymentMethod: receiptData.paymentMethod,
    appointmentDate: receiptData.appointmentDate,
    time: receiptData.time,
  });

  // 1. Generate crisp high-resolution luxury invoice JPEG
  let imageBase64 = '';
  try {
    imageBase64 = await generateInvoiceImageBase64(receiptData);
  } catch (imgErr) {
    console.error('Invoice image generation error:', imgErr);
  }

  const config = getWhatsAppConfig();
  const effectiveMode = getEffectiveWhatsAppMode(config);
  const baseUrl = getWhatsAppApiBaseUrl(config);

  // 2. Try sending via backend (local bot or clinic bridge)
  if (effectiveMode !== 'direct' && imageBase64 && imageBase64.length > 50) {
    try {
      const res = await fetch(`${baseUrl}/api/whatsapp/send-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          clientName: receiptData.clientName,
          invoiceNumber: invNum,
          imageBase64,
          image: imageBase64,
          pdfBase64: imageBase64,
          filename,
          message: invoiceText,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && !data.fallback) {
        return {
          success: true,
          mode: 'bot',
          message:
            effectiveMode === 'bridge'
              ? `تم إرسال صورة الفاتورة تلقائياً عبر جسر العيادة السحابي إلى ${receiptData.clientName || phone} 🚀✨`
              : `تم إرسال صورة الفاتورة تلقائياً عبر بوت واتساب إلى ${receiptData.clientName || phone} 🚀✨`,
        };
      }
    } catch (err) {
      console.warn('Backend / Bridge WhatsApp invoice call failed, using direct fallback:', err);
    }
  }

  // 3. Fallback: Download invoice image & open WhatsApp chat!
  if (imageBase64 && imageBase64.length > 50) {
    downloadBase64Image(imageBase64, filename);
  }
  openWhatsAppChat(phone, invoiceText);

  return {
    success: true,
    mode: 'direct',
    message: `تم فتح محادثة واتساب وتحميل صورة الفاتورة (${invNum}) لإرفاقها فوراً 📄💬✨`,
  };
}
