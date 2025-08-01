module Api
  class RecommendationsController < BaseController
    before_action :set_search_request

    def index
      recs = @sr.recommendations.order(:rank)
      render json: paginate(recs)
    end

    def show
      rec = @sr.recommendations.find(params[:id])
      render json: rec
    end

    private
    def set_search_request
      @sr =
        if params[:public_token]
          search_request = SearchRequest.find_by!(public_token: params[:public_token])
        else
          current_user
            .search_requests
            .find(params[:search_request_id])
        end
    end
  end
end