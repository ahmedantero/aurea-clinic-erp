import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemLabel = 'سجل',
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate intelligent page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const leftBound = Math.max(2, safeCurrentPage - 1);
      const rightBound = Math.min(totalPages - 1, safeCurrentPage + 1);

      if (leftBound > 2) pages.push('dots-left');
      for (let i = leftBound; i <= rightBound; i++) {
        pages.push(i);
      }
      if (rightBound < totalPages - 1) pages.push('dots-right');

      pages.push(totalPages);
    }
    return pages;
  }, [safeCurrentPage, totalPages]);

  if (totalItems === 0) return null;

  return (
    <div
      dir="rtl"
      className={`px-4 sm:px-6 py-3.5 bg-gradient-to-r from-stone-50/90 via-white to-stone-50/90 dark:from-stone-900/90 dark:via-stone-900 dark:to-stone-900/90 border-t border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600 dark:text-stone-300 select-none shadow-xs transition-all ${className}`}
    >
      {/* ── Left Side: Record Counters & Page Size Selector ── */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-1.5">
          <span className="text-stone-400 dark:text-stone-500">عرض</span>
          <span className="font-bold text-[#0f3b2c] dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
            {startIndex} - {endIndex}
          </span>
          <span className="text-stone-400 dark:text-stone-500">من أصل</span>
          <span className="font-extrabold text-stone-800 dark:text-stone-100 font-mono">
            {totalItems.toLocaleString()}
          </span>
          <span className="text-stone-500 dark:text-stone-400">{itemLabel}</span>
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 border-r border-stone-200 dark:border-stone-800 pr-3 mr-1">
            <span className="text-stone-400 dark:text-stone-500 text-[11px] hidden md:inline">لكل صفحة:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                onPageChange(1);
              }}
              className="bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-bold text-xs py-1 px-2.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-colors shadow-2xs"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Right Side: Navigation Buttons & Numbers ── */}
      <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
        {/* First Page (In RTL: ChevronsRight points right/forward to page 1) */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          className="p-1.5 sm:px-2 sm:py-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-stone-800 disabled:hover:text-stone-400 disabled:hover:border-stone-200 transition-all cursor-pointer shadow-2xs"
          title="الصفحة الأولى"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page (In RTL: ChevronRight points to preceding page) */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-stone-800 disabled:hover:text-stone-400 disabled:hover:border-stone-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs font-medium"
          title="الصفحة السابقة"
        >
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">السابق</span>
        </button>

        {/* Page Number Pills */}
        <div className="flex items-center gap-1 mx-0.5">
          {pageNumbers.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-stone-400 dark:text-stone-500 font-mono tracking-widest text-xs"
                >
                  •••
                </span>
              );
            }

            const isActive = p === safeCurrentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[30px] h-[30px] px-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center font-mono ${
                  isActive
                    ? 'bg-[#0f3b2c] text-white shadow-sm shadow-emerald-950/20 border border-emerald-800 scale-105'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 shadow-2xs'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page (In RTL: ChevronLeft points to next page) */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages}
          className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-stone-800 disabled:hover:text-stone-400 disabled:hover:border-stone-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs font-medium"
          title="الصفحة التالية"
        >
          <span className="hidden sm:inline text-[11px]">التالي</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Last Page (In RTL: ChevronsLeft points left/backward to last page) */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage === totalPages}
          className="p-1.5 sm:px-2 sm:py-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-stone-800 disabled:hover:text-stone-400 disabled:hover:border-stone-200 transition-all cursor-pointer shadow-2xs"
          title="الصفحة الأخيرة"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
