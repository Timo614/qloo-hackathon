class SteamAppGenre < ApplicationRecord
  self.table_name = "steam_app_genres"
  belongs_to :steam_app, foreign_key: :appid
end