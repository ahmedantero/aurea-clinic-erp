import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Sector,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';

export interface DonutDataItem {
  name: string;
  value: number;
  count?: number;
}

export interface InteractiveDonutChartProps {
  data: DonutDataItem[];
  height?: number | string;
  palette?: string[];
  className?: string;
  title?: string;
}

const DEFAULT_PALETTE = [
  '#0f3b2c', // Royal Deep Emerald
  '#10b981', // Vivid Emerald
  '#f59e0b', // Champagne Gold
  '#0d9488', // Teal
  '#d97706', // Warm Amber
  '#6366f1', // Indigo Accent
  '#ec4899', // Rose Pink
  '#8b5cf6', // Soft Violet
];

// ── Active Shape Renderer for Pop-Out Effect & Animated Center Text ──────────
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;

  const percentFormatted = (percent * 100).toFixed(1);
  const formattedValue = Number(value).toLocaleString('ar-EG');

  return (
    <g>
      {/* Dynamic Glow Filter definition */}
      <defs>
        <filter id="activeSliceGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={fill} floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Pop-out Scaled Active Slice */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="rgba(255, 255, 255, 0.7)"
        strokeWidth={3}
        filter="url(#activeSliceGlow)"
        className="transition-all duration-300"
      />

      {/* Outer Halo Accent Ring */}
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 14}
        outerRadius={outerRadius + 17}
        fill={fill}
        opacity={0.85}
      />

      {/* Center Dynamic Label: Category Name */}
      <text
        x={cx}
        y={cy - 12}
        textAnchor="middle"
        className="fill-stone-900 dark:fill-stone-100 font-black text-xs sm:text-sm tracking-tight"
        style={{ pointerEvents: 'none' }}
      >
        {payload.name}
      </text>

      {/* Center Dynamic Label: Formatted Value */}
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        className="fill-stone-950 dark:fill-white font-mono font-extrabold text-xs"
        style={{ pointerEvents: 'none' }}
      >
        {formattedValue} ج.م
      </text>

      {/* Center Dynamic Label: Percentage Badge */}
      <text
        x={cx}
        y={cy + 26}
        textAnchor="middle"
        className="fill-emerald-700 dark:fill-emerald-300 font-bold text-[11px]"
        style={{ pointerEvents: 'none' }}
      >
        {percentFormatted}% من الإجمالي
      </text>
    </g>
  );
};

export const InteractiveDonutChart: React.FC<InteractiveDonutChartProps> = ({
  data,
  height = 320,
  palette = DEFAULT_PALETTE,
  className = '',
}) => {
  // Default to 0 index if data is present
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const fallbackData: DonutDataItem[] = [
    { name: 'تسويق وإعلانات', value: 12500 },
    { name: 'خامات ومستهلكات سبا', value: 9800 },
    { name: 'إيجار ومرافق', value: 18000 },
    { name: 'صيانة وأجهزة', value: 4300 },
    { name: 'نثريات وضيافة', value: 2900 },
  ];

  const chartData = data && data.length > 0 ? data : fallbackData;
  const totalAmount = chartData.reduce((sum, item) => sum + (item.value || 0), 0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className={`w-full flex flex-col md:flex-row items-center justify-between gap-6 ${className}`} dir="rtl">
      {/* 1. Interactive Donut Chart Container */}
      <div className="relative w-full md:w-3/5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              {...({
                activeIndex,
                activeShape: renderActiveShape,
              } as any)}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={98}
              dataKey="value"
              onMouseEnter={onPieEnter}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
              className="cursor-pointer outline-none"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`donut-cell-${index}`}
                  fill={palette[index % palette.length]}
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Interactive Synchronized Legend with Hover Highlighting */}
      <div className="w-full md:w-2/5 space-y-2 select-none">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200/50 dark:border-white/10 mb-2">
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400">التصنيف</span>
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400">المبلغ / النسبة</span>
        </div>

        <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin pr-1">
          {chartData.map((item, index) => {
            const isSelected = activeIndex === index;
            const itemColor = palette[index % palette.length];
            const percent = totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) : 0;

            return (
              <motion.div
                key={`legend-${index}`}
                onMouseEnter={() => setActiveIndex(index)}
                whileHover={{ scale: 1.02 }}
                className={`p-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-between border ${
                  isSelected
                    ? 'bg-white/80 dark:bg-stone-800/80 shadow-md border-emerald-500/40 ring-1 ring-emerald-400/30'
                    : 'bg-white/25 dark:bg-stone-900/25 border-transparent hover:bg-white/50 dark:hover:bg-stone-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full transition-transform duration-200 shadow-xs"
                    style={{
                      backgroundColor: itemColor,
                      transform: isSelected ? 'scale(1.3)' : 'scale(1)',
                      boxShadow: isSelected ? `0 0 8px ${itemColor}` : 'none',
                    }}
                  />
                  <span
                    className={`text-xs transition-colors ${
                      isSelected
                        ? 'font-black text-stone-900 dark:text-stone-100'
                        : 'font-semibold text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>

                <div className="text-left font-mono">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {Number(item.value).toLocaleString('ar-EG')} ج.م
                  </span>
                  <span className="text-[10px] text-stone-400 block">
                    {percent}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InteractiveDonutChart;
