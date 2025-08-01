'use client'
import { useState } from 'react'
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeSanitize from 'rehype-sanitize'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSteam, faTwitter, faFacebook } from '@fortawesome/free-brands-svg-icons'
import { faCopy } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ExternalLink,
  Edit2,
  Check,
  X,
  Gamepad2
} from 'lucide-react'
import {
  SearchRequest,
  Recommendation,
  RecommendationExplanation,
  LANGUAGE_NAMES,
  SupportedLanguage
} from '@/types'
import { LoadingSpinner } from '@/app/components/ui/loading-spinner'

// Types for the shared components
interface RecommendationHeaderProps {
  currentRequest: SearchRequest | null
  isEditingName?: boolean
  editingName?: string
  onStartEdit?: () => void
  onSaveName?: () => void
  onCancelEdit?: () => void
  onEditNameChange?: (name: string) => void
  onShareTwitter: () => void
  onShareFacebook?: () => void
  onCopyPublicLink: () => void
  showEditControls?: boolean
}

interface RecommendationListProps {
  currentRequest: SearchRequest | null
  activeRecommendation: number | null
  explanations: Record<string, RecommendationExplanation>
  explanationLoading: number | null
  selectedLanguage: SupportedLanguage
  hasMultipleSeeds: boolean
  onToggleRecommendation: (id: number) => void
  onLoadExplanation: (id: number, locale: SupportedLanguage) => void
}

// Shared Recommendation Header Component
export function RecommendationHeader({
  currentRequest,
  isEditingName = false,
  editingName = '',
  onStartEdit,
  onSaveName,
  onCancelEdit,
  onEditNameChange,
  onShareTwitter,
  onShareFacebook,
  onCopyPublicLink,
  showEditControls = false
}: RecommendationHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex-1">
        {isEditingName && showEditControls ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editingName}
              onChange={(e) => onEditNameChange?.(e.target.value)}
              className="text-l font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none flex-1"
              placeholder={t('dashboard.placeholder.enter_search_name')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveName?.()
                if (e.key === 'Escape') onCancelEdit?.()
              }}
              autoFocus
            />
            <button
              onClick={onSaveName}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title={t('dashboard.messages.save_name')}
            >
              <Check size={20} />
            </button>
            <button
              onClick={onCancelEdit}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title={t('dashboard.messages.cancel_editing')}
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 max-w-full">
            <h2 className="text-lg font-bold text-gray-900 truncate max-w-[100%] flex-shrink">
              {currentRequest?.recommendations ? 
                (currentRequest.name || t('dashboard.messages.your_recommendations')) : 
                t('dashboard.messages.your_recommendations')
              }
            </h2>
            {showEditControls && onStartEdit && (
              <button
                onClick={onStartEdit}
                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                title={t('dashboard.messages.edit_name')}
              >
                <Edit2 size={18} />
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">{t('dashboard.messages.share')}</span>
        <button
          onClick={onShareTwitter}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          title={t('dashboard.share.twitter')}
        >
          <FontAwesomeIcon icon={faTwitter} className="w-4 h-4" />
        </button>
        
        {onShareFacebook && (
          <button
            onClick={onShareFacebook}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            title={t('dashboard.share.facebook')}
          >
            <FontAwesomeIcon icon={faFacebook} className="w-4 h-4" />
          </button>
        )}
        
        <button
          onClick={onCopyPublicLink}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          title={t('dashboard.share.copy_link')}
        >
          <FontAwesomeIcon icon={faCopy} className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Shared Recommendation List Component
export function RecommendationList({
  currentRequest,
  activeRecommendation,
  explanations,
  explanationLoading,
  selectedLanguage,
  hasMultipleSeeds,
  onToggleRecommendation,
  onLoadExplanation
}: RecommendationListProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (
      currentRequest &&
      activeRecommendation !== null &&
      explanationLoading === null        // not already fetching
    ) {
      const cacheKey = `${activeRecommendation}-${selectedLanguage}`;
      if (!explanations[cacheKey]) {
        onLoadExplanation(activeRecommendation, selectedLanguage);
      }
    }
  }, [selectedLanguage, activeRecommendation, explanations, explanationLoading, onLoadExplanation, currentRequest]);

  if (!currentRequest) {
    return (
      <div className="text-center py-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Gamepad2 className="mx-auto mb-4 text-purple-500" size={48} />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            {t('dashboard.messages.ready_to_discover.header')}
          </h2>
          <p className="text-gray-500 mb-6">
            {t('dashboard.messages.ready_to_discover.text')}
          </p>
        </motion.div>
      </div>
    )
  }

  if (!currentRequest.recommendations || currentRequest.recommendations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Gamepad2 className="mx-auto mb-4 opacity-50" size={48} />
        <p>{t('dashboard.messages.no_recommendations')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {currentRequest.recommendations.map((rec, index) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            index={index}
            isActive={activeRecommendation === rec.id}
            explanation={explanations[`${rec.id}-${selectedLanguage}`]}
            isLoadingExplanation={explanationLoading === rec.id}
            selectedLanguage={selectedLanguage}
            hasMultipleSeeds={hasMultipleSeeds}
            onToggle={() => onToggleRecommendation(rec.id)}
            onLoadExplanation={() => onLoadExplanation(rec.id, selectedLanguage)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Individual Recommendation Card Component
interface RecommendationCardProps {
  recommendation: Recommendation
  index: number
  isActive: boolean
  explanation?: RecommendationExplanation
  isLoadingExplanation: boolean
  selectedLanguage: SupportedLanguage
  hasMultipleSeeds: boolean
  onToggle: () => void
  onLoadExplanation: () => void
}

function RecommendationCard({
  recommendation: rec,
  index,
  isActive,
  explanation,
  isLoadingExplanation,
  selectedLanguage,
  hasMultipleSeeds,
  onToggle,
  onLoadExplanation
}: RecommendationCardProps) {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
    >
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition"
        onClick={onToggle}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                #{rec.rank}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {rec.steam_app?.name || t('dashboard.placeholder.game_name', {appid: rec.appid})}
              </h3>
            </div>
            
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">{t('dashboard.messages.match_score')}</span>
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">
                  {(rec.qloo_score * 100).toFixed(1)}%
                </div>
              </div>
              
              {rec.steam_app?.short_description && (
                <p className="text-gray-600 text-sm leading-relaxed">
                  {rec.steam_app.short_description}
                </p>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t('dashboard.messages.similar_to_games')}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(rec.explainability).slice(0, 4).map(([game, score]) => (
                  <span key={game} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                    {game} ({(score * 100).toFixed(0)}%)
                  </span>
                ))}
                {Object.keys(rec.explainability).length > 4 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                    {t('dashboard.messages.additional_amount', {number_more: (Object.keys(rec.explainability).length - 4)})}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="ml-6 flex flex-col items-center">
            {rec.steam_app?.header_image && (
              <motion.img
                src={rec.steam_app.header_image}
                alt={rec.steam_app.name}
                className="w-42 h-20 object-cover rounded mb-3"
                whileHover={{ scale: 1.05 }}
              />
            )}
            <motion.div
              animate={{ rotate: isActive ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="text-gray-400" size={24} />
            </motion.div>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 bg-gray-50"
          >
            <div className="p-6">
              {/* Full Explainability - only show if multiple seeds */}
              {hasMultipleSeeds && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3 text-gray-800">
                    {t('dashboard.messages.suggestion_contribution')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(rec.explainability)
                      .sort(([,a], [,b]) => b - a)
                      .map(([game, score]) => (
                        <div key={game} className="flex justify-between items-center px-4 py-3 bg-white rounded-lg border">
                          <span className="font-medium text-gray-800">{game}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <motion.div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${score * 100}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-600 min-w-[3rem]">
                              {(score * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* AI Explanation */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-gray-800">
                  {t('dashboard.messages.ai_analysis', {language: LANGUAGE_NAMES[selectedLanguage]})}
                </h4>
                
                {explanation ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="prose prose-sm max-w-none text-gray-800">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        rehypePlugins={[rehypeSanitize]}
                      >
                        {explanation.explanation}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                ) : isLoadingExplanation ? (
                  <div className="p-6 bg-gray-100 rounded-lg">
                    <div className="flex items-center justify-center">
                      <LoadingSpinner className="mr-3" />
                      <span className="text-gray-600">{t('dashboard.messages.generating_analysis')}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={onLoadExplanation}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {t('dashboard.messages.generate_analysis')}
                  </button>
                )}
              </div>

              {/* Steam Link */}
              <div className="flex justify-end">
                <a
                  href={`https://store.steampowered.com/app/${rec.appid}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 
                            bg-[#171a21] text-white rounded-lg
                            hover:bg-[#1b2838] transition-colors
                            flex-shrink-0"
                  title={t('dashboard.messages.view_on_steam')}
                >
                  <FontAwesomeIcon icon={faSteam} className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}