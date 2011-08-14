
(function(exports) {
/*
 * jQuery UI Autocomplete SC Extension
 */

$.widget('ui.sc_autocomplete', $.ui.autocomplete, {
  _renderItem: function(ul, item) {
    var view = this.options.itemViewClass.create({content:item, widget: this});
    view.appendTo(ul);
    return view.$();
  }
});

})({});


(function(exports) {
if ('undefined' === typeof JUI) {

/**
  @namespace
  @name JUI
  @version 1.0.alpha
*/
 JUI = {};

// aliases needed to keep minifiers from removing the global context
if ('undefined' !== typeof window) {
  window.JUI = JUI;
}

}

/**
  @static
  @type String
  @default '1.0.alpha'
  @constant
*/
JUI.VERSION = '1.0.beta.1.pre';

})({});


(function(exports) {

var get = SC.get, set = SC.set, none = SC.none;

/**
  @mixin
  @since SproutCore JUI 1.0
  @extends JUI.Widget
*/
JUI.Widget = SC.Mixin.create({

  uiWidget: function() {
    return jQuery.ui[this.get('uiType')];
  }.property().cacheable(),

  didInsertElement: function() {
    this._super();
    var options = this._gatherOptions();
    this._gatherEvents(options);

    var ui = get(this, 'uiWidget')(options, get(this, 'element'));
    set(this, 'ui', ui);
  },

  willDestroyElement: function() {
    var ui = get(this, 'ui');
    if (ui) {
      var observers = this._observers;
      for (var prop in observers) {
        if (observers.hasOwnProperty(prop)) {
          this.removeObserver(prop, observers[prop]);
        }
      }
      ui._destroy();
    }
  },

  didCreateWidget: SC.K,

  concatenatedProperties: ['uiEvents', 'uiOptions', 'uiMethods'],

  uiEvents: ['create'],
  uiOptions: ['disabled'],
  uiMethods: [],

  _gatherEvents: function(options) {
    var uiEvents = get(this, 'uiEvents');

    uiEvents.forEach(function(eventType) {
      var eventHandler = eventType === 'create' ? this.didCreateWidget : this[eventType];
      if (eventHandler) {
        options[eventType] = $.proxy(function(event, ui) {
          eventHandler.call(this, event, ui);
        }, this);
      }
    }, this);
  },

  _gatherOptions: function() {
    var uiOptions = get(this, 'uiOptions'),
        options = {},
        defaultOptions = get(this, 'uiWidget').prototype.options;

    uiOptions.forEach(function(key) {
      var value = get(this, key),
          uiKey = key.replace(/^_/, '');
      if (!none(value)) {
        options[uiKey] = value;
      } else {
        set(this, key, defaultOptions[uiKey]);
      }

      var observer = function() {
        var value = get(this, key);
            ui = get(this, 'ui');
        if (ui.options[uiKey] != value) {
          ui._setOption(uiKey, value);
        }
      };

      this.addObserver(key, observer);
      //this._observers = this._observers || {};
      //this._observers[key] = observer;
    }, this);

    return options;
  }
});

})({});


(function(exports) {

var get = SC.get;

/**
  @mixin
  @since SproutCore JUI 1.0
  @extends JUI.TargetSupport
*/
JUI.TargetSupport = SC.Mixin.create({

  // @private
  targetObject: function() {
    var target = get(this, 'target');

    if (SC.typeOf(target) === 'string') {
      return SC.getPath(this, target);
    } else {
      return target;
    }
  }.property('target').cacheable(),

  // @private
  executeAction: function() {
    var args = SC.$.makeArray(arguments),
        action = args.shift(),
        target = get(this, 'targetObject');
    if (target && action) {
      if (SC.typeOf(action) === 'string') {
        action = target[action];
      }
      action.apply(target, args);
    }
  }

});

})({});


(function(exports) {



var get = SC.get;

/**
  @class
  @since SproutCore JUI 1.0
  @extends JUI.AutocompleteItem
*/
JUI.AutocompleteItem = SC.View.extend({
  tagName: 'li',
  defaultTemplate: SC.Handlebars.compile('<a>{{content.label}}</a>'),
  didInsertElement: function() {
    this._super();
    this.$().data('item.autocomplete', {
      value: this.getPath('content.value'),
      label: this.getPath('content.label')
    });
    this.get('widget').menu.refresh();
  }
});

/**
  @class
  @since SproutCore JUI 1.0
  @extends JUI.AutocompleteTextField
*/
JUI.AutocompleteTextField = SC.TextField.extend(JUI.Widget, JUI.TargetSupport, {
  uiType: 'sc_autocomplete',
  uiOptions: ['_source', 'delay', 'autoFocus', 'position', 'minLength', 'itemViewClass'],
  uiEvents: ['select', 'focus', 'open', 'close'],

  itemViewClass: JUI.AutocompleteItem,
  requestContent: SC.K,
  content: [],

  _source: function() {
    var source = this.get('source');
    if (source) {
      this.set('content', source);
      return source;
    } else {
      return $.proxy(this, '_requestContent');
    }
  }.property('source').cacheable(),

  _requestContent: function (data, callback) {
    this._lastCallback = callback;
    this.requestContent(data);
  },

  _contentDidChange: function() {
    if (this._lastCallback) {
      this._lastCallback(this.get('content'));
      this._lastCallback = null;
    }
  }.observes('content'),

  select: function(event, ui) {
    if (ui.item) {
      this.executeAction(get(this, 'action'), ui.item.value);
      event.preventDefault();
    }
  }
});

})({});


(function(exports) {

var get = SC.get;

/**
  @class
  @since SproutCore JUI 1.0
  @extends JUI.Button
*/
JUI.Button = SC.Button.extend(JUI.Widget, {
  uiType: 'button',
  uiOptions: ['label'],

  isActiveBinding: SC.Binding.oneWay('.disabled'),

  _icons: function() {
    var icons = {};
    icons.primary = get(this, 'icon');
    if (icons.primary) {
      icons.primary = 'ui-icon-'.fmt(icons.primary);
    }
    return icons;
  }.property('icon').cacheable()
});

})({});


(function(exports) {

var set = SC.set;

/**
  @class
  @since SproutCore JUI 1.0
  @extends JUI.Slider
*/
JUI.Slider = SC.View.extend(JUI.Widget, {
  uiType: 'slider',
  uiOptions: ['value', 'min', 'max', 'step', 'orientation', 'range'],
  uiEvents: ['slide', 'start', 'stop'],

  slide: function(event, ui) {
    set(this, 'value', ui.value);
  }
});

})({});


(function(exports) {

var set = SC.set;

/**
  @class
  @since SproutCore JUI 1.0
  @extends JUI.Spinner
*/
JUI.Spinner = SC.TextField.extend(JUI.Widget, {
  uiType: 'spinner',
  uiOptions: ['value', 'min', 'max', 'step'],
  uiEvents: ['spin', 'start', 'stop'],
  uiMethods: ['pageDown', 'pageUp', 'stepDown', 'stepUp'],

  spin: function(event, ui) {
    set(this, 'value', ui.value);
  }
});

})({});


(function(exports) {

var get = SC.get, set = SC.set, none = SC.none;

/**
  @class
  @since SproutCore JUI 1.0
  @extends JUI.ProgressBar
*/
JUI.ProgressBar = SC.View.extend(JUI.Widget, {
  uiType: 'progressbar',
  uiOptions: ['_value', 'max'],
  uiEvents: ['change', 'complete'],

  _value: function(key, value) {
    if (!none(value)) {
      set(this, 'value', parseInt(value));
    }
    return parseInt(get(this, 'value'));
  }.property('value').cacheable()
});

})({});


(function(exports) {

var get = SC.get;

/**
  @class
  @since SproutCore JUI 1.0
  @extends JUI.Menu
*/
JUI.Menu = SC.CollectionView.extend(JUI.Widget, {
  uiType: 'menu',
  uiEvents: ['select'],

  tagName: 'ul',

  arrayDidChange: function(content, start, removed, added) {
    this._super(content, start, removed, added);

    var ui = get(this, 'ui');
    if (ui) { ui.refresh(); }
  }
});

})({});


(function(exports) {
/*
 * jQuery UI Dialog Auto Reposition Extension
 *
 * Copyright 2010, Scott González (http://scottgonzalez.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * http://github.com/scottgonzalez/jquery-ui-extensions
 */

$.ui.dialog.prototype.options.autoReposition = true;
jQuery(window).resize(function() {
  $('.ui-dialog-content:visible').each(function() {
    var dialog = $(this).data('dialog');
    if (dialog.options.autoReposition) {
      dialog.option('position', dialog.options.position);
    }
  });
});

})({});


(function(exports) {



var get = SC.get, set = SC.set;

JUI.DialogButton = SC.Object.extend(JUI.TargetSupport, {
  label: 'OK',
  action: 'close',
  executeAction: function() {
    this._super(get(this, 'action'));
  }
});

/**
  @class
  @since SproutCore JUI 1.0
  @extends JUI.Dialog
*/
JUI.Dialog = SC.View.extend(JUI.Widget, JUI.TargetSupport, {
  uiType: 'dialog',
  uiEvents: ['beforeClose'],
  uiOptions: ['title', '_buttons', 'position', 'closeOnEscape',
    'modal', 'draggable', 'resizable', 'autoReposition',
    'width', 'height', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight'],

  isOpen: false,
  message: '',
  buttons: [],

  defaultTemplate: SC.Handlebars.compile('<p>{{message}}</p>'),

  open: function() {
    if (get(this, 'state') !== 'inDOM') {
      this._insertElementLater(SC.K);
    } else {
      get(this, 'ui').open();
    }
  },

  close: function() {
    get(this, 'ui').close();
  },

  didInsertElement: function() {
    this._super();
    get(this, 'ui')._bind({
      dialogopen: $.proxy(this._open, this),
      dialogclose: $.proxy(this._close, this)
    });
  },

  _buttons: function() {
    return get(this, 'buttons').map(this._buildButton, this);
  }.property('buttons').cacheable(),

  _buildButton: function(buttonPath) {
    var button = this.getPath(buttonPath);
    if (!button.isInstance) {
      button = button.create({
        target: get(this, 'targetObject') || this
      });
      set(this, buttonPath, button);
    }
    var props = {text: get(button, 'label')};
    props.click = $.proxy(button, 'executeAction')
    return props;
  },

  _open: function() {
    set(this, 'isOpen', true);
    this.didOpenDialog();
  },

  _close: function() {
    set(this, 'isOpen', false);
    this.didCloseDialog();
  },

  didOpenDialog: SC.K,
  didCloseDialog: SC.K
});

JUI.Dialog.close = function() {
  $('.ui-dialog-content:visible').dialog('close');
};

JUI.ModalDialog = JUI.Dialog.extend({
  buttons: ['ok'],
  ok: JUI.DialogButton,
  resizable: false,
  draggable: false,
  modal: true
});

JUI.AlertDialog = JUI.ModalDialog.create({
  open: function(message, title, type) {
    set(this, 'title', title);
    set(this, 'message', message);
    set(this, 'icon', type);
    this._super();
  },
  info: function(message, title) {
    this.open(message, title, 'info');
  },
  error: function(message, title) {
    this.open(message, title, 'error');
  }
});

JUI.ConfirmDialog = JUI.ModalDialog.create({
  buttons: ['yes', 'no'],
  yes: JUI.DialogButton.extend({
    label: 'YES',
    action: 'didConfirm'
  }),
  no: JUI.DialogButton.extend({label: 'NO'}),
  didConfirm: function() {
    get(this, 'answer').resolve();
    this.close();
  },
  didCloseDialog: function() {
    var answer = get(this, 'answer');
    if (answer && !answer.isResolved()) {
      answer.reject();
    }
    set(this, 'answer', null);
  },
  open: function(message, title) {
    var answer = SC.$.Deferred();
    set(this, 'answer', answer);
    set(this, 'title', title);
    set(this, 'message', message);
    this._super();
    return answer.promise();
  }
});

})({});


(function(exports) {

var get = SC.get, set = SC.set, none = SC.none;

/**
  @class
  @since SproutCore JUI 1.0
  @extends JUI.Datepicker
*/
JUI.Datepicker = SC.TextField.extend(JUI.Widget, {
  uiType: 'datepicker',
  uiOptions: ['dateFormat', 'maxDate', 'minDate', 'defaultDate'],
  uiEvents: ['onSelect'],

  date: function(key, value) {
    var ui = get(this, 'ui');
    if (!none(value)) {
      ui.setDate(value);
    }
    return ui.getDate();
  }.property('value').cacheable(),

  open: function() {
    get(this, 'ui').show();
  },

  close: function() {
    get(this, 'ui').hide();
  },

  // @private
  uiWidget: function() {
    var datepicker = function(options, elem) {
      return SC.$(elem).datepicker(options).datepicker('widget');
    };
    datepicker.prototype.options = SC.$.datepicker._defaults;
    return datepicker;
  }.property().cacheable(),

  // @private
  onSelect: function(dateText, ui) {
    this.select();
  },

  select: SC.K
});

JUI.Datepicker.formatDate = SC.$.datepicker.formatDate;
JUI.Datepicker.parseDate = SC.$.datepicker.parseDate;

})({});


(function(exports) {

var get = SC.get, set = SC.set;

/**
  @mixin
  @since SproutCore JUI 1.0
  @extends JUI.Tooltip
*/
JUI.Tooltip = SC.Mixin.create({
  tooltip: '',
  hasTooltip: false,

  // @private
  toggleTooltip: function() {
    var flag = get(this, 'hasTooltip'),
        ui = get(this, 'tooltipWidget');
    if (flag && !ui) {
      ui = this.$().tooltip({
        content: get(this, 'tooltipTemplate')
      }).tooltip('widget');
      set(this, 'tooltipWidget', ui);
    } else if (ui) {
      ui._destroy();
    }
  }.observes('hasTooltip'),

  // @private
  tooltipTemplate: function() {
    return SC.Handlebars.compile(get(this, 'tooltip'));
  }.property('tooltip').cacheable()

});

})({});


(function(exports) {

var get = SC.get, set = SC.set;

/**
  @class
  @since SproutCore JUI 1.0
  @extends JUI.SortableCollectionView
*/
JUI.SortableCollectionView = SC.CollectionView.extend(JUI.Widget, {
  uiType: 'sortable',
  uiEvents: ['start', 'stop'],

  draggedStartPos: null,

  start: function(event, ui) {
    set(this, 'dragging', true);
    set(this, 'draggedStartPos', ui.item.index());
  },

  stop: function(event, ui) {
    var oldIdx = get(this, 'draggedStartPos');
    var newIdx = ui.item.index();
    if (oldIdx != newIdx) {
      var content = get(this, 'content');
      content.beginPropertyChanges();
      var el = content.objectAt(oldIdx);
      content.removeAt(oldIdx);
      content.insertAt(newIdx, el);
      content.endPropertyChanges();
    }
    set(this, 'dragging', false);
  },

  // @private
  // Overriding these to prevent CollectionView from reapplying content array modifications
  arrayWillChange: function(content, start, removedCount, addedCount) {
    if (get(this, 'dragging')) {
      //this._super(content, 0, 0, 0);
    } else {
      this._super(content, start, removedCount, addedCount);
    }
  },

  // @private
  arrayDidChange: function(content, start, removedCount, addedCount) {
    if (get(this, 'dragging')) {
      //this._super(content, 0, 0, 0);
    } else {
      this._super(content, start, removedCount, addedCount);
    }
  }
});

})({});


(function(exports) {

/**
  @class
  @since SproutCore JUI 1.0
  @extends JUI.ResizableView
*/
JUI.ResizableView = SC.View.extend(JUI.Widget, {
  uiType: 'resizable',
  uiEvents: ['start', 'stop', 'resize'],
  uiOptions: ['aspectRatio', 'maxHeight', 'maxWidth', 'minHeight', 'minWidth', 'containment', 'autoHide']
});

})({});


(function(exports) {
/*!
 * jQuery UI Throbber
 *
 * Copyright (c) 2011 Paul Chavard
 * Licensed under the MIT license
 *
 * Author: Paul Chavard [paul at chavard dot net]
 * Version: 0.5.0
 *
 * Credits: Felix Gnass [fgnass at neteye dot de]
 *
 */

(function($, undefined) {

$.widget('ui.throbber', {
  options: {
    segments: 12,
    space: 3,
    length: 7,
    width: 4,
    speed: 1.2,
    align: 'center',
    valign: 'center',
    padding: 4,
    autoStart: false,
    outside: true
  },

  _create: function() {
    this.options = $.extend({color: this.element.css('color')}, this.options);
    this._prepare();
    if (this.options.autoStart) {
      this._activate();
    }
  },

  _setOption: function(key, value) {
    this.options[key] = value;

    if (key === 'disabled') {
      if (this.throbber) {
        clearInterval(this.interval);
        this.throbber.remove();
      }
      if (value === false) {
        this._activate();
      }
    }

    return this;
  },

  _activate: function() {
    var options = this.options;
    this.throbber = this._render().css('position', 'absolute').prependTo(options.outside ? 'body' : this.element);
    var h = this.element.outerHeight() - this.throbber.height();
    var w = this.element.outerWidth() - this.throbber.width();
    var margin = {
      top: options.valign == 'top' ? options.padding : options.valign == 'bottom' ? h - options.padding : Math.floor(h / 2),
      left: options.align == 'left' ? options.padding : options.align == 'right' ? w - options.padding : Math.floor(w / 2)
    };
    var offset = this.element.offset();
    if (options.outside) {
      this.throbber.css({top: offset.top + 'px', left: offset.left + 'px'});
    } else {
      margin.top -= this.throbber.offset().top - offset.top;
      margin.left -= this.throbber.offset().left - offset.left;
    }
    this.throbber.css({marginTop: margin.top + 'px', marginLeft: margin.left + 'px'});
    this._animate(options.segments, Math.round(10 / options.speed) / 10);
  },

  _prepare: function() {
    if ($.ui.throbber.renderMethod) {
      this.renderMethod = $.ui.throbber.renderMethod;
      this.animateMethod = $.ui.throbber.animateMethod;
      return;
    }
    if (document.createElementNS && document.createElementNS( "http://www.w3.org/2000/svg", "svg").createSVGRect) {
      $.ui.throbber.renderMethod = 'SVG';
      if (document.createElement('div').style.WebkitAnimationName !== undefined) {
        $.ui.throbber.animateMethod = 'CSS';
      } else {
        $.ui.throbber.animateMethod = 'SVG';
      }
    } else if (this._prepareVML()) {
      $.ui.throbber.renderMethod = $.ui.throbber.animateMethod = 'VML';
    } else {
      $.ui.throbber.renderMethod = $.ui.throbber.animateMethod = 'DOM';
    }
    this.renderMethod = $.ui.throbber.renderMethod;
    this.animateMethod = $.ui.throbber.animateMethod;
  },

  _prepareVML: function() {
    var s = $('<shape>').css('behavior', 'url(#default#VML)');
    var ok = false;
    $('body').append(s);
    if (s.get(0).adj) {
      // VML support detected. Insert CSS rules for group, shape and stroke.
      var sheet = document.createStyleSheet();
      $.each(['group', 'shape', 'stroke'], function() {
        sheet.addRule(this, "behavior:url(#default#VML);");
      });
      ok = true;
    }
    $(s).remove();
    return ok;
  },

  _getOpacity: function(i) {
    var steps = this.options.steps || this.options.segments-1;
    var end = this.options.opacity !== undefined ? this.options.opacity : 1/steps;
    return 1 - Math.min(i, steps) * (1 - end) / steps;
  },

  _render: function() {
    return this['_render'+this.renderMethod]();
  },

  _renderDOM: function() {
    return $('<div>').addClass('ui-throbber');
  },

  _renderSVG: function() {
    var o = this.options;
    var innerRadius = o.width*2 + o.space;
    var r = (innerRadius + o.length + Math.ceil(o.width / 2) + 1);
      
    var el = svg().width(r*2).height(r*2);
      
    var g = svg('g', {
      'stroke-width': o.width, 
      'stroke-linecap': 'round', 
      stroke: o.color
    }).appendTo(svg('g', {transform: 'translate('+ r +','+ r +')'}).appendTo(el));
      
    for (var i = 0; i < o.segments; i++) {
      g.append(svg('line', {
        x1: 0, 
        y1: innerRadius, 
        x2: 0, 
        y2: innerRadius + o.length, 
        transform: 'rotate(' + (360 / o.segments * i) + ', 0, 0)',
        opacity: this._getOpacity(i)
      }));
    }
    return $('<div>').append(el).width(2*r).height(2*r);
  },

  _renderVML: function() {
    var o = this.options;
    var innerRadius = o.width*2 + o.space;
    var r = (innerRadius + o.length + Math.ceil(o.width / 2) + 1);
    var s = r*2;
    var c = -Math.ceil(s/2);
        
    var el = $('<group>', {coordsize: s + ' ' + s, coordorigin: c + ' ' + c}).css({top: c, left: c, width: s, height: s});
    for (var i = 0; i < o.segments; i++) {
      el.append($('<shape>', {path: 'm ' + innerRadius + ',0  l ' + (innerRadius + o.length) + ',0'}).css({
        width: s,
        height: s,
        rotation: (360 / o.segments * i) + 'deg'
      }).append($('<stroke>', {color: o.color, weight: o.width + 'px', endcap: 'round', opacity: this._getOpacity(i)})));
    }
    return $('<group>', {coordsize: s + ' ' + s}).css({width: s, height: s, overflow: 'hidden'}).append(el);
  },

  _animate: function(steps, duration) {
    this['_animate'+this.animateMethod](steps, duration);
  },

  _animateCSS: function(steps, duration) {
    if (!animations[steps]) {
      var name = 'spin' + steps;
      var rule = '@-webkit-keyframes '+ name +' {';
      for (var i=0; i < steps; i++) {
        var p1 = Math.round(100000 / steps * i) / 1000;
        var p2 = Math.round(100000 / steps * (i+1) - 1) / 1000;
        var value = '% { -webkit-transform:rotate(' + Math.round(360 / steps * i) + 'deg); }\n';
        rule += p1 + value + p2 + value; 
      }
      rule += '100% { -webkit-transform:rotate(100deg); }\n}';
      document.styleSheets[0].insertRule(rule);
      animations[steps] = name;
    }
    this.throbber.css('-webkit-animation', animations[steps] + ' ' + duration +'s linear infinite');
  },

  _animateSVG: function(steps, duration) {
    var rotation = 0;
    var g = this.throbber.find('g g').get(0);
    this.interval = setInterval(function() {
      g.setAttributeNS(null, 'transform', 'rotate(' + (++rotation % steps * (360 / steps)) + ')');
    },  duration * 1000 / steps);
  },

  _animateVML: function(steps, duration) {
    var rotation = 0;
    var g = this.throbber.get(0);
    this.interval = setInterval(function() {
      g.style.rotation = ++rotation % steps * (360 / steps);
    },  duration * 1000 / steps);
  },

  _animateDOM: function(steps, duration) {}

});

/**
 * Utility function to create elements in the SVG namespace.
 */
function svg(tag, attr) {
  var el = document.createElementNS("http://www.w3.org/2000/svg", tag || 'svg');
  if (attr) {
    $.each(attr, function(k, v) {
      el.setAttributeNS(null, k, v);
    });
  }
  return $(el);
}

var animations = {};

})(jQuery);

})({});


(function(exports) {


/*
 * JUI.Throbber 
 */

JUI.Throbber = SC.View.extend(JUI.Widget, {
  uiType: 'throbber',
  uiOptions: ['segments', 'space', 'length', 'width',
    'speed', 'align', 'valign', 'padding', 'autoStart', 'outside']
});

})({});


(function(exports) {












})({});


(function(exports) {
// ==========================================================================
// Project:   SproutCore JUI
// Copyright: ©2011 Paul Chavard
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

//require('jquery-ui');


})({});
