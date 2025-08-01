# app/controllers/auth_controller.rb
module Api
  class AuthController < BaseController
    skip_before_action :authenticate_user!, only: [:login, :logout, :register, :refresh]

    # POST /auth/register
    def register
      user = User.new(register_params)
      
      if user.save
        # Send verification email
        # AuthenticationMailer.email_verification(user).deliver_later
        user.verify_email!
        
        render json: {
          message: 'Registration successful, your access has been waitlisted. You will be notified at a future time when you can access the system.',
          user: user_response(user)
        }, status: :created
      else
        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # POST /auth/login
    def login
      user = User.find_by(email: params[:email]&.downcase)
      
      if user&.authenticate(params[:password])
        if user.verified?
          tokens = generate_tokens(user, nil)
          render json: {
            message: 'Login successful',
            user: user_response(user),
            **tokens
          }
        else
          render json: { 
            error: 'Please verify your email address before logging in.',
            code: 'email_not_verified'
          }, status: :forbidden
        end
      else
        render json: { error: 'Invalid email or password' }, status: :unauthorized
      end
    end

    # POST /auth/refresh
    def refresh
      refresh_token = RefreshToken.active.find_by(token: params[:refresh_token])
      
      if refresh_token
        user = refresh_token.user
        tokens = generate_tokens(user, refresh_token)
        
        render json: {
          message: 'Token refreshed successfully',
          user: user_response(user),
          **tokens
        }
      else
        render json: { error: 'Invalid or expired refresh token' }, status: :unauthorized
      end
    end

    # POST /auth/logout
    def logout
      if params[:refresh_token]
        refresh_token = current_user.refresh_tokens.find_by(token: params[:refresh_token])
        refresh_token&.destroy
      end
      
      render json: { message: 'Logout successful' }
    end

    # # POST /auth/logout_all
    # def logout_all
    #   current_user.invalidate_all_refresh_tokens!
    #   render json: { message: 'Logged out from all devices' }
    # end

    # # POST /auth/forgot_password
    # def forgot_password
    #   user = User.find_by(email: params[:email]&.downcase)
      
    #   if user
    #     user.generate_password_reset_token!
    #     AuthenticationMailer.password_reset(user).deliver_later
    #   end
      
    #   # Always return success to prevent email enumeration
    #   render json: { 
    #     message: 'If that email address is in our database, we will send you a password reset link.' 
    #   }
    # end

    # # POST /auth/reset_password
    # def reset_password
    #   user = User.find_by(password_reset_token: params[:token])
      
    #   if user && user.password_reset_valid?
    #     if user.update(password: params[:password], password_confirmation: params[:password_confirmation])
    #       user.clear_password_reset!
    #       user.invalidate_all_refresh_tokens! # Force re-login everywhere
          
    #       render json: { message: 'Password reset successful' }
    #     else
    #       render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    #     end
    #   else
    #     render json: { error: 'Invalid or expired reset token' }, status: :unprocessable_entity
    #   end
    # end

    # # GET /auth/verify_email/:token
    # def verify_email
    #   user = User.find_by(email_verification_token: params[:token])
      
    #   if user
    #     user.verify_email!
    #     render json: { message: 'Email verified successfully' }
    #   else
    #     render json: { error: 'Invalid verification token' }, status: :unprocessable_entity
    #   end
    # end

    # # POST /auth/resend_verification
    # def resend_verification
    #   user = User.find_by(email: params[:email]&.downcase)
      
    #   if user && !user.verified?
    #     user.generate_email_verification_token
    #     user.save!
    #     AuthenticationMailer.email_verification(user).deliver_later
    #   end
      
    #   render json: { 
    #     message: 'If that email address is in our database and unverified, we will send you a verification link.' 
    #   }
    # end

    private

    def register_params
      params.require(:user).permit(:email, :password, :password_confirmation, :first_name, :last_name)
    end

    def generate_tokens(user, refresh_token = nil)
      {
        access_token: user.generate_jwt,
        refresh_token: refresh_token || user.generate_refresh_token!.token,
        expires_in: 1.hour.to_i
      }
    end

    def user_response(user)
      {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        email_verified: user.email_verified?,
        created_at: user.created_at
      }
    end
  end
end