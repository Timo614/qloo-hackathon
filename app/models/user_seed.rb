class UserSeed < ApplicationRecord
  self.primary_key = [:user_id, :appid]  
  belongs_to :user
  belongs_to :steam_app, foreign_key: :appid
  
  validate :no_more_than_five_per_user, on: :create
  
  private

  def no_more_than_five_per_user
    if steam_app.qloo_entity.blank?
      errors.add(:base, 'Steam game not currently supported by Qloo')
    end
    if user.user_seeds.count >= 5
      errors.add(:base, 'Maximum of 5 seeds allowed')
    end
  end
end
