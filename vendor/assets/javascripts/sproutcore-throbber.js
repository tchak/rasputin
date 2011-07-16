
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
// ==========================================================================
// Project:   SproutCore DataStore
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================



})({});
