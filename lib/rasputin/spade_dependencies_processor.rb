
module Rasputin
  class SpadeDependenciesProcessor < Tilt::Template
    def prepare; end

    def evaluate(context, locals, &block)
      data.lines.each do |line|
        if line =~ /^\s*require\s*\(\s*['"]([^\)]+)['"]\s*\)/
          context.require_asset($1)
        end
      end
      data.gsub!(%r{^\s*require\(['"]([^'"])*['"]\);?\s*$}, "")

      data
    end
  end
end
