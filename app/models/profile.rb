class Profile < ApplicationRecord
  self.primary_key       = :id           
  self.record_timestamps = false         
  validates :id, presence: true
  has_many   :user_seeds, foreign_key: :user_id, dependent: :delete_all
  has_many   :user_histories, foreign_key: :user_id, dependent: :delete_all
  has_many   :search_requests, foreign_key: :user_id, dependent: :delete_all
  
  def self.approved?(uuid)
    key   = "profile:approved:#{uuid}"
    found = Rails.cache.read(key)
    return found unless found.nil?
    approved = where(id: uuid, approved: true).exists?
    Rails.cache.write(
      key,
      approved,
      expires_in: approved ? 1.hour : 1.minute
    )
    approved
  end
  
  scope :approved, -> { where(approved: true) }
end