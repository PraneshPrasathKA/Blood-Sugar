import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getTodayDateString } from '@/lib/dates';
import { Reading } from '@/types';
import { ReadingForm } from './ReadingForm';

describe('ReadingForm', () => {
  const today = getTodayDateString();

  function buildReading(
    overrides: Partial<Reading> & { time_slot: Reading['time_slot'] }
  ): Reading {
    return {
      id: `id-${overrides.time_slot}`,
      user_id: 'user-1',
      reading_date: today,
      glucose_value: 110,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  it('shows required error when glucose value is empty', async () => {
    const onSubmit = jest.fn();
    render(<ReadingForm defaultDate={today} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /add reading/i }));

    expect(
      await screen.findByText('Please enter a glucose value.')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows range error for values below 40, above 600, and decimals', async () => {
    const onSubmit = jest.fn();
    render(<ReadingForm defaultDate={today} onSubmit={onSubmit} />);

    const input = screen.getByLabelText(/glucose value/i);
    const submitBtn = screen.getByRole('button', { name: /add reading/i });

    await userEvent.clear(input);
    await userEvent.type(input, '30');
    await userEvent.click(submitBtn);
    expect(
      await screen.findByText('Value must be between 40 and 600 mg/dl.')
    ).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, '650');
    await userEvent.click(submitBtn);
    expect(
      await screen.findByText('Value must be between 40 and 600 mg/dl.')
    ).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, '125.5');
    await userEvent.click(submitBtn);
    expect(
      await screen.findByText('Value must be between 40 and 600 mg/dl.')
    ).toBeInTheDocument();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables future dates in the custom calendar date picker', async () => {
    const onSubmit = jest.fn();
    render(<ReadingForm defaultDate={today} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /^date$/i }));

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowIso = `${yyyy}-${mm}-${dd}`;

    if (tomorrow.getMonth() === new Date().getMonth()) {
      expect(screen.getByRole('button', { name: tomorrowIso })).toBeDisabled();
    } else {
      await userEvent.click(screen.getByRole('button', { name: /next month/i }));
      expect(screen.getByRole('button', { name: tomorrowIso })).toBeDisabled();
    }
  });

  it('automatically selects the next slot after already logged readings', () => {
    const existing = [
      buildReading({ time_slot: 'MORNING_FASTING', glucose_value: 95 }),
    ];

    render(
      <ReadingForm
        defaultDate={today}
        existingReadingsForDate={existing}
        onSubmit={jest.fn()}
      />
    );

    const slotCombobox = screen.getByRole('combobox', { name: /time slot/i });
    expect(slotCombobox).toHaveTextContent('After breakfast');
  });

  it('submits valid reading using the custom time slot dropdown', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<ReadingForm defaultDate={today} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('combobox', { name: /time slot/i }));
    await userEvent.click(
      screen.getByRole('option', { name: /after lunch/i })
    );

    await userEvent.type(screen.getByLabelText(/glucose value/i), '142');
    await userEvent.click(screen.getByRole('button', { name: /add reading/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        reading_date: today,
        time_slot: 'AFTER_LUNCH',
        glucose_value: 142,
      });
    });
  });

  it('renders server validation error banners such as duplicate slot', () => {
    render(
      <ReadingForm
        defaultDate={today}
        serverError="You already have an After lunch reading for this date."
        onSubmit={jest.fn()}
      />
    );

    expect(
      screen.getByText('You already have an After lunch reading for this date.')
    ).toBeInTheDocument();
  });
});
