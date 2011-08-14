// ==========================================================================
// Project:   SproutCore Bricks
// Copyright: ©2011 Paul Chavard
// Author :   Paul Chavard
//
// toggle_view.js
// ==========================================================================
SB = this.SB || {};

SB.ToggleViewSupport = SC.Mixin.create({
  toggleMethod: 'toggle',

  _isVisibleDidChange: function() {
    var method = this.$()[this.get('toggleMethod')];
    if (!method) { method = 'toggle'; }
    method.call(this.$(), this.get('isVisible'));
  }.observes('isVisible'),

  show: function() {
    this.set('isVisible', true);
  },
  hide: function() {
    this.set('isVisible', false);
  },
  toggle: function() {
    this.toggleProperty('isVisible');
  }
});
