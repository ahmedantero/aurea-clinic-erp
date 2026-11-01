import React from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { 
  CreditCard, 
  Receipt, 
  Edit3, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

export interface TableContextMenuProps {
  children: React.ReactNode;
  onCheckout?: () => void;
  onViewReceipt?: () => void;
  onCancelRefund?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopyInfo?: () => void;
  onStatusChange?: (status: 'قيد الانتظار' | 'مؤكد' | 'مكتمل' | 'ملغي') => void;
  isCompleted?: boolean;
}

export const TableContextMenu: React.FC<TableContextMenuProps> = ({
  children,
  onCheckout,
  onViewReceipt,
  onCancelRefund,
  onEdit,
  onDelete,
  onCopyInfo,
  onStatusChange,
  isCompleted = false,
}) => {
  return (
    <ContextMenu.Root dir="rtl">
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          className="min-w-[210px] bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl border border-stone-200/90 dark:border-stone-800 rounded-2xl p-1.5 shadow-2xl shadow-stone-900/20 text-xs font-medium z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Main Action: Checkout or Receipt */}
          {onCheckout && !isCompleted && (
            <ContextMenu.Item
              onClick={onCheckout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50/70 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer outline-none transition-colors"
            >
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>تحصيل وسداد الفاتورة</span>
            </ContextMenu.Item>
          )}

          {onViewReceipt && (
            <ContextMenu.Item
              onClick={onViewReceipt}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer outline-none transition-colors"
            >
              <Receipt className="w-4 h-4 text-stone-500" />
              <span>عرض / طباعة الإيصال</span>
            </ContextMenu.Item>
          )}

          {onCancelRefund && (
            <ContextMenu.Item
              onClick={onCancelRefund}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-700 dark:text-rose-300 font-bold bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer outline-none transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>إلغاء واسترداد الحجز</span>
            </ContextMenu.Item>
          )}

          {onCopyInfo && (
            <ContextMenu.Item
              onClick={onCopyInfo}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer outline-none transition-colors"
            >
              <Copy className="w-4 h-4 text-stone-500" />
              <span>نسخ بيانات السجل</span>
            </ContextMenu.Item>
          )}

          {onEdit && (
            <ContextMenu.Item
              onClick={onEdit}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer outline-none transition-colors"
            >
              <Edit3 className="w-4 h-4 text-stone-500" />
              <span>تعديل التفاصيل</span>
            </ContextMenu.Item>
          )}

          {/* Submenu for Status Change */}
          {onStatusChange && (
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger className="flex items-center justify-between px-3 py-2 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer outline-none transition-colors">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-stone-500" />
                  <span>تغيير الحالة</span>
                </div>
                <span className="text-[10px] text-stone-400">‹</span>
              </ContextMenu.SubTrigger>
              <ContextMenu.Portal>
                <ContextMenu.SubContent
                  className="min-w-[150px] bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl border border-stone-200/90 dark:border-stone-800 rounded-xl p-1 shadow-xl z-50 text-xs"
                >
                  <ContextMenu.Item
                    onClick={() => onStatusChange('قيد الانتظار')}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 cursor-pointer outline-none"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>قيد الانتظار</span>
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    onClick={() => onStatusChange('مؤكد')}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer outline-none"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>مؤكد</span>
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    onClick={() => onStatusChange('مكتمل')}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer outline-none"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>مكتمل</span>
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    onClick={() => onStatusChange('ملغي')}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer outline-none"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>ملغي</span>
                  </ContextMenu.Item>
                </ContextMenu.SubContent>
              </ContextMenu.Portal>
            </ContextMenu.Sub>
          )}

          {onDelete && (
            <>
              <ContextMenu.Separator className="h-px bg-stone-100 dark:bg-stone-800 my-1" />
              <ContextMenu.Item
                onClick={onDelete}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer outline-none transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف السجل</span>
              </ContextMenu.Item>
            </>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
