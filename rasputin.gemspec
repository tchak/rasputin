# -*- encoding: utf-8 -*-
$:.push File.expand_path("../lib", __FILE__)
require "rasputin/version"

Gem::Specification.new do |s|
  s.name        = "rasputin"
  s.version     = Rasputin::VERSION
  s.authors     = ["Paul Chavard"]
  s.email       = ["paul@chavard.net"]
  s.homepage    = "http://github.com/tchak/rasputin"
  s.summary     = %q{Sproutcore 2.0 adapter for the Rails asset pipeline.}
  s.description = %q{Sproutcore 2.0 for the Rails asset pipeline.}

  s.rubyforge_project = "rasputin"
  s.add_runtime_dependency 'railties',   '~> 3.1.0.rc4'
  s.add_runtime_dependency 'actionpack', '~> 3.1.0.rc4'
  s.add_runtime_dependency 'sprockets', '>= 2.0.0.beta.10'

  s.files         = `git ls-files`.split("\n")
  s.test_files    = `git ls-files -- {test,spec,features}/*`.split("\n")
  s.executables   = `git ls-files -- bin/*`.split("\n").map{ |f| File.basename(f) }
  s.require_paths = ["lib"]
end
