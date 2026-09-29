import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AlertVariant = "success" | "error" | "warning" | "info" | "confirm";

export interface AlertOptions {
  title?: string;
  message: string;
  variant?: AlertVariant;
  confirmText?: string;
  cancelText?: string;
  /** Only used for "confirm" variant. Callback for when the user presses confirm. */
  onConfirm?: () => void | Promise<void>;
}

interface AlertState extends AlertOptions {
  open: boolean;
  loading: boolean;
}

interface AlertContextValue {
  /** Show a simple alert (success / error / warning / info). Returns immediately. */
  alert: (options: AlertOptions) => void;
  /** Show a confirm dialog. Returns a Promise<boolean>. */
  confirm: (options: Omit<AlertOptions, "variant">) => Promise<boolean>;
  /** Convenience shorthands */
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AlertContext = createContext<AlertContextValue | null>(null);

// ─── Config per variant ───────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<
  AlertVariant,
  {
    icon: React.FC<{ className?: string }>;
    iconClass: string;
    headerClass: string;
    confirmClass: string;
    defaultTitle: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    headerClass: "from-emerald-50 to-transparent dark:from-emerald-950/40",
    confirmClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    defaultTitle: "Success",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-500",
    headerClass: "from-red-50 to-transparent dark:from-red-950/40",
    confirmClass: "bg-red-600 hover:bg-red-700 text-white",
    defaultTitle: "Error",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-500",
    headerClass: "from-amber-50 to-transparent dark:from-amber-950/40",
    confirmClass: "bg-amber-600 hover:bg-amber-700 text-white",
    defaultTitle: "Warning",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-500",
    headerClass: "from-blue-50 to-transparent dark:from-blue-950/40",
    confirmClass: "bg-blue-600 hover:bg-blue-700 text-white",
    defaultTitle: "Information",
  },
  confirm: {
    icon: AlertTriangle,
    iconClass: "text-amber-500",
    headerClass: "dark:from-amber-950/40",
    confirmClass: "bg-primary hover:bg-primary/90 text-white",
    defaultTitle: "Are you sure?",
  },
};

// ─── Modal Component ──────────────────────────────────────────────────────────

function AlertModal({
  state,
  onConfirm,
  onCancel,
}: {
  state: AlertState;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const variant = state.variant ?? "info";
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;
  const isConfirm = variant === "confirm";

  if (!state.open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(2px)",
      }}
      onClick={isConfirm ? undefined : onCancel}
    >
      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header Strip */}
        <div
          className={`bg-gradient-to-b ${config.headerClass} px-6 pt-6 pb-4 flex flex-col items-center gap-3`}
        >
          <div
            className={`rounded-full p-3 bg-white dark:bg-zinc-800 shadow-sm`}
          >
            <Icon className={`h-7 w-7 ${config.iconClass}`} />
          </div>
          <h2 className="text-base font-bold text-foreground text-center leading-tight">
            {state.title ?? config.defaultTitle}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 pb-2 pt-1">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {state.message}
          </p>
        </div>

        {/* Footer */}
        <div
          className={`flex gap-2 px-6 py-4 ${isConfirm ? "justify-between" : "justify-center"}`}
        >
          {isConfirm && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={state.loading}
            >
              {state.cancelText ?? "Cancel"}
            </Button>
          )}
          <Button
            className={`${isConfirm ? "flex-1" : "w-32"} ${config.confirmClass}`}
            onClick={onConfirm}
            disabled={state.loading}
          >
            {state.loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              (state.confirmText ?? (isConfirm ? "Confirm" : "OK"))
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AlertState>({
    open: false,
    loading: false,
    message: "",
  });

  // Used to resolve the Promise returned by `confirm()`
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false, loading: false }));
    resolverRef.current = null;
  }, []);

  const alert = useCallback((options: AlertOptions) => {
    setState({
      open: true,
      loading: false,
      variant: options.variant ?? "info",
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
    });
  }, []);

  const confirm = useCallback(
    (options: Omit<AlertOptions, "variant">): Promise<boolean> => {
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setState({
          open: true,
          loading: false,
          variant: "confirm",
          title: options.title,
          message: options.message,
          confirmText: options.confirmText,
          cancelText: options.cancelText,
          onConfirm: options.onConfirm,
        });
      });
    },
    [],
  );

  const success = useCallback(
    (message: string, title?: string) => {
      alert({ variant: "success", message, title });
    },
    [alert],
  );

  const error = useCallback(
    (message: string, title?: string) => {
      alert({ variant: "error", message, title });
    },
    [alert],
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      alert({ variant: "warning", message, title });
    },
    [alert],
  );

  const info = useCallback(
    (message: string, title?: string) => {
      alert({ variant: "info", message, title });
    },
    [alert],
  );

  const handleConfirm = useCallback(async () => {
    if (state.onConfirm) {
      setState((s) => ({ ...s, loading: true }));
      try {
        await state.onConfirm();
      } finally {
        setState((s) => ({ ...s, loading: false }));
      }
    }
    resolverRef.current?.(true);
    close();
  }, [state, close]);

  const handleCancel = useCallback(() => {
    resolverRef.current?.(false);
    close();
  }, [close]);

  return (
    <AlertContext.Provider
      value={{ alert, confirm, success, error, warning, info }}
    >
      {children}
      <AlertModal
        state={state}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </AlertContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used inside <AlertProvider>");
  return ctx;
}
