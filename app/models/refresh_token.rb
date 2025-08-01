# app/models/refresh_token.rb
class RefreshToken < ApplicationRecord
  belongs_to :user

  validates :token, presence: true, uniqueness: true
  validates :expires_at, presence: true
  validates   :user,     presence: true
  scope :active, -> { where('expires_at > ?', Time.current) }
  scope :expired, -> { where('expires_at <= ?', Time.current) }

  def expired?
    expires_at <= Time.current
  end

  def self.cleanup_expired
    expired.destroy_all
  end
end