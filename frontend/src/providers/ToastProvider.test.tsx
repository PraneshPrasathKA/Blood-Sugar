import { act, fireEvent, render, screen } from '@testing-library/react';
import { useToast } from '@/hooks/useToast';
import { ToastProvider } from './ToastProvider';

function ToastTrigger() {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => toast.success('Reading saved!')}
    >
      Trigger Toast
    </button>
  );
}

describe('ToastProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows a toast and automatically closes it after 5 seconds', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /trigger toast/i }));
    expect(screen.getByText('Reading saved!')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4800);
    });
    expect(screen.getByText('Reading saved!')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByText('Reading saved!')).not.toBeInTheDocument();
  });
});

