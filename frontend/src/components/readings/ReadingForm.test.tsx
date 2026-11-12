import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getTodayDateString } from '@/lib/dates';
import { ReadingForm } from './ReadingForm';

describe('ReadingForm', () => {
  const today = getTodayDateString();

  function getFutureDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
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

  it('shows error when a future date is selected', async () => {
    const onSubmit = jest.fn();
    render(<ReadingForm defaultDate={today} onSubmit={onSubmit} />);

    const dateInput = screen.getByLabelText(/^date$/i);
    const glucoseInput = screen.getByLabelText(/glucose value/i);

    fireEvent.change(dateInput, { target: { value: getFutureDate() } });
    await userEvent.type(glucoseInput, '115');
    await userEvent.click(screen.getByRole('button', { name: /add reading/i }));

    expect(
      await screen.findByText('Date cannot be in the future.')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid reading data with parsed integer glucose value', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<ReadingForm defaultDate={today} onSubmit={onSubmit} />);

    await userEvent.selectOptions(
      screen.getByLabelText(/time slot/i),
      'AFTER_LUNCH'
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

