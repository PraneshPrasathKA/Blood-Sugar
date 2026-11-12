'use client';

import { CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  formatDateRange,
  formatDisplayDate,
  formatShortDate,
  getDaysInMonth,
} from '@/lib/dates';
import { DailySeriesPoint } from '@/types';

interface GlucoseTrendChartProps {
  data: DailySeriesPoint[];
  range?: { startDate: string; endDate: string };
  overallAverage?: number | null;
  isCompletedMonth?: boolean;
  emptyMessage?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DailySeriesPoint }>;
}

function ChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0].payload;
  const spread = point.highest - point.lowest;
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 shadow-lg">
      <p className="text-xs font-semibold text-foreground">
        {formatDisplayDate(point.reading_date)}
      </p>
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <p className="flex items-center justify-between gap-5">
          <span>Daily average:</span>
          <span className="font-semibold text-primary">
            {point.average} mg/dL
          </span>
        </p>
        <p className="flex items-center justify-between gap-5">
          <span>Daily high:</span>
          <span className="font-medium text-rose-600">
            {point.highest} mg/dL
          </span>
        </p>
        <p className="flex items-center justify-between gap-5">
          <span>Daily low:</span>
          <span className="font-medium text-emerald-700">
            {point.lowest} mg/dL
          </span>
        </p>
        <p className="flex items-center justify-between gap-5">
          <span>Daily spread:</span>
          <span className="font-medium text-foreground">{spread} mg/dL</span>
        </p>
        <p className="flex items-center justify-between gap-5 border-t border-border pt-1 mt-1">
          <span>Readings logged:</span>
          <span className="font-medium text-foreground">{point.count} / 4</span>
        </p>
      </div>
    </div>
  );
}

export function GlucoseTrendChart({
  data,
  range,
  overallAverage,
  isCompletedMonth = false,
  emptyMessage = 'No readings recorded in this period yet.',
}: GlucoseTrendChartProps) {
  const daysLogged = data.length;
  const totalDaysInMonth = range ? getDaysInMonth(range.startDate) : null;

  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 text-center">
        <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground/60" />
        <p className="text-sm font-medium text-foreground">No trend data yet</p>
        <p className="mt-1 text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const primaryLineColor = isCompletedMonth ? '#0d9488' : '#5b4fe9';
  const primaryActiveDot = isCompletedMonth ? '#0f766e' : '#4338ca';

  return (
    <div className="space-y-3">
      {/* Period Completion Indicator Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/70 px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {isCompletedMonth ? (
            <Badge className="gap-1 border-teal-200 bg-teal-50 text-teal-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed month
            </Badge>
          ) : (
            <Badge className="gap-1 border-indigo-200 bg-indigo-50 text-indigo-700">
              <Clock className="h-3.5 w-3.5" />
              In progress
            </Badge>
          )}
          {range && (
            <span className="text-muted-foreground">
              {formatDateRange(range.startDate, range.endDate)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          {totalDaysInMonth && (
            <span>
              Coverage:{' '}
              <strong className="font-medium text-foreground">
                {daysLogged} / {totalDaysInMonth} days
              </strong>
            </span>
          )}
          {overallAverage !== null && overallAverage !== undefined && (
            <span>
              Period mean:{' '}
              <strong className="font-medium text-foreground">
                {overallAverage} mg/dL
              </strong>
            </span>
          )}
          <span className="hidden sm:inline">Target zone: 70–140 mg/dL</span>
        </div>
      </div>

      <div
        className={
          isCompletedMonth
            ? 'h-80 w-full rounded-xl border border-teal-100 bg-teal-50/20 p-2'
            : 'h-80 w-full'
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 14, right: 20, left: 4, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <ReferenceArea
              y1={70}
              y2={140}
              fill="#10b981"
              fillOpacity={0.07}
              ifOverflow="extendDomain"
            />
            <XAxis
              dataKey="reading_date"
              tickFormatter={formatShortDate}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickMargin={8}
              stroke="#cbd5e1"
            />
            <YAxis
              domain={['dataMin - 15', 'dataMax + 15']}
              tick={{ fontSize: 12, fill: '#64748b' }}
              stroke="#cbd5e1"
              label={{
                value: 'mg/dL',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#64748b', fontSize: 12 },
              }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              iconType="circle"
            />
            <ReferenceLine
              y={70}
              stroke="#10b981"
              strokeOpacity={0.5}
              strokeDasharray="4 4"
            />
            <ReferenceLine
              y={140}
              stroke="#6366f1"
              strokeOpacity={0.5}
              strokeDasharray="4 4"
            />
            {isCompletedMonth &&
              overallAverage !== null &&
              overallAverage !== undefined && (
                <ReferenceLine
                  y={overallAverage}
                  stroke="#0f766e"
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  label={{
                    value: `Avg ${overallAverage}`,
                    position: 'insideTopRight',
                    fill: '#0f766e',
                    fontSize: 11,
                  }}
                />
              )}
            <Line
              type="monotone"
              dataKey="highest"
              name="Daily High"
              stroke="#f43f5e"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={{ r: 2.5, fill: '#f43f5e' }}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="average"
              name={isCompletedMonth ? 'Completed Monthly Avg' : 'Daily Average'}
              stroke={primaryLineColor}
              strokeWidth={2.75}
              dot={{
                r: 4,
                fill: primaryLineColor,
                strokeWidth: 2,
                stroke: '#ffffff',
              }}
              activeDot={{ r: 6, fill: primaryActiveDot }}
            />
            <Line
              type="monotone"
              dataKey="lowest"
              name="Daily Low"
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={{ r: 2.5, fill: '#10b981' }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
