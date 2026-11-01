const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const app = express();
const PORT = process.env.PORT || 10000;

// Enable wide-open CORS for maximum interoperability (Vercel, custom domains, localhost)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let client = null;
let isReady = false;
let currentQr = null;
let currentQrDataUrl = null;
let lastQrTimestamp = null;
let connectedNumber = null;

/**
 * Formats Egyptian and international phone numbers into clean international digits.
 */
function cleanPhoneNumber(phone) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, '');
  if (!cleaned) return null;

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
 * Initialize WhatsApp Client
 */
function initWhatsApp() {
  if (client) return client;

  console.log('🔄 [WhatsApp Cloud Service] Booting Client with LocalAuth...');

  const puppeteerOpts = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    puppeteerOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth',
    }),
    puppeteer: puppeteerOpts,
  });

  client.on('qr', async (qr) => {
    currentQr = qr;
    lastQrTimestamp = new Date();
    isReady = false;
    try {
      currentQrDataUrl = await QRCode.toDataURL(qr, { width: 340, margin: 2 });
    } catch (err) {
      console.error('Failed to generate QR data URL:', err);
    }
    console.log('📱 [WhatsApp Cloud Service] New QR Code generated! Open /qr to scan.');
  });

  client.on('authenticated', () => {
    console.log('🔐 [WhatsApp Cloud Service] Authenticated successfully!');
  });

  client.on('ready', () => {
    isReady = true;
    currentQr = null;
    currentQrDataUrl = null;
    connectedNumber = client.info?.wid?.user || 'Connected';
    console.log('===============================================================');
    console.log(`✅ [WhatsApp Cloud Service] BOT IS READY 24/7! (Phone: ${connectedNumber})`);
    console.log('===============================================================');
  });

  client.on('disconnected', (reason) => {
    console.warn('⚠️ [WhatsApp Cloud Service] Disconnected:', reason);
    isReady = false;
    currentQr = null;
    currentQrDataUrl = null;
    connectedNumber = null;
    console.log('🔄 Reconnecting in 10 seconds...');
    setTimeout(() => {
      try {
        client.initialize();
      } catch (err) {
        console.error('Re-initialization error:', err);
      }
    }, 10000);
  });

  client.initialize().catch((err) => {
    console.error('⚠️ [WhatsApp Cloud Service] Init error:', err.message);
  });

  return client;
}

// ── Web UI Dashboard & QR Code Page ──────────────────────────────────────────
app.get(['/', '/qr'], (req, res) => {
  const isConnected = isReady;

  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aurea Clinic - WhatsApp Cloud Bot Service 24/7</title>
  ${!isConnected ? '<meta http-equiv="refresh" content="7">' : ''}
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Arial, sans-serif; }
    body {
      background: #f4f6f5;
      color: #1f2937;
      margin: 0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #ffffff;
      border-radius: 24px;
      padding: 32px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .badge-ready { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-wait { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    h1 { font-size: 22px; margin: 0 0 8px; color: #0f3b2c; font-weight: 900; }
    p { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 20px; }
    .qr-box {
      background: #fafaf9;
      padding: 16px;
      border-radius: 16px;
      border: 2px dashed #d6d3d1;
      display: inline-block;
      margin-bottom: 20px;
    }
    .qr-img { width: 300px; height: 300px; display: block; border-radius: 8px; }
    .instructions {
      text-align: right;
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;
      font-size: 13px;
      color: #334155;
      border: 1px solid #e2e8f0;
      margin-bottom: 20px;
    }
    .instructions ol { margin: 8px 0 0; padding-right: 20px; }
    .instructions li { margin-bottom: 6px; }
    .footer { font-size: 11px; color: #9ca3af; margin-top: 12px; }
    .btn {
      display: inline-block;
      background: #0f3b2c;
      color: #ffffff;
      padding: 10px 24px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      transition: background 0.2s;
    }
    .btn:hover { background: #164e3b; }
  </style>
</head>
<body>
  <div class="card">
    ${
      isConnected
        ? `
      <div class="badge badge-ready">🟢 متصل وشغال 24 ساعة في السحاب</div>
      <h1>أوريا كلينيك & سبا</h1>
      <p>بوت الواتساب السحابي نشط حالياً ويعمل بأعلى كفاءة. كل الفواتير والتذكيرات المرسلة من Vercel ستصل للعملاء تلقائياً 100%.</p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: right;">
        <div style="font-weight: 700; color: #166534; margin-bottom: 4px;">معلومات الاتصال:</div>
        <div style="font-size: 12px; color: #374151;">• حالة السيرفر: <strong>متصل 24/7 (Cloud Active)</strong></div>
        <div style="font-size: 12px; color: #374151;">• جاهز لاستقبال الطلبات من موقع العيادة فوراً</div>
      </div>
      <a href="/api/whatsapp/status" class="btn" target="_blank">فحص حالة الاتصال API (JSON)</a>
      `
        : currentQrDataUrl
        ? `
      <div class="badge badge-wait">🟡 بانتظار مسح الرمز بالهاتف</div>
      <h1>ربط واتساب العيادة</h1>
      <p>امسح رمز الـ QR Code أدناه من تطبيق واتساب الخاص بالعيادة لتفعيل الإرسال السحابي للأبد:</p>
      <div class="qr-box">
        <img src="${currentQrDataUrl}" class="qr-img" alt="WhatsApp QR Code">
      </div>
      <div class="instructions">
        <strong>طريقة الربط من الهاتف:</strong>
        <ol>
          <li>افتح تطبيق واتساب على هاتف العيادة.</li>
          <li>اضغط على القائمة (⁝ أو الإعدادات) واختر <strong>الأجهزة المرتبطة (Linked Devices)</strong>.</li>
          <li>اضغط على <strong>ربط جهاز (Link a Device)</strong> ووجه الكاميرا نحو الشاشة.</li>
        </ol>
      </div>
      <small style="color: #9ca3af; display: block; margin-bottom: 12px;">(يتم تحديث الرمز تلقائياً كل 7 ثوانٍ)</small>
      `
        : `
      <div class="badge badge-wait">🔄 جارٍ التشغيل...</div>
      <h1>تهيئة خادم الواتساب</h1>
      <p>محرك التصفح السحابي قيد التشغيل حالياً لتوليد رمز الـ QR Code، يرجى الانتظار ثوانٍ معدودة...</p>
      <div style="padding: 40px; color: #6b7280; font-size: 14px;">⏳ جاري تجهيز الجلسة...</div>
      `
    }
    <div class="footer">Aurea Clinic ERP • 24/7 WhatsApp Cloud Microservice</div>
  </div>
</body>
</html>
  `;

  res.send(html);
});

// ── Health & Keep-Alive Endpoints ────────────────────────────────────────────
app.get(['/health', '/ping'], (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    isReady,
    service: 'aurea-whatsapp-cloud-bot',
  });
});

// ── Status API ───────────────────────────────────────────────────────────────
app.get(['/api/whatsapp/status', '/status'], (req, res) => {
  res.json({
    success: true,
    isReady,
    status: isReady ? 'connected' : currentQr ? 'waiting_qr' : 'initializing',
    connectedNumber,
  });
});

// ── Send Reminder Endpoint ───────────────────────────────────────────────────
app.post('/api/whatsapp/send-reminder', async (req, res) => {
  try {
    if (!client || !isReady) {
      return res.status(200).json({
        success: false,
        fallback: true,
        reason: 'client_not_ready',
        message: 'بوت الواتساب السحابي غير متصل حالياً (يرجى مسح QR Code من صفحة /qr)',
      });
    }

    const { phone, clientName, staffName, serviceName, appointmentDate, time } = req.body;
    const cleanDigits = cleanPhoneNumber(phone);
    if (!cleanDigits) {
      return res.status(400).json({ success: false, error: 'رقم الهاتف غير صالح' });
    }

    const cName = clientName || 'عميلنا العزيز';
    const sName = staffName || 'الكادر الطبي المختص';
    const srvName = serviceName || 'جلستك العلاجية / سبا';
    const dDate = appointmentDate || 'الموعد المحدد';
    const aTime = time || '11:00 صباحاً';
    const mapUrl = process.env.CLINIC_MAP_URL || 'https://maps.google.com/?q=Aurea+Clinic';

    const reminderMessage =
      `مرحباً بك: *${cName}* ✦\n\n` +
      `نود تذكيرك بموعدك القادم في أوريا كلينيك & سبا:\n` +
      `*Aurea Clinic & Luxury Medical Spa*\n\n` +
      `• *التاريخ:* ${dDate}\n` +
      `• *التوقيت:* ${aTime}\n` +
      `• *الخدمة:* ${srvName}\n` +
      `• *الأخصائي:* ${sName}\n\n` +
      `يسعدنا دائماً استقبالك لتجربة استثنائية ✦\n` +
      `• *موقع العيادة:* ${mapUrl}\n\n` +
      `لتأكيد أو تعديل موعدك، يسعدنا تواصلك بالرد على هذه الرسالة ✓`;

    const numberDetails = await client.getNumberId(cleanDigits);
    if (!numberDetails || !numberDetails._serialized) {
      return res.status(400).json({
        success: false,
        error: 'number_not_registered',
        message: `رقم الهاتف (${phone}) غير مسجل في واتساب`,
      });
    }

    const result = await client.sendMessage(numberDetails._serialized, reminderMessage);
    console.log(`✅ [Reminder Sent] Delivered to ${numberDetails._serialized}`);

    res.json({
      success: true,
      message: 'تم إرسال تذكير الواتساب بنجاح عبر السيرفر السحابي',
      messageId: result?.id?._serialized,
    });
  } catch (err) {
    console.error('Error sending reminder:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Send Invoice Endpoint ────────────────────────────────────────────────────
app.post(['/api/whatsapp/send-invoice', '/api/whatsapp/send-invoice-pdf'], async (req, res) => {
  try {
    if (!client || !isReady) {
      return res.status(200).json({
        success: false,
        fallback: true,
        reason: 'client_not_ready',
        message: 'بوت الواتساب السحابي غير متصل حالياً (يرجى مسح QR Code من صفحة /qr)',
      });
    }

    const { phone, clientPhone, message, caption, filename } = req.body;
    const targetPhone = phone || clientPhone;
    const cleanDigits = cleanPhoneNumber(targetPhone);
    if (!cleanDigits) {
      return res.status(400).json({ success: false, error: 'رقم الهاتف غير صالح' });
    }

    let base64Data = req.body.imageBase64 || req.body.image || req.body.pdfBase64 || req.body.pdf;
    if (!base64Data) {
      return res.status(400).json({ success: false, error: 'لم يتم استلام بيانات صورة الفاتورة' });
    }

    if (base64Data.includes('base64,')) {
      base64Data = base64Data.split('base64,')[1];
    }
    base64Data = base64Data.trim().replace(/\s+/g, '');

    const numberDetails = await client.getNumberId(cleanDigits);
    if (!numberDetails || !numberDetails._serialized) {
      return res.status(400).json({
        success: false,
        error: 'number_not_registered',
        message: `رقم الهاتف (${targetPhone}) غير مسجل في واتساب`,
      });
    }

    const captionText = message || caption || 'مرفق فاتورة زيارتك لعيادة وسبا أوريا ✦';
    const tempFilePath = path.join(__dirname, `invoice_${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));

    try {
      const media = MessageMedia.fromFilePath(tempFilePath);
      if (filename) {
        media.filename = filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? filename : `${filename}.jpg`;
      }

      await client.sendMessage(numberDetails._serialized, media, {
        caption: captionText,
      });

      console.log(`✅ [Invoice Sent] Delivered to ${numberDetails._serialized}`);
      res.json({
        success: true,
        message: 'تم إرسال صورة الفاتورة بنجاح عبر السيرفر السحابي',
      });
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (err) {
    console.error('Error sending invoice:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Express server & initialize WhatsApp client
app.listen(PORT, () => {
  console.log(`🚀 [WhatsApp Cloud Service] HTTP server listening on port ${PORT}`);
  initWhatsApp();
});
