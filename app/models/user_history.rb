class UserHistory < ApplicationRecord
  self.primary_key = [:user_id, :appid] 
  belongs_to :profile,   foreign_key: :user_id
  belongs_to :steam_app, foreign_key: :appid
  scope :sorted, -> { order(last_seen: :desc) }
end