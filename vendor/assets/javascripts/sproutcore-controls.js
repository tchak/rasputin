
(function(exports) {
var get = SC.get, set = SC.set, getPath = SC.getPath;

SC.Select = SC.CollectionView.extend({

  classNames: ['sc-select'],

  itemTitleKey: null,

  itemValueKey: null,

  defaultValue: null,

  itemViewClass: SC.View.extend({

    tagName: 'option',
  
    defaultTemplate: SC.Handlebars.compile('{{title}}'),
  
    attributeBindings: ['value'],
  
    value: function() {
      var content = get(this, 'content'),
          valueKey = getPath(this, 'parentView.itemValueKey');
  
      return (valueKey) ? (content.get ? get(content, valueKey) : content[valueKey]) : content;
    }.property('content', 'parentView.itemValueKey').cacheable(),
  
    title: function() {
      var content = get(this, 'content'),
          nameKey = getPath(this, 'parentView.itemTitleKey');
  
      return nameKey ? (content.get ? get(content, nameKey) : content[nameKey]) : content.toString();
    }.property('content', 'parentView.itemTitleKey').cacheable()

  }),

  tagName: 'select',

  multiple: false,

  attributeBindings: ['multiple'],

  focusOut: function(event) {
    this._elementValueDidChange();
    return false;
  },

  change: function(event) {
    this._elementValueDidChange();
    return false;
  },

  keyUp: function(event) {
    this._elementValueDidChange();
    return false;
  },

  _elementValueDidChange: function() {
    set(this, 'value', this.$().val());
  },

  _valueDidChange: function() {
    SC.run.once(this, this._updateElementValue);
  }.observes('value'),

  _updateElementValue: function() {
    var value = get(this, 'value');
    if (value == null) {
      value = get(this, 'defaultValue');
    }
    this.$().val(value);
  }

});

})({});


(function(exports) {
/**
 */

var get = SC.get;

SC.TextArea.reopen({

  insertNewline: SC.K,
  cancel: SC.K,

  isAutogrow: false,
  maxRows: 10,

  keyUp: function(event) {
    this.interpretKeyEvents(event);
    return false;
  },

  lines: function() {
    return get(this, 'value').split("\n");
  }.property('value').cacheable(),

  rows: function() {
    var linesCount = 0,
        lines = get(this, 'lines');
    for (var i = 0, l = lines.length; i < l; i++) {
      linesCount += Math.floor((lines[i].length / this._colsDefault) + 1);
    }
    return linesCount;
  }.property('value').cacheable(),

  didInsertElement: function() {
    this._super();
    this._rowsDefault = this.$().prop('rows');
    this._colsDefault = this.$().prop('cols');
  },

  reset: function() {
    this._super();
    if (get(this, 'isAutogrow')) {
      this.$().prop('rows', this._rowsDefault);
    }
  },

  /**
    @private
  */
  interpretKeyEvents: function(event) {
    var map = SC.TextField.KEY_EVENTS;
    var method = map[event.keyCode];

    if (method) { return this[method](event); }
    else { this._elementValueDidChange(); }

    if (get(this, 'isAutogrow')) {
      this._willAutogrow();
    }
  },

  _willAutogrow: function() {
    var rows = get(this, 'rows');
    if (rows <= get(this, 'maxRows')) {
      this.$().prop('rows', (rows >= this._rowsDefault) ? (rows + 1) : this._rowsDefault);
    }
  }
});

})({});


(function(exports) {
var get = SC.get;

SC.FlashView = SC.View.extend({

  classNames: ['sc-flash-view'],

  message: '',

  isVisible: false,

  timeout: 0,

  defaultTemplate: SC.Handlebars.compile('{{message}}'),

  show: function(message) {
    set(this, 'message', message);
    set(this, 'isVisible', true);
    var timeout = get(this, 'timeout');
    if (timeout) {
      SC.run.later(this, 'hide', timeout);
    }
  },

  hide: function() {
    set(this, 'isVisible', false);
    set(this, 'message', '');
  }
});

})({});


(function(exports) {
// ==========================================================================
// Project:   SproutCore String
// Copyright: ©2011 Paul Chavard
// License:   Licensed under MIT license (see license.js)
// ==========================================================================



})({});
