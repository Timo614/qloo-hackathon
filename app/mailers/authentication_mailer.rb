# app/mailers/authentication_mailer.rb
class AuthenticationMailer < ApplicationMailer
  default from: ENV.fetch('DEFAULT_FROM_EMAIL', 'noreply@example.com')

  def email_verification(user)
    @user = user
    @verification_url = "#{frontend_url}/verify-email/#{user.email_verification_token}"
    
    mail(
      to: user.email,
      subject: 'Verify your email address'
    )
  end

  def password_reset(user)
    @user = user
    @reset_url = "#{frontend_url}/reset-password/#{user.password_reset_token}"
    
    mail(
      to: user.email,
      subject: 'Reset your password'
    )
  end

  private

  def frontend_url
    ENV.fetch('FRONTEND_URL', 'http://localhost:3000')
  end
end