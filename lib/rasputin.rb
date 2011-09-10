require 'tilt'
require 'sprockets/engines'

require "rasputin/version"
require "rasputin/handlebars/compiler"
require "rasputin/handlebars/template"

require "rasputin/slim" if defined? Slim

module Rasputin
  class Engine < ::Rails::Engine
    config.rasputin = ActiveSupport::OrderedOptions.new
    config.rasputin.precompile_handlebars = true

    initializer :setup_rasputin do |app|
      app.assets.register_engine '.handlebars', Rasputin::HandlebarsTemplate
    end
  end
end
