module Haml
  module Filters
    module Handlebars
      include Base

      # @see Base#render_with_options
      def render_with_options(text, options)
        type = " type=#{options[:attr_wrapper]}text/x-handlebars#{options[:attr_wrapper]}"

        <<END
<script#{type}>
  #{text.rstrip.gsub("\n", "\n    ")}
</script>
END
      end
    end
  end
end
