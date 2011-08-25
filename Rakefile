require 'bundler/gem_tasks'

desc "Update normalize.css"
task :update_normalize do
  require 'open-uri'
  res = open 'https://raw.github.com/necolas/normalize.css/master/normalize.css'
  File.open('vendor/assets/stylesheets/normalize.css', 'w') do |f|
    f << res.read
  end
end