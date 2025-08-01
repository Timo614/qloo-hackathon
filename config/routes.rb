Rails.application.routes.draw do
  # post '/auth/logout_all', to: 'auth#logout_all'
  # post '/auth/forgot_password', to: 'auth#forgot_password'
  # post '/auth/reset_password', to: 'auth#reset_password'
  # get '/auth/verify_email/:token', to: 'auth#verify_email'
  # post '/auth/resend_verification', to: 'auth#resend_verification'

  namespace :api do
    resource  :profile,      only: %i[show update]
    resources :steam_apps,   only: :index
    resources :user_seeds,   only: %i[index create update destroy]

    post '/auth/register', to: 'auth#register'
    post '/auth/login', to: 'auth#login'
    post '/auth/refresh', to: 'auth#refresh'
    post '/auth/logout', to: 'auth#logout'

    resources :search_requests, only: %i[create show index update] do
      resources :recommendations, only: %i[index show] do
        get :explanation, to: 'recommendation_explanations#show'
      end
    end

    get 'share/:public_token', to: 'public_requests#show', as: :public_request

    scope 'share/:public_token', as: :public do
      resources :recommendations, only: %i[index show] do
        get :explanation, to: 'recommendation_explanations#show'
      end
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
