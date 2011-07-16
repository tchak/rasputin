
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
JUI.VERSION = '1.0.alpha';

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

    this._defineMethods();
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
      this._observers = this._observers || {};
      this._observers[key] = observer;
    }, this);

    return options;
  },

  _defineMethods: function() {
    var uiMethods = get(this, 'uiMethods'),
        methods = {};
    uiMethods.forEach(function(methodName) {
      methods[methodName] = function() {
        var ui = get(this, 'ui');
        return ui[methodName].apply(ui, arguments);
      };
    });
    this.reopen(methods);
  }
});

})({});


(function(exports) {

/**
  @class
  @since SproutCore JUI 1.0
  @extends JUI.Button
*/
JUI.Button = SC.Button.extend(JUI.Widget, {
  uiType: 'button',
  uiOptions: ['label'],

  isActiveBinding: SC.Binding.oneWay('.disabled')
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



var get = SC.get, set = SC.set;

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
  uiMethods: ['open', 'close'],

  isOpen: false,

  message: '',
  icon: null,
  buttons: [],

  _iconClassNames: function() {
    var icon = get(this, 'icon');
    if (icon) {
      return "ui-icon ui-icon-%@".fmt(icon === 'error' ? 'alert' : icon);
    }
    return '';
  }.property('icon').cacheable(),

  _stateClassNames: function() {
    var icon = get(this, 'icon');
    if (icon === 'error') {
      return 'ui-state-error';
    } else if (icon === 'info') {
      return 'ui-state-highlight';
    }
    return '';
  }.property('icon').cacheable(),

  defaultTemplate: SC.Handlebars.compile('<p {{bindAttr class="_stateClassNames"}}>\
    <span {{bindAttr class="_iconClassNames"}}></span>{{message}}</p>'),

  _buttons: function() {
    var buttons = [],
        target = get(this, 'targetObject');
    get(this, 'buttons').forEach(function(button) {
      var action = button.action,
          context = this;
      if (!this[action] && target) {
        context = target;
      }
      buttons.push({
        text: button.label,
        click: function(event) {
          if (context && context[action]) {
            context[action].call(context, event);
          }
        }
      });
    }, this);
    return buttons;
  }.property('buttons').cacheable(),

  _open: function() {
    set(this, 'isOpen', true);
    this.didOpenDialog();
  },

  _close: function() {
    set(this, 'isOpen', false);
    this.didCloseDialog();
  },

  open: function() {
    this._insertElementLater(SC.K);
    this._open();
  },

  didInsertElement: function() {
    this._super();
    get(this, 'ui')._bind({
      dialogopen: $.proxy(this._open, this),
      dialogclose: $.proxy(this._close, this)
    });
  },

  close: SC.K,
  didOpenDialog: SC.K,
  didCloseDialog: SC.K
});

JUI.Dialog.close = function() {
  $('.ui-dialog-content:visible').dialog('close');
};

var alertDialog, confirmDialog;

JUI.AlertDialog = JUI.Dialog.extend({
  buttons: [{label: 'OK', action: 'close'}],
  resizable: false,
  draggable: false,
  modal: true
});

JUI.AlertDialog.reopenClass({
  open: function(message, title, type) {
    if (!alertDialog) {
      alertDialog = JUI.AlertDialog.create();
    }
    set(alertDialog, 'title', title ? title : null);
    set(alertDialog, 'message', message);
    set(alertDialog, 'icon', type);
    alertDialog.open();
  },

  info: function(message, title) {
    JUI.AlertDialog.open(message, title, 'info');
  },

  error: function(message, title) {
    JUI.AlertDialog.open(message, title, 'error');
  }
});

JUI.ConfirmDialog = JUI.AlertDialog.extend({
  buttons: [
    {label: 'YES', action: 'didConfirm'},
    {label: 'NO', action: 'close'}
  ],
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
  }
});

JUI.ConfirmDialog.reopenClass({
  open: function(message, title) {
    if (!confirmDialog) {
      confirmDialog = JUI.ConfirmDialog.create();
    }
    var answer = SC.$.Deferred();
    set(confirmDialog, 'answer', answer);
    set(confirmDialog, 'title', title ? title : null);
    set(confirmDialog, 'message', message);
    confirmDialog.open();
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










})({});


(function(exports) {
/*
 * jQuery UI Autocomplete HTML Extension
 *
 * Copyright 2010, Scott González (http://scottgonzalez.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * http://github.com/scottgonzalez/jquery-ui-extensions
 */

var proto = jQuery.ui.autocomplete.prototype,
  initSource = proto._initSource,
  escapeRegex = jQuery.ui.autocomplete.escapeRegex;

function filter(array, term) {
  var matcher = new RegExp(escapeRegex(term), 'i');
  return jQuery.grep(array, function(value) {
    return matcher.test(jQuery('<div>').html(value.label || value.value || value).text());
  });
}

jQuery.extend(proto, {
  _initSource: function() {
    if (this.options.html && jQuery.isArray(this.options.source)) {
      this.source = function(request, response) {
        response(filter( this.options.source, request.term));
      };
    } else {
      initSource.call(this);
    }
  },

  _renderItem: function(ul, item) {
    return jQuery('<li></li>')
      .data('item.autocomplete', item)
      .append(jQuery('<a></a>')[this.options.html ? 'html' : 'text'](item.label))
      .appendTo(ul);
  }
});

})({});


(function(exports) {



var get = SC.get;

/**
  @class
  @since SproutCore JUI 1.0
  @extends JUI.AutocompleteTextField
*/
JUI.AutocompleteTextField = SC.TextField.extend(JUI.Widget, JUI.TargetSupport, {
  uiType: 'autocomplete',
  uiOptions: ['source', 'delay', 'position', 'minLength', 'html'],
  uiEvents: ['select', 'focus', 'open', 'close'],

  select: function(event, ui) {
    if (ui.item) {
      this.executeAction(get(this, 'action'), ui.item.value);
      event.target.value = '';
      event.preventDefault();
    }
  }
});

})({});


(function(exports) {
// ==========================================================================
// Project:   SproutCore JUI
// Copyright: ©2011 Paul Chavard
// License:   Licensed under MIT license (see license.js)
// ==========================================================================



})({});
