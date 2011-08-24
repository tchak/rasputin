Rasputin
========

This is a gem for integration of SproutCore 2.0 with Rails 3.1 assets pipeline.

It provide direct requires for official sproutcore packages :

* sproutcore
* sproutcore-datastore
* sproutcore-statechart
* sproutcore-touch
* sproutcore-ajax

And it also provides some unnoficial packages :

* sproutcore-jui (jQuery UI wrappers for sc 2.0)
* sproutcore-i18n (integration with i18n-js gem)

Rasputin also provide sprockets engine for handlebars templates. Any template in your
javascript assets folder with extention handlebars will be availabel in sproutcore.

Examples :

    todos/templates/item.handlebars >> SC.TEMPLATES['todos_item']
    todos/ui/templates/stats.handlebars >> SC.TEMPLATES['todos_ui_stats']

Install
-------

In Gemfile:

    gem 'rasputin'

In your asset manifest (app/assets/javascripts/application.js) add the following:

    //= require sproutcore
    
And and any of the following you want to include:

    //= require sproutcore-ajax
    //= require sproutcore-datastore
    //= require sproutcore-i18n
    //= require sproutcore-jui
    //= require sproutcore-statechart
    //= require sproutcore-touch

ChangeLog
----------

0.7.1 :

* add sproutcore-touch

0.7.0 :

* add sproutcore-bricks

0.6.0 :

* update to lates sproutcore 2 (beta3)
* lots of fixes for sproutcore-jui
