'use client';

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Hash,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { GlucoseTrendChart } from '@/components/charts/GlucoseTrendChart';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useDailyReport,
  useMonthlyReport,
  useMonthToDateReport,
} from '@/hooks/useReports';
import { getGlucoseStatus, TIME_SLOT_LABELS } from '@/lib/constants';
import {
  formatDateRange,
  formatDisplayDate,
  getTodayDateString,
} from '@/lib/dates';
import { ReportSummary } from '@/types';

type ReportTab = 'daily' | 'month-to-date' | 'monthly';

function SummaryMetrics({
  summary,
  isLoading,
}: {
  summary?: ReportSummary;
  isLoading: boolean;
}) {
  const cards = [
    {
      label: 'Highest',
      value:
        summary?.highest !== null && summary?.highest !== undefined
          ? `${summary.highest} mg/dL`
          : '—',
      icon: ArrowUpRight,
      iconClass: 'text-rose-500',
    },
    {
      label: 'Lowest',
      value:
        summary?.lowest !== null && summary?.lowest !== undefined
          ? `${summary.lowest} mg/dL`
          : '—',
      icon: ArrowDownRight,
      iconClass: 'text-emerald-600',
    },
    {
      label: 'Average',
      value:
        summary?.average !== null && summary?.average !== undefined
          ? `${summary.average} mg/dL`
          : '—',
      icon: Activity,
      iconClass: 'text-primary',
    },
    {
      label: 'Total readings',
      value: String(summary?.count ?? 0),
      icon: Hash,
      iconClass: 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <Icon className={`h-4 w-4 ${item.iconClass}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">
                {isLoading ? '...' : item.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ReportsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');
  const defaultTab: ReportTab =
    initialTab === 'month-to-date' || initialTab === 'monthly'
      ? initialTab
      : 'daily';

  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTab, setActiveTab] = useState<ReportTab>(defaultTab);

  const dailyQuery = useDailyReport(selectedDate);
  const mtdQuery = useMonthToDateReport(selectedDate);
  const monthlyQuery = useMonthlyReport(selectedDate);

  const tabs: Array<{ id: ReportTab; label: string }> = [
    { id: 'daily', label: 'Daily' },
    { id: 'month-to-date', label: 'Month-to-date' },
    { id: 'monthly', label: 'Previous month' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Glucose Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review daily, month-to-date, and previous calendar month statistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <Label htmlFor="report-date" className="text-xs text-muted-foreground">
              Reference date
            </Label>
            <Input
              id="report-date"
              type="date"
              max={today}
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="w-auto"
            />
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Daily Report */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              Showing daily report for{' '}
              <strong className="font-medium text-foreground">
                {formatDisplayDate(selectedDate)}
              </strong>
            </span>
          </div>

          <SummaryMetrics
            summary={dailyQuery.data?.summary}
            isLoading={dailyQuery.isLoading}
          />

          <Card>
            <CardHeader>
              <CardTitle>Readings by time slot</CardTitle>
              <CardDescription>
                Individual blood glucose values logged on{' '}
                {formatDisplayDate(selectedDate)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyQuery.isLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Loading daily report...
                </p>
              ) : (dailyQuery.data?.readings.length ?? 0) === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-10 text-center">
                  <p className="text-sm font-medium text-foreground">
                    No readings for {formatDisplayDate(selectedDate)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Select another date or add a reading to populate this daily report.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {dailyQuery.data?.readings.map((reading) => {
                    const status = getGlucoseStatus(reading.glucose_value);
                    return (
                      <div
                        key={reading.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {TIME_SLOT_LABELS[reading.time_slot]}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDisplayDate(reading.reading_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-foreground">
                            {reading.glucose_value}{' '}
                            <span className="text-xs font-normal text-muted-foreground">
                              mg/dL
                            </span>
                          </span>
                          <Badge className={status.className}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Month-to-date Report */}
      {activeTab === 'month-to-date' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              Month-to-date range:{' '}
              <strong className="font-medium text-foreground">
                {mtdQuery.data
                  ? formatDateRange(
                      mtdQuery.data.range.startDate,
                      mtdQuery.data.range.endDate
                    )
                  : '...'}
              </strong>
            </span>
          </div>

          <SummaryMetrics
            summary={mtdQuery.data?.summary}
            isLoading={mtdQuery.isLoading}
          />

          <Card>
            <CardHeader>
              <CardTitle>Month-to-date trend</CardTitle>
              <CardDescription>
                Daily average blood glucose across the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mtdQuery.isLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Loading month-to-date chart...
                </p>
              ) : (
                <GlucoseTrendChart
                  data={mtdQuery.data?.dailySeries ?? []}
                  emptyMessage="No readings found in this month-to-date range."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Previous Month Report */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              Previous calendar month:{' '}
              <strong className="font-medium text-foreground">
                {monthlyQuery.data
                  ? formatDateRange(
                      monthlyQuery.data.range.startDate,
                      monthlyQuery.data.range.endDate
                    )
                  : '...'}
              </strong>
            </span>
          </div>

          <SummaryMetrics
            summary={monthlyQuery.data?.summary}
            isLoading={monthlyQuery.isLoading}
          />

          <Card>
            <CardHeader>
              <CardTitle>Previous month trend</CardTitle>
              <CardDescription>
                Daily average blood glucose for the entire previous calendar month
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyQuery.isLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Loading monthly chart...
                </p>
              ) : (
                <GlucoseTrendChart
                  data={monthlyQuery.data?.dailySeries ?? []}
                  emptyMessage="No readings recorded during the previous calendar month."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading reports...
          </div>
        }
      >
        <ReportsContent />
      </Suspense>
    </AppShell>
  );
}

