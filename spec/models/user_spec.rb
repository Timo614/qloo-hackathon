# spec/models/user_spec.rb
require 'rails_helper'

RSpec.describe User, type: :model do
  let(:user) { build(:user) }

  describe 'associations' do
    it { should have_one(:profile).with_foreign_key(:id).dependent(:destroy) }
    it { should have_many(:search_requests).through(:profile) }
    it { should have_many(:user_history).dependent(:destroy) }
    it { should have_many(:user_seeds).dependent(:destroy) }
    it { should have_many(:refresh_tokens).dependent(:destroy) }
  end

  describe 'validations' do
    subject { user }

    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email).case_insensitive }
    it { should allow_value('user@example.com').for(:email) }
    it { should allow_value('test.email+tag@domain.co.uk').for(:email) }
    it { should_not allow_value('invalid_email').for(:email) }
    it { should_not allow_value('user@').for(:email) }
    it { should_not allow_value('@domain.com').for(:email) }

    context 'password validations' do
      it { should validate_length_of(:password).is_at_least(8) }
      
      it 'validates password on create' do
        user = build(:user, password: 'short')
        expect(user).not_to be_valid
        expect(user.errors[:password]).to include('is too short (minimum is 8 characters)')
      end

      it 'validates password when password is present on update' do
        user = create(:user)
        user.password = 'short'
        expect(user).not_to be_valid
        expect(user.errors[:password]).to include('is too short (minimum is 8 characters)')
      end

      it 'does not validate password when not present on update' do
        user = create(:user)
        user.email = 'newemail@example.com'
        expect(user).to be_valid
      end
    end
  end

  describe 'callbacks' do
    describe 'before_save :downcase_email' do
      it 'converts email to lowercase before saving' do
        user = build(:user, email: 'TEST@EXAMPLE.COM')
        user.save
        expect(user.email).to eq('test@example.com')
      end

      it 'handles nil email gracefully' do
        user = build(:user, email: nil)
        expect { user.save }.not_to raise_error
      end
    end

    describe 'before_create :generate_email_verification_token' do
      it 'generates verification token on create' do
        user = build(:user, email_verification_token: nil)
        user.save
        expect(user.email_verification_token).to be_present
        expect(user.email_verification_token.length).to be >= 32
      end
    end
  end

  describe 'scopes' do
    let!(:verified_user) { create(:user, :verified) }
    let!(:unverified_user) { create(:user, :unverified) }

    describe '.verified' do
      it 'returns only verified users' do
        expect(User.verified).to include(verified_user)
        expect(User.verified).not_to include(unverified_user)
      end
    end

    describe '.unverified' do
      it 'returns only unverified users' do
        expect(User.unverified).to include(unverified_user)
        expect(User.unverified).not_to include(verified_user)
      end
    end
  end

  describe 'instance methods' do
    describe '#full_name' do
      it 'returns full name when both first and last names are present' do
        user = build(:user, first_name: 'John', last_name: 'Doe')
        expect(user.full_name).to eq('John Doe')
      end

      it 'returns first name only when last name is missing' do
        user = build(:user, first_name: 'John', last_name: nil)
        expect(user.full_name).to eq('John')
      end

      it 'returns last name only when first name is missing' do
        user = build(:user, first_name: nil, last_name: 'Doe')
        expect(user.full_name).to eq('Doe')
      end

      it 'returns empty string when both names are missing' do
        user = build(:user, first_name: nil, last_name: nil)
        expect(user.full_name).to eq('')
      end
    end

    describe '#verified?' do
      it 'returns true when email is verified' do
        user = build(:user, :verified)
        expect(user.verified?).to be true
      end

      it 'returns false when email is not verified' do
        user = build(:user, :unverified)
        expect(user.verified?).to be false
      end
    end

    describe '#verify_email!' do
      let(:user) { create(:user, :unverified) }

      it 'marks email as verified' do
        user.verify_email!
        expect(user.email_verified).to be true
        expect(user.email_verified_at).to be_within(1.second).of(Time.current)
        expect(user.email_verification_token).to be_nil
      end
    end

    describe '#generate_password_reset_token!' do
      let(:user) { create(:user) }

      it 'generates password reset token and expiration' do
        user.generate_password_reset_token!
        expect(user.password_reset_token).to be_present
        expect(user.password_reset_expires_at).to be_within(1.minute).of(2.hours.from_now)
      end

      it 'saves the user' do
        expect(user).to receive(:save!)
        user.generate_password_reset_token!
      end
    end

    describe '#password_reset_valid?' do
      it 'returns true when token exists and not expired' do
        user = create(:user, :with_password_reset)
        expect(user.password_reset_valid?).to be true
      end

      it 'returns false when token is expired' do
        user = create(:user, :with_expired_password_reset)
        expect(user.password_reset_valid?).to be false
      end

      it 'returns false when no token exists' do
        user = create(:user)
        expect(user.password_reset_valid?).to be false
      end
    end

    describe '#clear_password_reset!' do
      let(:user) { create(:user, :with_password_reset) }

      it 'clears password reset token and expiration' do
        user.clear_password_reset!
        expect(user.password_reset_token).to be_nil
        expect(user.password_reset_expires_at).to be_nil
      end
    end

    describe '#generate_jwt' do
      let(:user) { create(:user, :verified) }

      it 'generates a valid JWT token' do
        token = user.generate_jwt
        expect(token).to be_present
        
        # Decode and verify payload
        payload = JWT.decode(token, User.jwt_secret, true, algorithm: 'HS256').first
        expect(payload['sub']).to eq(user.id)
        expect(payload['email']).to eq(user.email)
        expect(payload['verified']).to be true
        expect(payload['exp']).to be_within(60).of(1.hour.from_now.to_i)
        expect(payload['iat']).to be_within(60).of(Time.current.to_i)
      end

      it 'includes verified status in payload' do
        unverified_user = create(:user, :unverified)
        token = unverified_user.generate_jwt
        payload = JWT.decode(token, User.jwt_secret, true, algorithm: 'HS256').first
        expect(payload['verified']).to be false
      end
    end

    describe '#generate_refresh_token!' do
      let(:user) { create(:user) }

      it 'creates a new refresh token' do
        expect { user.generate_refresh_token! }.to change(user.refresh_tokens, :count).by(1)
      end

      it 'returns the created refresh token' do
        refresh_token = user.generate_refresh_token!
        expect(refresh_token).to be_a(RefreshToken)
        expect(refresh_token.token).to be_present
        expect(refresh_token.expires_at).to be_within(1.minute).of(30.days.from_now)
      end
    end

    describe '#invalidate_all_refresh_tokens!' do
      let(:user) { create(:user) }

      before do
        create_list(:refresh_token, 3, user: user)
      end

      it 'destroys all refresh tokens for the user' do
        expect { user.invalidate_all_refresh_tokens! }.to change(user.refresh_tokens, :count).from(3).to(0)
      end
    end
  end

  describe 'class methods' do
    describe '.from_jwt' do
      let(:user) { create(:user, :verified) }

      context 'with valid token' do
        let(:token) { user.generate_jwt }

        it 'returns the user' do
          result = User.from_jwt(token)
          expect(result).to eq(user)
        end
      end

      context 'with invalid token' do
        it 'returns nil for malformed token' do
          result = User.from_jwt('invalid_token')
          expect(result).to be_nil
        end

        it 'returns nil for token with wrong secret' do
          payload = { sub: user.id, exp: 1.hour.from_now.to_i }
          token = JWT.encode(payload, 'wrong_secret', 'HS256')
          result = User.from_jwt(token)
          expect(result).to be_nil
        end

        it 'returns nil for expired token' do
          payload = { sub: user.id, exp: 1.hour.ago.to_i }
          token = JWT.encode(payload, User.jwt_secret, 'HS256')
          result = User.from_jwt(token)
          expect(result).to be_nil
        end

        it 'returns nil for token with non-existent user' do
          payload = { sub: 'non-existent-id', exp: 1.hour.from_now.to_i }
          token = JWT.encode(payload, User.jwt_secret, 'HS256')
          result = User.from_jwt(token)
          expect(result).to be_nil
        end
      end
    end

    describe '.jwt_secret' do
      it 'returns JWT secret from credentials or ENV or secret_key_base' do
        # Test that it returns a non-nil value
        expect(User.jwt_secret).to be_present
      end
    end
  end

  describe 'secure password' do
    it 'encrypts password' do
      user = create(:user, password: 'testpassword')
      expect(user.password_digest).to be_present
      expect(user.password_digest).not_to eq('testpassword')
    end

    it 'authenticates with correct password' do
      user = create(:user, password: 'testpassword')
      expect(user.authenticate('testpassword')).to eq(user)
    end

    it 'does not authenticate with incorrect password' do
      user = create(:user, password: 'testpassword')
      expect(user.authenticate('wrongpassword')).to be false
    end
  end

  describe 'edge cases and error handling' do
    describe 'email uniqueness' do
      it 'is case insensitive' do
        create(:user, email: 'test@example.com')
        duplicate_user = build(:user, email: 'TEST@EXAMPLE.COM')
        expect(duplicate_user).not_to be_valid
        expect(duplicate_user.errors[:email]).to include('has already been taken')
      end
    end

    describe 'JWT token generation with time freeze' do
      let(:user) { create(:user, :verified) }

      it 'generates consistent tokens at the same time' do
        freeze_time do
          token1 = user.generate_jwt
          token2 = user.generate_jwt
          expect(token1).to eq(token2)
        end
      end
    end

    describe 'password reset token security' do
      it 'generates different tokens each time' do
        user = create(:user)
        user.generate_password_reset_token!
        first_token = user.password_reset_token
        
        user.generate_password_reset_token!
        second_token = user.password_reset_token
        
        expect(first_token).not_to eq(second_token)
      end
    end
  end
end