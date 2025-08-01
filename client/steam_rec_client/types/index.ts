export interface SteamApp {
  id: number
  appid: number
  name: string
  header_image?: string
  short_description?: string
  release_date?: string
  genres?: Array<{ name: string }>
  categories?: Array<{ name: string }>
}

export interface UserSeed {
  id: number
  appid: number
  hits: number
  last_seen: string
  steam_app: SteamApp
}

export interface Recommendation {
  id: number
  appid: number
  rank: number
  qloo_score: number
  explainability: Record<string, number>
  steam_app?: SteamApp
}

export interface SearchRequest {
  id: number
  name?: string
  created_at: string
  public_token?: string
  seed_entity_ids: string[]
  recommendations?: Recommendation[]
  seeds?: SteamApp[]
}

export interface RecommendationExplanation {
  id: number
  locale: string
  explanation: string
  created_at: string
}

export interface SearchFilters {
  tag_ids: string[]
  exclude_tag_ids: string[]
}

export interface GameSearchFilters {
  windows?: boolean
  macos?: boolean
  linux?: boolean
  required_age?: string
  release_date_min?: string
  release_date_max?: string
  genre_ids?: string[]
  category_ids?: string[]
}

export interface Profile {
  id: string                // Rails UUID (same as user.id)
  handle: string            // e-mail or custom username
  approved: boolean         // wait-list flag
  created_at: string        // ISO timestamp
  updated_at?: string       // (optional) include if your API returns it
}

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'zh', 'ja'] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  'en': 'English',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch', 
  'zh': '中文',
  'ja': '日本語'
}

export const CURRENCY_MAP: Record<SupportedLanguage, string> = {
  'en': 'USD',
  'es': 'EUR', 
  'fr': 'EUR', 
  'de': 'EUR',
  'zh': 'CNY',
  'ja': 'JPY'
}

export const WHITELIST_TAGS = [
  'urn:tag:genre:media:action',
  'urn:tag:genre:media:adventure', 
  'urn:tag:wikipedia_category:wikidata:casual_games',
  'urn:tag:wikipedia_category:wikidata:indie_games',
  'urn:tag:genre:media:mmorpg',
  'urn:tag:genre:media:racing',
  'urn:tag:genre:media:rpg',
  'urn:tag:genre:media:simulation',
  'urn:tag:genre:media:strategy',
  'urn:tag:genre:media:sports',
  'urn:tag:genre:media:tycoon',
  'urn:tag:wikipedia_category:wikidata:cooperative_video_games',
  'urn:tag:wikipedia_category:wikidata:multiplayer_single_player_video_games',
  'urn:tag:wikipedia_category:wikidata:multiplayer_video_games',
  'urn:tag:wikipedia_category:wikidata:single_player_video_games',
  'urn:tag:wikipedia_category:wikidata:linux_games',
  'urn:tag:wikipedia_category:wikidata:windows_games',
  'urn:tag:wikipedia_category:wikidata:macos_games'
] as const

export const TAG_LABELS: Record<string, string> = {
  'urn:tag:genre:media:action': 'Action',
  'urn:tag:genre:media:adventure': 'Adventure',
  'urn:tag:wikipedia_category:wikidata:casual_games': 'Casual',
  'urn:tag:wikipedia_category:wikidata:indie_games': 'Indie',
  'urn:tag:genre:media:mmorpg': 'MMORPG',
  'urn:tag:genre:media:racing': 'Racing',
  'urn:tag:genre:media:rpg': 'RPG',
  'urn:tag:genre:media:simulation': 'Simulation',
  'urn:tag:genre:media:strategy': 'Strategy',
  'urn:tag:genre:media:sports': 'Sports',
  'urn:tag:genre:media:tycoon': 'Tycoon',
  'urn:tag:wikipedia_category:wikidata:cooperative_video_games': 'Co-op',
  'urn:tag:wikipedia_category:wikidata:multiplayer_single_player_video_games': 'Single/Multi-player',
  'urn:tag:wikipedia_category:wikidata:multiplayer_video_games': 'Multiplayer',
  'urn:tag:wikipedia_category:wikidata:single_player_video_games': 'Single-player',
  'urn:tag:wikipedia_category:wikidata:linux_games': 'Linux',
  'urn:tag:wikipedia_category:wikidata:windows_games': 'Windows',
  'urn:tag:wikipedia_category:wikidata:macos_games': 'macOS'
}