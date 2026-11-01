const ngrok = require('@ngrok/ngrok');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const configPath = path.join(__dirname, '..', 'ngrok_config.json');

async function start() {
  let authtoken = process.env.NGROK_AUTHTOKEN;
  let domain = process.env.NGROK_DOMAIN;

  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.authtoken && cfg.authtoken !== 'YOUR_AUTHTOKEN_HERE') {
        authtoken = cfg.authtoken.trim();
      }
      if (cfg.domain && cfg.domain !== 'YOUR_STATIC_DOMAIN_HERE') {
        domain = cfg.domain.trim();
      }
    } catch (e) {
      console.error('Error reading ngrok_config.json:', e);
    }
  }

  if (!authtoken) {
    console.log('\n===============================================================');
    console.log('⚠️ [Ngrok Setup] يرجى إدخال رمز Authtoken الخاص بك:');
    console.log('1. ادخل على لوحة تحكم ngrok المجانية: https://dashboard.ngrok.com/get-started/your-authtoken');
    console.log('2. انسخ الـ Authtoken وضعه في ملف ngrok_config.json');
    console.log('===============================================================\n');
    process.exit(1);
  }

  const opts = {
    addr: 5000,
    authtoken: authtoken,
  };

  if (domain) {
    opts.domain = domain;
  }

  try {
    console.log('🔄 جاري تشغيل نفق Ngrok بالرابط الثابت...');
    const listener = await ngrok.forward(opts);
    const url = listener.url();
    console.log('\n===============================================================');
    console.log(`✅ [Aurea Clinic Ngrok Bridge Connected!] تم الاتصال بنجاح!`);
    console.log(`🌐 الرابط الثابت الدائم لعيادتك: ${url}`);
    console.log(`👉 ضع هذا الرابط في صفحة الإعدادات في موقعك على Vercel:`);
    console.log(`   ${url}`);
    console.log('===============================================================\n');
  } catch (err) {
    console.error('❌ Failed to establish Ngrok tunnel:', err.message);
  }
}

start();
