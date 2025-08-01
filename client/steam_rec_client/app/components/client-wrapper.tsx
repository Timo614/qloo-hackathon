'use client'
import { ToastProvider } from '@/app/components/ui/toast'

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}