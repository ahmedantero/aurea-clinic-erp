import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle,
  Building2,
  Flower2,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور للمتابعة.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || 'فشل تسجيل الدخول. يرجى التأكد من البيانات المدخلة.');
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo fill buttons for smooth testing
  const handleQuickLogin = async (demoUser: 'admin' | 'reception') => {
    setUsername(demoUser);
    setPassword('123');
    setError(null);
    setLoading(true);
    try {
      await login(demoUser, '123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#fcfbf9] flex text-stone-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <div className="w-full grid lg:grid-cols-12 min-h-screen">
        {/* ======================================================== */}
        {/* RIGHT SIDE: LUXURY BRANDED HERO BANNER (cover.jpg) */}
        {/* ======================================================== */}
        <div className="hidden lg:flex lg:col-span-7 relative overflow-hidden flex-col justify-between p-12 bg-[#0f3b2c] text-[#fbf8ee]">
          {/* Background cover image */}
          <img
            src="/cover.jpg"
            alt="Aurea Luxury Cover"
            className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          />
          {/* Deep Forest Green to Black Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09251c] via-[#0f3b2c]/85 to-[#051711]/60" />
          
          {/* Subtle gold decorative gradient line */}
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-80" />

          {/* Top Brand Tag */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-[#d4af37]/40 shadow-inner">
                <Flower2 className="w-6 h-6 text-[#d4af37]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">أوريا كلينك وسبا</h2>
                <p className="text-xs text-[#d4af37] font-semibold">Aurea Clinic & Spa Management</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-amber-200">
              <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
              <span>نظام إدارة آمن ومرخص</span>
            </div>
          </div>

          {/* Center / Bottom Inspiring Content */}
          <div className="relative z-10 space-y-6 max-w-xl my-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-amber-200 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>الجيل الأحدث من أنظمة العيادات الطبية والمراكز العلاجية</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight">
              فخامة الإدارة الطبية، ودقة الحسابات في منصة واحدة.
            </h1>

            <p className="text-sm xl:text-base text-stone-200/90 leading-relaxed font-normal">
              تحكم ذكي في دورة العمل الكاملة: بدءاً من تسجيل الحجوزات، متابعة ملفات العملاء وسجل الجلسات، إلى احتساب عمولات الأطباء والجرد والميزانيات المالية اللحظية.
            </p>

            {/* Feature Badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/15 text-xs text-stone-200">
              <div className="p-3 rounded-xl bg-white/5 backdrop-blur-xs border border-white/10 space-y-1">
                <span className="text-[#d4af37] font-bold block text-sm">أدوار وصلاحيات</span>
                <span className="text-[11px] text-stone-300">تخصيص كامل لصلاحيات الإدارة والاستقبال</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 backdrop-blur-xs border border-white/10 space-y-1">
                <span className="text-[#d4af37] font-bold block text-sm">مستودع ومخزون</span>
                <span className="text-[11px] text-stone-300">خصم تلقائي للمستهلكات وتنبيهات نواقص</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 backdrop-blur-xs border border-white/10 space-y-1">
                <span className="text-[#d4af37] font-bold block text-sm">قوائم مالية</span>
                <span className="text-[11px] text-stone-300">أرباح وخسائر (P&L) وطباعة رسمية فورية</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="relative z-10 text-xs text-stone-300/70 flex items-center justify-between border-t border-white/10 pt-4">
            <span>Aurea Clinic ERP • الإصدار المعتمد 2.5</span>
            <span className="font-mono text-[11px]">PostgreSQL 18 • Secure RBAC</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* LEFT SIDE: CLEAN, MINIMALIST LOGIN FORM */}
        {/* ======================================================== */}
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-between p-6 sm:p-12 lg:p-14 bg-gradient-to-b from-[#fdfbf7] via-white to-[#faf8f4]">
          {/* Top Mobile Brand (Only on mobile) */}
          <div className="lg:hidden flex items-center justify-between pb-6 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
                <Flower2 className="w-5 h-5" />
              </div>
              <span className="font-black text-stone-800 text-base">أوريا كلينك وسبا</span>
            </div>
            <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
              بوابة الدخول
            </span>
          </div>

          {/* Main Login Form Container */}
          <div className="max-w-md w-full mx-auto my-auto py-8">
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-3">
                <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-[#d4af37] via-amber-200 to-emerald-900 shadow-md shadow-emerald-950/10">
                  <img
                    src="/logo.jpg"
                    alt="Aurea Logo"
                    className="w-full h-full object-cover rounded-2xl bg-white"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0f3b2c] text-white flex items-center justify-center border-2 border-white shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-[#0f3b2c] tracking-tight">
                تسجيل الدخول للنظام
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
                يرجى إدخال اسم المستخدم وكلمة المرور للوصول إلى لوحة التحكم
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4.5">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  اسم المستخدم (Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    placeholder="مثال: admin أو reception"
                    disabled={loading}
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm font-medium placeholder:text-stone-400 focus:outline-hidden focus:border-[#0f3b2c] focus:ring-2 focus:ring-[#0f3b2c]/10 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700">
                    كلمة المرور (Password)
                  </label>
                  <span className="text-[11px] text-[#0f3b2c] font-semibold">
                    رمز الحماية
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full pr-10 pl-11 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm font-medium placeholder:text-stone-400 focus:outline-hidden focus:border-[#0f3b2c] focus:ring-2 focus:ring-[#0f3b2c]/10 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                    title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0f3b2c] hover:bg-[#144c39] active:bg-[#0c2e22] text-[#fbf8ee] text-sm font-extrabold shadow-md shadow-emerald-950/15 border border-[#d4af37]/40 flex items-center justify-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري التحقق وتسجيل الدخول...</span>
                  </>
                ) : (
                  <>
                    <span>تسجيل الدخول إلى النظام</span>
                    <ArrowLeft className="w-4 h-4 text-amber-300" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Helper */}
            <div className="mt-8 pt-6 border-t border-stone-200/70">
              <p className="text-xs font-bold text-stone-600 mb-2.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>حسابات تجريبية سريعة لاختبار الصلاحيات (RBAC):</span>
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={loading}
                  className="p-3 rounded-xl border border-[#d4af37]/40 bg-[#faf8f4] hover:bg-[#f4efe4] text-right transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-[#0f3b2c] group-hover:text-emerald-900">
                      المدير (Admin)
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-[#0f3b2c] font-bold">
                      كامل الصلاحيات
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-mono">admin / 123</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('reception')}
                  disabled={loading}
                  className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-right transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-stone-800 group-hover:text-emerald-900">
                      الاستقبال (Reception)
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">
                      مقيد الصلاحيات
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-mono">reception / 123</p>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-stone-100 text-[11px] text-stone-400">
            أوريا كلينيك وسبا — نظام إدارة المؤسسات الطبية والتجميلية المعتمد
          </div>
        </div>
      </div>
    </div>
  );
};
