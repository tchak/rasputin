// ==========================================================================
// Project:   SproutCore Bricks
// Copyright: ©2011 Paul Chavard
// Author :   Paul Chavard
//
// pagination_buton.js
// ==========================================================================
SB = this.SB || {};

SB.PreviousButton = JUI.Button.extend({
  label: "Previous",
  action: 'previousPage',
  isVisibleBinding: 'targetObject.hasPreviousPage',
  disabledBinding: 'targetObject.isLoading'
});

SB.NextButton = JUI.Button.extend({
  label: "Next",
  action: 'nextPage',
  isVisibleBinding: 'targetObject.hasNextPage',
  disabledBinding: 'targetObject.isLoading'
});
