'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApi } from '@/hooks/useApi'
import { useAuth } from '@/hooks/useAuth'
import { SearchRequest } from '@/types'
import { Clock, Share, Eye, Edit2, Check, X } from 'lucide-react'
import { AnimatedCard } from './ui/animated-card'
import { formatDate } from '@/utils/formatting'
import { useToast } from '@/app/components/ui/toast'
import { useTranslation } from 'react-i18next'

interface SearchHistoryProps {
  onRequestSelect: (request: SearchRequest) => void
  onRequestUpdate: (requestId: number, newName: string) => Promise<void>
  triggerRefresh: number
}

export function SearchHistory({
  onRequestSelect,
  onRequestUpdate,
  triggerRefresh,
}: SearchHistoryProps) {
  const { t, i18n } = useTranslation()
  const [requests, setRequests] = useState<SearchRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const { request } = useApi()
  const { token, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && token) {
      setLoading(true)
      ;(async () => {
        try {
          // Paginated JSON: { data: SearchRequest[], meta: {...} }
          const res = await request('/api/search_requests')
          setRequests(Array.isArray(res.data) ? res.data : [])
        } catch (error) {
          console.error('Failed to load search history:', error)
          setRequests([])
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [triggerRefresh, authLoading, token, request])

  const { showToast } = useToast()      // inside the component body

  const copyPublicLink = async (publicToken: string) => {
    const locale   = i18n.language.split('-')[0];
    const slug     = `/public/${publicToken}`;
    const linkPath = locale === 'en' ? slug : `/${locale}${slug}`;
    const url = `${window.location.origin}${linkPath}`

    try {
      await navigator.clipboard.writeText(url)

      showToast({
        type: 'success',
        title: t('dashboard.success.public_link_copied.title'),
        message: t('dashboard.success.public_link_copied.message'),
      })
    } catch (error) {
      console.error('Failed to copy link:', error)

      showToast({
        type: 'error',
        title: t('dashboard.errors.copy_link_failure.title'),
        message: t('dashboard.errors.copy_link_failure.message'),
      })
    }
  }

  const startEditing = (requestId: number, currentName: string) => {
    setEditingId(requestId)
    setEditingName(currentName || '')
  }

  const saveEdit = async (requestId: number) => {
    try {
      await onRequestUpdate(requestId, editingName)
      
      // Update local state immediately for better UX
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? { ...req, name: editingName.trim() || undefined }
            : req
        )
      )
      
      setEditingId(null)
      setEditingName('')
    } catch (error) {
      console.error('Failed to update name:', error)
      // Keep editing mode open on error
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  if (loading) {
    return (
      <AnimatedCard className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </AnimatedCard>
    )
  }

  if (requests.length === 0) {
    return (
      <AnimatedCard className="p-6">
        <div className="text-center text-gray-500">
          <Clock className="mx-auto mb-2" size={24} />
          <p className="text-sm">{t('dashboard.messages.no_search_history')}</p>
        </div>
      </AnimatedCard>
    )
  }

  return (
    <AnimatedCard className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock size={20} />
        {t('dashboard.messages.recent_searches')}
      </h3>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        <AnimatePresence>
          {requests.map((req, index) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={`group p-3 border border-gray-200 rounded-lg transition-all ${
                editingId === req.id 
                  ? 'border-blue-300 bg-blue-50/50' 
                  : 'hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer'
              }`}
              onClick={() => editingId !== req.id && onRequestSelect(req)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  {editingId === req.id ? (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="font-medium text-gray-900 text-sm bg-white border border-gray-300 rounded px-2 py-1 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('dashboard.placeholder.enter_search_name')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(req.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          saveEdit(req.id)
                        }}
                        className="p-1 text-green-600 hover:bg-green-100 rounded transition"
                        title={t('dashboard.messages.save_name')}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          cancelEdit()
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition"
                        title={t('dashboard.messages.cancel_editing')}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {req.name || t('dashboard.placeholder.search_fallback', {rec_id: req.id})}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(req.id, req.name || '')
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded transition-all"
                        title={t('dashboard.messages.edit_name')}
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mb-1">
                    {formatDate(req.created_at)}
                  </p>
                  {req.recommendations && (
                    <p className="text-xs text-blue-600">
                      {t('dashboard.messages.recommendation_number', {recommendation_amount: req.recommendations.length})}
                    </p>
                  )}
                </div>

                <div className={`flex items-center gap-1 transition-opacity ${
                  editingId === req.id 
                    ? 'opacity-0 pointer-events-none' 
                    : 'opacity-0 group-hover:opacity-100'
                }`}>
                  {req.public_token && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        copyPublicLink(req.public_token!)
                      }}
                      className="p-1 rounded hover:bg-blue-100 text-blue-600 transition"
                      title={t('dashboard.share.copy_link')}
                    >
                      <Share size={14} />
                    </button>
                  )}
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      onRequestSelect(req)
                    }}
                    className="p-1 rounded hover:bg-gray-100 text-gray-600 transition"
                    title={t('dashboard.messages.view_details')}
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AnimatedCard>
  )
}