const cron = require('node-cron');
const { sendWhatsAppMessage, isWhatsAppReady } = require('./whatsappClient');

/**
 * Automated Cron Job Service for Clinic & Spa ERP
 * Dispatches daily reminders for next-day appointments every day at 8:00 PM.
 */

// Helper to delay between messages to avoid WhatsApp spam detection
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Core reminder dispatcher: finds all appointments for tomorrow and sends WhatsApp reminders
 */
async function dispatchNextDayReminders(prisma) {
  try {
    console.log('⏰ [Cron Job] Running daily appointment reminder check...');

    // Calculate tomorrow's local date boundaries
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = tomorrow.getMonth();
    const day = tomorrow.getDate();

    const startOfTomorrow = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const endOfTomorrow = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

    // Fetch next day's active appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        appointment_date: {
          gte: startOfTomorrow,
          lte: endOfTomorrow,
        },
        status: {
          in: ['Confirmed', 'Pending', 'مؤكد', 'معلق'],
        },
      },
      include: {
        client: true,
        staff: true,
        service: true,
        package: true,
        clientPackage: true,
      },
    });

    console.log(`📋 Found ${appointments.length} appointment(s) scheduled for tomorrow (${tomorrow.toISOString().split('T')[0]}).`);

    if (appointments.length === 0) {
      return { total: 0, sent: 0 };
    }

    let sentCount = 0;
    const mapUrl = process.env.CLINIC_MAP_URL || 'https://maps.google.com/?q=Aurea+Clinic';

    for (const apt of appointments) {
      const clientPhone = apt.client?.phone;
      if (!clientPhone) continue;

      const clientName = apt.client?.name || 'عميلنا العزيز';
      const staffName = apt.staff?.name || 'الكادر الطبي المختص';
      const serviceName =
        apt.package?.package_name ||
        apt.service?.name ||
        apt.clientPackage?.package_name ||
        'جلسة علاجية / سبا';

      const dateStr = apt.appointment_date.toISOString().split('T')[0];
      const timeStr = '11:00 صباحاً'; // Or stored slot

      const reminderMessage =
        `مرحباً ${clientName} ✨\n\n` +
        `نود تذكيرك بموعدك غداً في أوريا كلينك & سبا (Aurea Clinic & Spa):\n` +
        `🗓️ التاريخ: ${dateStr}\n` +
        `⏰ الوقت: ${timeStr}\n` +
        `💆 الخدمة: ${serviceName}\n` +
        `👩‍⚕️ الأخصائي: ${staffName}\n\n` +
        `ننتظرك بكل حب وراحة لتجربة استثنائية 🤍\n` +
        `📍 موقع العيادة: ${mapUrl}\n\n` +
        `* لتأكيد أو تعديل موعدك، يسعدنا تواصلك بالرد على هذه الرسالة.`;

      const result = await sendWhatsAppMessage(clientPhone, reminderMessage);
      if (result.success) {
        sentCount++;
      }

      // 1.5-second pause between messages to adhere to fair use
      await sleep(1500);
    }

    console.log(`✅ [Cron Job] Successfully dispatched ${sentCount}/${appointments.length} WhatsApp reminders.`);
    return { total: appointments.length, sent: sentCount };
  } catch (error) {
    console.error('❌ [Cron Job Error] Failed to dispatch daily reminders:', error.message);
    return { error: error.message };
  }
}

/**
 * Initializes the automated cron schedule
 * Schedule: Every day at 8:00 PM (20:00) Cairo time -> '0 20 * * *'
 */
function initCronJobs(prisma) {
  // Cron schedule: 0 20 * * * (At 20:00 every day)
  const cronExpression = '0 20 * * *';

  console.log(`🕒 Scheduling Daily WhatsApp Appointment Reminders at 8:00 PM (${cronExpression})`);

  cron.schedule(cronExpression, async () => {
    await dispatchNextDayReminders(prisma);
  }, {
    scheduled: true,
    timezone: 'Africa/Cairo',
  });
}

module.exports = {
  initCronJobs,
  dispatchNextDayReminders,
};
