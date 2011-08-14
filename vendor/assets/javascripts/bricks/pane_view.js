// ==========================================================================
// Project:   SproutCore Bricks
// Copyright: ©2011 Paul Chavard
// Author :   Paul Chavard
//
// pane_view.js
// ==========================================================================
SB = this.SB || {};

SB.PaneView = SC.View.extend(SB.ToggleViewSupport, {
  templateNamePrefix: null,
  rootElement: '[role="application"]',
  classNames: ['pane'],
  classNameBindings: ['paneClassName'],

  templateName: function() {
    var prefix = this.get('templateNamePrefix');
    if (prefix) {
      return prefix + '_' + this.get('name');
    }
    return this.get('name');
  }.property('templateNamePrefix', 'name').cacheable(),

  paneClassName: function() {
    return this.get('name') + '-pane';
  }.property('name').cacheable(),

  append: function() {
    var currentPane = SB.PaneView.currentPane;
    if (currentPane && currentPane.state === 'inDOM') {
      currentPane.hide();
    }
    if (this.state === 'inDOM') {
      this.show();
    } else {
      this.appendTo(this.get('rootElement')); 
    }
    SB.PaneView.currentPane = this;
  }
});

SC.Application.reopen({
  paneViewClass: SB.PaneView,

  createPanes: function(panes) {
    var paneViewClass = this.get('paneViewClass');
    (panes || []).forEach(function(paneName) {
      this["%@PaneView".fmt(paneName)] = paneViewClass.create({
        name: paneName.toLowerCase()
      });
    }, this);
  }
});
