
module Rasputin
  class RequirePreprocessor < Tilt::Template

    REQUIRE_PATTERN = /require\(\s*['"]([^\)]+)['"]\s*\)\s*;?\s*/
    HEADER_PATTERN = /
      \A (
        (?m:\s*) (
          (\/\* (?m:.*?) \*\/) |
          (\#\#\# (?m:.*?) \#\#\#) |
          (\/\/ .* \n?)+ |
          (\# .* \n?)+ |
          (#{REQUIRE_PATTERN}\n?)
        )
      )+
    /x
    DIRECTIVE_PATTERN = /^\s*#{REQUIRE_PATTERN}$/
    TREE_PATTERN = /\*\*\/\*$/
    DIRECTORY_PATTERN = /\*$/

    attr_reader :pathname
    attr_reader :header, :body

    def prepare
      @pathname = Pathname.new(file)

      @header = data[HEADER_PATTERN, 0] || ""
      @body   = $' || data
      # Ensure body ends in a new line
      @body  += "\n" if @body != "" && @body !~ /\n\Z/m
    end

    def evaluate(context, locals, &block)
      if Rails.configuration.rasputin.use_javascript_requires
        @context = context
        process_directives
      end

      processed_source
    end

    def processed_header
      if Rails.configuration.rasputin.strip_javascript_requires
        lineno = 0
        @processed_header ||= header.lines.map { |line|
          lineno += 1
          # Replace directive line with a clean break
          directives.assoc(lineno) ? "\n" : line
        }.join.chomp
      else
        @processed_header ||= header.chomp
      end
    end

    def processed_source
      @processed_source ||= processed_header + body
    end

    def directives
      @directives ||= header.lines.each_with_index.map { |line, index|
        if line =~ DIRECTIVE_PATTERN
          name, path = detect_directive($1)
          if respond_to?("process_#{name}_directive")
            [index + 1, name, path]
          end
        end
      }.compact
    end

    protected

    attr_reader :context

    def process_directives
      directives.each do |line_number, name, path|
        context.__LINE__ = line_number
        send("process_#{name}_directive", path)
        context.__LINE__ = nil
      end
    end

    def detect_directive(path)
      if path =~ TREE_PATTERN
        return :require_tree, absolute_path_to_directory(path, TREE_PATTERN)
      elsif path =~ DIRECTORY_PATTERN
        return :require_directory, absolute_path_to_directory(path, DIRECTORY_PATTERN)
      else
        return :require_file, path
      end
    end

    ###
    # Directives implementation
    ###

    # `path`
    def process_require_file_directive(path)
      if relative?(path)
        # The path must be absolute.
        raise ArgumentError, "require argument must be absolute path"
      else
        context.require_asset(path)
      end
    end

    # `path/*`
    def process_require_directory_directive(path=".")
      if relative?(path)
        # The path must be absolute.
        raise ArgumentError, "require_directory argument must be absolute path"
      else
        root = path

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
      end
    end

    # `path/**/*`
    def process_require_tree_directive(path)
      if relative?(path)
        # The path must be absolute.
        raise ArgumentError, "require_tree argument must be absolute path"
      else
        root = path

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
      end
    end

    private

    def absolute_path_to_directory(path, pattern)
      File.join(context.root_path, path.gsub(pattern, ''))
    end

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
