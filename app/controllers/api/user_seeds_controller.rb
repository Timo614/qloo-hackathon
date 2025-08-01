module Api
  class UserSeedsController < BaseController
    before_action :set_seed, only: %i[update destroy]

    def index
      seeds = current_user.user_seeds.includes(:steam_app).order('last_seen DESC')
      render json: seeds.as_json(include: :steam_app)
    end

    def create
      appid = params.require(:appid)
      if current_user.user_seeds.count >= 5
        render json: { error: 'Maximum of 5 seeds allowed', error_type: "maximum_reached" }, status: :unprocessable_entity
        return
      end
      
      app = SteamApp.ensure_qloo_entity!(appid)
      if app.qloo_entity.blank?
        render json: { error: 'Game not currently supported by Qloo', error_type: "unsupported_qloo" }, status: :unprocessable_entity
        return
      end
      
      seed = current_user.user_seeds.find_or_initialize_by(appid: appid)
      seed.hits += 1 if seed.persisted?
      seed.save!
      render json: seed, status: :created
    end

    def update
      @seed.increment!(:hits)
      @seed.touch(:last_seen)
      render json: @seed
    end

    def destroy
      @seed.destroy!
      head :no_content
    end

    private

    def set_seed
      @seed = current_user.user_seeds.find_by!(appid: params[:id])
    end
  end
end