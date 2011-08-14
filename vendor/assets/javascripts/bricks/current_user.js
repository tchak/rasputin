// ==========================================================================
// Project:   SproutCore Bricks
// Copyright: ©2011 Paul Chavard
// Author :   Paul Chavard
//
// current_user.js
// ==========================================================================
SB = this.SB || {};

SB.CurrentUser = SC.Object.extend({
  username: '',
  password: '',
  rememberMe: true,

  url: '/authenticate',
  authenticateMethod: 'HEAD',

  isLoggedIn: false,
  isLoggingIn: false,

  didLoggedIn: SC.K,
  didLoggedOut: SC.K,
  loginSuccess: SC.K,
  loginError: SC.K,

  setCredentials: SC.K,
  resetCredentials: SC.K,

  login: function() {
    if (this.get('isLoggedIn')) {return;}
    this.set('isLoggingIn', true);
    var username = this.get('username'),
        password = this.get('password');
    if (!SC.empty(username) && !SC.empty(password)) {
      this.setCredentials(username, password);
    }
    var method = "%@Url".fmt(this.get('authenticateMethod').toLowerCase());
    SC.Request[method](this.get('url')).json()
      .notify(this, 'loginComplete')
      .send();
  },

  logout: function() {
    if (!this.get('isLoggedIn')) {return;}
    this.setProperties({'username': '', 'password': ''});
    this.resetCredentials();
    this.set('isLoggedIn', false);
    this.didLoggedOut();
  },

  /*
    @private
  */
  loginComplete: function(response) {
    this.set('isLoggingIn', false);
    if (SC.ok(response)) {
      this.set('isLoggedIn', true);
      this.loginSuccess(response);
      this.didLoggedIn();
      this.setProperties({'username': '', 'password': ''});
    } else {
      this.set('isLoggedIn', false);
      this.set('password', '');
      this.resetCredentials();
      this.loginError(response);
    }
  }
});
