require "execjs"

module Rasputin
  module Handlebars
    module Source

      def self.bundled_path
        File.expand_path("../handlebars.js", __FILE__)
      end

      def self.path
        @path ||= ENV["HANDLEBARS_SOURCE_PATH"] || bundled_path
      end

      def self.path=(path)
        @contents = @version = @context = nil
        @path = path
      end

      def self.contents
        @contents ||= File.read(path)
      end

      def self.version
        @version ||= contents[/^Handlebars.VERSION = "([^"]*)"/, 1]
      end

      def self.context
        @context ||= ExecJS.compile(contents)
      end
    end

    class << self
      def version
        Source.version
      end

      def compile(template)
        template = template.read if template.respond_to?(:read)
        Source.context.call("SC.Handlebars.precompile", template)
      end
    end
  end
end
