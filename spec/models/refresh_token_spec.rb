# spec/models/refresh_token_spec.rb
require 'rails_helper'

RSpec.describe RefreshToken, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
  end

  describe 'validations' do
    it { should validate_presence_of(:token) }
    it { should validate_uniqueness_of(:token) }
    it { should validate_presence_of(:expires_at) }
  end

  describe 'scopes' do
    let!(:active_token) { create(:refresh_token) }
    let!(:expired_token) { create(:refresh_token, :expired) }

    describe '.active' do
      it 'returns only non-expired tokens' do
        expect(RefreshToken.active).to include(active_token)
        expect(RefreshToken.active).not_to include(expired_token)
      end
    end

    describe '.expired' do
      it 'returns only expired tokens' do
        expect(RefreshToken.expired).to include(expired_token)
        expect(RefreshToken.expired).not_to include(active_token)
      end
    end
  end

  describe 'instance methods' do
    describe '#expired?' do
      it 'returns false for active token' do
        token = create(:refresh_token)
        expect(token.expired?).to be false
      end

      it 'returns true for expired token' do
        token = create(:refresh_token, :expired)
        expect(token.expired?).to be true
      end
    end
  end

  describe 'class methods' do
    describe '.cleanup_expired' do
      let!(:active_token) { create(:refresh_token) }
      let!(:expired_token1) { create(:refresh_token, :expired) }
      let!(:expired_token2) { create(:refresh_token, :expired) }

      it 'removes only expired tokens' do
        expect { RefreshToken.cleanup_expired }.to change(RefreshToken, :count).from(3).to(1)
        expect(RefreshToken.exists?(active_token.id)).to be true
        expect(RefreshToken.exists?(expired_token1.id)).to be false
        expect(RefreshToken.exists?(expired_token2.id)).to be false
      end
    end
  end
end