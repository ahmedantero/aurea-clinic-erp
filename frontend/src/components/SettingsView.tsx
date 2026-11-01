import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  Laptop, 
  Globe, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { 
  getWhatsAppConfig, 
  saveWhatsAppConfig, 
  getEffectiveWhatsAppMode,
  WhatsAppMode, 
  WhatsAppConfig 
} from '../utils/whatsappSettings';

export const SettingsView: React.FC = () => {
  const { success, error, info } = useToast();
  const [config, setConfig] = useState<WhatsAppConfig>(getWhatsAppConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    reachable: boolean;
    isBotReady: boolean;
    message: string;
  } | null>(null);

  const isLocalHost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const effectiveMode = getEffectiveWhatsAppMode(config);

  const handleSave = () => {
    saveWhatsAppConfig(config);
    success('تم حفظ إعدادات الواتساب والنظام بنجاح ✨', 'تم الحفظ');
  };

  const handleReset = () => {
    const defaultConfig: WhatsAppConfig = {
      mode: 'auto',
      bridgeUrl: '',
      autoDetect: true,
    };
    setConfig(defaultConfig);
    saveWhatsAppConfig(defaultConfig);
    setTestResult(null);
    info('تمت استعادة الإعدادات التلقائية الافتراضية', 'استعادة الافتراضي');
  };

  const handleTestBridge = async () => {
    const targetUrl = (config.bridgeUrl || '').trim().replace(/\/+$/, '');
    if (!targetUrl && effectiveMode === 'bridge') {
      error('يرجى كتابة رابط جسر العيادة أولاً لفحصه', 'رابط مفقود');
      return;
    }

    const testEndpoint = targetUrl 
      ? `${targetUrl}/api/whatsapp/status`
      : '/api/whatsapp/status';

    setIsTesting(true);
    setTestResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(testEndpoint, { 
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));

      if (res.ok && data) {
        if (data.isReady) {
          setTestResult({
            tested: true,
            reachable: true,
            isBotReady: true,
            message: 'الاتصال بالجسر ممتاز! بوت الواتساب متصل وجاهز للإرسال الآلي 100% 🚀',
          });
          success('جسر الواتساب يعمل بأعلى كفاءة وبوت الواتساب جاهز للإرسال!', 'فحص ناجح');
        } else {
          setTestResult({
            tested: true,
            reachable: true,
            isBotReady: false,
            message: 'تم الوصول إلى خادم العيادة بنجاح، لكن جلسة الواتساب غير نشطة حالياً (يرجى مسح QR Code على جهاز العيادة).',
          });
          info('الخادم متصل لكن الواتساب يحتاج مسح QR Code', 'تنبيه');
        }
      } else {
        throw new Error('استجابة غير صالحة من الخادم');
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        reachable: false,
        isBotReady: false,
        message: 'تعذر الاتصال برابط الجسر. تأكد من تشغيل نفق الربط على جهاز العيادة وأن الرابط صحيح.',
      });
      error('تعذر الاتصال بالجسر. تأكد من تشغيل Start_Clinic_With_Tunnel.bat على جهازك.', 'فشل الاتصال');
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('تم نسخ الأمر إلى الحافظة بنجاح 📋', 'تم النسخ');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Luxury Header ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-l from-[#0f3b2c] via-[#164e3b] to-[#0f3b2c] text-[#fbf8ee] rounded-2xl p-6 shadow-md border border-[#c5a880]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c5a880]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 bg-[#fbf8ee]/10 rounded-xl backdrop-blur-sm border border-[#c5a880]/40 text-[#c5a880]">
                <Settings className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-black tracking-tight">إعدادات النظام وقنوات الإرسال</h1>
            </div>
            <p className="text-sm text-[#fbf8ee]/80 font-medium">
              التحكم في أوضاع التشغيل، قنوات إرسال الواتساب الآلي، والربط المجاني بين النسخة الأونلاين وجهاز العيادة.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#fbf8ee]/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-[#c5a880]/30 text-xs">
            <span className="text-[#c5a880] font-bold">البيئة الحالية:</span>
            <span className="font-bold flex items-center gap-1.5 text-emerald-300">
              {isLocalHost ? (
                <>
                  <Laptop className="w-4 h-4" /> جهاز محلي (Localhost)
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" /> سحابي مرفوع (Vercel Cloud)
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── Active Route Indicator Banner ────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            effectiveMode === 'local' 
              ? 'bg-emerald-100 text-emerald-800' 
              : effectiveMode === 'bridge'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {effectiveMode === 'local' ? <Laptop className="w-5 h-5" /> : effectiveMode === 'bridge' ? <Server className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs text-stone-500 font-bold">مسار الإرسال النشط حالياً:</div>
            <div className="text-base font-extrabold text-[#0f3b2c] flex items-center gap-2">
              {effectiveMode === 'local' && '🖥️ إرسال آلي محلي عبر سيرفر هذا الجهاز (Local Bot)'}
              {effectiveMode === 'bridge' && '🌐 إرسال آلي سحابي عبر نفق جهاز العيادة (Local Cloud Bridge)'}
              {effectiveMode === 'direct' && '💬 تحويل مباشر للواتساب الرسمي مع تنزيل الفاتورة'}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                نشط الآن
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestBridge}
          disabled={isTesting}
          className="px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300/80 shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
          {isTesting ? 'جارٍ الفحص...' : 'فحص كفاءة القناة الحالية'}
        </button>
      </div>

      {/* ── Live Test Result Box ─────────────────────────────────────── */}
      {testResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
          testResult.reachable && testResult.isBotReady
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : testResult.reachable
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {testResult.reachable && testResult.isBotReady ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div className="text-sm font-semibold leading-relaxed">
            {testResult.message}
          </div>
        </div>
      )}

      {/* ── Mode Selection Cards ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-black text-[#0f3b2c] mb-1">اختيار وضع تشغيل الواتساب</h2>
          <p className="text-xs text-stone-500 font-medium">
            حدد الطريقة التي تريد أن يرسل بها النظام الفواتير والتنبيهات للعملاء:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Auto Mode */}
          <div 
            onClick={() => setConfig({ ...config, mode: 'auto' })}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              config.mode === 'auto'
                ? 'border-[#0f3b2c] bg-emerald-50/50 shadow-sm ring-1 ring-[#0f3b2c]'
                : 'border-stone-200 hover:border-emerald-300 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                  <Sparkles className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                  مستحسن ذكي
                </span>
              </div>
              <h3 className="font-extrabold text-base text-[#0f3b2c] mb-1.5">كشف تلقائي ذكي (Auto)</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                يكتشف مكان تشغيل النظام تلقائياً: إذا كنت على جهازك يرسل محلياً، وإذا كنت على Vercel يرسل عبر نفق العيادة أو الرابط المباشر.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-xs font-bold text-emerald-800">
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${config.mode === 'auto' ? 'border-[#0f3b2c]' : 'border-stone-400'}`}>
                {config.mode === 'auto' && <span className="w-2 h-2 rounded-full bg-[#0f3b2c]" />}
              </span>
              {config.mode === 'auto' ? 'محدد حالياً' : 'تحديد هذا الوضع'}
            </div>
          </div>

          {/* Card 2: Ngrok Permanent Fixed Domain */}
          <div 
            onClick={() => setConfig({ ...config, mode: 'bridge' })}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              config.mode === 'bridge'
                ? 'border-[#0f3b2c] bg-emerald-50/50 shadow-sm ring-1 ring-[#0f3b2c]'
                : 'border-stone-200 hover:border-emerald-300 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-emerald-100 text-[#0f3b2c]">
                  <Server className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                  رابط ثابت للأبد (بدون كارت 100%)
                </span>
              </div>
              <h3 className="font-extrabold text-base text-[#0f3b2c] mb-1.5">جسر Ngrok الثابت (Fixed Domain)</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                يربط جهاز العيادة بموقعك على Vercel برابط ثابت دائم مدى الحياة مجاناً دون الحاجة لأي كارت بنكي نهائياً.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-xs font-bold text-[#0f3b2c]">
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${config.mode === 'bridge' ? 'border-[#0f3b2c]' : 'border-stone-400'}`}>
                {config.mode === 'bridge' && <span className="w-2 h-2 rounded-full bg-[#0f3b2c]" />}
              </span>
              {config.mode === 'bridge' ? 'محدد حالياً' : 'تحديد هذا الوضع'}
            </div>
          </div>

          {/* Card 3: Direct Link */}
          <div 
            onClick={() => setConfig({ ...config, mode: 'direct' })}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              config.mode === 'direct'
                ? 'border-[#0f3b2c] bg-emerald-50/50 shadow-sm ring-1 ring-[#0f3b2c]'
                : 'border-stone-200 hover:border-emerald-300 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-blue-100 text-blue-800">
                  <MessageSquare className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                  مباشر / طوارئ
                </span>
              </div>
              <h3 className="font-extrabold text-base text-[#0f3b2c] mb-1.5">التحويل المباشر (Direct Link)</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                يفتح محادثة واتساب الرسمية مع نص الفاتورة جاهزاً ويقوم بتنزيل الصورة لجهازك (مفيد عند غلق جهاز العيادة أو الإرسال من الموبايل).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-xs font-bold text-blue-900">
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${config.mode === 'direct' ? 'border-[#0f3b2c]' : 'border-stone-400'}`}>
                {config.mode === 'direct' && <span className="w-2 h-2 rounded-full bg-[#0f3b2c]" />}
              </span>
              {config.mode === 'direct' ? 'محدد حالياً' : 'تحديد هذا الوضع'}
            </div>
          </div>
        </div>

        {/* ── Bridge URL Configuration Input ─────────────────────────── */}
        <div className="pt-4 border-t border-stone-100 space-y-3">
          <label className="block text-sm font-extrabold text-[#0f3b2c]">
            رابط جسر Ngrok الثابت الخاص بعيادتك (Ngrok Static Domain URL):
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={config.bridgeUrl}
                onChange={(e) => setConfig({ ...config, bridgeUrl: e.target.value })}
                placeholder="https://your-domain.ngrok-free.app"
                dir="ltr"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono rounded-xl border border-stone-300 focus:border-[#0f3b2c] focus:ring-1 focus:ring-[#0f3b2c] outline-none"
              />
              <Server className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            </div>

            <button
              type="button"
              onClick={handleTestBridge}
              disabled={isTesting}
              className="px-5 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#0f3b2c] hover:bg-[#164e3b] text-[#fbf8ee] shadow-sm shrink-0 disabled:opacity-50"
            >
              <Wifi className={`w-4 h-4 ${isTesting ? 'animate-pulse' : ''}`} />
              فحص الاتصال بالجسر
            </button>
          </div>
          <p className="text-xs text-stone-500">
            * هذا الرابط الثابت تضعه هنا مرة واحدة فقط للأبد، وسيعمل معك تلقائياً في كل مرة تفتح فيها جهاز العيادة.
          </p>
        </div>
      </div>

      {/* ── Step-by-Step Ngrok Tutorial ───────────────────────────── */}
      <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200/80 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <h3 className="font-extrabold text-[#0f3b2c] text-sm">
            طريقة تشغيل رابط Ngrok الثابت في 3 خطوات بسيطة (مجاناً 100% وبدون كارت بنكي):
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 font-black flex items-center justify-center">1</div>
            <div className="font-bold text-stone-800">التسجيل بجوجل والحصول على الرمز</div>
            <p className="text-stone-600 leading-relaxed">
              ادخل على <a href="https://ngrok.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline">ngrok.com</a> وسجل بحساب جيميل الخاص بك بالضغط على <strong>Sign up with Google</strong> (دون إدخال أي كارت).
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 font-black flex items-center justify-center">2</div>
            <div className="font-bold text-stone-800">نسخ Authtoken والرابط الثابت</div>
            <p className="text-stone-600 leading-relaxed">
              من القائمة انسخ الـ <strong>Authtoken</strong>، ومن صفحة <strong>Domains</strong> انسخ رابطك الثابت المجاني (<code className="bg-stone-100 px-1 py-0.5 rounded font-mono text-emerald-800">xxx.ngrok-free.app</code>)، وضعهما في ملف <code className="bg-stone-100 px-1 py-0.5 rounded font-mono font-bold text-emerald-800">ngrok_config.json</code>.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 font-black flex items-center justify-center">3</div>
            <div className="font-bold text-stone-800">التشغيل والحفظ مرة واحدة للأبد</div>
            <p className="text-stone-600 leading-relaxed">
              شغل ملف <code className="bg-stone-100 px-1 py-0.5 rounded font-mono font-bold text-emerald-800">Start_Clinic_With_Ngrok.bat</code>، وضع الرابط في الخانة بالأعلى واضغط <strong>حفظ التغييرات</strong>. مبروك! الرابط أصبح ثابتاً دائماً!
            </p>
          </div>
        </div>
      </div>

      {/* ── Actions Footer ───────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={handleReset}
          className="px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer bg-stone-100 hover:bg-stone-200 text-stone-700"
        >
          استعادة الافتراضي
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="px-7 py-2.5 text-sm font-black rounded-xl transition-all cursor-pointer bg-[#0f3b2c] hover:bg-[#164e3b] text-[#fbf8ee] shadow-sm hover:shadow"
        >
          حفظ التغييرات
        </button>
      </div>
    </div>
  );
};
