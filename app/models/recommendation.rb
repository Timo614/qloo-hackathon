# app/models/recommendation.rb
class Recommendation < ApplicationRecord
  belongs_to :search_request
  belongs_to :steam_app,
             foreign_key: :appid,
             primary_key: :appid,
             inverse_of:  :recommendations

  has_many :recommendation_explanations, dependent: :destroy
  delegate :profile, to: :search_request

  attribute :explainability, :json, default: -> { {} }

  validates :appid, :rank, presence: true
  validates :rank, numericality: { only_integer: true, greater_than: 0 }
  validates :explainability, presence: true
  validates :appid, uniqueness: { scope: :search_request_id }

  scope :ordered, -> { order(:rank) }

  def weight_for(entity_uuid)
    explainability[entity_uuid.to_s].to_f
  end

  def generate_explanation(locale = 'en')
    recommendation_explanations.find_or_create_by!(locale: locale) do |exp|
      game_name = steam_app.name
      weights_json = explainability.to_json
      
      prompt = <<~PROMPT.squish
        Explain in #{locale} (without explicitly mentioning the language) why '#{game_name}' (from Steam) was suggested
        based on the user's selected titles.
        Weights: #{weights_json}
      PROMPT
      
      # Debug what's being sent
      Rails.logger.debug "Gemini prompt: #{prompt.inspect}"
      Rails.logger.debug "Prompt class: #{prompt.class}"
      
      exp.gemini_prompt = prompt
      exp.text = GeminiRequest.call(prompt)
    end
  end
end
