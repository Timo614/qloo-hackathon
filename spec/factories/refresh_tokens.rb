# spec/factories/refresh_tokens.rb
FactoryBot.define do
  factory :refresh_token do
    user
    token { SecureRandom.urlsafe_base64(32) }
    expires_at { 30.days.from_now }

    trait :expired do
      expires_at { 1.day.ago }
    end

    trait :expiring_soon do
      expires_at { 1.hour.from_now }
    end
  end
end