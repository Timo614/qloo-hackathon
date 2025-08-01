class SearchRequest < ApplicationRecord
  # ─── Associations ──────────────────────────────────────────────
  belongs_to :user
  has_many   :recommendations, -> { order(:rank) }, dependent: :delete_all

  # ─── Attributes ────────────────────────────────────────────────
  attribute :seed_entity_ids, :string, array: true, default: -> { [] }
  attribute :filters,         :json,   default: -> { {} }

  # ─── Validations ───────────────────────────────────────────────
  validates :user_id,          presence: true
  validates :seed_entity_ids,  length:   { minimum: 1, maximum: 5 }
  validates :name,             length:   { maximum: 120 }

  # ─── Scopes ────────────────────────────────────────────────────
  scope :recent_first, -> { order(created_at: :desc) }

  # ─── Callbacks ────────────────────────────────────────────────
  before_validation :generate_default_name, on: :create

  # ─── Instance helpers ─────────────────────────────────────────
  def qloo_entities
    SteamApp.where(appid: seed_entity_ids).pluck(:qloo_entity).compact
  end

  def seed_steam_apps
    return SteamApp.none if seed_entity_ids.blank?
    SteamApp.where(appid: seed_entity_ids.map(&:to_i))
  end

  private

  def generate_default_name
    return unless name.blank?

    first_title = SteamApp.find_by(appid: seed_entity_ids.first)&.name
    self.name =
      if first_title.blank?
        'Game recommendations'
      elsif seed_entity_ids.size == 1
        "#{first_title} recommendations"
      else
        "#{first_title} and #{seed_entity_ids.size - 1} other game recommendations"
      end.truncate(120)
  end
end
