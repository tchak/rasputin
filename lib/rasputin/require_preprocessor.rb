
module Rasputin
  class RequirePreprocessor < Tilt::Template

    DIRECTIVE_PATTERN = /^\s*require\(\s*['"]([^\)]+)['"]\s*\)/
    TREE_PATTERN = /\*\*\/\*$/
    DIRECTORY_PATTERN = /\*$/

    attr_reader :pathname

    def prepare
      @pathname = Pathname.new(file)
    end

    def evaluate(context, locals, &block)
      if Rails.configuration.rasputin.use_javascript_requires
        @context = context
        process_source
      end

      data
    end

    protected

    attr_reader :context

    def process_source
      data.lines.each do |line|
        if line =~ DIRECTIVE_PATTERN
          process_directive($1)
        end
      end
      if Rails.configuration.rasputin.strip_javascript_requires
        #data.gsub!(%r{^\s*require\(['"]([^'"])*['"]\);?\s*$}, "")
        data.gsub!(DIRECTIVE_PATTERN, '')
      end
    end

    def process_directive(path)
      if path =~ TREE_PATTERN
        path.gsub!(TREE_PATTERN, '')
        process_require_tree_directive("./#{path}")
      elsif path =~ DIRECTIVE_PATTERN
        path.gsub!(DIRECTIVE_PATTERN, '')
        process_require_directory_directive("./#{path}")
      else
        process_require_directive(path)
      end
    end

    def process_require_directive(path)
      context.require_asset(path)
    end

    # `path/*`
    def process_require_directory_directive(path=".")
      if relative?(path)
        root = pathname.dirname.join(path).expand_path

        unless (stats = stat(root)) && stats.directory?
          raise ArgumentError, "require_directory argument must be a directory"
        end

        context.depend_on(root)

        entries(root).each do |pathname|
          pathname = root.join(pathname)
          if pathname.to_s == self.file
            next
          elsif context.asset_requirable?(pathname)
            context.require_asset(pathname)
          end
        end
      else
        # The path must be relative and start with a `./`.
        raise ArgumentError, "require_directory argument must be a relative path"
      end
    end

    # `path/**/*`
    def process_require_tree_directive(path = ".")
      if relative?(path)
        root = pathname.dirname.join(path).expand_path

        unless (stats = stat(root)) && stats.directory?
          raise ArgumentError, "require_tree argument must be a directory"
        end

        context.depend_on(root)

        each_entry(root) do |pathname|
          if pathname.to_s == self.file
            next
          elsif stat(pathname).directory?
            context.depend_on(pathname)
          elsif context.asset_requirable?(pathname)
            context.require_asset(pathname)
          end
        end
      else
        # The path must be relative and start with a `./`.
        raise ArgumentError, "require_tree argument must be a relative path"
      end
    end

    private

    def relative?(path)
      path =~ /^\.($|\.?\/)/
    end

    def stat(path)
      context.environment.stat(path)
    end

    def entries(path)
      context.environment.entries(path)
    end

    def each_entry(root, &block)
      context.environment.each_entry(root, &block)
    end
  end
end
