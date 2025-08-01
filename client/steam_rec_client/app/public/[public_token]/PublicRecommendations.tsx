'use client'
import { useState, useEffect } from 'react'
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  SearchRequest,
  RecommendationExplanation,
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
  SupportedLanguage
} from '@/types'
import { 
  Share, 
  Copy,
  Facebook,
  Twitter,
  Home
} from 'lucide-react'
import { AnimatedCard } from '@/app/components/ui/animated-card'
import { LoadingOverlay } from '@/app/components/ui/loading-overlay'
import { useToast } from '@/app/components/ui/toast'
import { RecommendationHeader, RecommendationList } from '@/app/components/recommendation-components'
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/app/components/language-switcher';

/* ────────────────────────────────────────────────────────────────────────────
   🔸 NEW COMPONENT – compact grid of seed games
   --------------------------------------------------------------------------- */
interface SeedGamesListProps {
  seeds: {
    appid:       number
    name:        string
    header_image?: string
  }[]
}

function SeedGamesList ({ seeds }: SeedGamesListProps) {
  if (seeds.length === 0) return null

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
      {seeds.map(seed => (
        <a
          key={seed.appid}
          href={`https://store.steampowered.com/app/${seed.appid}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105"
        >
          {/* image */}
          <img
            src={seed.header_image}
            alt={seed.name}
            className="w-full h-32 object-cover"
          />
          {/* overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <p className="text-white text-sm font-semibold text-center px-2">
              {seed.name}
            </p>
          </div>
        </a>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   🔸 PAGE COMPONENT
   --------------------------------------------------------------------------- */
const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

export default function PublicRecommendations() {
  const { t, i18n } = useTranslation();

  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const publicToken = params?.public_token as string
  
  const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Active recommendation for explanation
  const [activeRecommendation, setActiveRecommendation] = useState<number | null>(null)
  const [explanations, setExplanations] = useState<Record<string, RecommendationExplanation>>({})
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en')
  const [explanationLoading, setExplanationLoading] = useState<number | null>(null)
  const hasMultipleSeeds = (searchRequest?.seed_entity_ids?.length ?? 0) >= 2

  useEffect(() => {
    const lng = i18n.language.split('-')[0] as SupportedLanguage;
    if (lng !== selectedLanguage) setSelectedLanguage(lng);
  }, [i18n.language]);

  /* ─────────── DATA LOAD ─────────── */
  useEffect(() => {
    if (!publicToken) return
    loadPublicRequest()
  }, [publicToken])

  const loadPublicRequest = async () => {
    try {
      const res = await fetch(`${API}/api/share/${publicToken}`)
      
      if (!res.ok) {
        setError(res.status === 404 ? t('dashboard.errors.recommendation_not_found') : t('dashboard.errors.failed_to_load_recommendations'))
        return
      }
      
      const data = await res.json()
      setSearchRequest(data)
    } catch (err) {
      setError(t('dashboard.errors.failed_to_load_recommendations'))
      console.error('Error loading public request:', err)
    } finally {
      setLoading(false)
    }
  }

  /* ─────────── EXPLANATION LOAD ─────────── */
  const loadExplanation = async (
    recommendationId: number,
    locale: SupportedLanguage = 'en'
  ) => {
    if (!publicToken) return

    setExplanationLoading(recommendationId)
    try {
      const res = await fetch(
        `${API}/api/share/${publicToken}/recommendations/${recommendationId}/explanation?locale=${locale}`
      )

      if (res.ok) {
        const raw = await res.json()
        const normalised: RecommendationExplanation = { ...raw, explanation: raw.text }

        setExplanations(prev => ({
          ...prev,
          [`${recommendationId}-${locale}`]: normalised,
        }))
      } else {
        showToast({ type: 'error', title: t('dashboard.errors.failed_to_load_analysis.title') })
      }
    } catch (err) {
      console.error('Failed to load explanation:', err)
      showToast({ type: 'error', title: t('dashboard.errors.failed_to_load_analysis.title'), message: t('dashboard.errors.failed_to_load_analysis.message') })
    } finally {
      setExplanationLoading(null)
    }
  }

  const toggleRecommendation = (recommendationId: number) => {
    if (activeRecommendation === recommendationId) {
      setActiveRecommendation(null)
    } else {
      setActiveRecommendation(recommendationId)
      if (!explanations[`${recommendationId}-${selectedLanguage}`]) {
        loadExplanation(recommendationId, selectedLanguage)
      }
    }
  }

  /* ─────────── SHARE UTILS (unchanged) ─────────── */
  const shareOnTwitter = () => { /* … unchanged … */ }
  const shareOnFacebook = () => { /* … unchanged … */ }
  const copyLink        = () => { /* … unchanged … */ }

  /* ─────────── RENDER STATES ─────────── */
  if (loading) {
    return <LoadingOverlay isVisible={true} message={t('dashboard.messages.loading_recommendations')} />
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center">
        <AnimatedCard className="p-8 text-center max-w-md">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{error}</h1>
          <p className="text-gray-600 mb-6">{t('dashboard.errors.recommendations_missing')}</p>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mx-auto"
          >
            <Home size={16} />
            {t('dashboard.messages.go_home')}
          </button>
        </AnimatedCard>
      </div>
    )
  }
  if (!searchRequest) return null

  const seedGames = searchRequest.seeds ?? []

  const createdAt =
  searchRequest?.created_at
    ? new Date(searchRequest.created_at).toLocaleDateString(i18n.language, {
        year:  'numeric',
        month: 'long',
        day:   'numeric',
      })
    : null;

  /* ─────────── MAIN RENDER ─────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <header className="relative bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        
        <div className="relative max-w-5xl mx-auto px-6 py-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center space-y-4"
          >
            {/* Main title with enhanced styling */}
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                🎮 {t('home.title')}
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
            </div>

            {/* Description with better typography */}
            <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium leading-relaxed">
              {t('home.description')}
            </p>

            {/* Metadata section */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100/80 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 font-medium">
                  {t('dashboard.messages.generated_on_datestring', {date: createdAt})}
                </span>
              </div>

              {/* Language selector with enhanced styling */}
              <Suspense fallback={
                <div className="w-24 h-8 bg-gray-200 animate-pulse rounded-lg"></div>
              }>
                <div className="transform hover:scale-105 transition-transform duration-200">
                  <LanguageSwitcher />
                </div>
              </Suspense>
            </div>
          </motion.div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 🔸 NEW SEED GAMES SECTION */}
        {seedGames.length > 0 && (
          <AnimatedCard className="p-6 mb-6" delay={0.15}>
            <h2 className="text-xl font-semibold text-center mb-4">{t('dashboard.messages.your_seed_games')}</h2>
            <SeedGamesList seeds={seedGames} />
          </AnimatedCard>
        )}

        {/* Recommendations */}
        <AnimatedCard className="p-6" delay={0.3}>
          <RecommendationHeader
            currentRequest={searchRequest}
            onShareTwitter={shareOnTwitter}
            onShareFacebook={shareOnFacebook}
            onCopyPublicLink={copyLink}
            showEditControls={false}
          />
          
          <RecommendationList
            currentRequest={searchRequest}
            activeRecommendation={activeRecommendation}
            explanations={explanations}
            explanationLoading={explanationLoading}
            selectedLanguage={selectedLanguage}
            hasMultipleSeeds={hasMultipleSeeds}
            onToggleRecommendation={toggleRecommendation}
            onLoadExplanation={loadExplanation}
          />
        </AnimatedCard>

        {/* Footer CTA */}
        <AnimatedCard className="p-6 text-center" delay={0.5}>
          <h3 className="text-lg font-semibold mb-2">{t('dashboard.messages.call_to_action.title')}</h3>
          <p className="text-gray-600 mb-4">{t('dashboard.messages.call_to_action.message')}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
          >
            {t('dashboard.messages.get_started')}
          </button>
        </AnimatedCard>
      </main>
    </div>
  )
}
