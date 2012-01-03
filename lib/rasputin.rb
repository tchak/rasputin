require 'tilt'
require 'sprockets/engines'

require "rasputin/version"
require "rasputin/handlebars/compiler"
require "rasputin/handlebars/template"

require "rasputin/slim" if defined? Slim
require "rasputin/haml" if defined? Haml

require "rasputin/require_preprocessor"

module Rasputin
  class Engine < ::Rails::Engine
    config.rasputin = ActiveSupport::OrderedOptions.new
    config.rasputin.precompile_handlebars = Rails.env.production?
    config.rasputin.template_name_separator = '/'

    initializer :setup_rasputin do |app|
      app.assets.register_preprocessor 'application/javascript', Rasputin::RequirePreprocessor
      app.assets.register_engine '.handlebars', Rasputin::HandlebarsTemplate
      app.assets.register_engine '.hbs', Rasputin::HandlebarsTemplate
    end
  end
end
