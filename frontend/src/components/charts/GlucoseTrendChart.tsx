'use client';

import { TrendingUp } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDisplayDate, formatShortDate } from '@/lib/dates';
import { DailySeriesPoint } from '@/types';

interface GlucoseTrendChartProps {
  data: DailySeriesPoint[];
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
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md">
      <p className="text-xs font-semibold text-foreground">
        {formatDisplayDate(point.reading_date)}
      </p>
      <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
        <p className="flex items-center justify-between gap-4">
          <span>Daily average:</span>
          <span className="font-semibold text-primary">{point.average} mg/dL</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span>Highest:</span>
          <span className="font-medium text-foreground">{point.highest} mg/dL</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span>Lowest:</span>
          <span className="font-medium text-foreground">{point.lowest} mg/dL</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span>Readings:</span>
          <span className="font-medium text-foreground">{point.count}</span>
        </p>
      </div>
    </div>
  );
}

export function GlucoseTrendChart({
  data,
  emptyMessage = 'No readings recorded in this period yet.',
}: GlucoseTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 text-center">
        <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground/60" />
        <p className="text-sm font-medium text-foreground">No trend data yet</p>
        <p className="mt-1 text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 16, left: 4, bottom: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
          <ReferenceLine
            y={70}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{
              value: '70',
              position: 'right',
              fill: '#94a3b8',
              fontSize: 11,
            }}
          />
          <ReferenceLine
            y={140}
            stroke="#a5b4fc"
            strokeDasharray="4 4"
            label={{
              value: '140',
              position: 'right',
              fill: '#6366f1',
              fontSize: 11,
            }}
          />
          <Line
            type="monotone"
            dataKey="average"
            name="Average Glucose"
            stroke="#5b4fe9"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#5b4fe9', strokeWidth: 2, stroke: '#ffffff' }}
            activeDot={{ r: 6, fill: '#4338ca' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

