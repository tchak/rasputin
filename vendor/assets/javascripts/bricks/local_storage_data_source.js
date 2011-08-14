// ==========================================================================
// Project:   Todos.LocalStorage
// Copyright: ©2011 My Company, Inc.
// ==========================================================================
/*globals Todos */

/** @class

  This data source serves as an adapter between SproutCore's data store and the
  browser's local storage.

  @extends SC.DataSource
*/
SB = this.SB || {};

(function() {
  var supportsLocalStorage = false;
  // HTML5 localStorage detection from http://diveintohtml5.org/storage.html
  try {
    supportsLocalStorage = ('localStorage' in window && window['localStorage'] !== null);
  } catch (e) { }

  if (!supportsLocalStorage) {
    var warnMethod = function() {
      console.log('Unable to use local storage data source because your browser does not support local storage.');
      return false;
    };

    SB.LocalStorageDataSource = SC.DataSource.extend({
      fetch: warnMethod,
      retrieveRecord: warnMethod,
      createRecord: warnMethod,
      updateRecord: warnMethod,
      destroyRecord: warnMethod
    });

    return;
  }

  SB.LocalStorageDataSource = SC.DataSource.extend(
  /** @scope SC.LocalStorage.prototype */ {
    /**
      The string to prefix to the key used to store the data in the browser's
      localStorage.

      @type String
      @default 'sproutcore-local-storage'
    */
    storagePrefix: 'sproutcore.local.storage.',

    // ..........................................................
    // QUERY SUPPORT
    //

    fetch: function(store, query) {
      var recordType = query.get('recordType');
      var key = this._keyForRecordType(recordType);
      var data = localStorage.getItem(key);

      if (data) {
        data = JSON.parse(data);
      } else {
        data = {};
      }

      data.__guid = data.__guid || 0;

      var dataByRecordType = this.get('dataByRecordType') || {};
      dataByRecordType[key] = data;

      this.set('dataByRecordType', dataByRecordType);

      var records = [];
      for (key in data) {
        if (data.hasOwnProperty(key) && key !== '__guid') {
          records.push(data[key]);
        }
      }

      store.loadRecords(recordType, records);
      return true; // return true if you handled the query
    },

    _keyForRecordType: function(recordType) {
      var recordTypeKey = recordType.localStorageKey;
      return this.get('storagePrefix')+recordTypeKey;
    },

    // ..........................................................
    // RECORD SUPPORT
    //

    retrieveRecord: function(store, storeKey, guid) {
      var recordType = store.recordTypeFor(storeKey);
      var data = this._dataForRecordType(recordType);

      store.dataSourceDidComplete(storeKey, data[guid]);

      return true; // return true if you handled the storeKey
    },

    createRecord: function(store, storeKey) {
      var guid = store.idFor(storeKey);
      var recordType = store.recordTypeFor(storeKey);
      var data = store.readDataHash(storeKey);

      if (guid === undefined || guid === null) {
        guid = this._generateGuid(recordType);
      }

      this._writeRecord(data, recordType, guid);
      this._writeDataToLocalStorage(recordType);

      store.dataSourceDidComplete(storeKey, null, guid);

      return true; // return true if you handled the storeKey
    },

    updateRecord: function(store, storeKey) {
      var guid = store.idFor(storeKey);
      var recordType = store.recordTypeFor(storeKey);
      var data = store.readDataHash(storeKey);

      this._writeRecord(data, recordType, guid);
      this._writeDataToLocalStorage(recordType);

      store.dataSourceDidComplete(storeKey, null, guid);
      return true; // return true if you handled the storeKey
    },

    _writeRecord: function(hash, recordType, guid) {
      var data = this._dataForRecordType(recordType);
      var primaryKey = recordType.prototype.primaryKey;


      data[guid] = hash;
      hash[primaryKey] = guid;
    },

    destroyRecord: function(store, storeKey) {
      var guid = store.idFor(storeKey);
      var recordType = store.recordTypeFor(storeKey);
      var data = this._dataForRecordType(recordType);

      delete data[guid];

      this._writeDataToLocalStorage(recordType);

      store.dataSourceDidDestroy(storeKey);

      return true; // return true if you handled the storeKey
    },

    _writeDataToLocalStorage: function(recordType) {
      var dataByRecordType = this.get('dataByRecordType');
      var key = this._keyForRecordType(recordType);

      localStorage[key] = JSON.stringify(dataByRecordType[key]);
    },

    _dataForRecordType: function(recordType) {
      var key = this._keyForRecordType(recordType);
      var dataByRecordType = this.get('dataByRecordType');

      return dataByRecordType[key];
    },

    _generateGuid: function(recordType) {
      var data = this._dataForRecordType(recordType);

      return ++data.__guid;
    }
  }) ;
})();
