class QlooRecommendation
  BASE            = 'https://hackathon.api.qloo.com'.freeze
  INSIGHTS_PATH   = '/v2/insights/'.freeze
  SEARCH_PATH     = '/search'.freeze
  DEFAULT_HEADERS = { 'X-Api-Key' => ENV.fetch('QLOO_API_KEY') }.freeze
  CACHE_TTL       = 15.minutes
  WHITELIST_TAGS = [
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
  ]

  class << self
    # ───────────────────────────────────────────────────────────
    # RECOMMENDATIONS
    # ───────────────────────────────────────────────────────────
    def insights(
          seed_entity_ids,
          tag_ids:          [],
          exclude_tag_ids:  [],
          take:             10,
          page:             1
        )
      raise ArgumentError, 'seed_entity_ids cannot be empty' if seed_entity_ids.empty?

      tag_ids        = tag_ids & WHITELIST_TAGS
      exclude_tag_ids = exclude_tag_ids & WHITELIST_TAGS

      params = {
        'filter.type'               => 'urn:entity:videogame',
        'signal.interests.entities' => seed_entity_ids.join(','),
        'feature.explainability'    => true,
        'take'                      => take,
        'page'                      => page
      }
      params['filter.tags']              = tag_ids.join(',')         if tag_ids.any?
      params['filter.exclude.tags']      = exclude_tag_ids.join(',') if exclude_tag_ids.any?
      Rails.logger.debug("Calling #{INSIGHTS_PATH} with params: #{params}")

      results = get_json(INSIGHTS_PATH, params)
      entities = results.dig('results','entities')
      entities.map { QlooRecommendation.simplify(_1) }
    end

    def search(query, take: 20, page: 1)
      raise ArgumentError, 'query cannot be blank' if query.blank?

      params = {
        query:  query,
        types:  'urn:entity:videogame',
        take:   take,
        page:   page,
        'sort_by'                     => 'match',
        'operator.filter.tags'        => 'union',
        'operator.filter.exclude.tags'=> 'union'
      }
      entities = get_json(SEARCH_PATH, params)["results"]
      entities.map { QlooRecommendation.simplify(_1) }
    end

    def entity_for_steam_app(appid)
      app = SteamApp.find(appid)
      return app.qloo_entity if app.qloo_entity.present?

      candidates = search(app.name)
      return if candidates.blank?

      # ─────────────────────────────────────────────────────────────
      # 0) Prefer an explicit Steam-ID match from Qloo’s result set
      # ─────────────────────────────────────────────────────────────
      winning = candidates.find { |c| c[:steam].to_i == appid.to_i }

      # ─────────────────────────────────────────────────────────────
      # 1-2) Fallback to title-slug or description match (existing logic)
      # ─────────────────────────────────────────────────────────────
      unless winning
        normalized_app = app.name.downcase.gsub(/[^a-z0-9]/, '')

        winning = candidates.find do |c|
          # 1) exact (slug-insensitive) title match
          c[:name].downcase.gsub(/[^a-z0-9]/, '') == normalized_app ||
          # 2) description mentions the full game title
          c[:description]&.downcase&.include?(app.name.downcase)
        end
      end

      winning ||= candidates.first
      winning&.dig(:entity_id)
    end

    def simplify(entity)
      properties = entity['properties']['external'] || entity['external'] || {}
      metacritic_data = properties['metacritic']
      steam_data      = properties['steam']

      metacritic_rating =
        if metacritic_data.is_a?(Array)
          metacritic_data.dig(0, 'critic_rating')
        elsif metacritic_data.is_a?(Hash)
          metacritic_data['critic_rating']
        end

      steam_id =
        if steam_data.is_a?(Array)
          steam_data.dig(0, 'id')
        elsif steam_data.is_a?(Hash)
          steam_data['id']
        end
        
      {
        name:              entity['name'],
        entity_id:         entity['entity_id'],
        description:       entity.dig('properties', 'description'),
        short_description: entity.dig('properties', 'short_descriptions', 0, 'value') ||
                          entity.dig('properties', 'short_description'),
        tags:              (entity['tags'] || []).to_h { |t| [t['name'], t['id'] || t['tag_id']] },
        affinity:          entity.dig('query', 'affinity'),                     
        explainability:    explainability_hash(entity),                      
        metacritic:        metacritic_rating,
        steam:             steam_id.to_i
      }
    end

    def explainability_hash(entity)
      arr = entity.dig('query', 'explainability', 'signal.interests.entities') || []
      arr.index_by { _1['entity_id'] }.transform_values { _1['score'] }
    end

    private

    def get_json(path, params)
      normalized = params.transform_keys(&:to_s)
      cache_key  = "qloo:#{path}?#{normalized.to_query}"

      Rails.cache.fetch(cache_key, expires_in: CACHE_TTL) do
        uri       = URI.join(BASE, path)
        uri.query = URI.encode_www_form(params)
        res = Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
          http.get(uri, DEFAULT_HEADERS)
        end
        raise "Qloo API error #{res.code}" unless res.is_a?(Net::HTTPSuccess)
        JSON.parse(res.body)
      end
    end

    def explainability_hash(entity)
      arr = entity.dig('query','explainability','signal.interests.entities') || []
      arr.index_by { _1['entity_id'] }.transform_values { _1['score'] }
    end
  end
end
