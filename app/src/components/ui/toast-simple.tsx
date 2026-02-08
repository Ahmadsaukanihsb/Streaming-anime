import * as React from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Simple toast without framer-motion for better performance
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 pr-8 shadow-lg transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-[#1A1A2E]/95 text-white",
        destructive: "border-red-500/20 bg-red-500/10 text-red-400",
        success: "border-green-500/20 bg-green-500/10 text-green-400",
        warning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const toastIcons = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
}

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: keyof typeof toastIcons
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
    
    // Auto remove after duration
    setTimeout(() => {
      removeToast(id)
    }, toast.duration || 3000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Viewport */}
      <div className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] w-full">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.variant || "default"]
          return (
            <div
              key={toast.id}
              className={cn(
                toastVariants({ variant: toast.variant }),
                "animate-slide-in-right"
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  {toast.title && (
                    <div className="text-sm font-semibold">{toast.title}</div>
                  )}
                  {toast.description && (
                    <div className="text-sm opacity-90">{toast.description}</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Note: Use useToast hook in components instead of global toast function
// Example: const { addToast } = useToast();
