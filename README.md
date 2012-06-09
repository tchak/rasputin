Rasputin
========

# WARNING
Most of the features from rasputin were merged in to official [ember-rails](https://github.com/emberjs/ember-rails) gem.
I will discontinu support to all the ember related stuff in rasputin.
You should start to migrate to [ember-rails](https://github.com/emberjs/ember-rails).
The sprocket extention to use `require` is going to stay in rasputin.

If you use Rasputin for Ember.js integration with Rails 3.1 assets pipeline you should use [ember-rails](https://github.com/emberjs/ember-rails) gem.

Rasputin provide a preprocessor for javascript that let you use "require" directive in your files:

    require('jquery');
    require('ember');
    require('ember-data');
    require('app/**/*');

Here is the two available settings :

    config.rasputin.enable = true
    config.rasputin.strip_require_directives = true

Install
-------

In Gemfile:

    gem 'rasputin'

ChangeLog
----------

0.16.0

* All Ember.js related stuff has moved to ember-rails

0.15.0

* Update to Ember.js 0.9.6

0.14.1

* Precompilation fix

0.14.0

* Update to Ember.js 0.9.4

0.13.2

* Rails 3.2 support

0.13.1

* fix to ensure rasputin is initialized in all groups (thanks @chrisconley)
* update ember-data

0.13.0

* new preprocessor for "javascript native require" (WIP)
* remove legacy packages

0.12.1

* new precompiler (borrowed from @keithpitt)
* default behavior is to precompil only in production environment
* haml filter (thanks @ootoovak)

0.12.0

* replace ember-datastore with ember-data

0.11.3

* update Ember.js to 0.9.3 and clean up ember-datastore

0.11.2

* update Ember.js to latest master

0.11.0

* renaming to Ember.js

0.10.3

* update sproutcore to latest master
* update Handlebars compiler (thank's to @MichaelRykov)

0.10.1

* update with built in metamorph

0.10.0

* add sproutcore-routing
* update sproutcore to master (with metamorph)

0.9.1

* you can change templates naming scheme in your configuration
* add .hbs extention support

0.9.0

* add support for Handlebars precompilation (thanks to @SlexAxton)
* add slim filter
* change templates naming scheme, use '/' instead of '_'

0.8.2

* rails 3.1 support
* fix sproutcore-touch

0.8.1

* add normalize.css

0.8.0

* remove unofficial packages. Prepare for more stable releases in sync with upstream.
* sproutcore-jui will move in to it's own gem

0.7.1 :

* add sproutcore-touch

0.7.0 :

* add sproutcore-bricks

0.6.0 :

* update to lates sproutcore 2 (beta3)
* lots of fixes for sproutcore-jui
