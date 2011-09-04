
(function(exports) {
// Vector and Matrix mathematics modules for JavaScript
// Copyright (c) 2007 James Coglan
// 
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

var Sylvester = {
  version: '0.1.3',
  precision: 1e-6
};

function Matrix() {}
Matrix.prototype = {

  // Returns element (i,j) of the matrix
  e: function(i,j) {
    if (i < 1 || i > this.elements.length || j < 1 || j > this.elements[0].length) { return null; }
    return this.elements[i-1][j-1];
  },

  // Maps the matrix to another matrix (of the same dimensions) according to the given function
  map: function(fn) {
    var els = [], ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
    do { i = ki - ni;
      nj = kj;
      els[i] = [];
      do { j = kj - nj;
        els[i][j] = fn(this.elements[i][j], i + 1, j + 1);
      } while (--nj);
    } while (--ni);
    return Matrix.create(els);
  },

  // Returns the result of multiplying the matrix from the right by the argument.
  // If the argument is a scalar then just multiply all the elements. If the argument is
  // a vector, a vector is returned, which saves you having to remember calling
  // col(1) on the result.
  multiply: function(matrix) {
    if (!matrix.elements) {
      return this.map(function(x) { return x * matrix; });
    }
    var returnVector = matrix.modulus ? true : false;
    var M = matrix.elements || matrix;
    if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
    if (!this.canMultiplyFromLeft(M)) { return null; }
    var ni = this.elements.length, ki = ni, i, nj, kj = M[0].length, j;
    var cols = this.elements[0].length, elements = [], sum, nc, c;
    do { i = ki - ni;
      elements[i] = [];
      nj = kj;
      do { j = kj - nj;
        sum = 0;
        nc = cols;
        do { c = cols - nc;
          sum += this.elements[i][c] * M[c][j];
        } while (--nc);
        elements[i][j] = sum;
      } while (--nj);
    } while (--ni);
    var M = Matrix.create(elements);
    return returnVector ? M.col(1) : M;
  },

  x: function(matrix) { return this.multiply(matrix); },
  
  // Returns true iff the matrix can multiply the argument from the left
  canMultiplyFromLeft: function(matrix) {
    var M = matrix.elements || matrix;
    if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
    // this.columns should equal matrix.rows
    return (this.elements[0].length == M.length);
  },

  // Set the matrix's elements from an array. If the argument passed
  // is a vector, the resulting matrix will be a single column.
  setElements: function(els) {
    var i, elements = els.elements || els;
    if (typeof(elements[0][0]) != 'undefined') {
      var ni = elements.length, ki = ni, nj, kj, j;
      this.elements = [];
      do { i = ki - ni;
        nj = elements[i].length; kj = nj;
        this.elements[i] = [];
        do { j = kj - nj;
          this.elements[i][j] = elements[i][j];
        } while (--nj);
      } while(--ni);
      return this;
    }
    var n = elements.length, k = n;
    this.elements = [];
    do { i = k - n;
      this.elements.push([elements[i]]);
    } while (--n);
    return this;
  }
};

// Constructor function
Matrix.create = function(elements) {
  var M = new Matrix();
  return M.setElements(elements);
};

// Utility functions
$M = Matrix.create;

})({});


(function(exports) {
// ==========================================================================
// Project:  AcceleratedEffects        
// Copyright: ©2011 Majd Taby
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

(function($) {
  if ( !$.cssHooks ) {
    throw("jQuery 1.4.3+ is needed for this plugin to work");
    return;
  }
  
  function styleSupport( prop ) {
    var vendorProp, supportedProp,

        // capitalize first character of the prop to test vendor prefix
        capProp = prop.charAt(0).toUpperCase() + prop.slice(1),
        prefixes = [ "Moz", "Webkit", "O", "ms" ],
        div = document.createElement( "div" );

    if ( prop in div.style ) {

      // browser supports standard CSS property name
      supportedProp = prop;
    } else {

      // otherwise test support for vendor-prefixed property names
      for ( var i = 0; i < prefixes.length; i++ ) {
        vendorProp = prefixes[i] + capProp;
        if ( vendorProp in div.style ) {
          supportedProp = vendorProp;
          break;
        }
      }
    }

    // avoid memory leak in IE
    div = null;
    
    // add property to $.support so it can be accessed elsewhere
    $.support[ prop ] = supportedProp;
    
    return supportedProp;
  }
  
  var transformProperty = styleSupport('transform');
  console.log(transformProperty);
  
  var properties = {
    rotateX: {
      defaultValue: 0
    },
    rotateY: {
      defaultValue: 0
    },
    rotateZ: {
      defaultValue: 0
    },
    translateX: {
      defaultValue: 0
    },
    translateY: {
      defaultValue: 0
    },
    translateZ: {
      defaultValue: 0
    },
    scale: {
      defaultValue: 1
    }
  };

  var RotationXMatrix = function(a) {
    return $M([
      [1,0,0,0],
      [0,Math.cos(a), Math.sin(-a), 0],
      [0,Math.sin(a), Math.cos( a), 0],
      [0,0,0,1]
    ]);
  };

  var RotationYMatrix = function(b) {
    return $M([
      [Math.cos( b), 0, Math.sin(b),0],
      [0,1,0,0],
      [Math.sin(-b), 0, Math.cos(b), 0],
      [0,0,0,1]
    ]);
  };

  var RotationZMatrix = function(c) {
    return $M([
      [Math.cos(c), Math.sin(-c), 0, 0],
      [Math.sin(c), Math.cos( c), 0, 0],
      [0,0,1,0],
      [0,0,0,1]
    ]);
  };

  var TranslationMatrix = function(tx,ty,tz) {
    return $M([
      [1,0,0,0],
      [0,1,0,0],
      [0,0,1,0],
      [tx,ty,tz,1]
    ]);
  };

  var ScaleMatrix = function(s) {  
    return $M([
      [s,0,0,0],
      [0,s,0,0],
      [0,0,s,0],
      [0,0,0,1]
    ]);
  };
  
  var applyMatrix = function(elem) {
      var transforms = $(elem).data('transforms');

      var rotX = transforms.rotateX || properties.rotateX.defaultValue,
          rotY = transforms.rotateY || properties.rotateY.defaultValue,
          rotZ = transforms.rotateZ || properties.rotateZ.defaultValue,
          scale = transforms.scale || properties.scale.defaultValue,
          translateX = transforms.translateX || properties.translateX.defaultValue,
          translateY = transforms.translateY || properties.translateY.defaultValue,
          translateZ = transforms.translateZ || properties.translateZ.defaultValue;

      var tM = RotationXMatrix(rotX)
                .x(RotationYMatrix(rotY))
                .x(RotationZMatrix(rotZ))
                .x(ScaleMatrix(scale))
                .x(TranslationMatrix(translateX,translateY,translateZ));
      
      s  = "matrix3d(";
        s += tM.e(1,1).toFixed(10) + "," + tM.e(1,2).toFixed(10) + "," + tM.e(1,3).toFixed(10) + "," + tM.e(1,4).toFixed(10) + ",";
        s += tM.e(2,1).toFixed(10) + "," + tM.e(2,2).toFixed(10) + "," + tM.e(2,3).toFixed(10) + "," + tM.e(2,4).toFixed(10) + ",";
        s += tM.e(3,1).toFixed(10) + "," + tM.e(3,2).toFixed(10) + "," + tM.e(3,3).toFixed(10) + "," + tM.e(3,4).toFixed(10) + ",";
        s += tM.e(4,1).toFixed(10) + "," + tM.e(4,2).toFixed(10) + "," + tM.e(4,3).toFixed(10) + "," + tM.e(4,4).toFixed(10);
      s += ")";
      
      elem.style[transformProperty] = s;
  }
  
  var hookFor = function(name) {
    
    $.fx.step[name] = function(fx){
      $.cssHooks[name].set( fx.elem, fx.now + fx.unit );
    };
    
    return {
      get: function( elem, computed, extra ) {
        var transforms = $(elem).data('transforms');
        if (transforms === undefined) {
          transforms = {};
          $(elem).data('transforms',transforms);
        }
        
        return transforms[name] || properties[name].defaultValue;
      },
      set: function( elem, value) {
        var transforms = $(elem).data('transforms');
        if (transforms === undefined) transforms = {};
        var propInfo = properties[name];

        if (typeof propInfo.apply === 'function') {
          transforms[name] = propInfo.apply(transforms[name] || propInfo.defaultValue, value);
        } else {
          transforms[name] = value
        }
        
        $(elem).data('transforms',transforms);
        applyMatrix(elem);
      }
    }
  }

  if (transformProperty) {
    for (var name in properties) {
      $.cssHooks[name] = hookFor(name);
      $.cssNumber[name] = true;
    } 
  }

})(jQuery);

})({});


(function(exports) {
// ==========================================================================
// Project:   AcceleratedEffects
// Copyright: ©2011 Majd Taby
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

})({});

(function(exports) {
// ==========================================================================
// Project:  SproutCore Runtime
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get;
var set = SC.set;

/**
  @class

  Registry of known gestures in the system. This is a singleton class, and is
  used by SC.View to analyze instances of SC.View for gesture support.

  You will not use this class yourself. Rather, gesture recognizers will call
  SC.Gestures.register(name, recognizer) when they want to make the system aware
  of them.

  @private
  @extends SC.Object
*/
SC.Gestures = SC.Object.create(
/** @scope SC.Gestures.prototype */{

  _registeredGestures: null,

  init: function() {
    this._registeredGestures = {};

    return this._super();
  },

  /**
    Registers a gesture recognizer to the system. The gesture recognizer is
    identified by the name parameter, which must be globally unique.
  */
  register: function(name, /** SC.Gesture */recognizer) {
    var registeredGestures = this._registeredGestures;

    if (registeredGestures[name] !== undefined) {
      throw new SC.Error(name+" already exists as a registered gesture recognizers. Gesture recognizers must have globally unique names.");
    }

    registeredGestures[name] = recognizer;
  },

  unregister: function(name) {
    var registeredGestures = this._registeredGestures;

    if (registeredGestures[name] !== undefined) {
      registeredGestures[name] = undefined;
    }
  },

  /**
    Registers a gesture recognizer to the system. The gesture recognizer is
    identified by the name parameter, which must be unique across the system.
  */
  knownGestures: function() {
    var registeredGestures = this._registeredGestures;

    return (registeredGestures)? registeredGestures : {};
  }

});


})({});


(function(exports) {
// ==========================================================================
// Project:  SproutCore Runtime
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get;
var set = SC.set;

/**
  @class

  Manages multiplegesture recognizers that are associated with a view.
  This class is instantiated automatically by SC.View and you wouldn't
  interact with it yourself.

  SC.GestureManager mainly acts as a composite for the multiple gesture
  recognizers associated with a view. Whenever it gets a touch event, it
  relays it to the gestures. The other main resposibility of
  SC.GestureManager is to handle re-dispatching of events to the view.

  @extends SC.Object
*/
SC.GestureManager = SC.Object.extend({

  /**
    An array containing all the gesture recognizers associated with a
    view. This is set automatically by SC.View.

    @default null
    @type Array
  */
  gestures: null,

  /**
    Internal hash used to keep a list of the events that need to be
    re-dispatched to the views. It's used so we don't re-dispatch
    the same event multiple times to the same view.

    @default null
    @type Array
  */
  _redispatchQueue: null,

  _redispatchToNearestParentViewWaitingForTouches: function(evt, view) {
    var foundManager = null,
        successful = false;
    var view = get(view, 'parentView');

    while(view) {
      var manager = get(view, 'eventManager');

      if (manager !== undefined && manager !== null) {
        var gestures = get(manager, 'gestures');

        for (var i=0, l=gestures.length; i<l; i++) {
          if (get(gestures[i], 'state') === SC.Gesture.WAITING_FOR_TOUCHES) {
            foundManager = manager;
          }
        }

        if (foundManager) {
          successful = true;
          foundManager.touchStart(evt, view);
          break;
        }
      }
      
      view = get(view, 'parentView');
    }

    return successful;
  },

  /**
    Relays touchStart events to all the gesture recognizers to the
    specified view

    @return Boolen
  */
  touchStart: function(evt, view) {
    if (this._redispatchToNearestParentViewWaitingForTouches(evt, view)) {
      return;
    }

    return this._invokeEvent('touchStart',evt, view);
  },

  /**
    Relays touchMove events to all the gesture recognizers to the
    specified view

    @return Boolen
  */
  touchMove: function(evt, view) {
    return this._invokeEvent('touchMove',evt, view);
  },

  /**
    Relays touchEnd events to all the gesture recognizers to the
    specified view

    @return Boolen
  */
  touchEnd: function(evt, view) {
    return this._invokeEvent('touchEnd',evt, view);
  },

  /**
    Relays touchCancel events to all the gesture recognizers to the
    specified view

    @return Boolen
  */
  touchCancel: function(evt, view) {
    return this._invokeEvent('touchCancel',evt, view);
  },

  /**
    Relays an event to the gesture recognizers. Used internally
    by the touch event listeners.

    @private
    @return Boolean
  */
  _invokeEvent: function(eventName, eventObject, view) {
    var gestures = get(this, 'gestures'),
        gesture, result = true;

    this._redispatchQueue = {};

    for (var i=0, l=gestures.length; i < l; i++) {
      gesture = gestures[i];
      handler = gesture[eventName];

      if (SC.typeOf(handler) === 'function') {
        result = handler.call(gesture, eventObject, view, this);
      }
    };

    this._flushReDispatchQueue();

    return result;
  },

  /**
    Similar to _invokeEvent, but instead of invoking the event
    to the gesture recognizers, it re-dispatches the event to the
    view. This method is used by the gesture recognizers when they
    want to let the view respond to the original events.
  */
  redispatchEventToView: function(view, eventName, eventObject) {
    var queue = this._redispatchQueue;

    if (queue[eventName] === undefined) {
      queue[eventName] = [];
    }
    else {
      var views = queue[eventName];

      for (var i=0, l=views.length; i<l; i++) {
        if (view === views[i].view) {
          return;
        }
      }
    }

    var originalEvent = null;
    if (eventObject && eventObject.originalEvent) originalEvent = eventObject.originalEvent;

    queue[eventName].push({
      view: view,
      originalEvent: originalEvent
    });
  },

  /**
    This method is used internally by _invokeEvent. It re-dispatches
    events to the view if the gestures decided they want to.
  */
  _flushReDispatchQueue: function() {
    var queue = this._redispatchQueue;

    for (var eventName in queue) {
      var views = queue[eventName];

      for (var i=0, l=views.length; i<l; i++) {
        var view = views[i].view;
        var event = jQuery.Event(eventName);

        event.originalEvent = views[i].originalEvent;

        // Trigger event so it bubbles up the hierarchy
        view.$().trigger(event, this);
      }
    }
  }

});

})({});


(function(exports) {
// ==========================================================================
// Project:  SproutCore Touch
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get;
var set = SC.set;

/**
  @class
  @private

  Used to manage and maintain a list of active touches related to a gesture 
  recognizer.
*/
SC.TouchList = SC.Object.extend({
  touches: null,

  timestamp: null,

  init: function() {
    this._super();

    set(this, 'touches', []);
  },

  addTouch: function(touch) {
    var touches = get(this, 'touches');
    touches.push(touch);
    this.notifyPropertyChange('touches');
  },

  updateTouch: function(touch) {
    var touches = get(this, 'touches');

    for (var i=0, l=touches.length; i<l; i++) {
      var _t = touches[i];

      if (_t.identifier === touch.identifier) {
        touches[i] = touch;
        this.notifyPropertyChange('touches');
        break;
      }
    }
  },

  removeTouch: function(touch) {
    var touches = get(this, 'touches');

    for (var i=0, l=touches.length; i<l; i++) {
      var _t = touches[i];

      if (_t.identifier === touch.identifier) {
        touches.splice(i,1);
        this.notifyPropertyChange('touches');
        break;
      }
    }
  },

  removeAllTouches: function() {
    set(this, 'touches', []);
  },

  touchWithId: function(id) {
    var ret = null,
        touches = get(this, 'touches');

    for (var i=0, l=touches.length; i<l; i++) {
      var _t = touches[i];

      if (_t.identifier === id) {
        ret = _t;
        break;
      }
    }

    return ret;
  },

  length: function() {
    var touches = get(this, 'touches');
    return touches.length;
  }.property('touches').cacheable()
});

})({});


(function(exports) {
// ==========================================================================
// Project:  SproutCore Runtime
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================



var get = SC.get;
var set = SC.set;

var sigFigs = 100;

/**
  @class

  Base class for all gesture recognizers. Handles low-level touch and state
  management, and provides some utility methods and some required methods all
  gesture recognizers are expected to implement.

  Overview
  =========

  Gestures coalesce multiple touch events to a single higher-level gesture
  event. For example, a tap gesture recognizer takes information about a
  touchstart event, a few touchmove events, and a touchend event and uses
  some heuristics to decide whether or not that sequence of events qualifies
  as a tap event. If it does, then it will notify the view of the higher-level
  tap events.

  Gesture events follow the format:

    * [GESTURE_NAME]Start - Sent when a gesture has gathered enough information
        to begin tracking the gesture

    * [GESTURE_NAME]Change - Sent when a gesture has already started and has
        received touchmove events that cause its state to change

    * [GESTURE_NAME]End - Sent when a touchend event is received and the gesture
        recognizer decides that the gesture is finished.

    * [GESTURE_NAME]Cancel - Sent when a touchcancel event is received.

  There are two types of gesturess: Discrete and Continuous gestures. In contrast
  to continuous gestures, discrete gestures don't have any change events. Rather,
  the start and end events are the only one that gets sent.

  Usage
  =======

  While you wouldn't use SC.Gesture directly, all its subclasses have the same
  API. For example, to implement pinch on a view, you implement pinchChange and
  optionally pinchStart, pinchEnd and pinchCancel.

      var myView = SC.View.create({
        pinchStart: function(recognizer) {
          this.$().css('background','red');
        },

        pinchChange: function(recognizer) {
          var scale = recognizer.get('scale');
          this.$().css('-webkit-transform','scale3d('+scale+','+scale+',1)');
        },

        pinchEnd: function(recognizer) {
          this.$().css('background','blue');
        },

        pinchCancel: function(recognizer) {
          this.$().css('background','blue');
        }
      });

  pinchStart(), pinchEnd() and pinchCancel() will only get called once per
  gesture, but pinchChange() will get called repeatedly called every time
  one of the touches moves.

  Creating Custom Gesture Recognizers
  ======

  SC.Gesture also defines an API which its subclasses can implement to build
  custom gestures. The methods are:

    * **didBecomePossible** - Called when a gesture enters a possible state. This
        means the gesture recognizer has accepted enough touches to match 
        the number of required touches. You would usually initialize your state
        in this callback.

    * **eventWasRejected** - Called if a view returns false from a gesture event.
        This callback allows you to reset internal state if the user rejects
        an event.

    * **shouldBegin** - Allows a gesture to block itself from entering a began state.
        This callback will continuously be called as touches move until it begins.

    * **shouldEnd** - Allows a gesture to block itself from entering an ended state.
        This callback gets called whenever a tracked touch gets a touchEnd event.

    * **didBegin** - Called when the gesture enters a began state. Called before the
       view receives the Start event.

    * **didChange** - Called when the gesture enters a began state, and when one of the
        touches moves. Called before the view receives the Change event.

    * **didEnd** - Called when the gesture enters an ended state. Called before the
       view receives the End event.

    * **didCancel** - Called when the gesture enters a cancelled state. Called before the
       view receives the Cancel event.

  In all the callbacks, you can use the `touches` protected property to access the
  touches hash. The touches hash is keyed on the identifiers of the touches, and the
  values are the jQuery.Event objects.

  You can also use the numberOfActiveTouches property to inspect how many touches
  are active, this is mostly useful in shouldBegin since every other callback can
  assume that there are as many active touches as specified in the 
  numberOfRequiredTouches property.

  Discrete vs Continuous Gestures
  =======

  There are two main classes of gesture recognizers: Discrete and Continuous 
  gestures. Discrete gestures do not get Change events sent, since they represent
  a single, instantaneous event, rather than a continuous motion. If you are 
  implementing your own discrete gesture recognizer, you must set the 
  isDiscreteGesture property to yes, and SC.Gesture will adapt its behavior.

  Discrete gestures use the shouldEnd callback to either accept or decline the gesture
  event. If it is delined, then the gesture will enter a Cancelled state and trigger
  the Cancel event on the view.

  @extends SC.Object
*/

SC.Gesture = SC.Object.extend(
  /** @scope SC.Gesture.prototype */{

  /**
    The current state of the gesture recognizer. This value can be any one
    of the states defined at the end of this file.

    @type Number
  */
  state: null,

  /**
    A string of the gesture recognizer's name. This value is set automatically
    but SC.Gestures when a gesture is registered.

    @type String
  */
  name: null,

  /** 
    Specifies whether a gesture is discrete or continuous.

    @type Boolean
    @default false
  */
  gestureIsDiscrete: false,

  /** 
    You can use the `touches` protected property to access the touches hash. The touches 
    hash is keyed on the identifiers of the touches, and the values are the jQuery.Event 
    objects.

    @private 
    @type Hash
  */
  touches: null,

  /** 
    You can also use the numberOfActiveTouches property to inspect how many touches
    are active, this is mostly useful in shouldBegin since every other callback can
    assume that there are as many active touches as specified in the 
    numberOfRequiredTouches property.

    @private 
    @type Number
  */
  numberOfActiveTouches: 0,

  /** 
    Used to specify the number of touches required for the gesture to enter a possible 
    state

    @private 
    @type Number
  */
  numberOfRequiredTouches: 1,

  init: function() {
    this._super();
    this.touches = SC.TouchList.create();
  },

  //..............................................
  // Gesture Callbacks

  /** @private */
  didBecomePossible: function() { },

  /** @private */
  shouldBegin: function() {
    return true;
  },

  /** @private */
  didBegin: function() { },

  /** @private */
  didChange: function() { },

  /** @private */
  eventWasRejected: function() { },

  /** @private */
  shouldEnd: function() {
    return true;
  },

  /** @private */
  didEnd: function() { },

  /** @private */
  didCancel: function() { },

  //..............................................
  // Utilities

  /** @private */
  attemptGestureEventDelivery: function(evt, view, eventName) {
    if (this.notifyViewOfGestureEvent(view, eventName) === false) {
      this.eventWasRejected();
    } else {
      evt.preventDefault();
    }
  },

  /**
    Given two Touch objects, this method returns the distance between them.

    @return Number
  */
  distance: function(touches) {

    if (touches.length < 2) {
      return 0;
    }

    var first = touches[0];
    var second = touches[1];

    var x = first.pageX;
    var y = first.pageY;
    var x0 = second.pageX;
    var y0 = second.pageY;

    return Math.sqrt((x -= x0) * x + (y -= y0) * y);
  },

  /**
    Given two Touch objects, this method returns the midpoint between them.

    @return Number
  */
  centerPointForTouches: function(touches) {
    var sumX = 0,
        sumY = 0;

    for (var i=0, l=touches.length; i<l; i++) {
      var touch = touches[i];
      sumX += touch.pageX;
      sumY += touch.pageY;
    }

    var location = {
      x: sumX / touches.length,
      y: sumY / touches.length
    };

    return location;
  },

  /** @private */
  _objectValues: function(object) {
    var ret = [];

    for (var item in object ) {
      if (object.hasOwnProperty(item)) {
        ret.push(object[item]);
      }
    }

    return ret;
  },

  /**
    Allows the gesture to notify the view it's associated with of a gesture
    event.

    @private
  */
  notifyViewOfGestureEvent: function(view, eventName, data) {
    var handler = view[eventName];
    var result = true;

    if (SC.typeOf(handler) === 'function') {
      result = handler.call(view, this, data);
    }

    return result;
  },

  toString: function() {
    return SC.Gesture+'<'+SC.guidFor(this)+'>';
  },

  /** @private */
  _resetState: function() {
    this.touches.removeAllTouches();
  },

  //..............................................
  // Touch event handlers

  /** @private */
  touchStart: function(evt, view, manager) {
    var targetTouches = evt.originalEvent.targetTouches;
    var _touches = this.touches;
    var state = get(this, 'state');

    set(_touches, 'timestamp', Date.now());

    //Collect touches by their identifiers
    for (var i=0, l=targetTouches.length; i<l; i++) {
      var touch = targetTouches[i];

      if(_touches.touchWithId(touch.identifier) === null && _touches.get('length') < get(this, 'numberOfRequiredTouches')) {
        _touches.addTouch(touch);
      }
    }

    if (_touches.get('length') < get(this, 'numberOfRequiredTouches')) {
      set(this ,'state', SC.Gesture.WAITING_FOR_TOUCHES);

    } else {
      // Discrete gestures may skip the possible step if they're ready to begin
      if (get(this, 'gestureIsDiscrete') && this.shouldBegin()) {
        set(this, 'state', SC.Gesture.BEGAN);
        this.didBegin();
        this.attemptGestureEventDelivery(evt, view, get(this, 'name')+'Start');
      } else {
        set(this, 'state', SC.Gesture.POSSIBLE);
        this.didBecomePossible();
      }
    }

    manager.redispatchEventToView(view,'touchstart', evt);
  },

  /** @private */
  touchMove: function(evt, view, manager) {
    var state = get(this, 'state');

    if (state === SC.Gesture.WAITING_FOR_TOUCHES || state === SC.Gesture.ENDED || state === SC.Gesture.CANCELLED) {
      // Nothing to do here
      manager.redispatchEventToView(view,'touchmove', evt);
      return;
    }

    var changedTouches = evt.originalEvent.changedTouches;
    var _touches = this.touches;

    set(_touches, 'timestamp', Date.now());

    // Update touches hash
    for (var i=0, l=changedTouches.length; i<l; i++) {
      var touch = changedTouches[i];
      _touches.updateTouch(touch);
    }

    if (state === SC.Gesture.POSSIBLE) {
      if (this.shouldBegin()) {
        set(this, 'state', SC.Gesture.BEGAN);
        this.didBegin();

        // Give the gesture a chance to update its state so the view can get 
        // updated information in the Start event
        this.didChange();

        this.attemptGestureEventDelivery(evt, view, get(this, 'name')+'Start');
      }

    // Discrete gestures don't fire changed events
    } else if ((state === SC.Gesture.BEGAN || state === SC.Gesture.CHANGED) && !get(this, 'gestureIsDiscrete')) {
      set(this, 'state', SC.Gesture.CHANGED);
      this.didChange();

      this.attemptGestureEventDelivery(evt, view, get(this, 'name')+'Change');

    } else {
      manager.redispatchEventToView(view,'touchmove', evt);
    }
  },

  /** @private */
  touchEnd: function(evt, view, manager) {
    // Discrete gestures need to cancel if they shouldn't end successfully
    if (get(this, 'gestureIsDiscrete')) {

      // Discrete gestures use shouldEnd to either accept or decline the gesture.
      if (this.state === SC.Gesture.BEGAN && this.shouldEnd()) {
        set(this, 'state', SC.Gesture.ENDED);
        this.didEnd();
        this.attemptGestureEventDelivery(evt, view, get(this, 'name')+'End');
      } else {
        set(this, 'state', SC.Gesture.CANCELLED);
        this.didCancel();
        this.attemptGestureEventDelivery(evt, view, get(this, 'name')+'Cancel');
      } 
    } 
    else {
      if (this.state !== SC.Gesture.ENDED && this.shouldEnd()) {
        set(this, 'state', SC.Gesture.ENDED);
        this.didEnd();

        this.attemptGestureEventDelivery(evt, view, get(this, 'name')+'End');
      } 

      manager.redispatchEventToView(view,'touchend', evt);
    }

    this._resetState();
  },

  /** @private */
  touchCancel: function(evt, view, manager) {
    if (this.state !== SC.Gesture.CANCELLED) {
      this._resetState();
      set(this, 'state', SC.Gesture.CANCELLED);
      this.notifyViewOfGestureEvent(view,get(this, 'name')+'Cancel');
    } else {
      manager.redispatchEventToView(view,'touchcancel', evt);
    }
  }
});

SC.Gesture.WAITING_FOR_TOUCHES = 0;
SC.Gesture.POSSIBLE = 1;
SC.Gesture.BEGAN = 2;
SC.Gesture.CHANGED = 3;
SC.Gesture.ENDED = 4;
SC.Gesture.CANCELLED = 4;

})({});


(function(exports) {
// ==========================================================================
// Project:  SproutCore Runtime
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get;
var set = SC.set;

var sigFigs = 100;

/**
  @class

  Recognizes a multi-touch pinch gesture. Pinch gestures require a specified number
  of fingers to move and will record and update the scale.

  For pinchChange events, the pinch gesture recognizer includes a scale property
  which can be applied as a CSS transform directly.

    var myview = SC.View.create({
      elementId: 'gestureTest',
      pinchChange: function(recognizer) {
        var scale = recognizer.get('scale');
        this.$().css('-webkit-transform','scale3d('+scale+','+scale+',1)');
      }
    })

  You can specify how many touches the gesture requires to start using the numberOfRequiredTouches
  property, which you can set in the pinchOptions hash:

    var myview = SC.View.create({
      pinchOptions: {
        numberOfRequiredTouches: 3
      }
      ...
    })


  @extends SC.Gesture
*/
SC.PinchGestureRecognizer = SC.Gesture.extend({

  /**
    The scale value which represents the current amount of scaling that has been applied
    to the view. You would normally apply this value directly to your element as a 3D
    scale.

    @type Number
  */
  scale: 1,

  numberOfRequiredTouches: 2,

  //..................................................
  // Private Methods and Properties

  /**
    Track starting distance between touches per gesture.

    @private
    @type Number
  */
  _startingDistanceBetweenTouches: null,

  /**
    Used for measuring velocity

    @private
    @type Number
  */
  _previousTimestamp: null,

  /**
    Used for measuring velocity and scale

    @private
    @type Number
  */  
  _previousDistance: 0,

  /**
    The pixel distance that the fingers need to get closer/farther away by before
    this gesture is recognized.

    @private
    @type Number
  */
  _deltaThreshold: 5,

  /**
    Used for rejected events

    @private
    @type Number
  */
  _previousScale: 1,

  /**
    @private
  */
  didBecomePossible: function() {
    this._startingDistanceBetweenTouches = this.distance(get(this.touches,'touches'));
    this._previousDistance = this._startingDistanceBetweenTouches;
    this._previousTimestamp = get(this.touches,'timestamp');
  },

  shouldBegin: function() {
    var currentDistanceBetweenTouches = this.distance(get(this.touches,'touches'));

    return Math.abs(currentDistanceBetweenTouches - this._startingDistanceBetweenTouches) >= this._deltaThreshold;
  },

  didChange: function() {
    var scale = this._previousScale = get(this, 'scale');
    var timeDifference = this.touches.timestamp - this._previousTimestamp;
    var currentDistanceBetweenTouches = this.distance(get(this.touches,'touches'));
    var distanceDifference = (currentDistanceBetweenTouches - this._previousDistance);

    set(this, 'velocity', distanceDifference / timeDifference);
    set(this, 'scale', currentDistanceBetweenTouches / this._previousDistance);
    
    this._previousTimestamp = get(this.touches,'timestamp');
    this._previousDistance = currentDistanceBetweenTouches;
  },

  eventWasRejected: function() {
    set(this, 'scale', this._previousScale);
  }
});

SC.Gestures.register('pinch', SC.PinchGestureRecognizer);

})({});


(function(exports) {
// ==========================================================================
// Project:  SproutCore Runtime
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get;
var set = SC.set;
var x = 0;

/**
  @class

  Recognizes a multi-touch pan gesture. Pan gestures require a specified number
  of fingers to move and will record and update the center point between the
  touches.

  For panChange events, the pan gesture recognizer includes a translation property
  which can be applied as a CSS transform directly. Translation values are hashes
  which contain an x and a y value.

    var myview = SC.View.create({
      elementId: 'gestureTest',
      panChange: function(recognizer) {
        var translation = recognizer.get('translation');
        this.$().css('-webkit-transform','translate3d('+translate.x+'px,'+translate.y+'px,0)');
      }
    })

  You can specify how many touches the gesture requires to start using the numberOfRequiredTouches
  property, which you can set in the panOptions hash:

    var myview = SC.View.create({
      panOptions: {
        numberOfRequiredTouches: 3
      }
      ...
    })

  @extends SC.Gesture
*/
SC.PanGestureRecognizer = SC.Gesture.extend({

  /**
    The translation value which represents the current amount of movement that has been applied
    to the view. You would normally apply this value directly to your element as a 3D
    transform.

    @type Location
  */
  translation: null,

  //..................................................
  // Private Methods and Properties

  /**
    Used to measure offsets

    @private
    @type Number
  */
  _previousLocation: null,

  /**
    Used for rejected events

    @private
    @type Hash
  */
  _previousTranslation: null,

  /**
    The pixel distance that the fingers need to move before this gesture is recognized.

    @private
    @type Number
  */
  _translationThreshold: 5,

  init: function() {
    this._super();
    set(this, 'translation', {x:0,y:0});
  },

  didBecomePossible: function() {
    this._previousLocation = this.centerPointForTouches(get(this.touches,'touches'));
  },

  shouldBegin: function() {
    var previousLocation = this._previousLocation;
    var currentLocation = this.centerPointForTouches(get(this.touches,'touches'));

    var x = previousLocation.x;
    var y = previousLocation.y;
    var x0 = currentLocation.x;
    var y0 = currentLocation.y;

    var distance = Math.sqrt((x -= x0) * x + (y -= y0) * y);
    return distance >= this._translationThreshold;
  },

  didChange: function() {
    var previousLocation = this._previousLocation;
    var currentLocation = this.centerPointForTouches(get(this.touches,'touches'));
    var translation = {x:currentLocation.x, y:currentLocation.y};

    translation.x = currentLocation.x - previousLocation.x;
    translation.y = currentLocation.y - previousLocation.y;

    this._previousTranslation = get(this, 'translation');
    set(this, 'translation', translation);
    this._previousLocation = currentLocation;
  },

  eventWasRejected: function() {
    set(this, 'translation', this._previousTranslation);
  }
});

SC.Gestures.register('pan', SC.PanGestureRecognizer);

})({});


(function(exports) {
// ==========================================================================
// Project:  SproutCore Runtime
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get;
var set = SC.set;

/**
  @class

  Recognizes a multi-touch tap gesture. Tap gestures allow for a certain amount
  of wiggle-room between a start and end of a touch. Taps are discrete gestures
  so only tapStart() and tapEnd() will get fired on a view.

    var myview = SC.View.create({
      elementId: 'gestureTest',
      tapStart: function(recognizer) {
        $('#gestureTest').css('background','green');
      },

      tapEnd: function(recognizer) {
        $('#gestureTest').css('background','yellow');
      }
    })

  You can specify how many touches the gesture requires to start using the numberOfRequiredTouches
  property, which you can set in the panOptions hash:

    var myview = SC.View.create({
      panOptions: {
        numberOfRequiredTouches: 3
      }
      ...
    })

  And you can also specify the number of taps required for the gesture to fire using the numberOfTaps
  property.

  @extends SC.Gesture
*/
SC.TapGestureRecognizer = SC.Gesture.extend({

  /**
    The translation value which represents the current amount of movement that has been applied
    to the view. You would normally apply this value directly to your element as a 3D
    transform.

    @type Location
  */
  numberOfTaps: 1,

  //..................................................
  // Private Methods and Properties

  /** @private */
  MULTITAP_DELAY: 150,

  /** @private */
  gestureIsDiscrete: true,

  /** @private */
  _initialLocation: null,

  /** @private */
  _waitingInterval: null,

  /** @private */
  _waitingForMoreTouches: false,

  /** @private */
  _moveThreshold: 10,

  shouldBegin: function() {
    return get(this.touches,'length') === get(this, 'numberOfRequiredTouches');
  },

  didBegin: function() {
    this._initialLocation = this.centerPointForTouches(get(this.touches,'touches'));

    if (get(this.touches,'length') < get(this, 'numberOfTaps')) {
      this._waitingForMoreTouches = true;
      this._waitingInterval = window.setInterval(this._intervalFired,this.MULTITAP_DELAY);
    }
  },

  shouldEnd: function() {
    var currentLocation = this.centerPointForTouches(get(this.touches,'touches'));

    var x = this._initialLocation.x;
    var y = this._initialLocation.y;
    var x0 = currentLocation.x;
    var y0 = currentLocation.y;

    var distance = Math.sqrt((x -= x0) * x + (y -= y0) * y);

    return (Math.abs(distance) < this._moveThreshold) && !this._waitingForMoreTouches;
  },

  didEnd: function() {
    this._initialLocation = null;
  },

  didCancel: function() {
    this._initialLocation = null;
  },

  _intervalFired: function() {
    window.clearInterval(this._waitingInterval);
    _waitingForMoreTouches = false;
  }
});

SC.Gestures.register('tap', SC.TapGestureRecognizer);

})({});


(function(exports) {



})({});


(function(exports) {
// ==========================================================================
// Project:  SproutCore Runtime
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get;
var set = SC.set;

/** 
  @class
  
  Extends SC.View by making the init method gesture-aware.

  @extends SC.Object
*/
SC.View.reopen(
/** @scope SC.View.prototype */{

  /**
    The SC.GestureManager instance which will manager the gestures of the view.    
    This object is automatically created and set at init-time.

    @default null
    @type Array
  */
  eventManager: null,

  /**
    Inspects the properties on the view instance and create gestures if they're 
    used.
  */
  init: function() {
    this._super();

    var knownGestures = SC.Gestures.knownGestures();
    var eventManager = get(this, 'eventManager');

    if (knownGestures && !eventManager) {
      var gestures = [];

      for (var gesture in knownGestures) {
        if (this[gesture+'Start'] || this[gesture+'Change'] || this[gesture+'End']) {

          var optionsHash;
          if (this[gesture+'Options'] !== undefined && typeof this[gesture+'Options'] === 'object') {
            optionsHash = this[gesture+'Options'];
          } else {
            optionsHash = {};
          }

          optionsHash.name = gesture;
          optionsHash.view = this;

          gestures.push(knownGestures[gesture].create(optionsHash));
        }
      }

      var manager = SC.GestureManager.create({
        gestures: gestures
      });

      set(this, 'eventManager', manager);
 
    }
  }

});


})({});


(function(exports) {




})({});


(function(exports) {



})({});
