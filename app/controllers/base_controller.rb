# app/controllers/base_controller.rb
class BaseController < ApplicationController
  attr_reader :current_user
  before_action :load_user
  before_action :authenticate_user!

  private

  def bool_param(key)
    ActiveModel::Type::Boolean.new.cast(params[key])
  end

  def paginate(scope)
    page     = params.fetch(:page, 1).to_i.clamp(1, 10_000)
    per_page = params.fetch(:per, 25).to_i.clamp(1, 100)
    scope    = scope.page(page).per(per_page)
    response.set_header('X-Total',     scope.total_count)
    response.set_header('X-Per-Page',  per_page)
    response.set_header('X-Page',      page)
    scope
  end

  def load_user
    token = extract_token
    if token.present?
      @current_user = User.from_jwt(token) 
    end
  end

  def authenticate_user!
    token = extract_token
    return render_unauthorized unless token
    return render_unauthorized unless @current_user

    # Check if user has an approved profile
    unless current_user.profile&.approved?
      return render json: { error: 'wait_list' }, status: :forbidden
    end
  end

  def extract_token
    header = request.headers['Authorization']
    return nil unless header&.start_with?('Bearer ')
    
    header.split('Bearer ').last
  end

  def render_unauthorized
    render json: { error: 'Unauthorized' }, status: :unauthorized
  end

  def current_user_id
    current_user&.id
  end
end