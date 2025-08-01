require 'rails_helper'

RSpec.describe "Api::Profiles", type: :request do
  describe "GET /show" do
    it "returns http success" do
      get "/api/profiles/show"
      expect(response).to have_http_status(:success)
    end
  end

end
