module Api
  class SearchRequestsController < BaseController
    DEFAULT_FILTERS = {
      tag_ids: [],
      exclude_tag_ids: [],
      take: 10,
      page: 1
    }

    def index
      # ───────────── pagination params ─────────────
      page     = (params[:page]     || 1).to_i
      per_page = (params[:per_page] || 10).to_i.clamp(1, 50)

      # ───────────── query current user’s requests ─────────────
      search_requests = current_user
        .search_requests
        .includes(recommendations: :steam_app)
        .order(created_at: :desc)
        .page(page)
        .per(per_page)

      # ───────────── render JSON ─────────────
      render json: {
        data: search_requests.as_json(
          include: {
            recommendations: {
              include: { steam_app: { only: %i[appid name header_image] } }
            }
          }
        ),
        meta: {
          current_page: search_requests.current_page,
          total_pages:  search_requests.total_pages,
          total_count:  search_requests.total_count,
          per_page:     search_requests.limit_value
        }
      }
    end

    def show
      search_request = current_user.search_requests.includes(recommendations: :steam_app).find(params[:id])
      render json: search_request.as_json(
          include: {
            recommendations: {
              include: { steam_app: { only: %i[appid name header_image] } }
            }
          }
        )
    end
    
    def update
      search_request = current_user.search_requests.find(params[:id])
      search_request.update!(params.permit(:name))
      render json: search_request
    end

    def create
      allowed_filters = params
        .fetch(:filters, {})
        .permit(
          tag_ids: [],
          exclude_tag_ids: [],
        )

      filters = DEFAULT_FILTERS.merge(allowed_filters.to_h.deep_symbolize_keys)

      filters[:tag_ids] = filters[:tag_ids] & QlooRecommendation::WHITELIST_TAGS if filters[:tag_ids]
      filters[:exclude_tag_ids] = filters[:exclude_tag_ids] & QlooRecommendation::WHITELIST_TAGS if filters[:exclude_tag_ids]

      raw_filters = params.fetch(:filters, {})

      # Get Qloo entities from user seeds via steam_apps
      qloo_entities = current_user.user_seeds
        .includes(:steam_app)
        .map(&:steam_app)
        .compact
        .map(&:qloo_entity)
        .compact
        .sort

      # Deterministic sort of nested filter structure
      def deep_sort_hash(obj)
        case obj
        when Hash then obj.sort.to_h.transform_values { |v| deep_sort_hash(v) }
        when Array then obj.map { |v| deep_sort_hash(v) }
        else obj
        end
      end

      sorted_filters = deep_sort_hash(raw_filters)

      # Generate MD5 hash from Qloo entity list and sorted filters
      require 'digest'
      hash_input = { qloo_entities: qloo_entities, filters: sorted_filters }.to_json
      search_hash = Digest::MD5.hexdigest(hash_input)

      # Return existing search request if user already made it
      if (existing = current_user.search_requests.find_by(search_hash: search_hash))
        render json: existing.as_json(include: :recommendations)
        return
      end

      search_request = current_user.search_requests.create!(
        name:            params[:name],    
        seed_entity_ids: current_user.user_seeds.pluck(:appid),
        filters:         filters,
        search_hash:     search_hash
      )

      # --- run Qloo immediately ---
      recs = QlooRecommendation.insights(search_request.qloo_entities, **search_request.filters.symbolize_keys)

      seed_appids = search_request.seed_entity_ids.map(&:to_i)
      recs.reject! { |r| seed_appids.include?(r[:steam].to_i) }

      # 1. Filter out records with missing steam IDs
      recs.reject! { |r| r[:steam].to_i == 0 }

      # 1b. Fetch valid SteamApp appids in one query
      valid_appids = SteamApp.where(appid: recs.map { |r| r[:steam].to_i }).pluck(:appid).to_set
      
      # 1c. Reject recs not in SteamApp (e.g. purged or removed)
      recs = recs.select { |r| valid_appids.include?(r[:steam].to_i) }


      # 2. Gather all explainability hashes into one flat hash
      #    (e.g., {"uuid1" => 0.51, "uuid2" => 0.49, ...})
      explainability_uuids = recs.flat_map { |r| r[:explainability].keys }.uniq

      # 3. Look up qloo_entity -> name from SteamApps
      qloo_to_name = SteamApp
        .where(qloo_entity: explainability_uuids)
        .pluck(:qloo_entity, :name)
        .map { |qloo_entity, name| [qloo_entity.downcase, name] }
        .to_h
        
      recommendation_rows = recs.each_with_index.map do |rec, idx|
        appid = rec[:steam]
        score = rec[:affinity]

        original_explainability = rec[:explainability] || {}
        translated_explainability = original_explainability.each_with_object({}) do |(entity_id, value), h|
          if (translated_name = qloo_to_name[entity_id.downcase])
            h[translated_name] = value
          end
        end

        next if translated_explainability.blank?

        {
          search_request_id: search_request.id,
          appid:             appid,
          rank:              idx + 1,
          qloo_score:        score,
          explainability:    translated_explainability,
          raw_qloo:          rec,
          created_at:        Time.current,
          updated_at:        Time.current
        }
      end.compact.take(5)

      inserted = Recommendation.insert_all(recommendation_rows, returning: %i[id appid])
      language = params[:language].in?(RecommendationExplanation::LANGUAGES) ? params[:language] : 'en'

      # inserted.each do |row|
      #   PrefetchExplanation.perform_later(row["id"], language)
      # end

      render json: search_request.as_json(
          include: {
            recommendations: {
              include: { steam_app: { only: %i[appid name header_image] } }
            }
          }
        )
    end
  end
end