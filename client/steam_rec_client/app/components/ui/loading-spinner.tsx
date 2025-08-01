'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'      

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string                    
}

export function LoadingSpinner({
  size = 'md',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <motion.div
      className={cn(
        'inline-block mx-auto border-4 border-blue-500 border-t-transparent rounded-full',
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  )
}
