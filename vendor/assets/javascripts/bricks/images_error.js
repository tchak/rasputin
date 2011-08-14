// ==========================================================================
// Project:   SproutCore Bricks
// Copyright: ©2011 Paul Chavard
// Author :   Paul Chavard
//
// images_error.js
// ==========================================================================
SB = this.SB || {};

SB.ImagesErrorSupport = SC.Mixin.create({
  didInsertElement: function() {
    this._super();
    var img = this.$('img[data-rescue-errors]'), self = this;
    img.hide().error(function() {
        if (self.imageLoadError(img)) {
          img.show();
        }
    }).load(function() {
      img.show();
    });
  },
  imageLoadError: SC.K
});
