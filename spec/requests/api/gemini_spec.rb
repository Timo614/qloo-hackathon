require 'rails_helper'

RSpec.describe "Api::Geminis", type: :request do
  describe "GET /explain" do
    it "returns http success" do
      get "/api/gemini/explain"
      expect(response).to have_http_status(:success)
    end
  end

end
