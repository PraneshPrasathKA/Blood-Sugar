'use client';

import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DeleteReadingDialog } from '@/components/readings/DeleteReadingDialog';
import { ReadingForm } from '@/components/readings/ReadingForm';
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
import { DatePicker } from '@/components/ui/date-picker';
import {
  useCreateReading,
  useDeleteReading,
  useReadings,
} from '@/hooks/useReadings';
import { useToast } from '@/hooks/useToast';
import { getGlucoseStatus, TIME_SLOT_LABELS } from '@/lib/constants';
import { formatDisplayDate, getTodayDateString } from '@/lib/dates';
import { ApiError } from '@/services/api';
import { Reading, TimeSlot } from '@/types';

export default function ReadingsPage() {
  const toast = useToast();
  const today = getTodayDateString();
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [formDate, setFormDate] = useState(today);
  const [addError, setAddError] = useState<string | null>(null);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);
  const [deletingReading, setDeletingReading] = useState<Reading | null>(null);

  const readingsQuery = useReadings({
    page,
    limit: 12,
    ...(dateFilter ? { date: dateFilter } : {}),
  });

  // Query readings for the currently active form date so slot auto-selection
  // and already-logged badges are accurate for any chosen date.
  const slotContextQuery = useReadings({ date: formDate, limit: 10 });

  const createMutation = useCreateReading();
  const deleteMutation = useDeleteReading();

  const readings = readingsQuery.data?.readings ?? [];
  const pagination = readingsQuery.data?.pagination;

  const handleAddReading = async (values: {
    reading_date: string;
    time_slot: TimeSlot;
    glucose_value: number;
  }) => {
    setAddError(null);
    try {
      await createMutation.mutateAsync(values);
      toast.success('Reading added successfully.', 'Reading added');
    } catch (error) {
      if (error instanceof ApiError) {
        setAddError(error.message);
        toast.error(error.message, 'Validation error');
      } else {
        const msg = 'Unable to save reading. Please try again.';
        setAddError(msg);
        toast.error(msg);
      }
    }
  };

  const handleConfirmDelete = async (reading: Reading) => {
    try {
      await deleteMutation.mutateAsync(reading.id);
      setDeletingReading(null);
      toast.danger('Reading deleted successfully.', 'Reading deleted', 'trash');
    } catch {
      toast.error('Failed to delete reading. Please try again.');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Reading Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, review, update, or remove your daily blood glucose entries (up to 4 slots per day).
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Add Reading Form Panel */}
          <Card className="lg:col-span-4 h-fit">
            <CardHeader>
              <CardTitle>Log a reading</CardTitle>
              <CardDescription>
                Choose a date, meal slot, and glucose value in mg/dL.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReadingForm
                existingReadingsForDate={slotContextQuery.data?.readings ?? []}
                defaultDate={dateFilter || today}
                isSubmitting={createMutation.isPending}
                serverError={addError}
                onDateChange={setFormDate}
                onSubmit={handleAddReading}
              />
            </CardContent>
          </Card>

          {/* Reading History Table */}
          <Card className="lg:col-span-8">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Reading history</CardTitle>
                <CardDescription>
                  {pagination
                    ? `${pagination.total} total reading(s)`
                    : 'Your logged entries'}
                </CardDescription>
              </div>

              <DatePicker
                value={dateFilter}
                maxDate={today}
                clearable
                placeholder="Filter by date"
                ariaLabel="Filter by date"
                onChange={(nextDate) => {
                  setDateFilter(nextDate);
                  if (nextDate) setFormDate(nextDate);
                  setPage(1);
                }}
                className="w-full sm:w-52"
              />
            </CardHeader>

            <CardContent>
              {readingsQuery.isLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading readings...
                </div>
              ) : readings.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                  <ClipboardList className="mb-2 h-8 w-8 text-muted-foreground/60" />
                  <p className="text-sm font-medium text-foreground">
                    {dateFilter
                      ? `No readings found for ${formatDisplayDate(dateFilter)}`
                      : 'No readings recorded yet'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use the form on the left to record a blood glucose reading.
                  </p>
                </div>
              ) : (
                <>
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
                        {readings.map((reading) => {
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
                                    aria-label={`Edit ${TIME_SLOT_LABELS[reading.time_slot]} reading on ${reading.reading_date}`}
                                    onClick={() => setEditingReading(reading)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Delete ${TIME_SLOT_LABELS[reading.time_slot]} reading on ${reading.reading_date}`}
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

                  {pagination && pagination.totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
                      <p className="text-xs text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page >= pagination.totalPages}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ReadingFormDialog
        open={Boolean(editingReading)}
        onOpenChange={(open) => !open && setEditingReading(null)}
        editingReading={editingReading}
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
