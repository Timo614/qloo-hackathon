# app/models/recommendation_explanation.rb
class RecommendationExplanation < ApplicationRecord
  belongs_to :recommendation
  has_one    :steam_app, through: :recommendation
  has_one    :profile,   through: :recommendation
  
  LANGUAGES = ['en', 'es', 'fr', 'de', 'zh', 'ja']

  validates :locale,
    presence: true,
    length: { maximum: 8 },
    inclusion: { in: LANGUAGES }
  validates :text, presence: true
end
