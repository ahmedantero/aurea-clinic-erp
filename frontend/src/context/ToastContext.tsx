import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, HelpCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration: number = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => {
    showToast(message, 'success', title || 'عملية ناجحة');
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    showToast(message, 'error', title || 'تنبيه خطأ');
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    showToast(message, 'warning', title || 'تنبيه');
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    showToast(message, 'info', title || 'معلومة');
  }, [showToast]);

  const confirm = useCallback((optionsOrMessage: ConfirmOptions | string): Promise<boolean> => {
    const options: ConfirmOptions =
      typeof optionsOrMessage === 'string'
        ? { message: optionsOrMessage }
        : optionsOrMessage;

    return new Promise<boolean>((resolve) => {
      setConfirmDialog({ options, resolve });
    });
  }, []);

  const handleConfirmAction = (accepted: boolean) => {
    if (confirmDialog) {
      confirmDialog.resolve(accepted);
      setConfirmDialog(null);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, confirm }}>
      {children}

      {/* Modern Floating Toasts Container */}
      <div 
        dir="rtl"
        className="fixed top-5 left-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none sm:max-w-md"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          const isInfo = toast.type === 'info';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
                isSuccess
                  ? 'bg-emerald-950/90 text-emerald-50 border-emerald-500/40 shadow-emerald-950/20'
                  : isError
                  ? 'bg-rose-950/90 text-rose-50 border-rose-500/40 shadow-rose-950/20'
                  : isWarning
                  ? 'bg-amber-950/90 text-amber-50 border-amber-500/40 shadow-amber-950/20'
                  : 'bg-stone-900/95 text-stone-50 border-stone-700/60 shadow-stone-950/30'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {isInfo && <Info className="w-5 h-5 text-sky-400" />}
              </div>

              <div className="flex-1 min-w-0">
                {toast.title && (
                  <h4 className="text-sm font-bold tracking-tight mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs font-normal leading-relaxed text-stone-200">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Modern Confirmation Modal */}
      {confirmDialog && (
        <div 
          dir="rtl"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#0f3b2c]/25 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="bg-gradient-to-b from-[#fdfbf7] via-[#fcfaf5] to-[#f7f4ed] dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl max-w-md w-full p-6 shadow-[0_25px_70px_-15px_rgba(15,59,44,0.22)] border border-stone-200/90 dark:border-white/10 transform scale-100 transition-all">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                  confirmDialog.options.type === 'danger'
                    ? 'bg-rose-50 text-rose-600 border border-rose-200/80'
                    : confirmDialog.options.type === 'warning'
                    ? 'bg-amber-50 text-amber-600 border border-amber-200/80'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                }`}
              >
                {confirmDialog.options.type === 'danger' ? (
                  <AlertCircle className="w-6 h-6" />
                ) : confirmDialog.options.type === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <HelpCircle className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {confirmDialog.options.title || 'تأكيد الإجراء'}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">
                  {confirmDialog.options.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-stone-200/80 dark:border-stone-800">
              <button
                type="button"
                onClick={() => handleConfirmAction(false)}
                className="px-4 py-2.5 text-sm font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition-colors cursor-pointer"
              >
                {confirmDialog.options.cancelText || 'إلغاء'}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmAction(true)}
                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all cursor-pointer ${
                  confirmDialog.options.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : confirmDialog.options.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-[#0f3b2c] hover:bg-[#164e3b] shadow-emerald-950/20'
                }`}
              >
                {confirmDialog.options.confirmText || 'تأكيد ومتابعة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
