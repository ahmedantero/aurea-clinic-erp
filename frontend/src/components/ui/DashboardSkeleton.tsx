import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 select-none" dir="rtl">
      {/* 1. Header Bar Shimmer */}
      <div className="p-6 rounded-3xl bg-white/20 dark:bg-stone-900/30 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-white/40 dark:bg-stone-800/60" />
          <div className="space-y-2">
            <div className="w-48 h-5 rounded-lg bg-white/40 dark:bg-stone-800/60" />
            <div className="w-64 h-3.5 rounded-lg bg-white/30 dark:bg-stone-800/40" />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="w-64 h-10 rounded-2xl bg-white/40 dark:bg-stone-800/60" />
          <div className="w-10 h-10 rounded-2xl bg-white/40 dark:bg-stone-800/60" />
        </div>
      </div>

      {/* 2. Top 4 Shimmering KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`kpi-skeleton-${i}`}
            className="p-6 rounded-3xl bg-white/20 dark:bg-stone-900/30 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-lg space-y-4 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-white/40 dark:bg-stone-800/60" />
              <div className="w-16 h-4 rounded-full bg-white/30 dark:bg-stone-800/40" />
            </div>
            <div className="space-y-2">
              <div className="w-32 h-7 rounded-lg bg-white/40 dark:bg-stone-800/60" />
              <div className="w-24 h-3.5 rounded-lg bg-white/30 dark:bg-stone-800/40" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Chart Shimmer Card */}
      <div className="p-6 rounded-3xl bg-white/20 dark:bg-stone-900/30 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-xl space-y-4 animate-pulse">
        <div className="flex items-center justify-between pb-4 border-b border-white/20">
          <div className="w-48 h-5 rounded-lg bg-white/40 dark:bg-stone-800/60" />
          <div className="w-24 h-6 rounded-xl bg-white/30 dark:bg-stone-800/40" />
        </div>
        <div className="h-64 rounded-2xl bg-white/15 dark:bg-stone-800/30 flex items-end p-4 gap-3">
          {[40, 65, 30, 85, 45, 90, 70, 50, 95, 60].map((heightPct, idx) => (
            <div
              key={`bar-shimmer-${idx}`}
              className="flex-1 rounded-t-xl bg-white/25 dark:bg-stone-700/30"
              style={{ height: `${heightPct}%` }}
            />
          ))}
        </div>
      </div>

      {/* 4. Table Shimmer Rows */}
      <div className="p-6 rounded-3xl bg-white/20 dark:bg-stone-900/30 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-xl space-y-3 animate-pulse">
        <div className="w-40 h-5 rounded-lg bg-white/40 dark:bg-stone-800/60 mb-2" />
        {[1, 2, 3, 4].map((row) => (
          <div
            key={`row-skeleton-${row}`}
            className="h-10 rounded-xl bg-white/25 dark:bg-stone-800/40 w-full"
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardSkeleton;
