'use client'
import { useState, useEffect, useCallback } from 'react'
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'
import { useProfile } from '@/hooks/useProfile'
import { WaitlistScreen } from '@/app/components/waitlist-screen'
import { useToast } from '@/app/components/ui/toast'
import { 
  SteamApp, 
  UserSeed, 
  SearchRequest, 
  Recommendation, 
  RecommendationExplanation, 
  SearchFilters,
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
  SupportedLanguage
} from '@/types'
import { LanguageSwitcher } from '@/app/components/language-switcher';

// Components
import { AnimatedCard } from '@/app/components/ui/animated-card'
import { LoadingOverlay } from '@/app/components/ui/loading-overlay'
import { TagSelector } from '@/app/components/ui/tag-selector'
import { EnhancedGameSearch } from '@/app/components/enhanced-game-search'
import { SearchHistory } from '@/app/components/search-history'
import { RecommendationHeader, RecommendationList } from '@/app/components/recommendation-components'

// Icons
import { 
  Search, 
  LogOut,
  Gamepad2,
  Sparkles,
  Filter,
  Lock,
  AlertCircle
} from 'lucide-react'

export default function Dashboard({ initialRequestId }: { initialRequestId?: string } = {}) {
  const router = useRouter()
  const { user, token, loading: authLoading, logout } = useAuth()
  const { request, loading: apiLoading } = useApi()
  const { profile, loading: profileLoading } = useProfile()
  const { showToast } = useToast()
  
  // State
  const [userSeeds, setUserSeeds] = useState<UserSeed[]>([])
  const [currentRequest, setCurrentRequest] = useState<SearchRequest | null>(null)
  const [searchHistoryRefresh, setSearchHistoryRefresh] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en')
  const [loading, setLoading] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState('')
  
  // Constants
  const MAX_SEEDS = 5
  const isAtSeedLimit = userSeeds.length >= MAX_SEEDS

  const { t, i18n } = useTranslation();

  const [seedError, setSeedError] = useState<string | null>(null)
  useEffect(() => {
    if (!seedError) return;
    const id = setTimeout(() => setSeedError(null), 5000);
    return () => clearTimeout(id);
  }, [seedError]);

  // Filters state
  const [filters, setFilters] = useState<SearchFilters>({
    tag_ids: [],
    exclude_tag_ids: [],
  })

  // Recommendation state
  const [activeRecommendation, setActiveRecommendation] = useState<number | null>(null)
  const [explanations, setExplanations] = useState<Record<string, RecommendationExplanation>>({})
  const [explanationLoading, setExplanationLoading] = useState<number | null>(null)
  const hasMultipleSeeds = (currentRequest?.seed_entity_ids?.length ?? 0) >= 2

  useEffect(() => {
    const lng = i18n.language.split('-')[0] as SupportedLanguage;
    if (lng !== selectedLanguage) setSelectedLanguage(lng);
  }, [i18n.language]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && (!user || !token)) {
      router.push('/')
    }
  }, [user, token, authLoading, router])

  // Load initial data
  useEffect(() => {
    if (user && token && profile?.approved) {
      loadUserSeeds()
    }
  }, [user, token, profile])

  useEffect(() => {
    if (!initialRequestId || !user || !token) return;

    if (!currentRequest || currentRequest.id !== Number(initialRequestId)) {
      (async () => {
        try {
          const data = await request(`/api/search_requests/${initialRequestId}`);
          setCurrentRequest(data);
        } catch (e) {
          console.error('Failed to hydrate request from URL', e);
        }
      })();
    }
  }, [initialRequestId, user, token]);

  const loadUserSeeds = async () => {
    try {
      const data = await request('/api/user_seeds')
      setUserSeeds(data || [])
    } catch (error) {
      console.error('Failed to load seeds:', error)
    }
  }

  const addGameToSeeds = async (game: SteamApp) => {
    if (isAtSeedLimit) {
      return;
    }
    
    try {
      setSeedError(null) 
      await request('/api/user_seeds', {
        method: 'POST',
        body: { appid: game.appid }
      })
      await loadUserSeeds()
    } catch (raw) {
      let err: any = raw
      try {
        if (raw instanceof Error && typeof raw.message === 'string') {
          err = { ...err, ...(JSON.parse(raw.message)) }
        }
      } catch { }

      if (err?.error_type === 'unsupported_qloo') {
        setSeedError(err.error ?? t('dashboard.errors.unsupported_qloo'))
      } else {
        setSeedError(t('dashboard.errors.generic_failed'))
      }
    }
  }

  const removeSeed = async (appid: number) => {
    try {
      await request(`/api/user_seeds/${appid}`, { method: 'DELETE' })
      setUserSeeds(seeds => seeds.filter(s => s.appid !== appid))
    } catch (error) {
      console.error(t('dashboard.errors.failed_to_remove_seed'))
    }
  }

  const createSearchRequest = async () => {
    if (userSeeds.length === 0) {
      // Replace alert with toast
      showToast({
        type: 'warning',
        title: t('dashboard.errors.create_search_request.title'),
        message: t('dashboard.errors.create_search_request.message')
      })
      return
    }
    
    setLoading(true)
    try {
      const requestData = await request('/api/search_requests', {
        method: 'POST',
        body: {
          name: searchName.trim() || undefined,
          filters,
          language: selectedLanguage
        }
      })
      
      setCurrentRequest(requestData)
      setSearchName('')
      window.history.replaceState({}, '', `/dashboard/${requestData.id}`);
      setSearchHistoryRefresh(prev => prev + 1)
    } catch (error) {
      console.error('Failed to create search request:', error)
      
      // Replace alert with toast
      showToast({
        type: 'error',
        title: t('dashboard.errors.recommendation_failure.title'),
        message: t('dashboard.errors.recommendation_failure.message')
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSearchRequestName = async (requestId: number, newName: string) => {
    try {
      const updatedRequest = await request(`/api/search_requests/${requestId}`, {
        method: 'PATCH',
        body: { name: newName.trim() || null }
      })
      
      if (currentRequest && currentRequest.id === requestId) {
        setCurrentRequest(prevRequest => ({
          ...prevRequest,
          ...updatedRequest
        }))
      }
      
      setSearchHistoryRefresh(prev => prev + 1)
    } catch (error) {
      console.error('Failed to update search request name:', error)
      
      // Replace alert with toast
      showToast({
        type: 'error',
        title: t('dashboard.errors.update_name_failure.title'),
        message: t('dashboard.errors.update_name_failure.message')
      })
    }
  }

  const startEditingName = () => {
    setEditingName(currentRequest?.name || '')
    setIsEditingName(true)
  }

  const saveEditedName = async () => {
    if (!currentRequest) return
    
    await updateSearchRequestName(currentRequest.id, editingName)
    setIsEditingName(false)
  }

  const cancelEditingName = () => {
    setIsEditingName(false)
    setEditingName('')
  }

  const loadExplanation = async (recommendationId: number, locale: SupportedLanguage = 'en') => {
    if (!currentRequest) return
    
    setExplanationLoading(recommendationId)
    try {
      const explanation = await request(
        `/api/search_requests/${currentRequest.id}/recommendations/${recommendationId}/explanation?locale=${locale}`
      )
      
      setExplanations(prev => ({
        ...prev,
        [`${recommendationId}-${locale}`]: {
          ...explanation,
          explanation: explanation.text
        }
      }))
    } catch (error) {
      console.error('Failed to load explanation:', error)
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

  const getPublicUrl = (req: SearchRequest | null) => {
    if (req?.public_token) {
      const locale   = i18n.language.split('-')[0];
      const slug     = `/public/${req.public_token}`;
      const linkPath = locale === 'en' ? slug : `/${locale}${slug}`;
      return `${window.location.origin}${linkPath}`
    } else {
      return window.location.href   
    }
  }

  const generatePublicLink = async () => {
    if (!currentRequest) return

    try {
      const requestData = await request(`/api/search_requests/${currentRequest.id}`)
      if (requestData.public_token) {
        const publicUrl = getPublicUrl(requestData)
        await navigator.clipboard.writeText(publicUrl)
        
        // Replace the alert with toast
        showToast({
          type: 'success',
          title: t('dashboard.success.public_link_copied.title'),
          message: t('dashboard.success.public_link_copied.message')
        })
      }
    } catch (error) {      
      // Show error toast instead of alert
      showToast({
        type: 'error',
        title: t('dashboard.errors.copy_link_failure.title'),
        message: t('dashboard.errors.copy_link_failure.message')
      })
    }
  }

  const shareToTwitter = () => {
    if (!currentRequest) return

    const gameNames = currentRequest.recommendations
      ?.slice(0, 3)
      .map(rec => rec.steam_app?.name)
      .filter(Boolean)
      .join(', ')

    const text = t('dashboard.share.tweet_text', { game_names: gameNames })
    const url = getPublicUrl(currentRequest)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`

    window.open(twitterUrl, '_blank', 'width=550,height=420')
  }

  const shareToFacebook = () => {
    if (!currentRequest) return

    const url = getPublicUrl(currentRequest)
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(facebookUrl, '_blank')
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Show loading if checking auth
  if (authLoading || profileLoading) {
    return <LoadingOverlay isVisible={true} message={t('dashboard.messages.loading')} />
  }

  // Unauthenticated
  if (!user || !token) {
    return null
  }

  // Not yet approved
  if (profile && !profile.approved) {
    return <WaitlistScreen email={user.email} />
  }

  return (
    <>
      <LoadingOverlay isVisible={loading} message={t('dashboard.messages.getting_recommendations')} />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">

              {/* ─────────────────────── left side logo ─────────────────────── */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <Gamepad2 className="text-blue-600" size={28} />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('home.title')}               {/* e.g. "Arcade Augur" */}
                </h1>
              </motion.div>

              {/* ─────────────────────── right side controls ─────────────────────── */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
              >
                {/* language selector */}
                <Suspense fallback={null}>
                  <LanguageSwitcher />
                </Suspense>

                {/* welcome text */}
                <span className="text-sm text-gray-600">
                  {t('header.welcome', { email: user?.email }) }
                </span>

                {/* sign-out button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut size={16} />
                  {t('auth.signOut')}
                </button>
              </motion.div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Game Search */}
              <AnimatedCard className="p-6 overflow-visible" delay={0.1} disableHoverOnDropdown={true}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Search className="text-blue-600" size={20} />
                  {t('dashboard.messages.search_games')}
                </h2>
                {seedError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{seedError}</p>
                    </div>
                  </motion.div>
                )}
                {/* Seed Limit Warning */}
                {isAtSeedLimit && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <Lock className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">
                          {t('dashboard.errors.max_seeds', { max_seeds: MAX_SEEDS }) }
                        </p>
                        <p className="text-xs">
                          {t('dashboard.messages.seed_limit')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div className={`relative z-50 ${isAtSeedLimit ? 'opacity-50 pointer-events-none' : ''}`}>
                  <EnhancedGameSearch onGameSelect={addGameToSeeds} />
                  {isAtSeedLimit && (
                    <div className="absolute inset-0 bg-gray-200/50 rounded-lg flex items-center justify-center">
                      <div className="bg-white px-3 py-1 rounded-full shadow-sm border flex items-center gap-2 text-sm text-gray-600">
                        <Lock size={14} />
                        {t('dashboard.messages.seed_limit_full')}
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedCard>

              {/* User Seeds */}
              <AnimatedCard className="p-6" delay={0.2}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="text-purple-600" size={20} />
                  {t('dashboard.messages.game_profile', { max_seeds: MAX_SEEDS, user_seeds: userSeeds.length }) }
                </h2>
                
                {userSeeds.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Gamepad2 className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">{t('dashboard.messages.add_games_message') }</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {userSeeds.map((seed, index) => (
                        <motion.div
                          key={seed.appid}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="group flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                        >
                          {seed.steam_app.header_image && (
                            <motion.img
                              src={seed.steam_app.header_image}
                              alt={seed.steam_app.name}
                              className="w-28 h-12 object-cover rounded flex-shrink-0"
                              whileHover={{ scale: 1.05 }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-gray-900 truncate">
                              {seed.steam_app.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {t('dashboard.messages.usage_amount', { seed_hits: seed.hits }) }
                            </p>
                          </div>
                          <button
                            onClick={() => removeSeed(seed.appid)}
                            className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200 transition-all flex-shrink-0"
                          >
                          {t('dashboard.messages.remove')}
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </AnimatedCard>

              {/* Search Filters & Options */}
              <AnimatedCard className="p-6" delay={0.3}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Filter className="text-green-600" size={20} />
                  {t('dashboard.messages.search_options')}
                </h2>
                
                <div className="space-y-4">
                  {/* Search Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dashboard.messages.search_name')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('dashboard.placeholder.search_name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                    />
                  </div>

                  {/* Tag Selection */}
                  <TagSelector
                    selectedTags={filters.tag_ids}
                    onTagChange={(tags) => setFilters(prev => ({ ...prev, tag_ids: tags }))}
                    excludedTags={filters.exclude_tag_ids}
                    onExcludeTagChange={(tags) => setFilters(prev => ({ ...prev, exclude_tag_ids: tags }))}
                  />
                  
                  {/* Generate Button */}
                  <motion.button
                    onClick={createSearchRequest}
                    disabled={userSeeds.length === 0 || loading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles size={16} />
                    {loading ? t('dashboard.messages.getting_recommendations') : t('dashboard.messages.get_recommendations')}
                  </motion.button>
                </div>
              </AnimatedCard>

              {/* Search History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <SearchHistory
                  onRequestSelect={(req: SearchRequest) => {
                    setCurrentRequest(req);
                    window.history.replaceState({}, '', `/dashboard/${req.id}`);
                  }}
                  onRequestUpdate={updateSearchRequestName}
                  triggerRefresh={searchHistoryRefresh}
                />
              </motion.div>
            </div>

            {/* Right Column - Recommendations */}
            <div className="lg:col-span-2">
              <AnimatedCard className="p-6" delay={0.5}>
                <RecommendationHeader
                  currentRequest={currentRequest}
                  isEditingName={isEditingName}
                  editingName={editingName}
                  onStartEdit={startEditingName}
                  onSaveName={saveEditedName}
                  onCancelEdit={cancelEditingName}
                  onEditNameChange={setEditingName}
                  onShareTwitter={shareToTwitter}
                  onShareFacebook={shareToFacebook}
                  onCopyPublicLink={generatePublicLink}
                  showEditControls={true}
                />
                
                <RecommendationList
                  currentRequest={currentRequest}
                  activeRecommendation={activeRecommendation}
                  explanations={explanations}
                  explanationLoading={explanationLoading}
                  selectedLanguage={selectedLanguage}
                  hasMultipleSeeds={hasMultipleSeeds}
                  onToggleRecommendation={toggleRecommendation}
                  onLoadExplanation={loadExplanation}
                />
              </AnimatedCard>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}