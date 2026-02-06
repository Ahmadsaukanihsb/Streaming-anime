import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Toast Types
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 pr-8 shadow-lg transition-all",
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

// Icons for each variant
const toastIcons = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
}

// Toast Data Structure
export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success" | "warning"
  duration?: number
  action?: React.ReactNode
}

// Individual Toast Component
function Toast({
  id,
  title,
  description,
  variant = "default",
  onDismiss,
  action,
}: ToastProps & { onDismiss: (id: string) => void }) {
  const Icon = toastIcons[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(toastVariants({ variant }))}
    >
      <div className="flex items-start gap-3 w-full">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {title && <div className="font-semibold text-sm">{title}</div>}
          {description && (
            <div className="text-sm opacity-90 mt-0.5">{description}</div>
          )}
          {action && <div className="mt-2">{action}</div>}
        </div>
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="absolute right-2 top-2 p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

// Toast Context
interface ToastContextType {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, "id">) => string
  dismissToast: (id: string) => void
  updateToast: (id: string, toast: Partial<ToastProps>) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = React.useCallback(
    (toast: Omit<ToastProps, "id">) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast = { ...toast, id, duration: toast.duration || 5000 }
      
      setToasts((prev) => [...prev, newToast])

      // Auto dismiss
      if (newToast.duration > 0) {
        setTimeout(() => {
          dismissToast(id)
        }, newToast.duration)
      }

      return id
    },
    [dismissToast]
  )

  const updateToast = React.useCallback(
    (id: string, toast: Partial<ToastProps>) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...toast } : t))
      )
    },
    []
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast, updateToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast {...toast} onDismiss={dismissToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// Custom Hook
export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Convenience functions
export function toast(options: Omit<ToastProps, "id">) {
  // This will be used outside React components
  // We need to export the toast function from a singleton
  if (typeof window !== "undefined" && (window as any).__toast) {
    return (window as any).__toast.addToast(options)
  }
  console.warn("Toast not initialized")
  return ""
}

toast.success = (title: string, description?: string) => {
  return toast({ title, description, variant: "success" })
}

toast.error = (title: string, description?: string) => {
  return toast({ title, description, variant: "destructive" })
}

toast.warning = (title: string, description?: string) => {
  return toast({ title, description, variant: "warning" })
}

toast.info = (title: string, description?: string) => {
  return toast({ title, description, variant: "default" })
}

// Make toast globally available
export function initGlobalToast(toastContext: ToastContextType) {
  if (typeof window !== "undefined") {
    (window as any).__toast = toastContext
  }
}
