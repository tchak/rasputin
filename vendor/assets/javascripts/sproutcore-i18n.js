(function() {

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
    return SC.String.loc(String(this), options);
  };
}

})();
