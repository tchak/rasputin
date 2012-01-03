Rasputin
========

This is a gem for integration of Ember.js with Rails 3.1 assets pipeline.

It provide direct requires for following ember packages :

* ember
* ember-datetime
* ember-data
* ember-touch
* ember-routing
* ember-i18n (integration with i18n-js gem)

Rasputin also provide sprockets engine for handlebars templates. Any template in your
javascript assets folder with extention `handlebars` or `hbs` will be availabel in ember.

Examples :

    todos/templates/item.handlebars >> Ember.TEMPLATES['todos/item']
    todos/ui/templates/stats.handlebars >> Ember.TEMPLATES['todos/ui/stats']
    todos/templates/collection.hbs >> Ember.TEMPLATES['todos/collection']

If you want to keep using old naming scheme, put this in your rails configuration block :

    config.rasputin.template_name_separator = '_'

The new default is '/'

Precompilation :

Starting with 0.9.0 release, Rasputin will precompile your handlebars templates.
Starting with 0.12.1 release, default behavior is to precompile templates only in production environment.
If you do not want this behavior you can tourn it off in your rails configuration block :

    config.rasputin.precompile_handlebars = false

If you use Slim of Haml templates, you can use handlebars filter :

    handlebars:
        {{view Ember.Button}}OK{{/view}}

It will be translated as :

    <script type="text/x-handlebars">
        {{view Ember.Button}}OK{{/view}}
    </script>

Preprocessor :

If you chouse to use "javascript native require" your application.js file will look like this :

    require('jquery');
    require('ember');
    require('ember-data');
    require('app/**/*');

Ther is two new settings :

    config.rasputin.use_javascript_requires = true
    config.rasputin.strip_javascript_requires = true

Install
-------

In Gemfile:

    gem 'rasputin'

In your javascript asset manifest (app/assets/javascripts/application.js) add the following:

    //= require jquery
    //= require ember

And any of the following you want to include:

    //= require ember-datetime
    //= require ember-data
    //= require ember-routing
    //= require ember-i18n

In your stylesheet asset manifest (app/assets/stylesheets/application.css) add the following:

    /*
     * = require normalize
     */

ChangeLog
----------

0.13.0

* new preprocessor for "javascript native require" (WIP)

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
