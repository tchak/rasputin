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

  init: function() {
    this._super();
    var paneName = this.get('name');
    this.set('classNames', [paneName + '-pane']);
    var templateName = this.get('templateNamePrefix');
    if (templateName) {
      templateName += '_' + paneName;
    } else {
      templateName = paneName;
    }
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
