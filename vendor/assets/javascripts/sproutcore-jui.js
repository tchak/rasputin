/*
 * jQuery UI Autocomplete HTML Extension
 *
 * Copyright 2010, Scott González (http://scottgonzalez.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * http://github.com/scottgonzalez/jquery-ui-extensions
 */
(function( $ ) {

var proto = $.ui.autocomplete.prototype,
  initSource = proto._initSource;

function filter( array, term ) {
  var matcher = new RegExp( $.ui.autocomplete.escapeRegex(term), "i" );
  return $.grep( array, function(value) {
    return matcher.test( $( "<div>" ).html( value.label || value.value || value ).text() );
  });
}

$.extend( proto, {
  _initSource: function() {
    if ( this.options.html && $.isArray(this.options.source) ) {
      this.source = function( request, response ) {
        response( filter( this.options.source, request.term ) );
      };
    } else {
      initSource.call( this );
    }
  },

  _renderItem: function( ul, item) {
    return $( "<li></li>" )
      .data( "item.autocomplete", item )
      .append( $( "<a></a>" )[ this.options.html ? "html" : "text" ]( item.label ) )
      .appendTo( ul );
  }
});

})( jQuery );

/*
 * jQuery UI Dialog Auto Reposition Extension
 *
 * Copyright 2010, Scott González (http://scottgonzalez.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * http://github.com/scottgonzalez/jquery-ui-extensions
 */
(function( $ ) {

$.ui.dialog.prototype.options.autoReposition = true;
$( window ).resize(function() {
    $( ".ui-dialog-content:visible" ).each(function() {
        var dialog = $( this ).data( "dialog" );
        if ( dialog.options.autoReposition ) {
            //dialog.option( "position", dialog.options.position );
        }
    });
});

})( jQuery );

/*
 * jQuery UI Widgets for Sproutcore20
 *
 * http://github.com/tchak/sproutcore-jquery-ui
 */

(function() {
var get = SC.get, set = SC.set;

JUI = SC.Object.create();

JUI.Widget = SC.Mixin.create({

  uiWidget: function() {
    return jQuery.ui[this.get('uiType')];
  }.property().cacheable(),

  didInsertElement: function() {
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

  uiEvents: [],
  uiOptions: [],
  uiMethods: [],

  _gatherEvents: function(options) {
    var uiEvents = get(this, 'uiEvents');
    uiEvents.push('create');

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
    uiOptions.push('disabled');

    uiOptions.forEach(function(key) {
      var value = get(this, key),
          uiKey = key.replace(/^_/, '');
      if (typeof value != 'undefined') {
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
        ui = get(this, 'ui');
    uiMethods.forEach(function(methodName) {
      this[methodName] = function() {
        ui[methodName]();
      };
    }, this);
  }
});

})();

(function() {

var get = SC.get;

// FIXME: Ugly hack because of collections buffered rendering...
// SC.CollectionView.reopen({
//   _updateElements: function(content, start, removed, added) {
//     this._super(content, start, removed, added);
//     var idx, views = get(this, 'childViews'), len = start+added;
//     for (idx = start; idx < len; idx++) {
//       views[idx]._notifyWillInsertElement();
//       views[idx]._notifyDidInsertElement();
//     }
//   }
// });

/*
 * SC.TargetSupport
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
    var args = $.makeArray(arguments),
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

//SC.Button.reopen(SC.TargetSupport);

})();

(function() {
var get = SC.get, set = SC.set;

/*
 * JUI.Button
 */

JUI.Button = SC.Button.extend(JUI.Widget, {
  uiType: 'button',
  uiOptions: ['label'],

  isActiveBinding: SC.Binding.oneWay('.disabled')
});

/*
 * JUI.Slider
 */

JUI.Slider = SC.View.extend(JUI.Widget, {
  uiType: 'slider',
  uiOptions: ['value', 'min', 'max', 'step', 'orientation', 'range'],
  uiEvents: ['slide', 'start', 'stop'],

  slide: function(event, ui) {
    set(this, 'value', ui.value);
  }
});

/*
 * JUI.ProgressBar
 */

JUI.ProgressBar = SC.View.extend(JUI.Widget, {
  uiType: 'progressbar',
  uiOptions: ['_value', 'max'],
  uiEvents: ['change', 'complete'],

  _value: function(key, value) {
    if (value !== null && value !== undefined) {
      set(this, 'value', parseInt(value));
    }
    return get(this, 'value');
  }.property('value').cacheable()
});

/*
 * JUI.Spinner
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

})();

/*
 * JUI.Menu
 */

JUI.Menu = SC.CollectionView.extend(JUI.Widget, {
  uiType: 'menu',
  uiEvents: ['select'],

  tagName: 'ul',

  arrayDidChange: function(content, start, removed, added) {
    this._super(content, start, removed, added);

    var ui = SC.get(this, 'ui');
    if (ui) { ui.refresh(); }
  }
});

/*
 * JUI.AutocompleteTextField
 */

JUI.AutocompleteTextField = SC.TextField.extend(JUI.Widget, JUI.TargetSupport, {
  uiType: 'autocomplete',
  uiOptions: ['source', 'delay', 'position', 'minLength', 'html'],
  uiEvents: ['select', 'focus', 'open', 'close'],

  select: function(event, ui) {
    if (ui.item) {
      this.executeAction(SC.get(this, 'action'), ui.item.value);
      event.target.value = '';
      event.preventDefault();
    }
  }
});

(function() {
var get = SC.get, set = SC.set;

/*
 * JUI.SortableCollectionView
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

})();

(function() {
var get = SC.get, set = SC.set;

/*
 * JUI.Dialog
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

JUI.AlertDialog.open = function(message, title, type) {
  if (!alertDialog) {
    alertDialog = JUI.AlertDialog.create();
  }
  set(alertDialog, 'title', title ? title : null);
  set(alertDialog, 'message', message);
  set(alertDialog, 'icon', type);
  alertDialog.open();
};

JUI.AlertDialog.info = function(message, title) {
  JUI.AlertDialog.open(message, title, 'info');
};

JUI.AlertDialog.error = function(message, title) {
  JUI.AlertDialog.open(message, title, 'error');
};

JUI.ConfirmDialog = JUI.AlertDialog.extend({
  buttons: [
    {label: 'YES', action: 'didConfirm'},
    {label: 'NO', action: 'close'}
  ],
  response: false,
  didConfirm: function() {
    set(this, 'response', true);
    this.close();
  },
  didCloseDialog: function() {
    this.executeAction(get(this, 'action'), get(this, 'response'));
    set(this, 'response', false);
  }
});

JUI.ConfirmDialog.notify = function(target, action) {
  if (!confirmDialog) {
    confirmDialog = JUI.ConfirmDialog.create();
  }
  set(confirmDialog, 'target', target);
  set(confirmDialog, 'action', action);
  return this;
};

JUI.ConfirmDialog.open = function(message, title) {
  if (!confirmDialog) {
    confirmDialog = JUI.ConfirmDialog.create();
  }
  set(confirmDialog, 'title', title ? title : null);
  set(confirmDialog, 'message', message);
  confirmDialog.open();
};

})();

(function() {
var get = SC.get, set = SC.set;

/*
 * JUI.Datepicker
 */

JUI.Datepicker = SC.TextField.extend(JUI.Widget, {
  uiType: 'datepicker',
  uiOptions: ['dateFormat', 'maxDate', 'minDate', 'defaultDate'],
  uiEvents: ['onSelect'],

  date: function(key, value) {
    var ui = get(this, 'ui');
    if (value != undefined) {
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
      return $(elem).datepicker(options).datepicker('widget');
    };
    datepicker.prototype.options = $.datepicker._defaults;
    return datepicker;
  }.property().cacheable(),

  // @private
  onSelect: function(dateText, ui) {
    this.select.call(this, dateText, ui);
  },

  select: SC.K
});

JUI.Datepicker.formatDate = $.datepicker.formatDate;
JUI.Datepicker.parseDate = $.datepicker.parseDate;

})();

/*
 * JUI.ResizableView
 */

JUI.ResizableView = SC.View.extend(JUI.Widget, {
  uiType: 'resizable',
  uiEvents: ['start', 'stop', 'resize'],
  uiOptions: ['aspectRatio', 'maxHeight', 'maxWidth', 'minHeight', 'minWidth', 'containment', 'autoHide']
});

(function() {
var get = SC.get, set = SC.set;

/*
 * JUI.Tooltip
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

})();

(function() {

var get = SC.get, set = SC.set, getPath = SC.getPath;

SC.Option = SC.View.extend({

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

});

SC.Select = SC.CollectionView.extend({

  classNames: ['sc-select'],

  itemTitleKey: null,

  itemValueKey: null,

  defaultValue: null,

  itemViewClass: SC.Option,

  tagName: 'select',

  multipleBinding: '.content.allowsMultipleSelection',

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
    this.$().val(get(this, 'value'));
  }

});

})();


