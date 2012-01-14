# -*- encoding: utf-8 -*-
$:.push File.expand_path("../lib", __FILE__)
require "rasputin/version"

Gem::Specification.new do |s|
  s.name        = "rasputin"
  s.version     = Rasputin::VERSION
  s.authors     = ["Paul Chavard"]
  s.email       = ["paul@chavard.net"]
  s.homepage    = "http://github.com/tchak/rasputin"
  s.summary     = %q{Ember.js adapter for the Rails asset pipeline.}
  s.description = %q{Ember.js for the Rails asset pipeline.}

  s.rubyforge_project = "rasputin"
  s.add_runtime_dependency 'railties', '~> 3.1'
  s.add_runtime_dependency 'actionpack', '~> 3.1'
  s.add_runtime_dependency 'sprockets', '~> 2.0'
  s.add_runtime_dependency 'jquery-rails', '>= 1.0'

  s.files         = `git ls-files`.split("\n")
  #s.test_files    = `git ls-files -- {test,spec,features}/*`.split("\n")
  s.require_paths = ["lib"]
end
