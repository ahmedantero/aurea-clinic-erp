const fs = require('fs');
const path = require('path');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

/**
 * 100% FREE WhatsApp Automation Service for Clinic & Spa ERP
 * Uses whatsapp-web.js with LocalAuth session persistence (Zero monthly API fees).
 */

let client = null;
let isReady = false;

/**
 * Extracts clean international digits from the incoming phone number.
 * Handles Egyptian local formats (010, 011, 012, 015) and international numbers.
 */
function extractCleanDigits(phone) {
  if (!phone) return null;

  // Remove non-digit characters
  let cleaned = String(phone).replace(/\D/g, '');

  // Handle Egyptian numbers: 010..., 011..., 012..., 015...
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '20' + cleaned.substring(1);
  } else if (cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = '20' + cleaned;
  } else if (cleaned.startsWith('0020')) {
    cleaned = cleaned.substring(2);
  }

  // If missing country code and length is 10 digits
  if (!cleaned.startsWith('20') && cleaned.length === 10 && cleaned.startsWith('1')) {
    cleaned = '20' + cleaned;
  }

  // Strip @ if present
  if (cleaned.includes('@')) {
    cleaned = cleaned.split('@')[0];
  }

  return cleaned;
}

/**
 * Formats phone numbers into standard WhatsApp format (e.g. 2010xxxxxxxx@c.us)
 */
function formatWhatsAppNumber(phone) {
  const digits = extractCleanDigits(phone);
  if (!digits) return null;
  return `${digits}@c.us`;
}

/**
 * Initialize WhatsApp Web Client with LocalAuth session caching
 */
function initWhatsApp() {
  if (client) return client;

  console.log('🔄 Initializing WhatsApp Web Client with LocalAuth...');

  const chromePath =
    process.env.CHROME_BIN ||
    (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : undefined);

  const puppeteerConfig = {
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

  if (chromePath) {
    puppeteerConfig.executablePath = chromePath;
  }

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth',
    }),
    puppeteer: puppeteerConfig,
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html',
    },
  });

  client.on('loading_screen', (percent, message) => {
    console.log(`⏳ WhatsApp Loading: ${percent}% - ${message}`);
    if (percent >= 99) {
      setTimeout(async () => {
        if (!isReady && client) {
          try {
            const state = await client.getState();
            if (state === 'CONNECTED') {
              isReady = true;
              console.log('=============================================================');
              console.log('✅ WhatsApp Bot is Ready! (Connected & 99% loaded)');
              console.log('=============================================================');
            }
          } catch (e) {}
        }
      }, 3000);
    }
  });

  client.on('change_state', (state) => {
    console.log(`🔄 WhatsApp State Changed: ${state}`);
  });

  // Display QR Code in Terminal on first run / when authentication needed
  client.on('qr', (qr) => {
    console.log('\n=============================================================');
    console.log('📱 SCAN THE QR CODE BELOW USING YOUR WHATSAPP (LINKED DEVICES):');
    console.log('=============================================================\n');
    qrcode.generate(qr, { small: true });
    console.log('\nWaiting for WhatsApp connection...');
  });

  client.on('authenticated', () => {
    console.log('🔐 WhatsApp Client Authenticated successfully!');
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp Authentication Failure:', msg);
    isReady = false;
  });

  client.on('ready', () => {
    isReady = true;
    console.log('=============================================================');
    console.log('✅ WhatsApp Bot is Ready! Automated notifications are active.');
    console.log('=============================================================');
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    console.warn('⚠️ WhatsApp Client was disconnected:', reason);
    console.log('🔄 Re-initializing WhatsApp in 10 seconds...');
    setTimeout(() => {
      try {
        client.initialize();
      } catch (err) {
        console.error('Failed to re-initialize WhatsApp client:', err.message);
      }
    }, 10000);
  });

  // Start initialization in background without blocking server boot
  client.initialize().catch((err) => {
    console.error('⚠️ WhatsApp Initialization error:', err.message);
  });

  return client;
}

/**
 * Robust message sender that verifies numbers via client.getNumberId()
 * and sends strictly using numberDetails._serialized as recipient ID.
 * @param {string} phoneNumber - Client phone number (e.g. "01012345678" or "+201012345678")
 * @param {string} message - Formatted Arabic notification text
 * @returns {Promise<{success: boolean, messageId?: string, recipientId?: string, error?: string, message?: string}>}
 */
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    if (!phoneNumber || !message) {
      return { success: false, error: 'Phone number and message text are required', message: 'رقم الهاتف ونص الرسالة مطلوبان' };
    }

    // 1. Extract clean digits and format standard WhatsApp ID first
    const cleanDigits = extractCleanDigits(phoneNumber);
    if (!cleanDigits) {
      console.warn(`⚠️ Invalid phone number format: "${phoneNumber}". Skipping message.`);
      return { 
        success: false, 
        error: 'invalid_phone_number', 
        message: 'صيغة رقم الهاتف غير صالحة، يرجى التأكد من كتابة الرقم بشكل صحيح' 
      };
    }
    const formattedNumber = `${cleanDigits}@c.us`;

    // 2. Check client readiness (logging formatted international number)
    if (!client || !isReady) {
      console.warn(`⚠️ WhatsApp client not ready. Message to ${formattedNumber} skipped.`);
      return {
        success: false,
        reason: 'client_not_ready',
        error: 'client_not_ready',
        message: 'خدمة الواتساب قيد التشغيل والتهيئة حالياً، يرجى الانتظار لحظات والمحاولة مجدداً (WhatsApp bot is still starting, please wait a moment)',
      };
    }

    // 3. Verify number exists on WhatsApp via client.getNumberId()
    const numberDetails = await client.getNumberId(cleanDigits);
    if (!numberDetails || !numberDetails._serialized) {
      console.warn(`⚠️ Phone number "${formattedNumber}" is not registered on WhatsApp.`);
      return {
        success: false,
        error: 'number_not_registered',
        message: `رقم الهاتف (${phoneNumber}) غير مسجل في واتساب`,
      };
    }

    // 4. Send message strictly using numberDetails._serialized as recipient ID
    const recipientId = numberDetails._serialized;
    const response = await client.sendMessage(recipientId, message);

    const messageId = response?.id?._serialized || response?.id?.id || 'SENT';
    console.log(`✅ WhatsApp message delivered to ${recipientId} [ID: ${messageId}]`);

    return {
      success: true,
      recipientId,
      messageId,
    };
  } catch (error) {
    console.error(`❌ Failed to send WhatsApp message to ${phoneNumber}:`, error.message);
    return {
      success: false,
      error: error.message,
      message: 'تعذر إرسال رسالة الواتساب: ' + error.message,
    };
  }
}

/**
 * Sends a media attachment (e.g. PDF Invoice) with an optional caption.
 * @param {string} phoneNumber - Recipient phone number
 * @param {string|Buffer} mediaData - Base64 string or Buffer of the file
 * @param {string} mimetype - e.g. 'application/pdf'
 * @param {string} filename - e.g. 'Invoice.pdf'
 * @param {string} caption - Optional text caption
 * @returns {Promise<{success: boolean, messageId?: string, recipientId?: string, error?: string, message?: string}>}
 */
async function sendWhatsAppMedia(phoneNumber, mediaData, mimetype = 'image/jpeg', filename = 'Invoice.jpg', caption = '') {
  let sanitizedPhone = null;
  let formattedNumber = null;
  try {
    if (!phoneNumber || !mediaData) {
      return { success: false, error: 'Phone number and media data are required', message: 'رقم الهاتف وملف الفاتورة مطلوبان' };
    }

    // 1. Sanitize incoming phone number
    sanitizedPhone = extractCleanDigits(phoneNumber);
    if (!sanitizedPhone) {
      console.warn(`⚠️ Invalid phone number format: "${phoneNumber}". Skipping media message.`);
      return { 
        success: false, 
        error: 'invalid_phone_number', 
        message: 'صيغة رقم الهاتف غير صالحة، يرجى التأكد من كتابة الرقم بشكل صحيح' 
      };
    }
    formattedNumber = `${sanitizedPhone}@c.us`;

    // 2. Check client readiness
    if (!client || !isReady) {
      console.warn(`⚠️ WhatsApp client not ready. Media message to ${formattedNumber} skipped.`);
      return {
        success: false,
        reason: 'client_not_ready',
        error: 'client_not_ready',
        message: 'خدمة الواتساب قيد التشغيل والتهيئة حالياً، يرجى الانتظار لحظات والمحاولة مجدداً (WhatsApp bot is still starting, please wait a moment)',
      };
    }

    // 3. Get the valid WhatsApp ID using client.getNumberId(sanitizedPhone)
    const numberDetails = await client.getNumberId(sanitizedPhone);
    if (!numberDetails || !numberDetails._serialized) {
      console.warn(`⚠️ Phone number "${formattedNumber}" is not registered on WhatsApp.`);
      return {
        success: false,
        error: 'number_not_registered',
        message: `رقم الهاتف (${formattedNumber}) غير مسجل في واتساب`,
      };
    }

    // 4. Extract clean base64 string
    let cleanBase64 = '';
    if (Buffer.isBuffer(mediaData)) {
      cleanBase64 = mediaData.toString('base64');
    } else if (typeof mediaData === 'string') {
      cleanBase64 = mediaData.split('base64,').pop().trim().replace(/\s+/g, '');
    }

    if (!cleanBase64 || cleanBase64.length < 50) {
      console.warn('⚠️ Invalid or empty image data received for WhatsApp media sending.');
      return {
        success: false,
        error: 'invalid_media_data',
        message: 'Invalid or empty media data received from frontend',
      };
    }

    // 5. Save to a temporary .jpg file to completely bypass Puppeteer memory limits
    const tempFilePath = path.join(__dirname, `temp_invoice_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`);
    fs.writeFileSync(tempFilePath, Buffer.from(cleanBase64, 'base64'));

    try {
      // 6. Load media from the actual file
      const media = MessageMedia.fromFilePath(tempFilePath);
      if (filename) media.filename = filename;
      const messageText = typeof caption === 'string' ? caption : '';

      // 7. Send media directly with caption (do NOT use sendMediaAsDocument)
      const response = await client.sendMessage(numberDetails._serialized, media, { 
        caption: messageText 
      });

      const messageId = response?.id?._serialized || response?.id?.id || 'SENT';
      console.log(`✅ WhatsApp media delivered to ${numberDetails._serialized} [ID: ${messageId}] (File: ${filename})`);

      return {
        success: true,
        recipientId: numberDetails._serialized,
        messageId,
        filename,
      };
    } finally {
      // 8. ALWAYS clean up the temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (error) {
    const targetDisplay = formattedNumber || phoneNumber;
    console.error(`❌ Failed to send WhatsApp media to ${targetDisplay}:`, error.message);
    return {
      success: false,
      error: error.message,
      message: 'تعذر إرسال الفاتورة عبر واتساب: ' + error.message,
    };
  }
}

/**
 * Returns current status of WhatsApp bot
 */
function isWhatsAppReady() {
  return isReady;
}

function getWhatsAppClient() {
  return client;
}

module.exports = {
  initWhatsApp,
  sendWhatsAppMessage,
  sendWhatsAppMedia,
  MessageMedia,
  extractCleanDigits,
  formatWhatsAppNumber,
  isWhatsAppReady,
  getWhatsAppClient,
};
