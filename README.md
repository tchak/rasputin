Rasputin
========

This is a gem for integration of SproutCore 2.0 with Rails 3.1 assets pipeline.

It provide direct requires for official sproutcore packages :

* sproutcore
* sproutcore-datastore
* sproutcore-statechart
* sproutcore-touch

And it also provides one unnoficial package :

* sproutcore-i18n (integration with i18n-js gem)

Rasputin also provide sprockets engine for handlebars templates. Any template in your
javascript assets folder with extention handlebars will be availabel in sproutcore.

Examples :

    todos/templates/item.handlebars >> SC.TEMPLATES['todos/item']
    todos/ui/templates/stats.handlebars >> SC.TEMPLATES['todos/ui/stats']
    todos/templates/collection.hbs >> SC.TEMPLATES['todos/collection']

If you want to keep using old naming scheme, put this in your rails configuration block :
    
    config.rasputin.template_name_separator = '_'

The new default is '/'

Precompilation :

Starting with 0.9.0 release, Rasputin will precompile your handlebars templates.
If you do not want this behavior you can tourn it off in your rails configuration block :

    config.rasputin.precompile_handlebars = false

Install
-------

In Gemfile:

    gem 'rasputin'

In your javascript asset manifest (app/assets/javascripts/application.js) add the following:

    //= require sproutcore
    
And any of the following you want to include:

    //= require sproutcore-datastore
    //= require sproutcore-statechart
    //= require sproutcore-touch
    //= require sproutcore-i18n

In your stylesheet asset manifest (app/assets/stylesheets/application.css) add the following:

    /*
     * = require normalize
     */

ChangeLog
----------

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
