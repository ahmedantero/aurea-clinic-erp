import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Sparkles, TrendingUp } from 'lucide-react';

export interface DailyDataPoint {
  date: string;
  dayName?: string;
  revenue: number;
  netProfit?: number;
  expenses?: number;
}

export interface ExecutiveAreaChartProps {
  data?: DailyDataPoint[];
  height?: number | string;
  className?: string;
}

// ── 1. Premium Glassmorphic Tooltip (No ugly dark boxes) ─────────────────────
export const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const currentItem = payload[0]?.payload as DailyDataPoint | undefined;
  const dayTitle = currentItem?.dayName ? `${currentItem.dayName}، ${label}` : label;

  return (
    <div
      dir="rtl"
      className="bg-white/85 dark:bg-stone-900/85 backdrop-blur-xl border border-white/60 dark:border-white/15 shadow-[0_16px_40px_rgba(15,59,44,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)] rounded-2xl p-4 min-w-[210px] select-none text-right transition-all duration-200"
    >
      {/* Header: Date + Day with luxury gold accent */}
      <div className="flex items-center justify-between gap-3 pb-2.5 mb-2.5 border-b border-stone-200/60 dark:border-white/10">
        <span className="text-xs font-black text-stone-800 dark:text-stone-100">
          {dayTitle}
        </span>
        <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Payload Entries with Emerald & Gold Glows */}
      <div className="space-y-2">
        {payload.map((entry: any, index: number) => {
          const isRevenue = entry.dataKey === 'revenue';
          const dotColor = entry.color || (isRevenue ? '#10b981' : '#f59e0b');

          return (
            <div
              key={`tooltip-entry-${index}`}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-xs"
                  style={{
                    backgroundColor: dotColor,
                    boxShadow: `0 0 8px ${dotColor}`,
                  }}
                />
                <span className="font-bold text-stone-600 dark:text-stone-300">
                  {entry.name || (isRevenue ? 'الإيرادات' : 'صافي الربح')}:
                </span>
              </div>
              <span className="font-mono font-black text-stone-900 dark:text-stone-100 text-sm">
                {Number(entry.value || 0).toLocaleString('ar-EG')}{' '}
                <span className="text-[10px] font-sans text-stone-500">ج.م</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Sample Mock Baseline if live data has 0 or 1 point ───────────────────────
const fallbackSampleData: DailyDataPoint[] = [
  { date: '10/01', dayName: 'الخميس', revenue: 4200, netProfit: 2600 },
  { date: '10/05', dayName: 'الإثنين', revenue: 7800, netProfit: 4900 },
  { date: '10/10', dayName: 'السبت', revenue: 6400, netProfit: 3800 },
  { date: '10/15', dayName: 'الخميس', revenue: 11200, netProfit: 7100 },
  { date: '10/20', dayName: 'الثلاثاء', revenue: 9500, netProfit: 6200 },
  { date: '10/25', dayName: 'الأحد', revenue: 14800, netProfit: 9400 },
  { date: '10/30', dayName: 'الجمعة', revenue: 16500, netProfit: 10800 },
];

// ── 2. The Main Executive AreaChart Component ────────────────────────────────
export const ExecutiveAreaChart: React.FC<ExecutiveAreaChartProps> = ({
  data,
  height = 320,
  className = '',
}) => {
  // Use live data if populated with 2+ points; otherwise gracefully show sample baseline
  const chartData = data && data.length > 1 ? data : fallbackSampleData;

  return (
    <div className={`w-full relative ${className}`} dir="ltr">
      <ResponsiveContainer width="100%" height={height as any}>
        <AreaChart
          data={chartData}
          margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
        >
          {/* Gradients: Top opacity 0.4 fading smoothly to 0 at bottom */}
          <defs>
            <linearGradient id="luxuryRevenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="60%" stopColor="#10b981" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>

            <linearGradient id="luxuryProfitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Clean CartesianGrid: horizontal only, faint #f3f4f6 */}
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="#f3f4f6"
            className="dark:stroke-stone-800/70"
          />

          {/* Clean XAxis without harsh borders */}
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
            dy={8}
          />

          {/* Clean YAxis without harsh borders and subtle numbers */}
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
            tickFormatter={(val) => `${Number(val).toLocaleString()}`}
            dx={-8}
          />

          {/* Interactive Hover Line & Glassmorphic Custom Tooltip */}
          <Tooltip
            cursor={{
              stroke: '#10b981',
              strokeWidth: 1.5,
              strokeDasharray: '5 5',
            }}
            content={<CustomTooltip />}
          />

          {/* Revenue Area: Fluid Curve (monotone), Emerald, Glowing Active Dot */}
          <Area
            type="monotone"
            dataKey="revenue"
            name="الإيرادات الكلية"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#luxuryRevenueGradient)"
            activeDot={{
              r: 6,
              stroke: '#10b981',
              strokeWidth: 3,
              fill: '#ffffff',
              className: 'shadow-lg',
            }}
          />

          {/* Net Profit Area: Fluid Curve (monotone), Champagne Gold */}
          <Area
            type="monotone"
            dataKey="netProfit"
            name="صافي الربح"
            stroke="#f59e0b"
            strokeWidth={2.5}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#luxuryProfitGradient)"
            activeDot={{
              r: 5,
              stroke: '#f59e0b',
              strokeWidth: 2.5,
              fill: '#ffffff',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExecutiveAreaChart;
