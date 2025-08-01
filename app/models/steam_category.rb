class SteamCategory < ApplicationRecord
  self.primary_key = :id
  has_and_belongs_to_many :steam_apps,
    join_table: :steam_app_categories,
    foreign_key: :category_id,
    association_foreign_key: :appid
end