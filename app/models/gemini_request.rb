class GeminiRequest
  ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
  TIMEOUT  = 10 # seconds

  class << self
    # ─────────────────────────────────────────────────────────────────
    # Public: returns Gemini’s generated text (String).
    #
    #   GeminiRequest.call(
    #     content:         "How does AI work?",
    #     thinking_budget: 0   # optional, default 0
    #   )
    #
    # Raises on non-200 responses.
    # ─────────────────────────────────────────────────────────────────
    def call(content, thinking_budget = 0)
      resp = post_to_gemini(content, thinking_budget)
      parse_response(resp)
    end

    private

    # -- HTTP layer ---------------------------------------------------
    def post_to_gemini(content, thinking_budget)
      Faraday.post(ENDPOINT, payload(content, thinking_budget).to_json, headers) do |req|
        req.options.timeout      = TIMEOUT
        req.options.open_timeout = TIMEOUT
      end
    end

    def headers
      {
        "Content-Type"   => "application/json",
        "Accept"         => "application/json",
        "x-goog-api-key" => ENV.fetch("GEMINI_API_KEY")
      }
    end

    def payload(content, thinking_budget)
      {
        contents: [
          {
            parts: [
              { text: content }
            ]
          }
        ],
        generationConfig: {
          thinkingConfig: { thinkingBudget: thinking_budget }
        }
      }
    end

    # -- Response parsing --------------------------------------------
    def parse_response(resp)
      raise "Gemini error: #{resp.status} – #{resp.body}" unless resp.success?

      body = JSON.parse(resp.body)
      body.dig("candidates", 0, "content", "parts", 0, "text").to_s
    end
  end
end
