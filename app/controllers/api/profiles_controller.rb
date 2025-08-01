module Api
  class ProfilesController < BaseController
    skip_before_action :authenticate_user!, only: [:show]

    def show
      if current_user
        render json: current_user.profile
      else
        render json: nil
      end
    end

    def update
      current_user.profile.update!(profile_params)
      render json: current_user.profile
    end

    private

    def profile_params
      params.permit(:handle)
    end
  end
end