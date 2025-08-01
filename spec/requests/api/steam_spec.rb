require 'rails_helper'

RSpec.describe "Api::Steams", type: :request do
  describe "GET /prices" do
    it "returns http success" do
      get "/api/steam/prices"
      expect(response).to have_http_status(:success)
    end
  end

end
