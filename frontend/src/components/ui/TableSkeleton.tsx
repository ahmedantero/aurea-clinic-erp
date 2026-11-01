import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  showHeader = true,
}) => {
  return (
    <div className="w-full bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl rounded-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-xs animate-pulse">
      {showHeader && (
        <div className="bg-stone-50/80 dark:bg-stone-800/60 border-b border-stone-200/80 dark:border-stone-800 px-6 py-4 flex items-center justify-between gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={`th-${i}`}
              className="h-4 bg-stone-200 dark:bg-stone-700 rounded-md"
              style={{ width: `${Math.max(60, 100 - i * 15)}px` }}
            />
          ))}
        </div>
      )}

      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {Array.from({ length: rows }).map((_, rIndex) => (
          <div
            key={`row-${rIndex}`}
            className="px-6 py-4 flex items-center justify-between gap-4"
          >
            {Array.from({ length: columns }).map((_, cIndex) => (
              <div key={`cell-${rIndex}-${cIndex}`} className="space-y-1.5 flex-1">
                <div
                  className="h-4 bg-stone-200/80 dark:bg-stone-800 rounded-md"
                  style={{
                    width: `${Math.max(40, (cIndex % 2 === 0 ? 80 : 50) + (rIndex * 7) % 30)}%`,
                  }}
                />
                {cIndex === 0 && (
                  <div className="h-3 w-1/3 bg-stone-100 dark:bg-stone-850 rounded" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
