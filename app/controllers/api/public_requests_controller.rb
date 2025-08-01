module Api
  class PublicRequestsController < ApplicationController
    def show
      search_request = SearchRequest
        .includes(recommendations: :steam_app)
        .find_by!(public_token: params[:public_token])

      render json: search_request.as_json(
        include: {
          recommendations: {
            include: { steam_app: { only: %i[appid name header_image] } }
          }
        }
      ).merge(
        seeds: search_request.seed_steam_apps.as_json(
          only: %i[appid name header_image]
        )
      )
    end
  end
end