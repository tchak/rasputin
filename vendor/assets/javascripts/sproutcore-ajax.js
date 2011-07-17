
(function(exports) {
// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get, set = SC.set, getPath = SC.getPath;

/**
  @class

  A response represents a single response from a server request.  An instance
  of this class is returned whenever you call SC.Request.send().

  @extend SC.Object
  @since SproutCore 1.0
*/
SC.Response = SC.Object.extend(
/** @scope SC.Response.prototype */ {

  /**
    Walk like a duck
    
    @type Boolean
  */
  isResponse: true,
  
  /**
    Becomes true if there was a failure.  Makes this into an error object.
    
    @type Boolean
    @default false
  */
  isError: false,

  /**
    Always the current response

    @field
    @type SC.Response
    @default `this`
  */
  errorValue: function() {
    return this;
  }.property().cacheable(),

  /**
    The error object generated when this becomes an error

    @type SC.Error
    @default null
  */
  errorObject: null,

  /**
    Request used to generate this response.  This is a copy of the original
    request object as you may have modified the original request object since
    then.

    To retrieve the original request object use originalRequest.

    @type SC.Request
    @default null
  */
  request: null,
  
  /**
    The request object that originated this request series.  Mostly this is
    useful if you are looking for a reference to the original request.  To
    inspect actual properties you should use request instead.

    @field
    @type SC.Request
    @observes request
  */
  originalRequest: function() {
    var ret = get(this, 'request');
    while (get(ret, 'source')) { ret = get(ret, 'source'); }
    return ret ;
  }.property('request').cacheable(),

  /** 
    Type of request. Must be an HTTP method. Based on the request.

    @field
    @type String
    @observes request
  */
  type: function() {
    return getPath(this, 'request.type');
  }.property('request').cacheable(),

  /**
    URL of request.

    @field
    @type String
    @observes request
  */
  url: function() {
    return getPath(this, 'request.url');
  }.property('request').cacheable(),

  /**
    Returns the hash of listeners set on the request.

    @field
    @type Hash
    @observes request
  */
  listeners: function() {
    return getPath(this, 'request.listeners');
  }.property('request').cacheable(),

  /**
    The response status code.

    @type Number
    @default -100
  */
  status: -100, // READY

  /**
    Headers from the response. Computed on-demand

    @type Hash
    @default null
  */
  headers: null,

  /**
    The response body or the parsed JSON.
  */
  body: null,

  /**
    Set to true if response is cancelled

    @type Boolean
    @default false
  */
  isCancelled: false,

  /**
    Set to true if the request timed out. Set to false if the request has
    completed before the timeout value. Set to null if the timeout timer is
    still ticking.

    @type Boolean
    @default null
  */
  timedOut: null,

  // ..........................................................
  // METHODS
  // 

  /**
    Called by the request manager when its time to actually run. This will
    invoke any callbacks on the source request then invoke transport() to
    begin the actual request.
  */
  fire: function() {
    var req = get(this, 'request'),
        source = req ? get(req, 'source') : null;

    // first give the source a chance to fixup the request and response
    // then freeze req so no more changes can happen.
    if (source && source.willSend) { source.willSend(req, this); }
    req.freeze();

    // if the source did not cancel the request, then invoke the transport
    // to actually trigger the request.  This might receive a response 
    // immediately if it is synchronous.
    if (!get(this, 'isCancelled')) { this.invokeTransport(); }

    // if the transport did not cancel the request for some reason, let the
    // source know that the request was sent
    if (!this.get('isCancelled') && source && source.didSend) {
      source.didSend(req, this);
    }
  },

  /**
    Called by `SC.Response#fire()`. Starts the transport by invoking the
    `SC.Response#receive()` function.
  */
  invokeTransport: function() {
    this.receive(function(proceed) { set(this, 'status', 200); }, this);
  },

  /**
    Invoked by the transport when it receives a response. The passed-in
    callback will be invoked to actually process the response. If cancelled
    we will pass false. You should clean up instead.

    Invokes callbacks on the source request also.

    @param {Function} callback the function to receive
    @param {Object} context context to execute the callback in
    @returns {SC.Response} receiver
  */
  receive: function(callback, context) {
    var req = get(this, 'request');
    var source = req ? get(req, 'source') : null;

    SC.run(this, function() {
      // invoke the source, giving a chance to fixup the response or (more
      // likely) cancel the request.
      if (source && source.willReceive) { source.willReceive(req, this); }

      // invoke the callback.  note if the response was cancelled or not
      callback.call(context, !get(this, 'isCancelled'));

      // if we weren't cancelled, then give the source first crack at handling
      // the response.  if the source doesn't want listeners to be notified,
      // it will cancel the response.
      if (!get(this, 'isCancelled') && source && source.didReceive) {
        source.didReceive(req, this);
      }

      // notify listeners if we weren't cancelled.
      if (!get(this, 'isCancelled')) { this.notify(); }
    });

    // no matter what, remove from inflight queue
    SC.Request.manager.transportDidClose(this);
    return this;
  },

  /**
    Default method just closes the connection. It will also mark the request
    as cancelled, which will not call any listeners.
  */
  cancel: function() {
    if (!get(this, 'isCancelled')) {
      set(this, 'isCancelled', true) ;
      this.cancelTransport() ;
      SC.Request.manager.transportDidClose(this) ;
    }
  },

  /**
    Override with concrete implementation to actually cancel the transport.
  */
  cancelTransport: function() {},

  /**
    Notifies any saved target/action. Call whenever you cancel, or end.

    @returns {SC.Response} receiver
  */
  notify: function() {
    var listeners = this.get('listeners'),
        status = this.get('status'),
        baseStat = Math.floor(status / 100) * 100,
        handled = false;

    if (!listeners) { return this; }

    handled = this._notifyListeners(listeners, status);
    if (!handled && baseStat !== status) { handled = this._notifyListeners(listeners, baseStat); }
    if (!handled && status !== 0) { handled = this._notifyListeners(listeners, 0); }
    
    return this ;
  },
  
  /**
    String representation of the response object

    @returns {String}
  */
  toString: function() {
    var ret = this._super();
    return "%@<%@ %@, status=%@".fmt(ret, this.get('type'), this.get('address'), this.get('status'));
  },

  /**
    @private

    Will notify each listener. Returns true if any of the listeners handle.
  */
  _notifyListeners: function(listeners, status) {
    var notifiers = listeners[status], params, target, action;
    if (!notifiers) { return false; }

    var handled = false;
    var len = notifiers.length;

    for (var i = 0; i < len; i++) {
      var notifier = notifiers[i];
      params = (notifier.params || []).copy();
      params.unshift(this);

      target = notifier.target;
      action = notifier.action;
      if (SC.typeOf(action) === 'string') { action = target[action]; }

      handled = action.apply(target, params);
    }

    return handled;
  }
});

/**
  Concrete implementation of SC.Response that implements support for using 
  jqXHR requests.
  
  @extends SC.Response
*/
SC.XHRResponse = SC.Response.extend({

  /**
    Implement transport-specific support for fetching all headers
  */
  headers: function() {
    var rawRequest = get(this, 'rawRequest'),
        str = rawRequest ? rawRequest.getAllResponseHeaders() : null,
        ret = {};
        
    if (!str) return ret;
    
    str.split("\n").forEach(function(header) {
      var idx = header.indexOf(':'),
          key, value;
      if (idx>=0) {
        key = header.slice(0,idx);
        value = SC.String.trim(header.slice(idx+1));
        ret[key] = value ;
      }
    }, this);
    
    return ret ;
  }.property('status').cacheable(),
  
  /**
    Implement transport-specific support for fetching named header
  */
  header: function(key) {
    var rawRequest = get(this, 'rawRequest');
    return rawRequest ? rawRequest.getResponseHeader(key) : null;    
  },

  /**
  */
  cancelTransport: function() {
    var rawRequest = get(this, 'rawRequest');
    if (rawRequest) rawRequest.abort();
    set(this, 'rawRequest', null);
  },

  /**
  */
  invokeTransport: function() {
    var async = !!getPath(this, 'request.isAsynchronous');
    var rawRequest = this.createRequest();

    // save it 
    set(this, 'rawRequest', rawRequest);

    // not async
    if (!async) this.finishRequest();

    return rawRequest;
  },
  
  /**
    Creates the jqXHR object.

    @returns {jqXHR}
  */
  createRequest: function() {
    var request = get(this, 'request');
    return SC.$.ajax({
      url: get(this, 'url'),
      type: get(this, 'type'),
      dataType: get(request, 'dataType'),
      async: get(request, 'isAsynchronous'),
      headers: get(request, 'headers'),
      data: get(request, 'body'),
      timeout: get(request, 'timeout'),
      ifModified: get(request, 'ifModified'),
      complete: this.finishRequest,
      success: this._didLoadContent,
      context: this
    });
  },

  /**
    @private
  
    Called by the jqXHR when it responds with some final results.
    
    @param {jqXHR} rawRequest the actual request
    @returns {Boolean} request success
  */
  finishRequest: function(rawRequest) {
    if (rawRequest.readyState === 4 && !get(this, 'timedOut')) {
      this.receive(function(proceed) {
        if (!proceed) return; // skip receiving...
        var statusText = rawRequest.statusText,
            status = rawRequest.status;
        set(this, 'status', status);
        if (statusText === 'success' || statusText === 'notmodified') {
          set(this, 'isError', false);
          set(this, 'errorObject', null);
        } else {
          if (statusText === 'timeout') {
            set(this, 'timedOut', true);
            this.cancelTransport();
          }
          var error = new SC.Error('%@ Request %@'.fmt(statusText, status));
          set(error, 'errorValue', this);
          set(this, 'isError', true);
          set(this, 'errorObject', error);
        }
      }, this);

      return true;
    }
    return false;
  },

  /**
    @private
  */
  _didLoadContent: function(data) {
    set(this, 'body', data);
  }

});

SC.HTTPError = SC.Object.extend({
  
});

SC.ok = function(ret) {
  return (ret !== false) && !(ret && ret.isError);
};

})({});


(function(exports) {
// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get, set = SC.set;

/**
  @class

  Implements support for Ajax requests using XHR and other prototcols.

  SC.Request is much like an inverted version of the request/response objects
  you receive when implementing HTTP servers.

  To send a request, you just need to create your request object, configure
  your options, and call send() to initiate the request.

  @extends SC.Object
  @extends SC.Copyable
  @extends SC.Freezable
*/
SC.Request = SC.Object.extend(SC.Copyable, SC.Freezable, {

  // ..........................................................
  // PROPERTIES
  // 

  /**
    Sends the request asynchronously instead of blocking the browser. You
    should almost always make requests asynchronous. You can change this
    options with the async() helper option (or simply set it directly).

    @type Boolean
    @default YES
  */
  isAsynchronous: true,

  /**
    Current set of headers for the request

    @field
    @type Hash
    @default {}
  */
  headers: function() {
    var ret = this._headers;
    if (!ret) { ret = this._headers = {}; }
    return ret;
  }.property().cacheable(),

  /**
    Underlying response class to actually handle this request. Currently the
    only supported option is SC.XHRResponse which uses a traditional
    XHR transport.

    @type SC.Response
    @default SC.XHRResponse
  */
  responseClass: SC.XHRResponse,

  /**
    The original request for copied requests.

    @property SC.Request
    @default null
  */
  source: null,

  /**
    The URL this request to go to.

    @type String
    @default null
  */
  url: null,

  /**
    The HTTP method to use.

    @type String
    @default 'GET'
  */
  type: 'GET',

  /**
    The body of the request.  May be an object is isJSON or isXML is set,
    otherwise should be a string.

    @type Object|String
    @default null
  */
  body: null,

  /**
    @type String
    @default 'json'
  */
  dataType: 'json',

  /**
    An optional timeout value of the request, in milliseconds. The timer
    begins when SC.Response#fire is actually invoked by the request manager
    and not necessarily when SC.Request#send is invoked. If this timeout is
    reached before a response is received, the equivalent of
    SC.Request.manager#cancel() will be invoked on the SC.Response instance
    and the didReceive() callback will be called.

    An exception will be thrown if you try to invoke send() on a request that
    has both a timeout and isAsyncronous set to NO.

    @type Number
    @default null
  */
  timeout: null,

  /**
    
  */
  ifModified: false,

  // ..........................................................
  // CALLBACKS
  //

  /**
    Invoked on the original request object just before a copied request is
    frozen and then sent to the server. This gives you one last change to
    fixup the request; possibly adding headers and other options.

    If you do not want the request to actually send, call cancel().

    @param {SC.Request} request A copy of the request object, not frozen
    @param {SC.Response} response The object that will wrap the response
  */
  willSend: function(request, response) {},

  /**
    Invoked on the original request object just after the request is sent to
    the server. You might use this callback to update some state in your
    application.

    The passed request is a frozen copy of the request, indicating the
    options set at the time of the request.

    @param {SC.Request} request A copy of the request object, frozen
    @param {SC.Response} response The object that will wrap the response
    @returns {Boolean} YES on success, NO on failure
  */
  didSend: function(request, response) {},

  /**
    Invoked when a response has been received but not yet processed. This is
    your chance to fix up the response based on the results. If you don't
    want to continue processing the response call response.cancel().

    @param {SC.Request} request A copy of the request object, frozen
    @param {SC.Response} response The object that will wrap the response
  */
  willReceive: function(request, response) {},

  /**
    Invoked after a response has been processed but before any listeners are
    notified. You can do any standard processing on the request at this
    point. If you don't want to allow notifications to continue, call
    response.cancel()

    @param {SC.Request} request A copy of the request object, frozen
    @param {SC.Response} response The object that will wrap the response
  */
  didReceive: function(request, response) {},


  // ..........................................................
  // HELPER METHODS
  //

  /** @private */
  concatenatedProperties: 'COPY_KEYS',

  /** @private */
  COPY_KEYS: ['isAsynchronous', 'dataType', 'url', 'type', 'timeout', 'body', 'responseClass', 'willSend', 'didSend', 'willReceive', 'didReceive'],
  
  /**
    Returns a copy of the current request. This will only copy certain
    properties so if you want to add additional properties to the copy you
    will need to override copy() in a subclass.

    @returns {SC.Request} new request
  */
  copy: function() {
    var ret = {},
        keys = this.COPY_KEYS,
        loc = keys.length,
        key, listeners, headers;

    while(--loc >= 0) {
      key = keys[loc];
      if (this.hasOwnProperty(key)) {
        ret[key] = this.get(key);
      }
    }

    if (this.hasOwnProperty('listeners')) {
      ret.listeners = SC.copy(this.get('listeners'));
    }

    if (this.hasOwnProperty('_headers')) {
      ret._headers = SC.copy(this._headers);
    }

    ret.source = get(this, 'source') || this;

    return this.constructor.create(ret);
  },

  /**
    To set headers on the request object. Pass either a single key/value
    pair or a hash of key/value pairs. If you pass only a header name, this
    will return the current value of the header.

    @param {String|Hash} key
    @param {String} value
    @returns {SC.Request|Object} receiver
  */
  header: function(key, value) {
    var headers;

    if (SC.typeOf(key) === 'string') {
      headers = this._headers;
      if (arguments.length === 1) {
        return headers ? headers[key] : null;
      } else {
        this.propertyWillChange('headers');
        if (!headers) { headers = this._headers = {}; }
        headers[key] = value;
        this.propertyDidChange('headers');
        return this;
      }

    // handle parsing hash of parameters
    } else if (value === undefined) {
      headers = key;
      this.beginPropertyChanges();
      for(key in headers) {
        if (!headers.hasOwnProperty(key)) { continue; }
        this.header(key, headers[key]);
      }
      this.endPropertyChanges();
      return this;
    }

    return this;
  },

  /**
    Clears the list of headers that were set on this request.
    This could be used by a subclass to blow-away any custom
    headers that were added by the super class.
  */
  clearHeaders: function() {
    this.propertyWillChange('headers');
    this._headers = {};
    this.propertyDidChange('headers');
  },

  /**
    Converts the current request to be asynchronous.

    @param {Boolean} flag YES to make asynchronous, NO or undefined. Default YES.
    @returns {SC.Request} receiver
  */
  async: function(flag) {
    if (flag === undefined) { flag = true; }
    set(this, 'isAsynchronous', flag);
    return this;
  },

  /**
    Sets the maximum amount of time the request will wait for a response.

    @param {Number} timeout The timeout in milliseconds.
    @returns {SC.Request} receiver
  */
  timeoutAfter: function(timeout) {
    set(this, 'timeout', timeout);
    return this;
  },

  /**
    Converts the current request to use JSON.

    @returns {SC.Request} receiver
  */
  json: function() {
    set(this, 'dataType', 'json');
    return this;
  },

  /**
    Converts the current request to use XML.

    @returns {SC.Request} recevier
  */
  xml: function() {
    set(this, 'dataType', 'xml');
    return this;
  },

  /**
    
  */
  isJSON: function() {
    return get(this, 'dataType') === 'json';
  }.property('dataType').cacheable(),

  /**
    
  */
  isXML: function() {
    return get(this, 'dataType') === 'xml';
  }.property('dataType').cacheable(),

  /**
    Will fire the actual request. If you have set the request to use JSON
    mode then you can pass any object that can be converted to JSON as the
    body. Otherwise you should pass a string body.
    
    @param {String|Object} [body]
    @returns {SC.Response} New response object
  */  
  send: function(body) {
    // Sanity-check: Be sure a timeout value was not specified if the request
    // is synchronous (because it wouldn't work).
    var timeout = get(this, 'timeout');
    if (timeout && !get(this, 'isAsynchronous')) {
      throw "Timeout values cannot be used with synchronous requests";
    } else if (timeout === 0) {
      throw "The timeout value must either not be specified or must be greater than 0";
    }

    if (body) { set(this, 'body', body); }
    return SC.Request.manager.sendRequest(this.copy());
  },

  /**
    Resends the current request. This is more efficient than calling send()
    for requests that have already been used in a send. Otherwise acts just
    like send(). Does not take a body argument.

    @returns {SC.Response} new response object
  */
  resend: function() {
    var req = get(this, 'source') ? this : this.copy();
    return SC.Request.manager.sendRequest(req);
  },

  /**
    Configures a callback to execute when a request completes. You must pass
    at least a target and action/method to this and optionally a status code.
    You may also pass additional parameters which will be passed along to your
    callback. If your callback handled the notification, it should return YES.

    ## Scoping With Status Codes

    If you pass a status code as the first option to this method, then your
    notification callback will only be called if the response status matches
    the code. For example, if you pass 201 (or SC.Request.CREATED) then
    your method will only be called if the response status from the server
    is 201.

    You can also pass "generic" status codes such as 200, 300, or 400, which
    will be invoked anytime the status code is the range if a more specific
    notifier was not registered first and returned YES.

    Finally, passing a status code of 0 or no status at all will cause your
    method to be executed no matter what the resulting status is unless a
    more specific notifier was registered and returned YES.

    ## Callback Format

    Your notification callback should expect to receive the Response object
    as the first parameter plus any additional parameters that you pass.

    @param {Number} status
    @param {Object} target
    @param {String|Function} action
    @param {Hash} params
    @returns {SC.Request} receiver
  */
  notify: function(status, target, action, params) {
    // normalize status
    var hasStatus = true;
    if (SC.typeOf(status) !== 'number') {
      params = $.makeArray(arguments).slice(2);
      action = target;
      target = status;
      status = 0;
      hasStatus = false;
    } else {
      params = $.makeArray(arguments).slice(3);
    }

    var listeners = get(this, 'listeners');
    if (!listeners) { set(this, 'listeners', listeners = {}); }
    if(!listeners[status]) { listeners[status] = []; }

    listeners[status].push({target: target, action: action, params: params});

    return this;
  }

});

SC.Request.reopenClass({

  /**
    Helper method for quickly setting up a GET request.

    @param {String} url of request
    @returns {SC.Request} receiver
  */
  getUrl: function(url) {
    return this.create().set('url', url).set('type', 'GET');
  },

  /**
    Helper method for quickly setting up a HEAD request.

    @param {String} url of request
    @returns {SC.Request} receiver
  */
  headUrl: function(url) {
    return this.create().set('url', url).set('type', 'HEAD');
  },

  /**
    Helper method for quickly setting up a DELETE request.

    @param {String} url of request
    @returns {SC.Request} receiver
  */
  deleteUrl: function(url) {
    return this.create().set('url', url).set('type', 'DELETE');
  },

  /**
    Helper method for quickly setting up a POST request.

    @param {String} url of request
    @param {String} body
    @returns {SC.Request} receiver
  */
  postUrl: function(url, body) {
    var req = this.create().set('url', url).set('type', 'POST');
    if (body) { set(req, 'body', body); }
    return req;
  },

  /**
    Helper method for quickly setting up a PUT request.

    @param {String} url of request
    @param {String} body
    @returns {SC.Request} receiver
  */
  putUrl: function(url, body) {
    var req = this.create().set('url', url).set('type', 'PUT');
    if (body) { set(req, 'body', body); }
    return req;
  }

});

/**
  @class

  The request manager coordinates all of the active XHR requests. It will
  only allow a certain number of requests to be active at a time; queuing
  any others. This allows you more precise control over which requests load
  in which order.
*/
SC.Request.manager = SC.Object.create({

  /**
    Maximum number of concurrent requests allowed. 6 for all browsers.
    
    @type Number
    @default 6
  */
  maxRequests: 6,

  /**
    Current requests that are inflight.

    @type Array
    @default []
  */
  inflight: [],

  /**
    Requests that are pending and have not been started yet.

    @type Array
    @default []
  */
  pending: [],


  // ..........................................................
  // METHODS
  // 
  
  /**
    Invoked by the send() method on a request. This will create a new low-
    level transport object and queue it if needed.
    
    @param {SC.Request} request the request to send
    @returns {SC.Object} response object
  */
  sendRequest: function(request) {
    if (!request) { return null; }

    // create low-level transport.  copy all critical data for request over
    // so that if the request has been reconfigured the transport will still
    // work.
    var response = get(request, 'responseClass').create({request: request});

    // add to pending queue
    get(this, 'pending').pushObject(response);
    this.fireRequestIfNeeded();

    return response;
  },

  /** 
    Cancels a specific request. If the request is pending it will simply
    be removed. Otherwise it will actually be cancelled.

    @param {Object} response a response object
    @returns {Boolean} YES if cancelled
  */
  cancel: function(response) {
    var pending = get(this, 'pending'),
        inflight = get(this, 'inflight'),
        idx;

    if (pending.indexOf(response) >= 0) {
      this.propertyWillChange('pending');
      pending.removeObject(response);
      this.propertyDidChange('pending');
      return true;
    } else if (inflight.indexOf(response) >= 0) {
      response.cancel();

      inflight.removeObject(response);
      this.fireRequestIfNeeded();
      return true;
    }

    return false;
  },

  /**
    Cancels all inflight and pending requests.

    @returns {Boolean} YES if any items were cancelled.
  */
  cancelAll: function() {
    if (get(this, 'pending').length || get(this, 'inflight').length) {
      set(this, 'pending', []);
      get(this, 'inflight').forEach(function(r) { r.cancel(); });
      set(this, 'inflight', []);
      return true;
    }

    return false;
  },
  
  /**
    Checks the inflight queue. If there is an open slot, this will move a
    request from pending to inflight.

    @returns {Object} receiver
  */
  fireRequestIfNeeded: function() {
    var pending = get(this, 'pending'),
        inflight = get(this, 'inflight'),
        max = get(this, 'maxRequests'),
        next;

    if ((pending.length>0) && (inflight.length<max)) {
      next = pending.shiftObject();
      inflight.pushObject(next);
      next.fire();
    }
  },

  /**
    Called by a response/transport object when finishes running. Removes
    the transport from the queue and kicks off the next one.
  */
  transportDidClose: function(response) {
    get(this, 'inflight').removeObject(response);
    this.fireRequestIfNeeded();
  }

});

})({});


(function(exports) {
// ==========================================================================
// Project:   SproutCore AJAX
// Copyright: ©2011 Paul Chavard
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


})({});
