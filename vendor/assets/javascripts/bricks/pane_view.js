// ==========================================================================
// Project:   SproutCore Bricks
// Copyright: ©2011 Paul Chavard
// Author :   Paul Chavard
//
// pane_view.js
// ==========================================================================
SB = this.SB || {};
SB.APP_NAMESPACE = 'App';

SB.PaneView = SC.View.extend({
  init: function() {
    this._super();
    var paneName = this.get('name');
    this.set('classNames', ['%@-pane'.fmt(paneName)]);
    var templateName = [SB.PaneView.TEMPLATES_ROOT, paneName].join('_').replace(/^_/, '');
    this.set('templateName', templateName);
  },
  append: function() {
    var currentPane = SB.PaneView.currentPane;
    if (currentPane && currentPane.state === 'inDOM') {
      currentPane.hide();
    }
    if (this.state === 'inDOM') {
      this.show();
    } else {
      this.appendTo(SB.PaneView.SELECTOR); 
    }
    SB.PaneView.currentPane = this;
  }
});

SB.PaneView.reopenClass({
  TEMPLATES_ROOT: null,
  SELECTOR: '[role="application"]',
  currentPane: null,
  panes: []
});

SC.View.reopen({
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

SC.$(document).ready(function() {
  var app = window[SB.APP_NAMESPACE];
  if (SB.PaneView.panes.length > 0 && !app) {
    throw SC.Error("You have to set SB.APP_NAMESPACE to your SC.Application path");
  }
  SB.PaneView.panes.forEach(function(paneName) {
    app["%@PaneView".fmt(paneName)] = SB.PaneView.create({
      name: paneName.toLowerCase()
    });
  });
});
