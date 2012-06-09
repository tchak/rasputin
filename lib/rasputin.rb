require 'tilt'
require 'sprockets/engines'

require "rasputin/version"
require "rasputin/require_preprocessor"

module Rasputin
  class Engine < ::Rails::Engine
    config.rasputin = ActiveSupport::OrderedOptions.new
    config.rasputin.enable = true
    config.rasputin.strip_require_directives = true

    initializer :setup_rasputin, :group => :all do |app|
      app.assets.register_preprocessor 'application/javascript', Rasputin::RequirePreprocessor
    end
  end
end
