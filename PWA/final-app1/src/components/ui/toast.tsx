"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "./card";
import { Button } from "./button";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(7);
      const newToast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration || 5000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "success", title, message });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "error", title, message });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "info", title, message });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "warning", title, message });
    },
    [showToast]
  );

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          bg: "from-green-50 to-emerald-50",
          border: "border-green-200",
          icon: CheckCircle,
          iconColor: "text-green-600",
        };
      case "error":
        return {
          bg: "from-red-50 to-rose-50",
          border: "border-red-200",
          icon: AlertCircle,
          iconColor: "text-red-600",
        };
      case "warning":
        return {
          bg: "from-orange-50 to-amber-50",
          border: "border-orange-200",
          icon: AlertTriangle,
          iconColor: "text-orange-600",
        };
      case "info":
        return {
          bg: "from-blue-50 to-indigo-50",
          border: "border-blue-200",
          icon: Info,
          iconColor: "text-blue-600",
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          const Icon = styles.icon;

          return (
            <Card
              key={toast.id}
              className={`border-0 shadow-2xl bg-gradient-to-br ${styles.bg} ${styles.border} fade-in`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 ${styles.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {toast.title}
                    </h4>
                    {toast.message && (
                      <p className="text-sm text-gray-600 mt-1">
                        {toast.message}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => removeToast(toast.id)}
                    size="icon"
                    variant="ghost"
                    className="flex-shrink-0 h-6 w-6"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
