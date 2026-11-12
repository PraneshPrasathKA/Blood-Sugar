'use client';

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  showToast: (input: {
    title?: string;
    message: string;
    variant?: ToastVariant;
    duration?: number;
  }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION_MS = 5000;

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const closeTimer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);

    return () => {
      clearTimeout(closeTimer);
    };
  }, [toast.id, toast.duration, onDismiss]);

  const variantStyles: Record<
    ToastVariant,
    {
      container: string;
      iconWrap: string;
      bar: string;
      Icon: typeof CheckCircle2;
    }
  > = {
    success: {
      container: 'border-emerald-200 border-l-4 border-l-emerald-500 bg-white text-slate-900',
      iconWrap: 'bg-emerald-50 text-emerald-600',
      bar: 'bg-emerald-500',
      Icon: CheckCircle2,
    },
    error: {
      container: 'border-rose-200 border-l-4 border-l-rose-500 bg-white text-slate-900',
      iconWrap: 'bg-rose-50 text-rose-600',
      bar: 'bg-rose-500',
      Icon: AlertCircle,
    },
    info: {
      container: 'border-indigo-200 border-l-4 border-l-indigo-500 bg-white text-slate-900',
      iconWrap: 'bg-indigo-50 text-indigo-600',
      bar: 'bg-indigo-500',
      Icon: Info,
    },
  };

  const style = variantStyles[toast.variant];
  const Icon = style.Icon;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ animation: 'sweety-toast-enter 200ms ease-out forwards' }}
      className={cn(
        'pointer-events-auto relative overflow-hidden rounded-xl border p-4 shadow-xl',
        style.container
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            style.iconWrap
          )}
        >
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          {toast.title && (
            <p className="text-sm font-semibold text-slate-900">
              {toast.title}
            </p>
          )}
          <p className="text-sm text-slate-600">{toast.message}</p>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Close notification"
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
        <div
          className={cn('h-full origin-left', style.bar)}
          style={{
            animation: `sweety-toast-shrink ${toast.duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      title,
      message,
      variant = 'info',
      duration = DEFAULT_DURATION_MS,
    }: {
      title?: string;
      message: string;
      variant?: ToastVariant;
      duration?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [
        ...prev.slice(-3),
        { id, title, message, variant, duration },
      ]);
    },
    []
  );

  const success = useCallback(
    (message: string, title = 'Success') => {
      showToast({ title, message, variant: 'success' });
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, title = 'Error') => {
      showToast({ title, message, variant: 'error' });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, title = 'Notice') => {
      showToast({ title, message, variant: 'info' });
    },
    [showToast]
  );

  const toastContainer = (
    <div
      aria-label="Notifications"
      style={{
        position: 'fixed',
        top: '1.25rem',
        right: '1.25rem',
        zIndex: 9999,
        width: 'min(24rem, calc(100vw - 2rem))',
      }}
      className="pointer-events-none flex flex-col gap-2.5"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {mounted && typeof document !== 'undefined'
        ? createPortal(toastContainer, document.body)
        : null}
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}
