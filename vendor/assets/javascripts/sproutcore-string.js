
(function(exports) {
var parseNumber = function(source) { return source * 1 || 0; },
    nativeTrim = String.prototype.trim;

$.extend(SC.String, {

  /**
    Trims defined characters from begining and ending of the string.

    @param {String} str
      The string to trim

    @returns {String} the trimed string.
  */
  trim: function(str) {
    if (nativeTrim) {
      return nativeTrim.call(str);
    } else {
      var str = str.replace(/^\s\s*/, ''),
          ws = /\s/, i = str.length;
      while (ws.test(str.charAt(--i)));
      return str.slice(0, i + 1);
    }
  },

  /**
    Converts first letter of the string to uppercase.

    @param {String} str
      The string to capitalize

    @returns {String} the capitalized string.
  */
  capitalize: function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
  },

  /**
    Converts first letter of every word in the string to uppercase.

    @param {String} str
      The string to titleize

    @returns {String} the titleized string.
  */
  titleize: function(str){
    var arr = str.split(' '),
        word;
    for (var i=0; i < arr.length; i++) {
      word = arr[i].split('');
      if (typeof word[0] !== 'undefined') word[0] = word[0].toUpperCase();
      i+1 === arr.length ? arr[i] = word.join('') : arr[i] = word.join('') + ' ';
    }
    return arr.join('');
  },

  /**
    Converts underscored or dasherized string to a camelized one.

    @param {String} str
      The string to camelize

    @returns {String} the decamelized string.
  */
  camelize: function(str){
    return trim(str).replace(/(\-|_|\s)+(.)?/g, function(match, separator, chr) {
      return chr ? chr.toUpperCase() : '';
    });
  },

  /**
    Parse string to number. Return 0 if string can't be parsed to number.

    @param {String} str
      The string to parse

    @returns {Number} the parsed string.
  */
  toNumber: function(str, decimals) {
    return parseNumber(parseNumber(str).toFixed(parseNumber(decimals)));
  },

  /**
    Truncate string to given length and append given postfix.

    @param {String} str
      The string to truncate

    @returns {String} the truncated string.
  */
  truncate: function(str, length, truncateStr){
    length = length || 50;
    truncateStr = truncateStr || '...';
    return str.length > (length + truncateStr.length) ? str.slice(0,length) + truncateStr : str;
  }
});

var capitalize  = SC.String.capitalize,
    titleize    = SC.String.titleize,
    camelize    = SC.String.camelize,
    toNumber    = SC.String.toNumber,
    truncate    = SC.String.truncate,
    trim        = SC.String.trim;
  
if (SC.EXTEND_PROTOTYPES) {

  /**
    @see SC.String.capitalize
  */
  String.prototype.capitalize = function() {
    return capitalize(this);
  };

    /**
    @see SC.String.titleize
  */
  String.prototype.titleize = function() {
    return titleize(this);
  };

  /**
    @see SC.String.camelize
  */
  String.prototype.camelize = function() {
    return camelize(this);
  };

  /**
    @see SC.String.toNumber
  */
  String.prototype.toNumber = function(decimals) {
    return toNumber(this, decimals);
  };

  /**
    @see SC.String.truncate
  */
  String.prototype.truncate = function(length, truncateStr) {
    return truncate(this, length, truncateStr);
  };

  if (!nativeTrim) {
    /**
      @see SC.String.trim
    */
    String.prototype.trim = function() {
      return trim(this);
    };
  }
}

})({});


(function(exports) {
// ==========================================================================
// Project:   SproutCore String
// Copyright: ©2011 Paul Chavard
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

})({});
