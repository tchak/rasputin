(function() {
var get = SC.get, set = SC.set;

SC.State = SC.Object.extend({
  isState: true,
  parentState: null,
  start: null,

  init: function() {
    SC.keys(this).forEach(function(name) {
      var value = this[name];

      if (value && value.isState) {
        set(value, 'parentState', this);
        set(value, 'name', (get(this, 'name') || '') + '.' + name);
      }
    }, this);
  },

  initChildState: function(state) {
    set(state, 'parentState', this);
  },

  storyboard: SC.computed(function() {
    var parent = get(this, 'parentState');
    if (!parent) { return; }

    if (parent.isStoryboard) { return parent; }
    else { return get(parent, 'storyboard'); }
  }).property('parentState').cacheable(),

  sheet: SC.computed(function() {
    var parent = get(this, 'parentState');
    if (!parent) { return; }

    if (parent.isSheet) { return parent; }
    else { return get(parent, 'sheet'); }
  }).property('parentState').cacheable(),

  goToState: function(state) {
    var storyboard = get(this, 'storyboard');
    sc_assert("a state must have an associated storyboard", !!storyboard);

    storyboard.goToState(state);
  },

  enter: SC.K,
  exit: SC.K
});

})();
(function() {

var get = SC.get, set = SC.set;

SC.Sheet = SC.State.extend({
  isSheet: true,

  enter: function() {
    var view = get(this, 'view');

    if (view) {
      view.appendTo(this.getPath('parentState.rootElement'));
    }
  },

  exit: function() {
    var view = get(this, 'view');

    if (view) {
      view.remove();
    }
  }
});


})();
(function() {
var get = SC.get, set = SC.set, getPath = SC.getPath, fmt = SC.String.fmt;

SC.LOG_STATE_TRANSITIONS = false;

SC.Storyboard = SC.State.extend({
  rootElement: 'body',

  isStoryboard: true,

  /**
    When creating a new storyboard, look for a default state to transition
    into. This state can either be named `start`, or can be specified using the
    `initialState` property.
  */
  init: function() {
    this._super();

    var initialState = get(this, 'initialState');

    if (!initialState && get(this, 'start')) {
      initialState = 'start';
    }

    if (initialState) {
      this.goToState(initialState);
    }
  },

  currentState: null,

  send: function(event, context) {
    this.sendRecursively(event, get(this, 'currentState'), context);
  },

  sendRecursively: function(event, currentState, context) {
    var log = SC.LOG_STATE_TRANSITIONS;

    var action = currentState[event];

    if (action) {
      if (log) { console.log("STORYBOARDS: Sending event '%@' to state %@.".fmt(event, currentState.name)); }
      action.call(currentState, context);
    } else {
      var parentState = get(currentState, 'parentState');
      if (parentState) { this.sendRecursively(event, parentState, context); }
    }
  },

  goToState: function(name) {
    var currentState = get(this, 'currentState') || this, state, newState;

    var exitStates = [];

    newState = getPath(currentState, name);
    state = currentState;

    if (!newState) {
      while (state && !newState) {
        exitStates[SC.guidFor(state)] = state;
        exitStates.push(state)

        state = get(state, 'parentState')
        newState = getPath(state, name);
      }
    }

    this.enterState(state, name, exitStates);
  },

  getState: function(name) {
    var state = get(this, name),
        parentState = get(this, 'parentState');

    if (state) {
      return state;
    } else if (parentState) {
      return parentState.getState(name);
    }
  },

  asyncEach: function(list, callback, doneCallback) {
    var async = false, self = this;

    if (!list.length) {
      if (doneCallback) { doneCallback.call(this); }
      return;
    }

    var head = list[0];
    var tail = list.slice(1);

    var transition = {
      async: function() { async = true; },
      resume: function() {
        self.asyncEach(tail, callback, doneCallback);
      }
    }

    callback.call(this, head, transition);

    if (!async) { transition.resume(); }
  },

  enterState: function(parent, name, exitStates) {
    var log = SC.LOG_STATE_TRANSITIONS;

    var parts = name.split("."), state = parent, enterStates = [];

    parts.forEach(function(name) {
      state = state[name];

      var guid = SC.guidFor(state);

      if (guid in exitStates) {
        exitStates.removeObject(state);
        delete exitStates[guid];
      } else {
        enterStates.push(state);
      }
    });

    this.asyncEach(exitStates, function(state, transition) {
      state.exit(transition);
    }, function() {
      this.asyncEach(enterStates, function(state, transition) {
        if (log) { console.log("STORYBOARDS: Entering " + state.name); }
        state.enter(transition);
      }, function() {
        var startState = state, enteredState;

        // right now, start states cannot be entered asynchronously
        while (startState = get(startState, 'start')) {
          enteredState = startState;
          startState.enter();
        }

        set(this, 'currentState', enteredState || state);
      });
    });
  }
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore Storyboards
// Copyright: ©2011 Living Social Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================



})();
(function() {

var get = SC.get, set = SC.set;

SC.Sheet = SC.State.extend({
  isSheet: true,

  enter: function() {
    var view = get(this, 'view');

    if (view) {
      view.appendTo(this.getPath('parentState.rootElement'));
    }
  },

  exit: function() {
    var view = get(this, 'view');

    if (view) {
      view.remove();
    }
  }
});


})();
(function() {
var get = SC.get, set = SC.set;

SC.State = SC.Object.extend({
  isState: true,
  parentState: null,
  start: null,

  init: function() {
    SC.keys(this).forEach(function(name) {
      var value = this[name];

      if (value && value.isState) {
        set(value, 'parentState', this);
        set(value, 'name', (get(this, 'name') || '') + '.' + name);
      }
    }, this);
  },

  initChildState: function(state) {
    set(state, 'parentState', this);
  },

  storyboard: SC.computed(function() {
    var parent = get(this, 'parentState');
    if (!parent) { return; }

    if (parent.isStoryboard) { return parent; }
    else { return get(parent, 'storyboard'); }
  }).property('parentState').cacheable(),

  sheet: SC.computed(function() {
    var parent = get(this, 'parentState');
    if (!parent) { return; }

    if (parent.isSheet) { return parent; }
    else { return get(parent, 'sheet'); }
  }).property('parentState').cacheable(),

  goToState: function(state) {
    var storyboard = get(this, 'storyboard');
    sc_assert("a state must have an associated storyboard", !!storyboard);

    storyboard.goToState(state);
  },

  enter: SC.K,
  exit: SC.K
});

})();
(function() {
var get = SC.get, set = SC.set, getPath = SC.getPath, fmt = SC.String.fmt;

SC.LOG_STATE_TRANSITIONS = false;

SC.Storyboard = SC.State.extend({
  rootElement: 'body',

  isStoryboard: true,

  /**
    When creating a new storyboard, look for a default state to transition
    into. This state can either be named `start`, or can be specified using the
    `initialState` property.
  */
  init: function() {
    this._super();

    var initialState = get(this, 'initialState');

    if (!initialState && get(this, 'start')) {
      initialState = 'start';
    }

    if (initialState) {
      this.goToState(initialState);
    }
  },

  currentState: null,

  send: function(event, context) {
    this.sendRecursively(event, get(this, 'currentState'), context);
  },

  sendRecursively: function(event, currentState, context) {
    var log = SC.LOG_STATE_TRANSITIONS;

    var action = currentState[event];

    if (action) {
      if (log) { console.log("STORYBOARDS: Sending event '%@' to state %@.".fmt(event, currentState.name)); }
      action.call(currentState, context);
    } else {
      var parentState = get(currentState, 'parentState');
      if (parentState) { this.sendRecursively(event, parentState, context); }
    }
  },

  goToState: function(name) {
    var currentState = get(this, 'currentState') || this, state, newState;

    var exitStates = [];

    newState = getPath(currentState, name);
    state = currentState;

    if (!newState) {
      while (state && !newState) {
        exitStates[SC.guidFor(state)] = state;
        exitStates.push(state)

        state = get(state, 'parentState')
        newState = getPath(state, name);
      }
    }

    this.enterState(state, name, exitStates);
  },

  getState: function(name) {
    var state = get(this, name),
        parentState = get(this, 'parentState');

    if (state) {
      return state;
    } else if (parentState) {
      return parentState.getState(name);
    }
  },

  asyncEach: function(list, callback, doneCallback) {
    var async = false, self = this;

    if (!list.length) {
      if (doneCallback) { doneCallback.call(this); }
      return;
    }

    var head = list[0];
    var tail = list.slice(1);

    var transition = {
      async: function() { async = true; },
      resume: function() {
        self.asyncEach(tail, callback, doneCallback);
      }
    }

    callback.call(this, head, transition);

    if (!async) { transition.resume(); }
  },

  enterState: function(parent, name, exitStates) {
    var log = SC.LOG_STATE_TRANSITIONS;

    var parts = name.split("."), state = parent, enterStates = [];

    parts.forEach(function(name) {
      state = state[name];

      var guid = SC.guidFor(state);

      if (guid in exitStates) {
        exitStates.removeObject(state);
        delete exitStates[guid];
      } else {
        enterStates.push(state);
      }
    });

    this.asyncEach(exitStates, function(state, transition) {
      state.exit(transition);
    }, function() {
      this.asyncEach(enterStates, function(state, transition) {
        if (log) { console.log("STORYBOARDS: Entering " + state.name); }
        state.enter(transition);
      }, function() {
        var startState = state, enteredState;

        // right now, start states cannot be entered asynchronously
        while (startState = get(startState, 'start')) {
          enteredState = startState;
          startState.enter();
        }

        set(this, 'currentState', enteredState || state);
      });
    });
  }
});

})();
