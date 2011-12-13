(function() {

Ember.I18n = I18n;

Ember.String.loc = function(scope, options) {
  return Ember.I18n.translate(scope, options);
};

Ember.STRINGS = Ember.I18n.translations;

Ember.Handlebars.registerHelper('loc', function(property) {
  return Ember.String.loc(property);
});

if (Ember.EXTEND_PROTOTYPES) {
  String.prototype.loc = function(options) {
    return Ember.String.loc(String(this), options);
  };
}

})();
