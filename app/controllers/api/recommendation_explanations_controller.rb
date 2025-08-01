module Api
  class RecommendationExplanationsController < BaseController
    before_action :set_recommendation
    skip_before_action :authenticate_user!, only: [:show]

    # GET /api/search_requests/:search_request_id/recommendations/:recommendation_id/explanation?locale=fr
    def show
      locale = params[:locale] || 'en'
      unless RecommendationExplanation::LANGUAGES.include?(locale)
        render json: { error: 'Unsupported locale' }, status: :bad_request and return
      end

      explanation = @rec.recommendation_explanations.find_by(locale: locale)
      explanation ||= @rec.generate_explanation(locale)
      render json: explanation
    end

    private

    def set_recommendation
      @rec =
        if params[:public_token]
          search_request = SearchRequest.find_by!(public_token: params[:public_token])
          search_request.recommendations.find(params[:recommendation_id])
        else
          current_user
            .search_requests
            .find(params[:search_request_id])
            .recommendations
            .find(params[:recommendation_id])
        end
    end
  end
end