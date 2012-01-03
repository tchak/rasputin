
module Rasputin
  class RequirePreprocessor < Tilt::Template
    def prepare; end

    def evaluate(context, locals, &block)
      data.lines.each do |line|
        if line =~ /^\s*require\s*\(\s*['"]([^\)]+)['"]\s*\)/
          process_require_directive($1)
        end
      end
      data.gsub!(%r{^\s*require\(['"]([^'"])*['"]\);?\s*$}, "")

      data
    end
  end

  def process_require_directive(path)
    context.require_asset(path)
  end

  # `path/*`
  def process_require_directory_directive(path = ".")
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
