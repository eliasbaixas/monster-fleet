ENV["RAILS_ENV"] = "test"
require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'

class ActiveSupport::TestCase
  fixtures :all

  def sample_file(filename = "MARCELVILLIER71.jpg")
    File.new("test/fixtures/#{filename}")
  end

end
