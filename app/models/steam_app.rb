class SteamApp < ApplicationRecord
  self.primary_key = :appid
  DEFAULT_PER_PAGE = 30

  # ─── Associations ──────────────────────────────────────────────
  has_many :user_seeds,    foreign_key: :appid, inverse_of: :steam_app, dependent: :delete_all
  has_many :user_histories,foreign_key: :appid, inverse_of: :steam_app, dependent: :delete_all
  has_many :recommendations,
           foreign_key: :appid,
           inverse_of:  :steam_app,
           dependent:   :delete_all 

  # many-to-many through link tables
  has_and_belongs_to_many :steam_categories,
    join_table: :steam_app_categories,
    association_foreign_key: :category_id,
    foreign_key: :appid

  has_and_belongs_to_many :steam_genres,
    join_table: :steam_app_genres,
    association_foreign_key: :genre_id,
    foreign_key: :appid

  has_many :steam_app_genres,     foreign_key: :appid,
                                  inverse_of:  :steam_app,
                                  dependent:   :delete_all
  has_many :steam_app_categories, foreign_key: :appid,
                                  inverse_of:  :steam_app,
                                  dependent:   :delete_all

  # ─── Validations (Rails 8) ─────────────────────────────────────
  validates :name, presence: true
  validates :appid, numericality: { only_integer: true }

  def self.ensure_qloo_entity!(appid)
    app = find(appid)
    return app if app.qloo_entity.present?

    if (entity = QlooRecommendation.entity_for_steam_app(appid))
      app.update!(qloo_entity: entity)
    end

    app
  end

  def self.parse_year_or_date(val, default_date, month, day)
    if val.present? && val.to_s =~ /\A\d{4}\z/
      Date.new(val.to_i, month, day)
    else
      # assume val is already a Date (or nil)
      val || default_date
    end
  end


  def self.search(
    query,
    windows:           nil,
    macos:             nil,
    linux:             nil,
    required_age:      nil,
    release_date_min:  nil,
    release_date_max:  nil,
    genre_ids:         nil,
    category_ids:      nil,
    page:              1,
    per:               DEFAULT_PER_PAGE
  )
    rel = all

    if per > 50
        per = 50
    end

    # -------------- name search (ILIKE + trigram order) --------------------
    if query.present?
      rel = rel
              .where("name ILIKE ?", "%#{sanitize_sql_like(query)}%")
              .order(Arel.sql("similarity(name, #{connection.quote(query)}) DESC"))
    end

    # -------------- filters (unchanged) ------------------------------------
    rel = rel.where(platform_windows: windows) unless windows.nil?
    rel = rel.where(platform_mac:     macos)   unless macos.nil?
    rel = rel.where(platform_linux:   linux)   unless linux.nil?
    rel = rel.where("required_age <= ?", required_age) unless required_age.nil?

    if release_date_min.present? || release_date_max.present?
      # helper to turn a bare "YYYY" (Integer or String) into
      # a Date at either Jan 1 or Dec 31 of that year.
      start_date = parse_year_or_date(release_date_min, Date.new(1970,1,1), 1,  1)
      end_date   = parse_year_or_date(release_date_max, Date.new(3000,12,31), 12, 31)

      rel = rel.where(release_date: start_date..end_date)
    end

    if genre_ids&.any?
      rel = rel.joins(:steam_app_genres)
               .where(steam_app_genres: { genre_id: genre_ids })
               .distinct
    end

    if category_ids&.any?
      rel = rel.joins(:steam_app_categories)
               .where(steam_app_categories: { category_id: category_ids })
               .group("steam_apps.appid")
               .having("COUNT(DISTINCT steam_app_categories.category_id) = ?", category_ids.size)
    end

    rel.page(page).per(per)
  end
end
