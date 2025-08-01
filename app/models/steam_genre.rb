class SteamGenre < ApplicationRecord
  self.primary_key = :id
  has_and_belongs_to_many :steam_apps,
    join_table: :steam_app_genres,
    foreign_key: :genre_id,
    association_foreign_key: :appid
end