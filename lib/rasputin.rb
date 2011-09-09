require 'tilt'
require 'sprockets/engines'

require "rasputin/version"
require "rasputin/handlebars_template"

module Rasputin
  class Engine < ::Rails::Engine
    initializer :setup_rasputin do |app|
      app.assets.register_engine '.handlebars', Rasputin::HandlebarsTemplate
    end
  end
end
