require 'rails_helper'

RSpec.describe "Api::Users", type: :request do
  describe "GET /seeds" do
    it "returns http success" do
      get "/api/users/seeds"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /history" do
    it "returns http success" do
      get "/api/users/history"
      expect(response).to have_http_status(:success)
    end
  end

end
