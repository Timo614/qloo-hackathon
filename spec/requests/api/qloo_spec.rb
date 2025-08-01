require 'rails_helper'

RSpec.describe "Api::Qloos", type: :request do
  describe "GET /recommend" do
    it "returns http success" do
      get "/api/qloo/recommend"
      expect(response).to have_http_status(:success)
    end
  end

end
