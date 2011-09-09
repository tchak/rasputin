require 'tilt'
require 'sprockets/engines'

require "rasputin/version"
require "rasputin/handlebars_template"
require "rasputin/spade_dependencies_processor"

module Rasputin
  class Engine < ::Rails::Engine
    config.closure = ActiveSupport::OrderedOptions.new
    config.closure.lib = 'vendor/assets/closure-library/closure'

    initializer :setup_rasputin do |app|
      app.assets.register_preprocessor 'application/javascript', Rasputin::SpadeDependenciesProcessor
      app.assets.register_engine '.handlebars', Rasputin::HandlebarsTemplate
    end
  end
end
