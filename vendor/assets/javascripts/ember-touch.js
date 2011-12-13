(function(exports) {
// ==========================================================================
// Project:  Ember Runtime
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = Ember.get;
var set = Ember.set;

/**
  @class

  Registry of known gestures in the system. This is a singleton class, and is
  used by Ember.View to analyze instances of Ember.View for gesture support.

  You will not use this class yourself. Rather, gesture recognizers will call
  Ember.Gestures.register(name, recognizer) when they want to make the system aware
  of them.

  @private
  @extends Ember.Object
*/
Ember.Gestures = Ember.Object.create(
/** @scope Ember.Gestures.prototype */{

  _registeredGestures: null,

  init: function() {
    this._registeredGestures = {};

    return this._super();
  },

  /**
    Registers a gesture recognizer to the system. The gesture recognizer is
    identified by the name parameter, which must be globally unique.
  */
  register: function(name, recognizer) {
    var registeredGestures = this._registeredGestures;

    if (registeredGestures[name] !== undefined) {
      throw new Ember.Error(name+" already exists as a registered gesture recognizers. Gesture recognizers must have globally unique names.");
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

var get = Ember.get;
var set = Ember.set;

/**
  @class

  Manages multiplegesture recognizers that are associated with a view.
  This class is instantiated automatically by Ember.View and you wouldn't
  interact with it yourself.

  Ember.GestureManager mainly acts as a composite for the multiple gesture
  recognizers associated with a view. Whenever it gets a touch event, it
  relays it to the gestures. The other main resposibility of
  Ember.GestureManager is to handle re-dispatching of events to the view.

  @extends Ember.Object
*/
Ember.GestureManager = Ember.Object.extend({

  /**
    An array containing all the gesture recognizers associated with a
    view. This is set automatically by Ember.View.

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
    view = get(view, 'parentView');

    while(view) {
      var manager = get(view, 'eventManager');

      if (manager !== undefined && manager !== null) {
        var gestures = get(manager, 'gestures');

        for (var i=0, l=gestures.length; i<l; i++) {
          if (get(gestures[i], 'state') === Ember.Gesture.WAITING_FOR_TOUCHES) {
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

      if (Ember.typeOf(handler) === 'function') {
        result = handler.call(gesture, eventObject, view, this);
      }
    }

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

var get = Ember.get;
var set = Ember.set;

/**
  @class
  @private

  Used to manage and maintain a list of active touches related to a gesture 
  recognizer.
*/
Ember.TouchList = Ember.Object.extend({
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



var get = Ember.get;
var set = Ember.set;

var sigFigs = 100;

/**
  @class

  Base class for all gesture recognizers. Handles low-level touch and state
  management, and provides some utility methods and some required methods all
  gesture recognizers are expected to implement.

  ## Overview

  Gestures coalesce multiple touch events to a single higher-level gesture
  event. For example, a tap gesture recognizer takes information about a
  touchstart event, a few touchmove events, and a touchend event and uses
  some heuristics to decide whether or not that sequence of events qualifies
  as a tap event. If it does, then it will notify the view of the higher-level
  tap events.

  Gesture events follow the format:

    * *[GESTURE_NAME]* Start - Sent when a gesture has gathered enough information
        to begin tracking the gesture

    * *[GESTURE_NAME]* Change - Sent when a gesture has already started and has
        received touchmove events that cause its state to change

    * *[GESTURE_NAME]* End - Sent when a touchend event is received and the gesture
        recognizer decides that the gesture is finished.

    * *[GESTURE_NAME]* Cancel - Sent when a touchcancel event is received.

  There are two types of gestures: Discrete and Continuous gestures. In contrast
  to continuous gestures, discrete gestures don't have any change events. Rather,
  the end event is the only one that gets sent to the view.

  ## Usage

  While you wouldn't use Ember.Gesture directly, all its subclasses implement the 
  same API. For example, to implement pinch on a view, you implement one or more 
  of the pinch events. For example:

      var myView = Ember.View.create({
        pinchStart: function(recognizer) {
          this.$().css('background','red');
        },

        pinchChange: function(recognizer) {
          var scale = recognizer.get('scale');
          this.$().css('scale',function(index, value) {
            return recognizer.get('scale') * value
          });
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

  ## Customizing Gesture Recognizers

  Some of the gesture recognizers include properties that can be customized by 
  the user for a specific instance of a view. For example, a pan gesture defaults 
  to being a one-finger gesture, but in some scenarios, it must be defined as a 
  two-finger gesture. In that case, you can override defaults by specifying an 
  Options hash. 

      var myView = Ember.View.create({
        panOptions: {
          numberOfRequiredTouches: 2
        }
      });      

  ## Creating Custom Gesture Recognizers

  Ember.Gesture also defines an API which its subclasses can implement to build
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
  values are the jQuery.Event objects. You can also access the length property to inspect 
  how many touches are active, this is mostly useful in shouldBegin since every other 
  callback can assume that there are as many active touches as specified in the 
  numberOfRequiredTouches property.

  ## Discrete vs Continuous Gestures

  There are two main classes of gesture recognizers: Discrete and Continuous 
  gestures. Discrete gestures do not get Start, Change nor Cancel events sent, 
  since they represent a single, instantaneous event, rather than a continuous 
  motion. If you are implementing your own discrete gesture recognizer, you must 
  set the isDiscreteGesture property to yes, and Ember.Gesture will adapt its behavior.

  Discrete gestures use the shouldEnd callback to either accept or decline the gesture
  event. If it is declined, then the gesture will enter a Cancelled state.
  
  @extends Ember.Object
*/

Ember.Gesture = Ember.Object.extend(
  /** @scope Ember.Gesture.prototype */{

  /**
    The current state of the gesture recognizer. This value can be any one
    of the states defined at the end of this file.

    @type Number
  */
  state: null,

  /**
    A string of the gesture recognizer's name. This value is set automatically
    but Ember.Gestures when a gesture is registered.

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
    this.touches = Ember.TouchList.create();
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
  attemptGestureEventDelivery: function(evt, view, eventName, stopPropagation) {
    if (stopPropagation === undefined) {
      stopPropagation = true;
    }

    if (this.notifyViewOfGestureEvent(view, eventName) === false) {
      this.eventWasRejected();
    } else if(stopPropagation) {
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

    if (Ember.typeOf(handler) === 'function') {
      result = handler.call(view, this, data);
    }

    return result;
  },

  toString: function() {
    return Ember.Gesture+'<'+Ember.guidFor(this)+'>';
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
      set(this ,'state', Ember.Gesture.WAITING_FOR_TOUCHES);

    } else {
      // Discrete gestures may skip the possible step if they're ready to begin
      if (get(this, 'gestureIsDiscrete') && this.shouldBegin()) {
        set(this, 'state', Ember.Gesture.BEGAN);
        this.didBegin();
      } else {
        set(this, 'state', Ember.Gesture.POSSIBLE);
        this.didBecomePossible();
      }
    }

    manager.redispatchEventToView(view,'touchstart', evt);
  },

  /** @private */
  touchMove: function(evt, view, manager) {
    var state = get(this, 'state');

    if (state === Ember.Gesture.WAITING_FOR_TOUCHES || state === Ember.Gesture.ENDED || state === Ember.Gesture.CANCELLED) {
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

    if (state === Ember.Gesture.POSSIBLE) {
      if (this.shouldBegin()) {
        set(this, 'state', Ember.Gesture.BEGAN);
        this.didBegin();

        // Give the gesture a chance to update its state so the view can get 
        // updated information in the Start event
        this.didChange();

        this.attemptGestureEventDelivery(evt, view, get(this, 'name')+'Start',(this.get('isDiscreteGesture'))? true: false);
      }

    // Discrete gestures don't fire changed events
    } else if ((state === Ember.Gesture.BEGAN || state === Ember.Gesture.CHANGED) && !get(this, 'gestureIsDiscrete')) {
      set(this, 'state', Ember.Gesture.CHANGED);
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
      if (this.state === Ember.Gesture.BEGAN && this.shouldEnd()) {
        set(this, 'state', Ember.Gesture.ENDED);
        this.didEnd();
        this.attemptGestureEventDelivery(evt, view, get(this, 'name')+'End');
      } else {
        set(this, 'state', Ember.Gesture.CANCELLED);
        this.didCancel();
        this.attemptGestureEventDelivery(evt, view, get(this, 'name')+'Cancel');
      } 
    } 
    else {
      if ((this.state === Ember.Gesture.BEGAN || this.state === Ember.Gesture.CHANGED) && this.shouldEnd()) {
        set(this, 'state', Ember.Gesture.ENDED);
        this.didEnd();

        this.attemptGestureEventDelivery(evt, view, get(this, 'name')+'End');
      } 

      manager.redispatchEventToView(view,'touchend', evt);
    }

    this._resetState();
  },

  /** @private */
  touchCancel: function(evt, view, manager) {
    if (this.state !== Ember.Gesture.CANCELLED) {
      this._resetState();
      set(this, 'state', Ember.Gesture.CANCELLED);
      this.notifyViewOfGestureEvent(view,get(this, 'name')+'Cancel');
    } else {
      manager.redispatchEventToView(view,'touchcancel', evt);
    }
  }
});

Ember.Gesture.WAITING_FOR_TOUCHES = 0;
Ember.Gesture.POSSIBLE = 1;
Ember.Gesture.BEGAN = 2;
Ember.Gesture.CHANGED = 3;
Ember.Gesture.ENDED = 4;
Ember.Gesture.CANCELLED = 4;

})({});


(function(exports) {
// ==========================================================================
// Project:  SproutCore Runtime
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = Ember.get;
var set = Ember.set;

var sigFigs = 100;

/**
  @class

  Recognizes a multi-touch pinch gesture. Pinch gestures require a specified number
  of fingers to move and will record and update the scale.

  For pinchChange events, the pinch gesture recognizer includes a scale property
  which can be applied as a CSS transform directly.

    var myview = Ember.View.create({
      elementId: 'gestureTest',
      
      pinchChange: function(rec) {
        this.$().css('scale',function(index, value) {
          return rec.get('scale') * value
        });
      }
    })

  You can specify how many touches the gesture requires to start using the numberOfRequiredTouches
  property, which you can set in the pinchOptions hash:

    var myview = Ember.View.create({
      pinchOptions: {
        numberOfRequiredTouches: 3
      }
      ...
    })


  @extends Ember.Gesture
*/
Ember.PinchGestureRecognizer = Ember.Gesture.extend({

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

Ember.Gestures.register('pinch', Ember.PinchGestureRecognizer);

})({});


(function(exports) {
// ==========================================================================
// Project:  SproutCore Runtime
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = Ember.get;
var set = Ember.set;
var x = 0;

/**
  @class

  Recognizes a multi-touch pan gesture. Pan gestures require a specified number
  of fingers to move and will record and update the center point between the
  touches.

  For panChange events, the pan gesture recognizer includes a translation property
  which can be applied as a CSS transform directly. Translation values are hashes
  which contain an x and a y value.

    var myview = Ember.View.create({
      elementId: 'gestureTest',
      
      panChange: function(rec) {
        var val = rec.get('translation');
        this.$().css({
          translateX: '%@=%@'.fmt((val.x < 0)? '-' : '+',Math.abs(val.x)),
          translateY: '%@=%@'.fmt((val.y < 0)? '-' : '+',Math.abs(val.y))
        });
      }
    })

  You can specify how many touches the gesture requires to start using the numberOfRequiredTouches
  property, which you can set in the panOptions hash:

    var myview = Ember.View.create({
      panOptions: {
        numberOfRequiredTouches: 3
      }
      ...
    })

  @extends Ember.Gesture
*/
Ember.PanGestureRecognizer = Ember.Gesture.extend({

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

Ember.Gestures.register('pan', Ember.PanGestureRecognizer);

})({});


(function(exports) {
// ==========================================================================
// Project:  SproutCore Runtime
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = Ember.get;
var set = Ember.set;

/**
  @class

  Recognizes a multi-touch tap gesture. Tap gestures allow for a certain amount
  of wiggle-room between a start and end of a touch. Taps are discrete gestures
  so only tapEnd() will get fired on a view.

    var myview = Ember.View.create({
      elementId: 'gestureTest',

      tapEnd: function(recognizer) {
        $('#gestureTest').css('background','yellow');
      }
    })

  You can specify how many touches the gesture requires to start using the numberOfRequiredTouches
  property, which you can set in the panOptions hash:

    var myview = Ember.View.create({
      tapOptions: {
        numberOfTaps: 3
      }
      ...
    })

  And you can also specify the number of taps required for the gesture to fire using the numberOfTaps
  property.

  @extends Ember.Gesture
*/
Ember.TapGestureRecognizer = Ember.Gesture.extend({

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

Ember.Gestures.register('tap', Ember.TapGestureRecognizer);

})({});


(function(exports) {



})({});


(function(exports) {
// ==========================================================================
// Project:  SproutCore Runtime
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = Ember.get;
var set = Ember.set;

/** 
  @class
  
  Extends Ember.View by making the init method gesture-aware.

  @extends Ember.Object
*/
Ember.View.reopen(
/** @scope Ember.View.prototype */{

  /**
    The Ember.GestureManager instance which will manager the gestures of the view.    
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

    var knownGestures = Ember.Gestures.knownGestures();
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

      var manager = Ember.GestureManager.create({
        gestures: gestures
      });

      set(this, 'eventManager', manager);
 
    }
  }

});

})({});

