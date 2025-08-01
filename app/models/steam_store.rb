class SteamStore
  BASE_URL = 'https://store.steampowered.com/api/appdetails'.freeze
  CACHE_TTL = 15.minutes

  class << self
    def fetch(app_id, cc = 'us')
      raise ArgumentError, 'app_id must be integer' unless app_id.to_s =~ /^\d+$/

      Rails.cache.fetch(cache_key(app_id, cc), expires_in: CACHE_TTL) do
        uri       = URI(BASE_URL)
        uri.query = URI.encode_www_form(appids: app_id, cc: cc)

        response = Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
          http.get(uri)
        end
        raise "Steam API error #{response.code}" unless response.is_a?(Net::HTTPSuccess)

        body  = JSON.parse(response.body)
        entry = body[app_id.to_s]

        entry && entry['success'] ? entry['data']['price_overview'] : nil
      end
    end

    private

    def cache_key(app_id, cc)
      "steam_store:#{app_id}:#{cc.downcase}"
    end
  end
end
