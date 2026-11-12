'use client';

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { GlucoseTrendChart } from '@/components/charts/GlucoseTrendChart';
import { AppShell } from '@/components/layout/AppShell';
import { DeleteReadingDialog } from '@/components/readings/DeleteReadingDialog';
import { ReadingFormDialog } from '@/components/readings/ReadingFormDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteReading, useReadings } from '@/hooks/useReadings';
import { useDailyReport, useMonthToDateReport } from '@/hooks/useReports';
import { getGlucoseStatus, TIME_SLOT_LABELS } from '@/lib/constants';
import { formatDisplayDate, getTodayDateString } from '@/lib/dates';
import { Reading } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const today = getTodayDateString();

  const [formOpen, setFormOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);
  const [deletingReading, setDeletingReading] = useState<Reading | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const dailyQuery = useDailyReport(today);
  const mtdQuery = useMonthToDateReport(today);
  const recentQuery = useReadings({ page: 1, limit: 8 });
  const deleteMutation = useDeleteReading();

  const todaySummary = dailyQuery.data?.summary;
  const mtdSummary = mtdQuery.data?.summary;
  const recentReadings = recentQuery.data?.readings ?? [];

  const handleOpenAdd = () => {
    setEditingReading(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (reading: Reading) => {
    setEditingReading(reading);
    setFormOpen(true);
  };

  const handleConfirmDelete = async (reading: Reading) => {
    await deleteMutation.mutateAsync(reading.id);
    setDeletingReading(null);
    setStatusMessage('Reading deleted successfully.');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome & Quick Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back, {user?.name.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Overview for {formatDisplayDate(today)} and your month-to-date progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleOpenAdd}>
              <Plus className="h-4 w-4" />
              Add reading
            </Button>
            <Button variant="outline" asChild>
              <Link href="/reports?tab=daily">
                <Calendar className="h-4 w-4" />
                Daily report
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/reports?tab=monthly">
                <BarChart3 className="h-4 w-4" />
                Monthly report
              </Link>
            </Button>
          </div>
        </div>

        {statusMessage && (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {statusMessage}
            </span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-xs font-medium underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today&apos;s readings
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">
                {dailyQuery.isLoading ? '—' : `${todaySummary?.count ?? 0} / 4`}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {todaySummary?.count === 4
                  ? 'All daily slots logged'
                  : `${4 - (todaySummary?.count ?? 0)} slot(s) remaining today`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average glucose
              </CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">
                {mtdQuery.isLoading
                  ? '—'
                  : mtdSummary?.average !== null && mtdSummary?.average !== undefined
                    ? `${mtdSummary.average} mg/dL`
                    : 'No data'}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Month-to-date ({mtdSummary?.count ?? 0} readings)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Highest reading
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">
                {mtdQuery.isLoading
                  ? '—'
                  : mtdSummary?.highest !== null && mtdSummary?.highest !== undefined
                    ? `${mtdSummary.highest} mg/dL`
                    : 'No data'}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Month-to-date peak
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lowest reading
              </CardTitle>
              <ArrowDownRight className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">
                {mtdQuery.isLoading
                  ? '—'
                  : mtdSummary?.lowest !== null && mtdSummary?.lowest !== undefined
                    ? `${mtdSummary.lowest} mg/dL`
                    : 'No data'}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Month-to-date minimum
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Glucose Trend Chart */}
        <Card>
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Month-to-date glucose trend</CardTitle>
              <CardDescription>
                Daily average blood glucose (mg/dL) from your recorded entries
              </CardDescription>
            </div>
            <Link
              href="/reports"
              className="text-sm font-medium text-primary hover:underline"
            >
              View full reports →
            </Link>
          </CardHeader>
          <CardContent>
            {mtdQuery.isLoading ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Loading chart...
              </div>
            ) : (
              <GlucoseTrendChart
                data={mtdQuery.data?.dailySeries ?? []}
                emptyMessage="Add your first reading this month to see your glucose trend."
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Readings */}
        <Card>
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Recent readings</CardTitle>
              <CardDescription>
                Your latest logged blood glucose values
              </CardDescription>
            </div>
            <Link
              href="/readings"
              className="text-sm font-medium text-primary hover:underline"
            >
              Manage all readings →
            </Link>
          </CardHeader>
          <CardContent>
            {recentQuery.isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading readings...
              </div>
            ) : recentReadings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  No readings recorded yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add your first fasting or post-meal reading to start tracking.
                </p>
                <Button className="mt-4" size="sm" onClick={handleOpenAdd}>
                  <Plus className="h-4 w-4" />
                  Add first reading
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="py-3 pr-4 font-medium">Date</th>
                      <th className="py-3 pr-4 font-medium">Time slot</th>
                      <th className="py-3 pr-4 font-medium">Glucose</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentReadings.map((reading) => {
                      const status = getGlucoseStatus(reading.glucose_value);
                      return (
                        <tr key={reading.id} className="hover:bg-muted/30">
                          <td className="py-3 pr-4 font-medium text-foreground whitespace-nowrap">
                            {formatDisplayDate(reading.reading_date)}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                            {TIME_SLOT_LABELS[reading.time_slot]}
                          </td>
                          <td className="py-3 pr-4 font-semibold text-foreground whitespace-nowrap">
                            {reading.glucose_value} mg/dL
                          </td>
                          <td className="py-3 pr-4">
                            <Badge className={status.className}>
                              {status.label}
                            </Badge>
                          </td>
                          <td className="py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Edit reading on ${reading.reading_date}`}
                                onClick={() => handleOpenEdit(reading)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Delete reading on ${reading.reading_date}`}
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeletingReading(reading)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ReadingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingReading={editingReading}
        onSuccess={(msg) => setStatusMessage(msg)}
      />

      <DeleteReadingDialog
        reading={deletingReading}
        isDeleting={deleteMutation.isPending}
        onClose={() => setDeletingReading(null)}
        onConfirm={handleConfirmDelete}
      />
    </AppShell>
  );
}

