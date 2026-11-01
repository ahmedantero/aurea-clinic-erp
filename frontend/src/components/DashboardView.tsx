import React from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ChevronLeft, 
  Sparkles, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Flower2,
  ArrowUpRight,
  MessageSquare
} from 'lucide-react';
import { Appointment } from '../types';
import { useToast } from '../context/ToastContext';
import { AnimatedNumber } from './ui/AnimatedNumber';
import { StatCard } from './ui/StatCard';
import { dispatchWhatsAppReminder } from '../utils/whatsappHelper';

interface DashboardViewProps {
  appointments: Appointment[];
  onNavigateToAppointments: () => void;
  onOpenNewModal: () => void;
  onRefresh?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  appointments,
  onNavigateToAppointments,
  onOpenNewModal,
  onRefresh,
}) => {
  const { success, error } = useToast();
  const [sendingWhatsAppId, setSendingWhatsAppId] = React.useState<string | null>(null);

  // Auto-refresh data on Dashboard mount
  React.useEffect(() => {
    if (onRefresh) onRefresh();
  }, []);

  const confirmedCount = appointments.filter((a) => a.status === 'مؤكد').length;
  const pendingCount = appointments.filter((a) => a.status === 'قيد الانتظار').length;
  const completedCount = appointments.filter((a) => a.status === 'مكتمل').length;
  const cancelledCount = appointments.filter((a) => (a.status as string) === 'ملغي' || (a.status as string) === 'Cancelled').length;

  // Calculate estimated total session value strictly from active non-cancelled appointments
  const totalBookingsValue = appointments
    .filter((a) => (a.status as string) !== 'ملغي' && (a.status as string) !== 'Cancelled')
    .reduce((sum, a) => sum + (parseFloat(a.finalPrice as any) || 0), 0);

  const handleSendWhatsAppReminder = async (apt: Appointment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const phone = apt.clientPhone?.trim();
    if (!phone) {
      error('لا يوجد رقم هاتف مسجل لهذا العميل لإرسال تذكير واتساب', 'رقم الهاتف مفقود');
      return;
    }

    setSendingWhatsAppId(apt.id);
    try {
      const res = await dispatchWhatsAppReminder({
        phone,
        clientName: apt.clientName,
        staffName: apt.staffName,
        serviceName: apt.serviceName || apt.packageName,
        appointmentDate: apt.appointmentDate,
        time: apt.time,
      });

      success(res.message, res.mode === 'bot' ? 'تم الإرسال الآلي' : 'واتساب جاهز');
    } catch (err: any) {
      error('حدث خطأ أثناء محاولة إرسال تذكير الواتساب', 'خطأ في الاتصال');
    } finally {
      setSendingWhatsAppId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Welcome Hero Banner with cover.jpg & Gradient Overlay */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-xl min-h-[240px] sm:min-h-[290px] flex items-center bg-stone-900 border border-emerald-950/40">
        {/* Background Image from public/cover.jpg */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105 hover:scale-100"
          style={{ backgroundImage: `url('/cover.jpg')` }}
        />

        {/* Dark green to transparent gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-l from-emerald-950/95 via-emerald-900/85 to-transparent" />
        
        {/* Subtle radial depth gradient */}
        <div className="absolute inset-0 bg-radial-[circle_at_top_right] from-black/40 via-transparent to-black/30" />

        {/* Banner Content (White / Gold Typography) */}
        <div className="relative z-10 p-6 sm:p-10 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="max-w-2xl">
            {/* Elegant Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>نظام أوريا المتكامل لإدارة العيادة والسبا</span>
            </div>

            {/* Main Greeting in White & Gold typography */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
              مرحباً بك في نظام{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-100 font-serif">
                أوريا كلينيك
              </span>{' '}
              <span className="text-xs sm:text-sm font-normal text-amber-200/80 font-mono" dir="ltr">
                — Aurea Clinic
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-2.5 font-normal leading-relaxed">
              لوحة التحكم الرئيسية لمتابعة جدول الجلسات اليومية، سجلات العملاء، ومؤشرات الأداء. لديك اليوم{' '}
              <strong className="text-amber-300 font-bold underline decoration-amber-400/60 underline-offset-4">
                {pendingCount} مواعيد قيد الانتظار
              </strong>{' '}
              تحتاج للمراجعة والتأكيد.
            </p>
          </div>

          {/* Quick Action Button with Gold Glow */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenNewModal}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-900 font-extrabold text-sm transition-all duration-200 flex items-center gap-2.5 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>تسجيل حجز جديد</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Overlapping 3D Magnetic Tilt Summary Cards (-mt-12 with z-20 & soft shadows) */}
      <div className="-mt-12 relative z-20 px-2 sm:px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <StatCard
          title="إجمالي الحجوزات"
          subtitle="جلسة مسجلة بالنظام"
          value={<AnimatedNumber value={appointments.length} />}
          icon={Calendar}
          accentColor="blue"
          badge="العيادة والسبا"
          onClick={onNavigateToAppointments}
        />

        {/* Confirmed Bookings */}
        <StatCard
          title="الحجوزات المؤكدة"
          subtitle="جاهزة لبدء الجلسات"
          value={<AnimatedNumber value={confirmedCount} />}
          icon={CheckCircle2}
          accentColor="emerald"
          badge="مؤكد"
          onClick={onNavigateToAppointments}
        />

        {/* Pending Bookings */}
        <StatCard
          title="قيد الانتظار"
          subtitle="تحتاج متابعة وتأكيد"
          value={<AnimatedNumber value={pendingCount} />}
          icon={Clock}
          accentColor="amber"
          badge="مطلوب مراجعة"
          onClick={onNavigateToAppointments}
        />

        {/* Estimated Total Value */}
        <StatCard
          title="قيمة الجلسات المسجلة"
          subtitle={`${completedCount} جلسة مكتملة ومسددة`}
          value={<AnimatedNumber value={totalBookingsValue} suffix=" ج.م" />}
          icon={DollarSign}
          accentColor="emerald"
          badge="الإجمالي"
          trend={{ value: 'نشط', isPositive: true }}
          onClick={onNavigateToAppointments}
        />
      </div>

      {/* 3. Upcoming Appointments & Quick Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Appointments */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-stone-800 dark:text-stone-100">أحدث الحجوزات والمواعيد القادمة</h2>
              <p className="text-xs text-stone-400">جدول الجلسات المعتمدة في نظام العيادة</p>
            </div>
            <button
              onClick={onNavigateToAppointments}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100/70 px-3 py-1.5 rounded-xl transition-colors"
            >
              <span>عرض كافة الحجوزات</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {appointments.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
                <p>لا توجد حجوزات مسجلة حالياً.</p>
              </div>
            ) : (
              appointments.slice(0, 5).map((apt) => (
                <div
                  key={apt.id}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-stone-50/60 dark:hover:bg-stone-800/40 px-3 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-center font-bold text-xs border border-stone-200/60 dark:border-stone-700 shrink-0">
                      {apt.clientName.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-800 dark:text-stone-100">{apt.clientName}</h4>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {apt.serviceName} • <span className="text-stone-600 dark:text-stone-300 font-medium">{apt.staffName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      disabled={sendingWhatsAppId === apt.id}
                      onClick={(e) => handleSendWhatsAppReminder(apt, e)}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                      title="إرسال تذكير الموعد عبر واتساب"
                    >
                      {sendingWhatsAppId === apt.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span className="hidden sm:inline">تذكير</span>
                    </button>

                    <div className="text-left">
                      <span className="text-xs font-medium text-stone-700 dark:text-stone-300 block font-mono" dir="ltr">
                        {apt.appointmentDate} ({apt.time})
                      </span>
                      <span
                        className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full mt-1 ${
                          apt.status === 'مكتمل'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : apt.status === 'مؤكد'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : apt.status === 'قيد الانتظار'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Clinic Highlights & Spa Ambiance */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
                  <Flower2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-800 dark:text-stone-100">أقسام أوريا كلينيك</h3>
                  <p className="text-xs text-stone-400">الخدمات العلاجية والاسترخائية</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              {[
                { name: 'علاج طبيعي وتأهيل', desc: 'جلسات أجهزة كهربائية ومساج علاجي', count: 'نشط' },
                { name: 'عناية بالبشرة والوجه', desc: 'ديرما بيل وتقشير وتنظيف عميق', count: 'نشط' },
                { name: 'سبا وحمام مغربي', desc: 'استرخاء متكامل وبخار وصابون مغربي', count: 'نشط' },
                { name: 'حجامة وعناية طبية', desc: 'كاسات جافة ورطبة بإشراف متخصص', count: 'نشط' },
              ].map((section, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-stone-50/70 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex items-center justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-stone-800 dark:text-stone-100">{section.name}</h5>
                    <p className="text-[11px] text-stone-400 mt-0.5">{section.desc}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                    {section.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Calming Spa Tip */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200 mt-4 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>
              نظام أوريا صُمم لتقديم تجربة استثنائية تجمع بين الرعاية الطبية وأعلى معايير الرفاهية والاسترخاء.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
