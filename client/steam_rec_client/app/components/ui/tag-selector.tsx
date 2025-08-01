'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TAG_LABELS, WHITELIST_TAGS } from '@/types'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next';

interface TagSelectorProps {
  selectedTags: string[]
  onTagChange: (tags: string[]) => void
  excludedTags: string[]
  onExcludeTagChange: (tags: string[]) => void
  className?: string
}

export function TagSelector({ 
  selectedTags, 
  onTagChange, 
  excludedTags, 
  onExcludeTagChange,
  className 
}: TagSelectorProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'include' | 'exclude'>('include')

  const currentTags = mode === 'include' ? selectedTags : excludedTags
  const otherTags = mode === 'include' ? excludedTags : selectedTags
  const handleTagToggle = mode === 'include' ? onTagChange : onExcludeTagChange

  const toggleTag = (tag: string) => {
    // Remove from other list if present
    const otherHandler = mode === 'include' ? onExcludeTagChange : onTagChange
    if (otherTags.includes(tag)) {
      otherHandler(otherTags.filter(t => t !== tag))
    }

    // Toggle in current list
    if (currentTags.includes(tag)) {
      handleTagToggle(currentTags.filter(t => t !== tag))
    } else {
      handleTagToggle([...currentTags, tag])
    }
  }

  return (
    <div className={className}>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('include')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            mode === 'include' 
              ? "bg-green-100 text-green-800 ring-2 ring-green-200" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {t('dashboard.messages.include_tags', {tag_amount: selectedTags.length})}
        </button>
        <button
          type="button"
          onClick={() => setMode('exclude')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            mode === 'exclude' 
              ? "bg-red-100 text-red-800 ring-2 ring-red-200" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {t('dashboard.messages.exclude_tags', {tag_amount: excludedTags.length})}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: mode === 'include' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: mode === 'include' ? 20 : -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <div className="text-sm text-gray-600 mb-3">
            {mode === 'include' 
              ? t('dashboard.messages.tag_selection.inclusive')
              : t('dashboard.messages.tag_selection.exclusive')
            }
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {WHITELIST_TAGS.map(tag => {
              const isSelected = currentTags.includes(tag)
              const isInOtherList = otherTags.includes(tag)
              
              return (
                <motion.button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "px-3 py-2 text-xs rounded-lg transition-all text-left",
                    isSelected && mode === 'include' && "bg-green-100 text-green-800 ring-1 ring-green-300",
                    isSelected && mode === 'exclude' && "bg-red-100 text-red-800 ring-1 ring-red-300",
                    !isSelected && !isInOtherList && "bg-gray-50 text-gray-700 hover:bg-gray-100",
                    isInOtherList && "bg-gray-200 text-gray-500 opacity-50 cursor-not-allowed"
                  )}
                  disabled={isInOtherList}
                >
                  {TAG_LABELS[tag] || tag}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}