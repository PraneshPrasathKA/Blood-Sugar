'use client';

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
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
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import {
  useDailyReport,
  useMonthlyReport,
  useMonthToDateReport,
} from '@/hooks/useReports';
import {
  getAverageRangeAssessment,
  getGlucoseStatus,
  getHighestRangeAssessment,
  getLowestRangeAssessment,
  TIME_SLOT_LABELS,
} from '@/lib/constants';
import {
  formatDateRange,
  formatDisplayDate,
  getTodayDateString,
  isCompletedMonthRange,
} from '@/lib/dates';
import { cn } from '@/lib/utils';
import { ReportSummary } from '@/types';

type ReportTab = 'daily' | 'month-to-date' | 'monthly';

function SummaryMetrics({
  summary,
  isLoading,
  isCompletedPeriod = false,
}: {
  summary?: ReportSummary;
  isLoading: boolean;
  isCompletedPeriod?: boolean;
}) {
  const highAssessment = getHighestRangeAssessment(summary?.highest);
  const lowAssessment = getLowestRangeAssessment(summary?.lowest);
  const avgAssessment = getAverageRangeAssessment(summary?.average);
  const spread =
    summary?.highest !== null &&
    summary?.highest !== undefined &&
    summary?.lowest !== null &&
    summary?.lowest !== undefined
      ? summary.highest - summary.lowest
      : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Highest Card */}
      <Card className="relative overflow-hidden">
        <div className="h-1 w-full bg-rose-400/80" />
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Highest
          </CardTitle>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {isLoading
                ? '...'
                : summary?.highest !== null && summary?.highest !== undefined
                  ? `${summary.highest} mg/dL`
                  : '—'}
            </span>
            {!isLoading && (
              <Badge className={highAssessment.badgeClassName}>
                {highAssessment.label}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {highAssessment.detail}
          </p>
        </CardContent>
      </Card>

      {/* Lowest Card */}
      <Card
        className={cn(
          'relative overflow-hidden',
          lowAssessment.isLowWarning && 'border-amber-300 bg-amber-50/40'
        )}
      >
        <div
          className={cn(
            'h-1 w-full',
            lowAssessment.isLowWarning ? 'bg-amber-500' : 'bg-emerald-500/80'
          )}
        />
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Lowest
          </CardTitle>
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              lowAssessment.isLowWarning
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-50 text-emerald-600'
            )}
          >
            <ArrowDownRight className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {isLoading
                ? '...'
                : summary?.lowest !== null && summary?.lowest !== undefined
                  ? `${summary.lowest} mg/dL`
                  : '—'}
            </span>
            {!isLoading && (
              <Badge className={lowAssessment.badgeClassName}>
                {lowAssessment.label}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {lowAssessment.detail}
          </p>
        </CardContent>
      </Card>

      {/* Average Card */}
      <Card
        className={cn(
          'relative overflow-hidden',
          avgAssessment.isLowWarning && 'border-amber-300 bg-amber-50/40'
        )}
      >
        <div
          className={cn(
            'h-1 w-full',
            avgAssessment.isLowWarning ? 'bg-amber-500' : 'bg-indigo-500/80'
          )}
        />
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Average
          </CardTitle>
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              avgAssessment.isLowWarning
                ? 'bg-amber-100 text-amber-700'
                : 'bg-indigo-50 text-indigo-600'
            )}
          >
            {avgAssessment.isLowWarning ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
          </span>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {isLoading
                ? '...'
                : summary?.average !== null && summary?.average !== undefined
                  ? `${summary.average} mg/dL`
                  : '—'}
            </span>
            {!isLoading && (
              <Badge className={avgAssessment.badgeClassName}>
                {avgAssessment.label}
              </Badge>
            )}
          </div>
          <p
            className={cn(
              'text-xs',
              avgAssessment.isLowWarning
                ? 'font-medium text-amber-800'
                : 'text-muted-foreground'
            )}
          >
            {avgAssessment.detail}
          </p>
        </CardContent>
      </Card>

      {/* Total Readings & Spread Card */}
      <Card
        className={cn(
          'relative overflow-hidden',
          isCompletedPeriod && 'border-teal-200 bg-teal-50/30'
        )}
      >
        <div
          className={cn(
            'h-1 w-full',
            isCompletedPeriod ? 'bg-teal-500' : 'bg-slate-400/70'
          )}
        />
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total readings
          </CardTitle>
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              isCompletedPeriod
                ? 'bg-teal-100 text-teal-700'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Hash className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {isLoading ? '...' : String(summary?.count ?? 0)}
            </span>
            {isCompletedPeriod && (
              <Badge className="border-teal-200 bg-teal-50 text-teal-800">
                Finalized
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {spread !== null
              ? `High–Low spread: ${spread} mg/dL`
              : 'Target zone: 70–140 mg/dL'}
          </p>
        </CardContent>
      </Card>
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

  const mtdRange = mtdQuery.data?.range;
  const mtdCompleted = mtdRange
    ? isCompletedMonthRange(mtdRange.startDate, mtdRange.endDate)
    : false;

  const monthlyRange = monthlyQuery.data?.range;
  const monthlyCompleted = monthlyRange
    ? isCompletedMonthRange(monthlyRange.startDate, monthlyRange.endDate)
    : true;

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

        <div className="space-y-1.5 sm:w-56">
          <Label htmlFor="report-date" className="text-xs text-muted-foreground">
            Reference date
          </Label>
          <DatePicker
            id="report-date"
            ariaLabel="Reference date"
            value={selectedDate}
            maxDate={today}
            onChange={(nextDate) => {
              if (nextDate) setSelectedDate(nextDate);
            }}
          />
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
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>
                Month-to-date range:{' '}
                <strong className="font-medium text-foreground">
                  {mtdRange
                    ? formatDateRange(mtdRange.startDate, mtdRange.endDate)
                    : '...'}
                </strong>
              </span>
            </div>
            {mtdCompleted && (
              <Badge className="gap-1 border-teal-200 bg-teal-50 text-teal-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Full month completed
              </Badge>
            )}
          </div>

          <SummaryMetrics
            summary={mtdQuery.data?.summary}
            isLoading={mtdQuery.isLoading}
            isCompletedPeriod={mtdCompleted}
          />

          <Card>
            <CardHeader>
              <CardTitle>
                {mtdCompleted
                  ? 'Completed month trend'
                  : 'Month-to-date trend'}
              </CardTitle>
              <CardDescription>
                Daily average, high, and low blood glucose across the selected period
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
                  range={mtdRange}
                  overallAverage={mtdQuery.data?.summary.average}
                  isCompletedMonth={mtdCompleted}
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
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" />
              <span>
                Previous calendar month:{' '}
                <strong className="font-medium text-foreground">
                  {monthlyRange
                    ? formatDateRange(
                        monthlyRange.startDate,
                        monthlyRange.endDate
                      )
                    : '...'}
                </strong>
              </span>
            </div>
            <Badge className="gap-1 border-teal-200 bg-teal-50 text-teal-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed month · Finalized
            </Badge>
          </div>

          <SummaryMetrics
            summary={monthlyQuery.data?.summary}
            isLoading={monthlyQuery.isLoading}
            isCompletedPeriod={monthlyCompleted}
          />

          <Card className="border-teal-200/80">
            <CardHeader>
              <CardTitle>Completed month trend</CardTitle>
              <CardDescription>
                Finalized daily average, high, and low blood glucose for the entire previous calendar month
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
                  range={monthlyRange}
                  overallAverage={monthlyQuery.data?.summary.average}
                  isCompletedMonth={monthlyCompleted}
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
