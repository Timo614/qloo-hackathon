'use client'
import React, { useState, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertCircle, Info } from 'lucide-react'

// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
  hideToast: (id: string) => void
}

// Toast Context
const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    setToasts(prev => [...prev, newToast])

    // Auto-hide after duration (default 4 seconds)
    setTimeout(() => {
      hideToast(id)
    }, toast.duration || 4000)
  }

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  )
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast Container Component
function ToastContainer({ toasts, onHide }: { toasts: Toast[], onHide: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onHide={onHide} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Individual Toast Item Component
function ToastItem({ toast, onHide }: { toast: Toast, onHide: (id: string) => void }) {
  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: <Check className="w-5 h-5 text-green-600" />,
          title: 'text-green-800',
          message: 'text-green-700'
        }
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: <X className="w-5 h-5 text-red-600" />,
          title: 'text-red-800',
          message: 'text-red-700'
        }
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200',
          icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
          title: 'text-amber-800',
          message: 'text-amber-700'
        }
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: <Info className="w-5 h-5 text-blue-600" />,
          title: 'text-blue-800',
          message: 'text-blue-700'
        }
    }
  }

  const styles = getToastStyles(toast.type)

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`${styles.bg} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-sm ${styles.title}`}>
            {toast.title}
          </h4>
          {toast.message && (
            <p className={`text-sm mt-1 ${styles.message}`}>
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => onHide(toast.id)}
          className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    </motion.div>
  )
}