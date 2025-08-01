'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
  disableHoverOnDropdown?: boolean
}

export function AnimatedCard({ 
  children, 
  className, 
  delay = 0, 
  hover = true,
  disableHoverOnDropdown = false 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover && !disableHoverOnDropdown ? { 
        y: -4, 
        transition: { duration: 0.2 }
      } : undefined}
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100 relative",
        hover && !disableHoverOnDropdown && "hover:shadow-lg transition-shadow duration-300",
        className
      )}
      style={{ 
        // Ensure proper stacking context
        zIndex: hover && !disableHoverOnDropdown ? 'auto' : 1 
      }}
    >
      {children}
    </motion.div>
  )
}