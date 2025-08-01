# app/models/user.rb
class User < ApplicationRecord
  has_secure_password

  # Associations
  has_many :search_requests, dependent: :destroy
  has_one :profile, foreign_key: :id, dependent: :destroy
  has_many :user_history, dependent: :destroy
  has_many :user_seeds, dependent: :destroy
  has_many :refresh_tokens, dependent: :destroy

  # Validations
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, if: :password_required?

  # Callbacks
  before_save :downcase_email
  before_create :generate_email_verification_token
  after_create :ensure_profile

  # Scopes
  scope :verified, -> { where(email_verified: true) }
  scope :unverified, -> { where(email_verified: false) }

  def full_name
    [first_name, last_name].compact.join(' ')
  end

  def verified?
    email_verified?
  end

  def verify_email!
    update!(
      email_verified: true,
      email_verified_at: Time.current,
      email_verification_token: nil
    )
  end

  def generate_password_reset_token!
    self.password_reset_token = SecureRandom.urlsafe_base64(32)
    self.password_reset_expires_at = 2.hours.from_now
    save!
  end

  def password_reset_valid?
    password_reset_expires_at && password_reset_expires_at > Time.current
  end

  def clear_password_reset!
    update_columns(
      password_reset_token: nil,
      password_reset_expires_at: nil
    )
  end

  # JWT token methods
  def generate_jwt
    payload = {
      sub: id,
      email: email,
      verified: email_verified?,
      exp: 1.hour.from_now.to_i,
      iat: Time.current.to_i
    }
    JWT.encode(payload, jwt_secret, 'HS256')
  end

  def generate_refresh_token!
    refresh_tokens.create!(
      token: SecureRandom.urlsafe_base64(32),
      expires_at: 30.days.from_now
    )
  end

  def invalidate_all_refresh_tokens!
    refresh_tokens.destroy_all
  end

  # Class methods
  def self.from_jwt(token)
    payload = JWT.decode(token, jwt_secret, true, algorithm: 'HS256').first
    find(payload['sub'])
  rescue JWT::DecodeError, JWT::ExpiredSignature, ActiveRecord::RecordNotFound
    nil
  end

  private  

  def ensure_profile
    return if profile.present?        # already exists (e.g. imported data)

    # build_profile sets profile.id = user.id for you because of `foreign_key: :id`
    build_profile(handle: email)

    # let validations run unless you have a specific reason to skip them
    profile.save!
  end

  def downcase_email
    self.email = email.downcase if email.present?
  end

  def generate_email_verification_token
    self.email_verification_token = SecureRandom.urlsafe_base64(32)
  end

  def password_required?
    new_record? || password.present?
  end

  def self.jwt_secret
    Rails.application.credentials.jwt_secret || ENV['JWT_SECRET'] || Rails.application.secret_key_base
  end

  def jwt_secret
    self.class.jwt_secret
  end
end