
(function(exports) {

if ('I18n' in window) {

SC.I18n = I18n;

SC.String.loc = function(scope, options) {
  return SC.I18n.translate(scope, options);
};

SC.STRINGS = SC.I18n.translations;

Handlebars.registerHelper('loc', function(property) {
  return SC.String.loc(property);
});

if (SC.EXTEND_PROTOTYPES) {

String.prototype.loc = function(options) {
  return SC.String.loc(this, options);
};

}

}

})({});


(function(exports) {
// ==========================================================================
// Project:   SproutCore I18N
// Copyright: ©2011 Paul Chavard
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

if ('undefined' === typeof I18n) require('i18n');

})({});
