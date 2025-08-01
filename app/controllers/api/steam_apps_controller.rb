module Api
  class SteamAppsController < BaseController
    # GET /api/steam_apps
    def index
      apps = SteamApp.search(
        params[:q],
        windows:           bool_param(:windows),
        macos:             bool_param(:macos),
        linux:             bool_param(:linux),
        required_age:      params[:required_age],
        release_date_min:  params[:release_date_min],
        release_date_max:  params[:release_date_max],
        # genre_ids:         params[:genre_ids],
        # category_ids:      params[:category_ids]
      )
      render json: paginate(apps)
    end
  end
end