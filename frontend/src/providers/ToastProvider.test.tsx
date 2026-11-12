import { act, fireEvent, render, screen } from '@testing-library/react';
import { useToast } from '@/hooks/useToast';
import { ToastProvider } from './ToastProvider';

function ToastTrigger() {
  const toast = useToast();
  return (
    <div>
      <button
        type="button"
        onClick={() => toast.success('Reading added!', 'Reading added')}
      >
        Trigger Green
      </button>
      <button
        type="button"
        onClick={() => toast.danger('Reading deleted!', 'Reading deleted')}
      >
        Trigger Red
      </button>
      <button
        type="button"
        onClick={() => toast.info('Reading updated!', 'Reading updated')}
      >
        Trigger Blue
      </button>
    </div>
  );
}

describe('ToastProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders bottom-right green, red, and blue toasts and auto-closes after 5 seconds', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    const region = screen.getByLabelText('Notifications');
    expect(region).toHaveStyle({
      position: 'fixed',
      bottom: '1.25rem',
      right: '1.25rem',
    });

    fireEvent.click(screen.getByRole('button', { name: /trigger green/i }));
    fireEvent.click(screen.getByRole('button', { name: /trigger red/i }));
    fireEvent.click(screen.getByRole('button', { name: /trigger blue/i }));

    const statuses = screen.getAllByRole('status');
    expect(statuses[0]).toHaveAttribute('data-toast-variant', 'success');
    expect(statuses[1]).toHaveAttribute('data-toast-variant', 'danger');
    expect(statuses[2]).toHaveAttribute('data-toast-variant', 'info');

    act(() => {
      jest.advanceTimersByTime(4800);
    });
    expect(screen.getByText('Reading added!')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByText('Reading added!')).not.toBeInTheDocument();
    expect(screen.queryByText('Reading deleted!')).not.toBeInTheDocument();
    expect(screen.queryByText('Reading updated!')).not.toBeInTheDocument();
  });
});
