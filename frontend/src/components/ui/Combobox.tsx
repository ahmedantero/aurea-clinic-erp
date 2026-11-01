import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  emptyText?: string;
  allowClear?: boolean;
}

/**
 * Normalizes Arabic text for fuzzy searching:
 * - Removes diacritics / Tashkeel
 * - Normalizes Alef forms (أ, إ, آ -> ا)
 * - Normalizes Taa Marbuta (ة -> ه)
 * - Normalizes Yaa / Alef Maksura (ي, ى -> ي)
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel & dagger alif
    .replace(/[أإآآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim();
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'اختر من القائمة...',
  searchPlaceholder = 'ابحث هنا بالاسم أو الرقم...',
  disabled = false,
  className = '',
  emptyText = 'لا توجد نتائج مطابقة',
  allowClear = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter options with normalized Arabic comparison
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const normalizedQuery = normalizeArabic(searchQuery);

    return options.filter((opt) => {
      const normLabel = normalizeArabic(opt.label);
      const normSub = opt.subLabel ? normalizeArabic(opt.subLabel) : '';
      return normLabel.includes(normalizedQuery) || normSub.includes(normalizedQuery);
    });
  }, [options, searchQuery]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full text-right ${className}`} dir="rtl">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm rounded-xl border transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-white dark:bg-stone-900'
            : 'border-stone-200/90 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 hover:bg-white dark:hover:bg-stone-900 hover:border-stone-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="truncate">
          {selectedOption ? (
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              {selectedOption.label}
              {selectedOption.subLabel && (
                <span className="text-xs text-stone-400 dark:text-stone-500 font-normal mr-2">
                  ({selectedOption.subLabel})
                </span>
              )}
            </span>
          ) : (
            <span className="text-stone-400 dark:text-stone-500">{placeholder}</span>
          )}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 text-stone-400 mr-2">
          {allowClear && selectedOption && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 transition-colors"
              title="مسح الاختيار"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute z-50 w-full mt-1.5 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-xl shadow-stone-900/10 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-2 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2 bg-stone-50/50 dark:bg-stone-950/30">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full text-xs bg-transparent text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 divide-y-0">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400">
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer text-right ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100/80 dark:hover:bg-stone-800/80'
                      }`}
                    >
                      <div className="truncate">
                        <div>{opt.label}</div>
                        {opt.subLabel && (
                          <div className="text-[11px] text-stone-400 font-normal">
                            {opt.subLabel}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 mr-2">
                        {opt.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
