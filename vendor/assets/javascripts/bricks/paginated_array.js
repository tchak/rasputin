// ==========================================================================
// Project:   SproutCore Bricks
// Copyright: ©2011 Paul Chavard
// Author :   Paul Chavard
//
// paginated_array.js
// ==========================================================================
SB = this.SB || {};

SB.PaginatedArray = SC.ArrayProxy.extend({
  content: [],

  limit: 100,
  offset: 0,
  total: 0,

  isLoading: false,
  didRequireRange: SC.K,

  reset: function() {
    this.set('offset', 0);
    this.set('total', 0);
    this.set('content', []);
    this._didRequireRange(this.limit, 0);
  },

  reload: function() {
    this._didRequireRange(this.limit, this.offset);
  },

  _didRequireRange: function(limit, offset) {
    this.set('isLoading', true);
    this.didRequireRange(limit, offset);
  },

  rangeDidLoaded: function(total, content) {
    this.set('total', total);
    this.set('content', content);
    this.set('isLoading', false);
  },

  nextPage: function() {
    if (this.get('hasNextPage')) {
      this.incrementProperty('offset');
      this._didRequireRange(this.limit, this.offset);
    }
  },

  previousPage: function() {
    if (this.get('hasPreviousPage')) {
      this.decrementProperty('offset');
      this._didRequireRange(this.limit, this.offset);
    }
  },

  hasNextPage: function() {
    return (this.offset+1)*this.limit < this.total;
  }.property('offset', 'limit', 'total').cacheable(),

  hasPreviousPage: function() {
    return this.offset > 0;
  }.property('offset').cacheable()
});
