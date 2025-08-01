class PrefetchExplanation < ApplicationJob
  queue_as :default

  def perform(recommendation_id, locale)
      recommendation = Recommendation.find(recommendation_id)
      unless recommendation.recommendation_explanations.exists?(locale: locale)
        recommendation.generate_explanation(locale)
      end
  end
end