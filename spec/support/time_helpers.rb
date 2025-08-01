# spec/support/time_helpers.rb
module TimeHelpers
  def freeze_time(&block)
    time = Time.current
    travel_to(time, &block)
  end

  def travel_to_future(duration, &block)
    travel_to(Time.current + duration, &block)
  end

  def travel_to_past(duration, &block)
    travel_to(Time.current - duration, &block)
  end
end