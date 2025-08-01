class SteamAppCategory < ApplicationRecord
  self.table_name = "steam_app_categories"
  belongs_to :steam_app, foreign_key: :appid
end
