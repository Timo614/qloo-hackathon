'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApi } from '@/hooks/useApi'
import { SteamApp, GameSearchFilters } from '@/types'
import { Search, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next';

interface EnhancedGameSearchProps {
  onGameSelect: (game: SteamApp) => void
  placeholder?: string
  className?: string
}

export function EnhancedGameSearch({ onGameSelect, placeholder, className }: EnhancedGameSearchProps) {
  const { t } = useTranslation();
  const text = placeholder ?? t('dashboard.messages.enhanced_game_search')
  
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SteamApp[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [filters, setFilters] = useState<GameSearchFilters>({})
  
  const { request, loading } = useApi()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Search games with debouncing
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        try {
          const params = new URLSearchParams({
            q: query,
            page: '1',
            per_page: '8',
            ...(filters.windows !== undefined && { windows: filters.windows.toString() }),
            ...(filters.macos !== undefined && { macos: filters.macos.toString() }),
            ...(filters.linux !== undefined && { linux: filters.linux.toString() }),
            ...(filters.required_age && { required_age: filters.required_age }),
            ...(filters.release_date_min && { release_date_min: filters.release_date_min }),
            ...(filters.release_date_max && { release_date_max: filters.release_date_max }),
          })
          
          if (filters.genre_ids?.length) {
            filters.genre_ids.forEach(id => params.append('genre_ids[]', id))
          }
          if (filters.category_ids?.length) {
            filters.category_ids.forEach(id => params.append('category_ids[]', id))
          }

          const data = await request(`/api/steam_apps?${params}`)
          setResults(data.items || data)
          setIsOpen(true)
          setSelectedIndex(-1)
        } catch (error) {
          console.error('Search failed:', error)
          setResults([])
        }
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, filters, request])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleGameSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleGameSelect = (game: SteamApp) => {
    onGameSelect(game)
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  const clearFilters = () => {
    setFilters({})
  }

  const activeFilterCount = Object.values(filters).filter(v => 
    v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
  ).length

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="space-y-3">
        {/* Main Search Input */}
        <div className="relative">
          <div className="absolute left-3 top-3.5 text-gray-400">
            <Search size={20} />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={text}
            className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true)
            }}
          />
          
          <div className="absolute right-3 top-3 flex items-center gap-2">
            {loading && (
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            )}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "relative p-1 rounded hover:bg-gray-100 transition",
                activeFilterCount > 0 && "bg-blue-100 text-blue-600"
              )}
            >
              <Filter size={16} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 rounded-lg p-4 border"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-900">{t('dashboard.filters.search_filters')}</h3>
                <div className="flex gap-2">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      {t('dashboard.filters.clear_filters')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Platform Support */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('dashboard.messages.platform_support')}</label>
                  <div className="space-y-2">
                    {[
                      { key: 'windows', label: t('dashboard.labels.windows') },
                      { key: 'macos', label: t('dashboard.labels.macOS') },
                      { key: 'linux', label: t('dashboard.labels.linux') }
                    ].map(platform => (
                      <label key={platform.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters[platform.key as keyof GameSearchFilters] as boolean || false}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            [platform.key]: e.target.checked || undefined
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{platform.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Age Rating & Release Date */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.messages.max_age_rating')}</label>
                    <select
                      value={filters.required_age || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, required_age: e.target.value || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">{t('dashboard.labels.age.any')}</option>
                      <option value="0">{t('dashboard.labels.age.everyone')}</option>
                      <option value="13">{t('dashboard.labels.age.teen')}</option>
                      <option value="17">{t('dashboard.labels.age.mature')}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.labels.from_year')}</label>
                      <input
                        type="number"
                        placeholder="2020"
                        min="1980"
                        max="2025"
                        value={filters.release_date_min || '1980'}
                        onChange={(e) => setFilters(prev => ({ ...prev, release_date_min: e.target.value || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm min-w-[80px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.labels.to_year')}</label>
                      <input
                        type="number"
                        placeholder="2024"
                        min="1980"
                        max="2025"
                        value={filters.release_date_max || '2025'}
                        onChange={(e) => setFilters(prev => ({ ...prev, release_date_max: e.target.value || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm min-w-[80px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Results Dropdown - Fixed positioning and z-index */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto"
            style={{
              // Ensure it overlays properly even in constrained containers
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
            }}
          >
            {results.map((game, index) => (
              <motion.div
                key={game.appid}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-3 cursor-pointer transition-all",
                  index === selectedIndex 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-50'
                )}
                onClick={() => handleGameSelect(game)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center gap-3">
                  {game.header_image && (
                    <motion.img
                      src={game.header_image}
                      alt={game.name}
                      className="w-26 h-12 object-cover rounded flex-shrink-0" // Changed from w-16 h-10
                      whileHover={{ scale: 1.05 }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 truncate">
                      {game.name}
                    </h3>
                    {game.short_description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {game.short_description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}