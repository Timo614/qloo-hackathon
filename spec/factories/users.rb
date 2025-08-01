# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    email { Faker::Internet.email }
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    password { 'password123' }
    password_confirmation { 'password123' }
    email_verified { false }
    email_verification_token { SecureRandom.urlsafe_base64(32) }

    trait :verified do
      email_verified { true }
      email_verified_at { Time.current }
      email_verification_token { nil }
    end

    trait :unverified do
      email_verified { false }
      email_verified_at { nil }
      email_verification_token { SecureRandom.urlsafe_base64(32) }
    end

    trait :with_password_reset do
      password_reset_token { SecureRandom.urlsafe_base64(32) }
      password_reset_expires_at { 2.hours.from_now }
    end

    trait :with_expired_password_reset do
      password_reset_token { SecureRandom.urlsafe_base64(32) }
      password_reset_expires_at { 1.hour.ago }
    end
  end
end