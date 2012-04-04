(function() {
window.DS = Ember.Namespace.create({
  CURRENT_API_REVISION: 4
});

})();



(function() {
var get = Ember.get, set = Ember.set;

/**
  A model array is an array that contains records of a certain type. The model
  array materializes records as needed when they are retrieved for the first
  time. You should not create model arrays yourself. Instead, an instance of
  DS.ModelArray or its subclasses will be returned by your application's store
  in response to queries.
*/

DS.ModelArray = Ember.ArrayProxy.extend({

  /**
    The model type contained by this model array.

    @type DS.Model
  */
  type: null,

  // The array of client ids backing the model array. When a
  // record is requested from the model array, the record
  // for the client id at the same index is materialized, if
  // necessary, by the store.
  content: null,

  // The store that created this model array.
  store: null,

  init: function() {
    set(this, 'modelCache', Ember.A([]));
    this._super();
  },

  arrayDidChange: function(array, index, removed, added) {
    var modelCache = get(this, 'modelCache');
    modelCache.replace(index, 0, new Array(added));

    this._super(array, index, removed, added);
  },

  arrayWillChange: function(array, index, removed, added) {
    this._super(array, index, removed, added);

    var modelCache = get(this, 'modelCache');
    modelCache.replace(index, removed);
  },

  objectAtContent: function(index) {
    var modelCache = get(this, 'modelCache');
    var model = modelCache.objectAt(index);

    if (!model) {
      var store = get(this, 'store');
      var content = get(this, 'content');

      var contentObject = content.objectAt(index);

      if (contentObject !== undefined) {
        model = store.findByClientId(get(this, 'type'), contentObject);
        modelCache.replace(index, 1, [model]);
      }
    }

    return model;
  }
});

})();



(function() {
var get = Ember.get;

DS.FilteredModelArray = DS.ModelArray.extend({
  filterFunction: null,

  replace: function() {
    var type = get(this, 'type').toString();
    throw new Error("The result of a client-side filter (on " + type + ") is immutable.");
  },

  updateFilter: Ember.observer(function() {
    var store = get(this, 'store');
    store.updateModelArrayFilter(this, get(this, 'type'), get(this, 'filterFunction'));
  }, 'filterFunction')
});

})();



(function() {
var get = Ember.get, set = Ember.set;

DS.AdapterPopulatedModelArray = DS.ModelArray.extend({
  query: null,
  isLoaded: false,

  replace: function() {
    var type = get(this, 'type').toString();
    throw new Error("The result of a server query (on " + type + ") is immutable.");
  },

  load: function(array) {
    var store = get(this, 'store'), type = get(this, 'type');

    var clientIds = store.loadMany(type, array).clientIds;

    this.beginPropertyChanges();
    set(this, 'content', Ember.A(clientIds));
    set(this, 'isLoaded', true);
    this.endPropertyChanges();
  }
});


})();



(function() {
var get = Ember.get, set = Ember.set, guidFor = Ember.guidFor;

var Set = function() {
  this.hash = {};
  this.list = [];
};

Set.prototype = {
  add: function(item) {
    var hash = this.hash,
        guid = guidFor(item);

    if (hash.hasOwnProperty(guid)) { return; }

    hash[guid] = true;
    this.list.push(item);
  },

  remove: function(item) {
    var hash = this.hash,
        guid = guidFor(item);

    if (!hash.hasOwnProperty(guid)) { return; }

    delete hash[guid];
    var list = this.list,
        index = Ember.ArrayUtils.indexOf(this, item);

    list.splice(index, 1);
  },

  isEmpty: function() {
    return this.list.length === 0;
  }
};

var ManyArrayState = Ember.State.extend({
  recordWasAdded: function(manager, record) {
    var dirty = manager.dirty, observer;
    dirty.add(record);

    observer = function() {
      if (!get(record, 'isDirty')) {
        record.removeObserver('isDirty', observer);
        manager.send('childWasSaved', record);
      }
    };

    record.addObserver('isDirty', observer);
  },

  recordWasRemoved: function(manager, record) {
    var dirty = manager.dirty, observer;
    dirty.add(record);

    observer = function() {
      record.removeObserver('isDirty', observer);
      if (!get(record, 'isDirty')) { manager.send('childWasSaved', record); }
    };

    record.addObserver('isDirty', observer);
  }
});

var states = {
  clean: ManyArrayState.create({
    isDirty: false,

    recordWasAdded: function(manager, record) {
      this._super(manager, record);
      manager.goToState('dirty');
    },

    update: function(manager, clientIds) {
      var manyArray = manager.manyArray;
      set(manyArray, 'content', clientIds);
    }
  }),

  dirty: ManyArrayState.create({
    isDirty: true,

    childWasSaved: function(manager, child) {
      var dirty = manager.dirty;
      dirty.remove(child);

      if (dirty.isEmpty()) { manager.send('arrayBecameSaved'); }
    },

    arrayBecameSaved: function(manager) {
      manager.goToState('clean');
    }
  }) 
};

DS.ManyArrayStateManager = Ember.StateManager.extend({
  manyArray: null,
  initialState: 'clean',
  states: states,

  init: function() {
    this._super();
    this.dirty = new Set();
  }
});

})();



(function() {
var get = Ember.get, set = Ember.set, getPath = Ember.getPath;

DS.ManyArray = DS.ModelArray.extend({
  init: function() {
    set(this, 'stateManager', DS.ManyArrayStateManager.create({ manyArray: this }));

    return this._super();
  },

  parentRecord: null,

  isDirty: Ember.computed(function() {
    return getPath(this, 'stateManager.currentState.isDirty');
  }).property('stateManager.currentState').cacheable(),

  fetch: function() {
    var clientIds = get(this, 'content'),
        store = get(this, 'store'),
        type = get(this, 'type');

    var ids = clientIds.map(function(clientId) {
      return store.clientIdToId[clientId];
    });

    store.fetchMany(type, ids);
  },

  // Overrides Ember.Array's replace method to implement
  replace: function(index, removed, added) {
    var parentRecord = get(this, 'parentRecord');
    var pendingParent = parentRecord && !get(parentRecord, 'id');
    var stateManager = get(this, 'stateManager');

    added = added.map(function(record) {


      if (pendingParent) {
        record.send('waitingOn', parentRecord);
      }

      this.assignInverse(record, parentRecord);

      stateManager.send('recordWasAdded', record);

      return record.get('clientId');
    }, this);

    var store = this.store;

    var len = index+removed, record;
    for (var i = index; i < len; i++) {
      // TODO: null out inverse FK
      record = this.objectAt(i);
      this.assignInverse(record, parentRecord, true);
      stateManager.send('recordWasAdded', record);
    }

    this._super(index, removed, added);
  },

  assignInverse: function(record, parentRecord, remove) {
    var associationMap = get(record.constructor, 'associations'),
        possibleAssociations = associationMap.get(parentRecord.constructor),
        possible, actual;

    if (!possibleAssociations) { return; }

    for (var i = 0, l = possibleAssociations.length; i < l; i++) {
      possible = possibleAssociations[i];

      if (possible.kind === 'belongsTo') {
        actual = possible;
        break;
      }
    }

    if (actual) {
      set(record, actual.name, remove ? null : parentRecord);
    }
  }
});

})();



(function() {

})();



(function() {
var get = Ember.get, set = Ember.set, getPath = Ember.getPath, fmt = Ember.String.fmt;

DS.Transaction = Ember.Object.extend({
  init: function() {
    set(this, 'buckets', {
      clean:   Ember.Map.create(),
      created: Ember.Map.create(),
      updated: Ember.Map.create(),
      deleted: Ember.Map.create()
    });
  },

  createRecord: function(type, hash) {
    var store = get(this, 'store');

    return store.createRecord(type, hash, this);
  },

  add: function(record) {
    // we could probably make this work if someone has a valid use case. Do you?


    var modelTransaction = get(record, 'transaction'),
        defaultTransaction = getPath(this, 'store.defaultTransaction');


    this.adoptRecord(record);
  },

  remove: function(record) {
    var defaultTransaction = getPath(this, 'store.defaultTransaction');

    defaultTransaction.adoptRecord(record);
  },

  /**
    @private

    This method moves a record into a different transaction without the normal
    checks that ensure that the user is not doing something weird, like moving
    a dirty record into a new transaction.

    It is designed for internal use, such as when we are moving a clean record
    into a new transaction when the transaction is committed.

    This method must not be called unless the record is clean.
  */
  adoptRecord: function(record) {
    var oldTransaction = get(record, 'transaction');

    if (oldTransaction) {
      oldTransaction.removeFromBucket('clean', record);
    }

    this.addToBucket('clean', record);
    set(record, 'transaction', this);
  },

  modelBecameDirty: function(kind, record) {
    this.removeFromBucket('clean', record);
    this.addToBucket(kind, record);
  },

  /** @private */
  addToBucket: function(kind, record) {
    var bucket = get(get(this, 'buckets'), kind),
        type = record.constructor;

    var records = bucket.get(type);

    if (!records) {
      records = Ember.OrderedSet.create();
      bucket.set(type, records);
    }

    records.add(record);
  },

  /** @private */
  removeFromBucket: function(kind, record) {
    var bucket = get(get(this, 'buckets'), kind),
        type = record.constructor;

    var records = bucket.get(type);
    records.remove(record);
  },

  modelBecameClean: function(kind, record) {
    this.removeFromBucket(kind, record);

    var defaultTransaction = getPath(this, 'store.defaultTransaction');
    defaultTransaction.adoptRecord(record);
  },

  commit: function() {
    var buckets = get(this, 'buckets');

    var iterate = function(kind, fn, binding) {
      var dirty = get(buckets, kind);

      dirty.forEach(function(type, models) {
        if (models.isEmpty()) { return; }

        var array = [];

        models.forEach(function(model) {
          model.send('willCommit');

          if (get(model, 'isPending') === false) {
            array.push(model);
          }
        });

        fn.call(binding, type, array);
      });
    };

    var commitDetails = {
      updated: {
        eachType: function(fn, binding) { iterate('updated', fn, binding); }
      },

      created: {
        eachType: function(fn, binding) { iterate('created', fn, binding); }
      },

      deleted: {
        eachType: function(fn, binding) { iterate('deleted', fn, binding); }
      }
    };

    var store = get(this, 'store');
    var adapter = get(store, '_adapter');

    var clean = get(buckets, 'clean');
    var defaultTransaction = get(store, 'defaultTransaction');

    clean.forEach(function(type, records) {
      records.forEach(function(record) {
        this.remove(record);
      }, this);
    }, this);

    if (adapter && adapter.commit) { adapter.commit(store, commitDetails); }
    else { throw fmt("Adapter is either null or do not implement `commit` method", this); }
  }
});

})();



(function() {
var get = Ember.get, set = Ember.set, getPath = Ember.getPath, fmt = Ember.String.fmt;

var DATA_PROXY = {
  get: function(name) {
    return this.savedData[name];
  }
};

// These values are used in the data cache when clientIds are
// needed but the underlying data has not yet been loaded by
// the server.
var UNLOADED = 'unloaded';
var LOADING = 'loading';

// Implementors Note:
//
//   The variables in this file are consistently named according to the following
//   scheme:
//
//   * +id+ means an identifier managed by an external source, provided inside the
//     data hash provided by that source.
//   * +clientId+ means a transient numerical identifier generated at runtime by
//     the data store. It is important primarily because newly created objects may
//     not yet have an externally generated id.
//   * +type+ means a subclass of DS.Model.

/**
  The store contains all of the hashes for data models loaded from the server.
  It is also responsible for creating instances of DS.Model when you request one
  of these data hashes, so that they can be bound to in your Handlebars templates.

  Create a new store like this:

       MyApp.store = DS.Store.create();

  You can retrieve DS.Model instances from the store in several ways. To retrieve
  a model for a specific id, use the `find()` method:

       var model = MyApp.store.find(MyApp.Contact, 123);

   By default, the store will talk to your backend using a standard REST mechanism.
   You can customize how the store talks to your backend by specifying a custom adapter:

       MyApp.store = DS.Store.create({
         adapter: 'MyApp.CustomAdapter'
       });

    You can learn more about writing a custom adapter by reading the `DS.Adapter`
    documentation.
*/
DS.Store = Ember.Object.extend({

  /**
    Many methods can be invoked without specifying which store should be used.
    In those cases, the first store created will be used as the default. If
    an application has multiple stores, it should specify which store to use
    when performing actions, such as finding records by id.

    The init method registers this store as the default if none is specified.
  */
  init: function() {
    // Enforce API revisioning. See BREAKING_CHANGES.md for more.
    var revision = get(this, 'revision');

    if (revision !== DS.CURRENT_API_REVISION && !Ember.ENV.TESTING) {
      throw new Error("Error: The Ember Data library has had breaking API changes since the last time you updated the library. Please review the list of breaking changes at https://github.com/emberjs/data/blob/master/BREAKING_CHANGES.md, then update your store's `revision` property to " + DS.CURRENT_API_REVISION);
    }

    if (!get(DS, 'defaultStore') || get(this, 'isDefaultStore')) {
      set(DS, 'defaultStore', this);
    }

    // internal bookkeeping; not observable
    this.typeMaps = {};
    this.recordCache = [];
    this.clientIdToId = {};
    this.modelArraysByClientId = {};

    set(this, 'defaultTransaction', this.transaction());

    return this._super();
  },

  /**
    Returns a new transaction scoped to this store.

    @see {DS.Transaction}
    @returns DS.Transaction
  */
  transaction: function() {
    return DS.Transaction.create({ store: this });
  },

  /**
    @private

    This is used only by the model's DataProxy. Do not use this directly.
  */
  dataForRecord: function(record) {
    var type = record.constructor,
        clientId = get(record, 'clientId'),
        typeMap = this.typeMapFor(type);

    return typeMap.cidToHash[clientId];
  },

  /**
    The adapter to use to communicate to a backend server or other persistence layer.

    This can be specified as an instance, a class, or a property path that specifies
    where the adapter can be located.

    @property {DS.Adapter|String}
  */
  adapter: null,

  /**
    @private

    This property returns the adapter, after resolving a possible String.

    @returns DS.Adapter
  */
  _adapter: Ember.computed(function() {
    var adapter = get(this, 'adapter');
    if (typeof adapter === 'string') {
      return getPath(this, adapter, false) || getPath(window, adapter);
    }
    return adapter;
  }).property('adapter').cacheable(),

  // A monotonically increasing number to be used to uniquely identify
  // data hashes and records.
  clientIdCounter: 1,

  // ....................
  // . CREATE NEW MODEL .
  // ....................

  /**
    Create a new record in the current store. The properties passed
    to this method are set on the newly created record.

    @param {subclass of DS.Model} type
    @param {Object} properties a hash of properties to set on the
      newly created record.
    @returns DS.Model
  */
  createRecord: function(type, properties, transaction) {
    properties = properties || {};

    // Create a new instance of the model `type` and put it
    // into the specified `transaction`. If no transaction is
    // specified, the default transaction will be used.
    //
    // NOTE: A `transaction` is specified when the
    // `transaction.createRecord` API is used.
    var record = type._create({
      store: this
    });

    transaction = transaction || get(this, 'defaultTransaction');
    transaction.adoptRecord(record);

    // Extract the primary key from the `properties` hash,
    // based on the `primaryKey` for the model type.
    var id = properties[get(record, 'primaryKey')] || null;

    var hash = {}, clientId;

    // Push the hash into the store. If present, associate the
    // extracted `id` with the hash.
    clientId = this.pushHash(hash, id, type);

    record.send('didChangeData');

    var recordCache = get(this, 'recordCache');

    // Now that we have a clientId, attach it to the record we
    // just created.
    set(record, 'clientId', clientId);

    // Store the record we just created in the record cache for
    // this clientId.
    recordCache[clientId] = record;

    // Set the properties specified on the record.
    record.setProperties(properties);

    this.updateModelArrays(type, clientId, get(record, 'data'));

    return record;
  },

  // ................
  // . DELETE MODEL .
  // ................

  /**
    For symmetry, a record can be deleted via the store.

    @param {DS.Model} record
  */
  deleteRecord: function(record) {
    record.send('deleteRecord');
  },

  // ...............
  // . FIND MODELS .
  // ...............

  /**
    This is the main entry point into finding records. The first
    parameter to this method is always a subclass of `DS.Model`.

    You can use the `find` method on a subclass of `DS.Model`
    directly if your application only has one store. For
    example, instead of `store.find(App.Person, 1)`, you could
    say `App.Person.find(1)`.

    ---

    To find a record by ID, pass the `id` as the second parameter:

        store.find(App.Person, 1);
        App.Person.find(1);

    If the record with that `id` had not previously been loaded,
    the store will return an empty record immediately and ask
    the adapter to find the data by calling its `find` method.

    The `find` method will always return the same object for a
    given type and `id`. To check whether the adapter has populated
    a record, you can check its `isLoaded` property.

    ---

    To find all records for a type, call `find` with no additional
    parameters:

        store.find(App.Person);
        App.Person.find();

    This will return a `ModelArray` representing all known records
    for the given type and kick off a request to the adapter's
    `findAll` method to load any additional records for the type.

    The `ModelArray` returned by `find()` is live. If any more
    records for the type are added at a later time through any
    mechanism, it will automatically update to reflect the change.

    ---

    To find a record by a query, call `find` with a hash as the
    second parameter:

        store.find(App.Person, { page: 1 });
        App.Person.find({ page: 1 });

    This will return a `ModelArray` immediately, but it will always
    be an empty `ModelArray` at first. It will call the adapter's
    `findQuery` method, which will populate the `ModelArray` once
    the server has returned results.

    You can check whether a query results `ModelArray` has loaded
    by checking its `isLoaded` property.
  */
  find: function(type, id, query) {
    if (id === undefined) {
      return this.findAll(type);
    }

    if (query !== undefined) {
      return this.findMany(type, id, query);
    } else if (Ember.typeOf(id) === 'object') {
      return this.findQuery(type, id);
    }

    if (Ember.isArray(id)) {
      return this.findMany(type, id);
    }

    var clientId = this.typeMapFor(type).idToCid[id];

    return this.findByClientId(type, clientId, id);
  },

  findByClientId: function(type, clientId, id) {
    var recordCache = get(this, 'recordCache'),
        dataCache = this.typeMapFor(type).cidToHash,
        model;

    // If there is already a clientId assigned for this
    // type/id combination, try to find an existing
    // model for that id and return. Otherwise,
    // materialize a new model and set its data to the
    // value we already have.
    if (clientId !== undefined) {
      model = recordCache[clientId];

      if (!model) {
        // create a new instance of the model in the
        // 'isLoading' state
        model = this.materializeRecord(type, clientId);

        if (typeof dataCache[clientId] === 'object') {
          model.send('didChangeData');
        }
      }
    } else {
      clientId = this.pushHash(LOADING, id, type);

      // create a new instance of the model in the
      // 'isLoading' state
      model = this.materializeRecord(type, clientId);

      // let the adapter set the data, possibly async
      var adapter = get(this, '_adapter');
      if (adapter && adapter.find) { adapter.find(this, type, id); }
      else { throw fmt("Adapter is either null or does not implement `find` method", this); }
    }

    return model;
  },

  /**
    @private

    Ask the adapter to fetch IDs that are not already loaded.

    This method will convert `id`s to `clientId`s, filter out
    `clientId`s that already have a data hash present, and pass
    the remaining `id`s to the adapter.

    @param {Class} type A model class
    @param {Array} ids An array of ids
    @param {Object} query

    @returns {Array} An Array of all clientIds for the
      specified ids.
  */
  fetchMany: function(type, ids, query) {
    var typeMap = this.typeMapFor(type),
        idToClientIdMap = typeMap.idToCid,
        dataCache = typeMap.cidToHash,
        data = typeMap.cidToHash,
        needed;

    var clientIds = Ember.A([]);

    if (ids) {
      needed = [];

      ids.forEach(function(id) {
        // Get the clientId for the given id
        var clientId = idToClientIdMap[id];

        // If there is no `clientId` yet
        if (clientId === undefined) {
          // Create a new `clientId`, marking its data hash
          // as loading. Once the adapter returns the data
          // hash, it will be updated
          clientId = this.pushHash(LOADING, id, type);
          needed.push(id);

        // If there is a clientId, but its data hash is
        // marked as unloaded (this happens when a
        // hasMany association creates clientIds for its
        // referenced ids before they were loaded)
        } else if (clientId && data[clientId] === UNLOADED) {
          // change the data hash marker to loading
          dataCache[clientId] = LOADING;
          needed.push(id);
        }

        // this method is expected to return a list of
        // all of the clientIds for the specified ids,
        // unconditionally add it.
        clientIds.push(clientId);
      }, this);
    } else {
      needed = null;
    }

    // If there are any needed ids, ask the adapter to load them
    if ((needed && get(needed, 'length') > 0) || query) {
      var adapter = get(this, '_adapter');
      if (adapter && adapter.findMany) { adapter.findMany(this, type, needed, query); }
      else { throw fmt("Adapter is either null or does not implement `findMany` method", this); }
    }

    return clientIds;
  },

  /** @private
  */
  findMany: function(type, ids, query) {
    var clientIds = this.fetchMany(type, ids, query);

    return this.createManyArray(type, clientIds);
  },

  findQuery: function(type, query) {
    var array = DS.AdapterPopulatedModelArray.create({ type: type, content: Ember.A([]), store: this });
    var adapter = get(this, '_adapter');
    if (adapter && adapter.findQuery) { adapter.findQuery(this, type, query, array); }
    else { throw fmt("Adapter is either null or does not implement `findQuery` method", this); }
    return array;
  },

  findAll: function(type) {

    var typeMap = this.typeMapFor(type),
        findAllCache = typeMap.findAllCache;

    if (findAllCache) { return findAllCache; }

    var array = DS.ModelArray.create({ type: type, content: Ember.A([]), store: this });
    this.registerModelArray(array, type);

    var adapter = get(this, '_adapter');
    if (adapter && adapter.findAll) { adapter.findAll(this, type); }

    typeMap.findAllCache = array;
    return array;
  },

  filter: function(type, query, filter) {
    // allow an optional server query
    if (arguments.length === 3) {
      this.findQuery(type, query);
    } else if (arguments.length === 2) {
      filter = query;
    }

    var array = DS.FilteredModelArray.create({ type: type, content: Ember.A([]), store: this, filterFunction: filter });

    this.registerModelArray(array, type, filter);

    return array;
  },

  // ............
  // . UPDATING .
  // ............

  hashWasUpdated: function(type, clientId, record) {
    this.updateModelArrays(type, clientId, get(record, 'data'));
  },

  // ..............
  // . PERSISTING .
  // ..............

  commit: function() {
    var defaultTransaction = get(this, 'defaultTransaction');
    set(this, 'defaultTransaction', this.transaction());

    defaultTransaction.commit();
  },

  didUpdateRecords: function(array, hashes) {
    if (hashes) {
      array.forEach(function(model, idx) {
        this.didUpdateRecord(model, hashes[idx]);
      }, this);
    } else {
      array.forEach(function(model) {
        this.didUpdateRecord(model);
      }, this);
    }
  },

  didUpdateRecord: function(model, hash) {
    if (hash) {
      var clientId = get(model, 'clientId'),
          dataCache = this.typeMapFor(model.constructor).cidToHash;

      dataCache[clientId] = hash;
      model.send('didChangeData');
      model.hashWasUpdated();
    }

    model.send('didCommit');
  },

  didDeleteRecords: function(array) {
    array.forEach(function(model) {
      model.send('didCommit');
    });
  },

  didDeleteRecord: function(model) {
    model.send('didCommit');
  },

  _didCreateRecord: function(record, hash, typeMap, clientId, primaryKey) {
    var recordData = get(record, 'data'), id, changes;

    if (hash) {
      typeMap.cidToHash[clientId] = hash;

      // If the server returns a hash, we assume that the server's version
      // of the data supercedes the local changes.
      record.beginPropertyChanges();
      record.send('didChangeData');
      recordData.adapterDidUpdate(hash);
      record.hashWasUpdated();
      record.endPropertyChanges();

      id = hash[primaryKey];

      typeMap.idToCid[id] = clientId;
      this.clientIdToId[clientId] = id;
    } else {
      recordData.commit();
    }

    record.send('didCommit');
  },


  didCreateRecords: function(type, array, hashes) {
    var primaryKey = type.proto().primaryKey,
        typeMap = this.typeMapFor(type),
        id, clientId;

    for (var i=0, l=get(array, 'length'); i<l; i++) {
      var model = array[i], hash = hashes[i];
      clientId = get(model, 'clientId');

      this._didCreateRecord(model, hash, typeMap, clientId, primaryKey);
    }
  },

  didCreateRecord: function(model, hash) {
    var type = model.constructor,
        typeMap = this.typeMapFor(type),
        id, clientId, primaryKey;

    // The hash is optional, but if it is not provided, the client must have
    // provided a primary key.

    primaryKey = type.proto().primaryKey;

    // TODO: Make ember_assert more flexible and convert this into an ember_assert
    if (hash) {

    } else {

    }

    clientId = get(model, 'clientId');

    this._didCreateRecord(model, hash, typeMap, clientId, primaryKey);
  },

  recordWasInvalid: function(record, errors) {
    record.send('becameInvalid', errors);
  },

  // ................
  // . MODEL ARRAYS .
  // ................

  registerModelArray: function(array, type, filter) {
    var modelArrays = this.typeMapFor(type).modelArrays;

    modelArrays.push(array);

    this.updateModelArrayFilter(array, type, filter);
  },

  createManyArray: function(type, clientIds) {
    var array = DS.ManyArray.create({ type: type, content: clientIds, store: this });

    clientIds.forEach(function(clientId) {
      var modelArrays = this.modelArraysForClientId(clientId);
      modelArrays.add(array);
    }, this);

    return array;
  },

  updateModelArrayFilter: function(array, type, filter) {
    var typeMap = this.typeMapFor(type),
        dataCache = typeMap.cidToHash,
        clientIds = typeMap.clientIds,
        clientId, hash, proxy;

    var recordCache = get(this, 'recordCache'), record;

    for (var i=0, l=clientIds.length; i<l; i++) {
      clientId = clientIds[i];

      hash = dataCache[clientId];
      if (typeof hash === 'object') {
        if (record = recordCache[clientId]) {
          proxy = get(record, 'data');
        } else {
          DATA_PROXY.savedData = hash;
          proxy = DATA_PROXY;
        }

        this.updateModelArray(array, filter, type, clientId, proxy);
      }
    }
  },

  updateModelArrays: function(type, clientId, dataProxy) {
    var modelArrays = this.typeMapFor(type).modelArrays,
        modelArrayType, filter;

    modelArrays.forEach(function(array) {
      filter = get(array, 'filterFunction');
      this.updateModelArray(array, filter, type, clientId, dataProxy);
    }, this);
  },

  updateModelArray: function(array, filter, type, clientId, dataProxy) {
    var shouldBeInArray;

    if (!filter) {
      shouldBeInArray = true;
    } else {
      shouldBeInArray = filter(dataProxy);
    }

    var content = get(array, 'content');
    var alreadyInArray = content.indexOf(clientId) !== -1;

    var modelArrays = this.modelArraysForClientId(clientId);

    if (shouldBeInArray && !alreadyInArray) {
      modelArrays.add(array);
      content.pushObject(clientId);
    } else if (!shouldBeInArray && alreadyInArray) {
      modelArrays.remove(array);
      content.removeObject(clientId);
    }
  },

  removeFromModelArrays: function(model) {
    var clientId = get(model, 'clientId');
    var modelArrays = this.modelArraysForClientId(clientId);

    modelArrays.forEach(function(array) {
      var content = get(array, 'content');
      content.removeObject(clientId);
    });
  },

  // ............
  // . INDEXING .
  // ............

  modelArraysForClientId: function(clientId) {
    var modelArrays = get(this, 'modelArraysByClientId');
    var ret = modelArrays[clientId];

    if (!ret) {
      ret = modelArrays[clientId] = Ember.OrderedSet.create();
    }

    return ret;
  },

  typeMapFor: function(type) {
    var typeMaps = get(this, 'typeMaps');
    var guidForType = Ember.guidFor(type);

    var typeMap = typeMaps[guidForType];

    if (typeMap) {
      return typeMap;
    } else {
      return (typeMaps[guidForType] =
        {
          idToCid: {},
          clientIds: [],
          cidToHash: {},
          modelArrays: []
      });
    }
  },

  /** @private

    For a given type and id combination, returns the client id used by the store.
    If no client id has been assigned yet, one will be created and returned.

    @param {DS.Model} type
    @param {String|Number} id
  */
  clientIdForId: function(type, id) {
    var clientId = this.typeMapFor(type).idToCid[id];

    if (clientId !== undefined) { return clientId; }

    return this.pushHash(UNLOADED, id, type);
  },

  // ................
  // . LOADING DATA .
  // ................

  /**
    Load a new data hash into the store for a given id and type combination.
    If data for that model had been loaded previously, the new information
    overwrites the old.

    If the model you are loading data for has outstanding changes that have not
    yet been saved, an exception will be thrown.

    @param {DS.Model} type
    @param {String|Number} id
    @param {Object} hash the data hash to load
  */
  load: function(type, id, hash) {
    if (hash === undefined) {
      hash = id;
      var primaryKey = type.proto().primaryKey;

      id = hash[primaryKey];
    }

    var typeMap = this.typeMapFor(type),
        dataCache = typeMap.cidToHash,
        clientId = typeMap.idToCid[id],
        recordCache = get(this, 'recordCache');

    if (clientId !== undefined) {
      dataCache[clientId] = hash;

      var record = recordCache[clientId];
      if (record) {
        record.send('didChangeData');
      }
    } else {
      clientId = this.pushHash(hash, id, type);
    }

    DATA_PROXY.savedData = hash;
    this.updateModelArrays(type, clientId, DATA_PROXY);

    return { id: id, clientId: clientId };
  },

  loadMany: function(type, ids, hashes) {
    var clientIds = Ember.A([]);

    if (hashes === undefined) {
      hashes = ids;
      ids = [];
      var primaryKey = type.proto().primaryKey;

      ids = Ember.ArrayUtils.map(hashes, function(hash) {
        return hash[primaryKey];
      });
    }

    for (var i=0, l=get(ids, 'length'); i<l; i++) {
      var loaded = this.load(type, ids[i], hashes[i]);
      clientIds.pushObject(loaded.clientId);
    }

    return { clientIds: clientIds, ids: ids };
  },

  /** @private

    Stores a data hash for the specified type and id combination and returns
    the client id.

    @param {Object} hash
    @param {String|Number} id
    @param {DS.Model} type
    @returns {Number}
  */
  pushHash: function(hash, id, type) {
    var typeMap = this.typeMapFor(type);

    var idToClientIdMap = typeMap.idToCid,
        clientIdToIdMap = this.clientIdToId,
        clientIds = typeMap.clientIds,
        dataCache = typeMap.cidToHash;

    var clientId = ++this.clientIdCounter;

    dataCache[clientId] = hash;

    // if we're creating an item, this process will be done
    // later, once the object has been persisted.
    if (id) {
      idToClientIdMap[id] = clientId;
      clientIdToIdMap[clientId] = id;
    }

    clientIds.push(clientId);

    return clientId;
  },

  // .........................
  // . MODEL MATERIALIZATION .
  // .........................

  materializeRecord: function(type, clientId) {
    var model;

    get(this, 'recordCache')[clientId] = model = type._create({
      store: this,
      clientId: clientId
    });

    get(this, 'defaultTransaction').adoptRecord(model);

    model.send('loadingData');
    return model;
  },

  destroy: function() {
    if (get(DS, 'defaultStore') === this) {
      set(DS, 'defaultStore', null);
    }

    return this._super();
  }
});

})();



(function() {
var get = Ember.get, set = Ember.set, getPath = Ember.getPath, guidFor = Ember.guidFor;

var stateProperty = Ember.computed(function(key) {
  var parent = get(this, 'parentState');
  if (parent) {
    return get(parent, key);
  }
}).property();

var isEmptyObject = function(object) {
  for (var name in object) {
    if (object.hasOwnProperty(name)) { return false; }
  }

  return true;
};

var hasDefinedProperties = function(object) {
  for (var name in object) {
    if (object.hasOwnProperty(name) && object[name]) { return true; }
  }

  return false;
};

DS.State = Ember.State.extend({
  isLoaded: stateProperty,
  isDirty: stateProperty,
  isSaving: stateProperty,
  isDeleted: stateProperty,
  isError: stateProperty,
  isNew: stateProperty,
  isValid: stateProperty,
  isPending: stateProperty,

  // For states that are substates of a
  // DirtyState (updated or created), it is
  // useful to be able to determine which
  // type of dirty state it is.
  dirtyType: stateProperty
});

var setProperty = function(manager, context) {
  var key = context.key, value = context.value;

  var model = get(manager, 'model'),
      data = get(model, 'data');

  set(data, key, value);
};

var setAssociation = function(manager, context) {
  var key = context.key, value = context.value;

  var model = get(manager, 'model'),
      data = get(model, 'data');

  data.setAssociation(key, value);
};

var didChangeData = function(manager) {
  var model = get(manager, 'model'),
      data = get(model, 'data');

  data._savedData = null;
  model.notifyPropertyChange('data');
};

// The waitingOn event shares common functionality
// between the different dirty states, but each is
// treated slightly differently. This method is exposed
// so that each implementation can invoke the common
// behavior, and then implement the behavior specific
// to the state.
var waitingOn = function(manager, object) {
  var model = get(manager, 'model'),
      pendingQueue = get(model, 'pendingQueue'),
      objectGuid = guidFor(object);

  var observer = function() {
    if (get(object, 'id')) {
      manager.send('doneWaitingOn', object);
      Ember.removeObserver(object, 'id', observer);
    }
  };

  pendingQueue[objectGuid] = [object, observer];
  Ember.addObserver(object, 'id', observer);
};

// Implementation notes:
//
// Each state has a boolean value for all of the following flags:
//
// * isLoaded: The record has a populated `data` property. When a
//   record is loaded via `store.find`, `isLoaded` is false
//   until the adapter sets it. When a record is created locally,
//   its `isLoaded` property is always true.
// * isDirty: The record has local changes that have not yet been
//   saved by the adapter. This includes records that have been
//   created (but not yet saved) or deleted.
// * isSaving: The record's transaction has been committed, but
//   the adapter has not yet acknowledged that the changes have
//   been persisted to the backend.
// * isDeleted: The record was marked for deletion. When `isDeleted`
//   is true and `isDirty` is true, the record is deleted locally
//   but the deletion was not yet persisted. When `isSaving` is
//   true, the change is in-flight. When both `isDirty` and
//   `isSaving` are false, the change has persisted.
// * isError: The adapter reported that it was unable to save
//   local changes to the backend. This may also result in the
//   record having its `isValid` property become false if the
//   adapter reported that server-side validations failed.
// * isNew: The record was created on the client and the adapter
//   did not yet report that it was successfully saved.
// * isValid: No client-side validations have failed and the
//   adapter did not report any server-side validation failures.
// * isPending: A record `isPending` when it belongs to an
//   association on another record and that record has not been
//   saved. A record in this state cannot be saved because it
//   lacks a "foreign key" that will be supplied by its parent
//   association when the parent record has been created. When
//   the adapter reports that the parent has saved, the
//   `isPending` property on all children will become `false`
//   and the transaction will try to commit the records.

// This mixin is mixed into various uncommitted states. Make
// sure to mix it in *after* the class definition, so its
// super points to the class definition.
var Uncommitted = Ember.Mixin.create({
  setProperty: setProperty,
  setAssociation: setAssociation,

  deleteRecord: function(manager) {
    this._super(manager);

    var model = get(manager, 'model'),
        dirtyType = get(this, 'dirtyType');

    model.withTransaction(function(t) {
      t.modelBecameClean(dirtyType, model);
    });
  }
});

// These mixins are mixed into substates of the concrete
// subclasses of DirtyState.

var CreatedUncommitted = Ember.Mixin.create({
  deleteRecord: function(manager) {
    this._super(manager);

    manager.goToState('deleted.saved');
  }
});

var UpdatedUncommitted = Ember.Mixin.create({
  deleteRecord: function(manager) {
    this._super(manager);

    var model = get(manager, 'model');

    model.withTransaction(function(t) {
      t.modelBecameClean('created', model);
    });

    manager.goToState('deleted');
  }
});

// The dirty state is a abstract state whose functionality is
// shared between the `created` and `updated` states.
//
// The deleted state shares the `isDirty` flag with the
// subclasses of `DirtyState`, but with a very different
// implementation.
var DirtyState = DS.State.extend({
  initialState: 'uncommitted',

  // FLAGS
  isDirty: true,

  // SUBSTATES

  // When a record first becomes dirty, it is `uncommitted`.
  // This means that there are local pending changes,
  // but they have not yet begun to be saved.
  uncommitted: DS.State.extend({
    // TRANSITIONS
    enter: function(manager) {
      var dirtyType = get(this, 'dirtyType'),
          model = get(manager, 'model');

      model.withTransaction(function (t) {
        t.modelBecameDirty(dirtyType, model);
      });
    },

    exit: function(manager) {
      var model = get(manager, 'model');
      manager.send('invokeLifecycleCallbacks', model);
    },

    // EVENTS
    deleteRecord: Ember.K,

    waitingOn: function(manager, object) {
      waitingOn(manager, object);
      manager.goToState('pending');
    },

    willCommit: function(manager) {
      manager.goToState('inFlight');
    }
  }, Uncommitted),

  // Once a record has been handed off to the adapter to be
  // saved, it is in the 'in flight' state. Changes to the
  // record cannot be made during this window.
  inFlight: DS.State.extend({
    // FLAGS
    isSaving: true,

    // TRANSITIONS
    enter: function(manager) {
      var dirtyType = get(this, 'dirtyType'),
          model = get(manager, 'model');

      model.withTransaction(function (t) {
        t.modelBecameClean(dirtyType, model);
      });
    },

    // EVENTS
    didCommit: function(manager) {
      manager.goToState('loaded');
    },

    becameInvalid: function(manager, errors) {
      var model = get(manager, 'model');

      set(model, 'errors', errors);
      manager.goToState('invalid');
    },

    didChangeData: didChangeData
  }),

  // If a record becomes associated with a newly created
  // parent record, it will be `pending` until the parent
  // record has successfully persisted. Once this happens,
  // this record can use the parent's primary key as its
  // foreign key.
  //
  // If the record's transaction had already started to
  // commit, the record will transition to the `inFlight`
  // state. If it had not, the record will transition to
  // the `uncommitted` state.
  pending: DS.State.extend({
    initialState: 'uncommitted',

    // FLAGS
    isPending: true,

    // SUBSTATES

    // A pending record whose transaction has not yet
    // started to commit is in this state.
    uncommitted: DS.State.extend({
      // EVENTS
      deleteRecord: function(manager) {
        var model = get(manager, 'model'),
            pendingQueue = get(model, 'pendingQueue'),
            tuple;

        // since we are leaving the pending state, remove any
        // observers we have registered on other records.
        for (var prop in pendingQueue) {
          if (!pendingQueue.hasOwnProperty(prop)) { continue; }

          tuple = pendingQueue[prop];
          Ember.removeObserver(tuple[0], 'id', tuple[1]);
        }
      },

      willCommit: function(manager) {
        manager.goToState('committing');
      },

      doneWaitingOn: function(manager, object) {
        var model = get(manager, 'model'),
            pendingQueue = get(model, 'pendingQueue'),
            objectGuid = guidFor(object);

        delete pendingQueue[objectGuid];

        if (isEmptyObject(pendingQueue)) {
          manager.send('doneWaiting');
        }
      },

      doneWaiting: function(manager) {
        var dirtyType = get(this, 'dirtyType');
        manager.goToState(dirtyType + '.uncommitted');
      }
    }, Uncommitted),

    // A pending record whose transaction has started
    // to commit is in this state. Since it has not yet
    // been sent to the adapter, it is not `inFlight`
    // until all of its dependencies have been committed.
    committing: DS.State.extend({
      // FLAGS
      isSaving: true,

      // EVENTS
      doneWaitingOn: function(manager, object) {
        var model = get(manager, 'model'),
            pendingQueue = get(model, 'pendingQueue'),
            objectGuid = guidFor(object);

        delete pendingQueue[objectGuid];

        if (isEmptyObject(pendingQueue)) {
          manager.send('doneWaiting');
        }
      },

      doneWaiting: function(manager) {
        var model = get(manager, 'model'),
            transaction = get(model, 'transaction');

        // Now that the model is no longer pending, schedule
        // the transaction to commit.
        Ember.run.once(transaction, transaction.commit);
      },

      willCommit: function(manager) {
        var dirtyType = get(this, 'dirtyType');
        manager.goToState(dirtyType + '.inFlight');
      }
    })
  }),

  // A record is in the `invalid` state when its client-side
  // invalidations have failed, or if the adapter has indicated
  // the the record failed server-side invalidations.
  invalid: DS.State.extend({
    // FLAGS
    isValid: false,

    // EVENTS
    deleteRecord: function(manager) {
      manager.goToState('deleted');
    },

    setAssociation: setAssociation,

    setProperty: function(manager, context) {
      setProperty(manager, context);

      var model = get(manager, 'model'),
          errors = get(model, 'errors'),
          key = context.key;

      delete errors[key];

      if (!hasDefinedProperties(errors)) {
        manager.send('becameValid');
      }
    },

    becameValid: function(manager) {
      manager.goToState('uncommitted');
    }
  })
});

// The created and updated states are created outside the state
// chart so we can reopen their substates and add mixins as
// necessary.

var createdState = DirtyState.create({
  dirtyType: 'created',

  // FLAGS
  isNew: true,

  // EVENTS
  invokeLifecycleCallbacks: function(manager, model) {
    model.didCreate();
  }
});

var updatedState = DirtyState.create({
  dirtyType: 'updated',

  // EVENTS
  invokeLifecycleCallbacks: function(manager, model) {
    model.didUpdate();
  }
});

// The created.uncommitted state and created.pending.uncommitted share
// some logic defined in CreatedUncommitted.
createdState.states.uncommitted.reopen(CreatedUncommitted);
createdState.states.pending.states.uncommitted.reopen(CreatedUncommitted);

// The updated.uncommitted state and updated.pending.uncommitted share
// some logic defined in UpdatedUncommitted.
updatedState.states.uncommitted.reopen(UpdatedUncommitted);
updatedState.states.pending.states.uncommitted.reopen(UpdatedUncommitted);

var states = {
  rootState: Ember.State.create({
    // FLAGS
    isLoaded: false,
    isDirty: false,
    isSaving: false,
    isDeleted: false,
    isError: false,
    isNew: false,
    isValid: true,
    isPending: false,

    // SUBSTATES

    // A record begins its lifecycle in the `empty` state.
    // If its data will come from the adapter, it will
    // transition into the `loading` state. Otherwise, if
    // the record is being created on the client, it will
    // transition into the `created` state.
    empty: DS.State.create({
      // EVENTS
      loadingData: function(manager) {
        manager.goToState('loading');
      },

      didChangeData: function(manager) {
        didChangeData(manager);

        manager.goToState('loaded.created');
      }
    }),

    // A record enters this state when the store askes
    // the adapter for its data. It remains in this state
    // until the adapter provides the requested data.
    //
    // Usually, this process is asynchronous, using an
    // XHR to retrieve the data.
    loading: DS.State.create({
      // TRANSITIONS
      exit: function(manager) {
        var model = get(manager, 'model');
        model.didLoad();
      },

      // EVENTS
      didChangeData: function(manager, data) {
        didChangeData(manager);
        manager.send('loadedData');
      },

      loadedData: function(manager) {
        manager.goToState('loaded');
      }
    }),

    // A record enters this state when its data is populated.
    // Most of a record's lifecycle is spent inside substates
    // of the `loaded` state.
    loaded: DS.State.create({
      initialState: 'saved',

      // FLAGS
      isLoaded: true,

      // SUBSTATES

      // If there are no local changes to a record, it remains
      // in the `saved` state.
      saved: DS.State.create({
        // EVENTS
        setProperty: function(manager, context) {
          setProperty(manager, context);
          manager.goToState('updated');
        },

        setAssociation: function(manager, context) {
          setAssociation(manager, context);
          manager.goToState('updated');
        },

        didChangeData: didChangeData,

        deleteRecord: function(manager) {
          manager.goToState('deleted');
        },

        waitingOn: function(manager, object) {
          waitingOn(manager, object);
          manager.goToState('updated.pending');
        }
      }),

      // A record is in this state after it has been locally
      // created but before the adapter has indicated that
      // it has been saved.
      created: createdState,

      // A record is in this state if it has already been
      // saved to the server, but there are new local changes
      // that have not yet been saved.
      updated: updatedState
    }),

    // A record is in this state if it was deleted from the store.
    deleted: DS.State.create({
      // FLAGS
      isDeleted: true,
      isLoaded: true,
      isDirty: true,

      // SUBSTATES

      // When a record is deleted, it enters the `start`
      // state. It will exit this state when the record's
      // transaction starts to commit.
      start: DS.State.create({
        // TRANSITIONS
        enter: function(manager) {
          var model = get(manager, 'model');
          var store = get(model, 'store');

          if (store) {
            store.removeFromModelArrays(model);
          }

          model.withTransaction(function(t) {
            t.modelBecameDirty('deleted', model);
          });
        },

        // EVENTS
        willCommit: function(manager) {
          manager.goToState('inFlight');
        }
      }),

      // After a record's transaction is committing, but
      // before the adapter indicates that the deletion
      // has saved to the server, a record is in the
      // `inFlight` substate of `deleted`.
      inFlight: DS.State.create({
        // FLAGS
        isSaving: true,

        // TRANSITIONS
        exit: function(stateManager) {
          var model = get(stateManager, 'model');

          model.withTransaction(function(t) {
            t.modelBecameClean('deleted', model);
          });
        },

        // EVENTS
        didCommit: function(manager) {
          manager.goToState('saved');
        }
      }),

      // Once the adapter indicates that the deletion has
      // been saved, the record enters the `saved` substate
      // of `deleted`.
      saved: DS.State.create({
        // FLAGS
        isDirty: false
      })
    }),

    // If the adapter indicates that there was an unknown
    // error saving a record, the record enters the `error`
    // state.
    error: DS.State.create({
      isError: true
    })
  })
};

DS.StateManager = Ember.StateManager.extend({
  model: null,
  initialState: 'rootState',
  states: states
});

})();



(function() {
var get = Ember.get, set = Ember.set;

// This object is a regular JS object for performance. It is only
// used internally for bookkeeping purposes.
var DataProxy = DS._DataProxy = function(record) {
  this.record = record;
  this.unsavedData = {};
  this.associations = {};
};

DataProxy.prototype = {
  get: function(key) { return Ember.get(this, key); },
  set: function(key, value) { return Ember.set(this, key, value); },

  setAssociation: function(key, value) {
    this.associations[key] = value;
  },

  savedData: function() {
    var savedData = this._savedData;
    if (savedData) { return savedData; }

    var record = this.record,
        clientId = get(record, 'clientId'),
        store = get(record, 'store');

    if (store) {
      savedData = store.dataForRecord(record);
      this._savedData = savedData;
      return savedData;
    }
  },

  unknownProperty: function(key) {
    var unsavedData = this.unsavedData,
        associations = this.associations,
        savedData = this.savedData(),
        store;

    var value = unsavedData[key], association;

    // if this is a belongsTo association, this will
    // be a clientId.
    association = associations[key];

    if (association !== undefined) {
      store = get(this.record, 'store');
      return store.clientIdToId[association];
    }

    if (savedData && value === undefined) {
      value = savedData[key];
    }

    return value;
  },

  setUnknownProperty: function(key, value) {
    var record = this.record,
        unsavedData = this.unsavedData;

    unsavedData[key] = value;

    record.hashWasUpdated();

    return value;
  },

  commit: function() {
    var record = this.record;

    var unsavedData = this.unsavedData;
    var savedData = this.savedData();

    for (var prop in unsavedData) {
      if (unsavedData.hasOwnProperty(prop)) {
        savedData[prop] = unsavedData[prop];
        delete unsavedData[prop];
      }
    }

    record.notifyPropertyChange('data');
  },

  rollback: function() {
    this.unsavedData = {};
  },

  adapterDidUpdate: function(data) {
    this.unsavedData = {};
  }
};

})();



(function() {
var get = Ember.get, set = Ember.set, getPath = Ember.getPath, none = Ember.none;

var retrieveFromCurrentState = Ember.computed(function(key) {
  return get(getPath(this, 'stateManager.currentState'), key);
}).property('stateManager.currentState').cacheable();

DS.Model = Ember.Object.extend({
  isLoaded: retrieveFromCurrentState,
  isDirty: retrieveFromCurrentState,
  isSaving: retrieveFromCurrentState,
  isDeleted: retrieveFromCurrentState,
  isError: retrieveFromCurrentState,
  isNew: retrieveFromCurrentState,
  isPending: retrieveFromCurrentState,
  isValid: retrieveFromCurrentState,

  clientId: null,
  transaction: null,
  stateManager: null,
  pendingQueue: null,
  errors: null,

  // because unknownProperty is used, any internal property
  // must be initialized here.
  primaryKey: 'id',
  id: Ember.computed(function(key, value) {
    var primaryKey = get(this, 'primaryKey'),
        data = get(this, 'data');

    if (arguments.length === 2) {
      set(data, primaryKey, value);
      return value;
    }

    return data && get(data, primaryKey);
  }).property('primaryKey', 'data'),

  // The following methods are callbacks invoked by `getJSON`. You
  // can override one of the callbacks to override specific behavior,
  // or getJSON itself.
  //
  // If you override getJSON, you can invoke these callbacks manually
  // to get the default behavior.

  /**
    Add the record's primary key to the JSON hash.

    The default implementation uses the record's specified `primaryKey`
    and the `id` computed property, which are passed in as parameters.

    @param {Object} json the JSON hash being built
    @param {Number|String} id the record's id
    @param {String} key the primaryKey for the record
  */
  addIdToJSON: function(json, id, key) {
    if (id) { json[key] = id; }
  },

  /**
    Add the attributes' current values to the JSON hash.

    The default implementation gets the current value of each
    attribute from the `data`, and uses a `defaultValue` if
    specified in the `DS.attr` definition.

    @param {Object} json the JSON hash being build
    @param {Ember.Map} attributes a Map of attributes
    @param {DataProxy} data the record's data, accessed with `get` and `set`.
  */
  addAttributesToJSON: function(json, attributes, data) {
    attributes.forEach(function(name, meta) {
      var key = meta.key(this.constructor),
          value = get(data, key);

      if (value === undefined) {
        value = meta.options.defaultValue;
      }

      json[key] = value;
    }, this);
  },

  /**
    Add the value of a `hasMany` association to the JSON hash.

    The default implementation honors the `embedded` option
    passed to `DS.hasMany`. If embedded, `toJSON` is recursively
    called on the child records. If not, the `id` of each
    record is added.

    Note that if a record is not embedded and does not
    yet have an `id` (usually provided by the server), it
    will not be included in the output.

    @param {Object} json the JSON hash being built
    @param {DataProxy} data the record's data, accessed with `get` and `set`.
    @param {Object} meta information about the association
    @param {Object} options options passed to `toJSON`
  */
  addHasManyToJSON: function(json, data, meta, options) {
    var key = meta.key,
        manyArray = get(this, key),
        records = [],
        clientId, id;

    if (meta.options.embedded) {
      // TODO: Avoid materializing embedded hashes if possible
      manyArray.forEach(function(record) {
        records.push(record.toJSON(options));
      });
    } else {
      var clientIds = get(manyArray, 'content');

      for (var i=0, l=clientIds.length; i<l; i++) {
        clientId = clientIds[i];
        id = get(this, 'store').clientIdToId[clientId];

        if (id !== undefined) {
          records.push(id);
        }
      }
    }

    json[key] = records;
  },

  /**
    Add the value of a `belongsTo` association to the JSON hash.

    The default implementation always includes the `id`.

    @param {Object} json the JSON hash being built
    @param {DataProxy} data the record's data, accessed with `get` and `set`.
    @param {Object} meta information about the association
    @param {Object} options options passed to `toJSON`
  */
  addBelongsToToJSON: function(json, data, meta, options) {
    var key = meta.key, value, id;

    if (options.embedded) {
      key = options.key || get(this, 'namingConvention').keyToJSONKey(key);
      value = get(data.record, key);
      json[key] = value ? value.toJSON(options) : null;
    } else {
      key = options.key || get(this, 'namingConvention').foreignKey(key);
      id = data.get(key);
      json[key] = none(id) ? null : id;
    }
  },
  /**
    Create a JSON representation of the record, including its `id`,
    attributes and associations. Honor any settings defined on the
    attributes or associations (such as `embedded` or `key`).
  */
  toJSON: function(options) {
    var data = get(this, 'data'),
        result = {},
        type = this.constructor,
        attributes = get(type, 'attributes'),
        primaryKey = get(this, 'primaryKey'),
        id = get(this, 'id'),
        store = get(this, 'store'),
        associations;

    options = options || {};

    // delegate to `addIdToJSON` callback
    this.addIdToJSON(result, id, primaryKey);

    // delegate to `addAttributesToJSON` callback
    this.addAttributesToJSON(result, attributes, data);

    associations = get(type, 'associationsByName');

    // add associations, delegating to `addHasManyToJSON` and
    // `addBelongsToToJSON`.
    associations.forEach(function(key, meta) {
      if (options.associations && meta.kind === 'hasMany') {
        this.addHasManyToJSON(result, data, meta, options);
      } else if (meta.kind === 'belongsTo') {
        this.addBelongsToToJSON(result, data, meta, options);
      }
    }, this);

    return result;
  },

  data: Ember.computed(function() {
    return new DS._DataProxy(this);
  }).cacheable(),

  didLoad: Ember.K,
  didUpdate: Ember.K,
  didCreate: Ember.K,

  init: function() {
    var stateManager = DS.StateManager.create({
      model: this
    });

    set(this, 'pendingQueue', {});

    set(this, 'stateManager', stateManager);
    stateManager.goToState('empty');
  },

  destroy: function() {
    if (!get(this, 'isDeleted')) {
      this.deleteRecord();
    }
    this._super();
  },

  send: function(name, context) {
    return get(this, 'stateManager').send(name, context);
  },

  withTransaction: function(fn) {
    var transaction = get(this, 'transaction');
    if (transaction) { fn(transaction); }
  },

  setProperty: function(key, value) {
    this.send('setProperty', { key: key, value: value });
  },

  deleteRecord: function() {
    this.send('deleteRecord');
  },

  waitingOn: function(record) {
    this.send('waitingOn', record);
  },

  notifyHashWasUpdated: function() {
    var store = get(this, 'store');
    if (store) {
      store.hashWasUpdated(this.constructor, get(this, 'clientId'), this);
    }
  },

  unknownProperty: function(key) {
    var data = get(this, 'data');

    if (data && key in data) {

    }
  },

  setUnknownProperty: function(key, value) {
    var data = get(this, 'data');

    if (data && key in data) {

    } else {
      return this._super(key, value);
    }
  },

  namingConvention: {
    keyToJSONKey: function(key) {
      // TODO: Strip off `is` from the front. Example: `isHipster` becomes `hipster`
      return Ember.String.decamelize(key);
    },

    foreignKey: function(key) {
      return Ember.String.decamelize(key) + '_id';
    }
  },

  /** @private */
  hashWasUpdated: function() {
    // At the end of the run loop, notify model arrays that
    // this record has changed so they can re-evaluate its contents
    // to determine membership.
    Ember.run.once(this, this.notifyHashWasUpdated);
  },

  dataDidChange: Ember.observer(function() {
    var associations = get(this.constructor, 'associationsByName'),
        data = get(this, 'data'), store = get(this, 'store'),
        idToClientId = store.idToClientId,
        cachedValue;

    associations.forEach(function(name, association) {
      if (association.kind === 'hasMany') {
        cachedValue = this.cacheFor(name);

        if (cachedValue) {
          var ids = data.get(name) || [];
          var clientIds = Ember.ArrayUtils.map(ids, function(id) {
            return store.clientIdForId(association.type, id);
          });

          set(cachedValue, 'content', Ember.A(clientIds));
          cachedValue.fetch();
        }
      }
    }, this);
  }, 'data')
});

// Helper function to generate store aliases.
// This returns a function that invokes the named alias
// on the default store, but injects the class as the
// first parameter.
var storeAlias = function(methodName) {
  return function() {
    var store = get(DS, 'defaultStore'),
        args = [].slice.call(arguments);

    args.unshift(this);
    return store[methodName].apply(store, args);
  };
};

DS.Model.reopenClass({
  find: storeAlias('find'),
  filter: storeAlias('filter'),

  _create: DS.Model.create,

  create: function() {
    throw new Ember.Error("You should not call `create` on a model. Instead, call `createRecord` with the attributes you would like to set.");
  },

  createRecord: storeAlias('createRecord')
});

})();



(function() {
var get = Ember.get, getPath = Ember.getPath;
DS.Model.reopenClass({
  attributes: Ember.computed(function() {
    var map = Ember.Map.create();

    this.eachComputedProperty(function(name, meta) {
      if (meta.isAttribute) { map.set(name, meta); }
    });

    return map;
  }).cacheable(),

  processAttributeKeys: function() {
    if (this.processedAttributeKeys) { return; }

    var namingConvention = this.proto().namingConvention;

    this.eachComputedProperty(function(name, meta) {
      if (meta.isAttribute && !meta.options.key) {
        meta.options.key = namingConvention.keyToJSONKey(name, this);
      }
    }, this);
  }
});

DS.attr = function(type, options) {
  var transform = DS.attr.transforms[type];


  var transformFrom = transform.from;
  var transformTo = transform.to;

  options = options || {};

  var meta = {
    type: type,
    isAttribute: true,
    options: options,

    // this will ensure that the key always takes naming
    // conventions into consideration.
    key: function(recordType) {
      recordType.processAttributeKeys();
      return options.key;
    }
  };

  return Ember.computed(function(key, value) {
    var data;

    key = meta.key(this.constructor);

    if (arguments.length === 2) {
      value = transformTo(value);
      this.setProperty(key, value);
    } else {
      data = get(this, 'data');
      value = get(data, key);

      if (value === undefined) {
        value = options.defaultValue;
      }
    }

    return transformFrom(value);
  // `data` is never set directly. However, it may be
  // invalidated from the state manager's setData
  // event.
  }).property('data').cacheable().meta(meta);
};

DS.attr.transforms = {
  string: {
    from: function(serialized) {
      return Ember.none(serialized) ? null : String(serialized);
    },

    to: function(deserialized) {
      return Ember.none(deserialized) ? null : String(deserialized);
    }
  },

  number: {
    from: function(serialized) {
      return Ember.none(serialized) ? null : Number(serialized);
    },

    to: function(deserialized) {
      return Ember.none(deserialized) ? null : Number(deserialized);
    }
  },

  'boolean': {
    from: function(serialized) {
      return Boolean(serialized);
    },

    to: function(deserialized) {
      return Boolean(deserialized);
    }
  },

  date: {
    from: function(serialized) {
      var type = typeof serialized;

      if (type === "string" || type === "number") {
        return new Date(serialized);
      } else if (serialized === null || serialized === undefined) {
        // if the value is not present in the data,
        // return undefined, not null.
        return serialized;
      } else {
        return null;
      }
    },

    to: function(date) {
      if (date instanceof Date) {
        var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        var pad = function(num) {
          return num < 10 ? "0"+num : ""+num;
        };

        var utcYear = date.getUTCFullYear(),
            utcMonth = date.getUTCMonth(),
            utcDayOfMonth = date.getUTCDate(),
            utcDay = date.getUTCDay(),
            utcHours = date.getUTCHours(),
            utcMinutes = date.getUTCMinutes(),
            utcSeconds = date.getUTCSeconds();


        var dayOfWeek = days[utcDay];
        var dayOfMonth = pad(utcDayOfMonth);
        var month = months[utcMonth];

        return dayOfWeek + ", " + dayOfMonth + " " + month + " " + utcYear + " " +
               pad(utcHours) + ":" + pad(utcMinutes) + ":" + pad(utcSeconds) + " GMT";
      } else if (date === undefined) {
        return undefined;
      } else {
        return null;
      }
    }
  }
};


})();



(function() {

})();



(function() {
var get = Ember.get, set = Ember.set, getPath = Ember.getPath,
    none = Ember.none;

var embeddedFindRecord = function(store, type, data, key, one) {
  var association = get(data, key);
  return none(association) ? undefined : store.load(type, association).id;
};

var referencedFindRecord = function(store, type, data, key, one) {
  return get(data, key);
};

var hasAssociation = function(type, options, one) {
  options = options || {};

  var embedded = options.embedded,
      findRecord = embedded ? embeddedFindRecord : referencedFindRecord;

  var meta = { type: type, isAssociation: true, options: options, kind: 'belongsTo' };

  return Ember.computed(function(key, value) {
    var data = get(this, 'data'), ids, id, association,
        store = get(this, 'store');

    if (typeof type === 'string') {
      type = getPath(this, type, false) || getPath(window, type);
    }

    if (arguments.length === 2) {
      key = options.key || get(this, 'namingConvention').foreignKey(key);
      this.send('setAssociation', { key: key, value: value === null ? null : get(value, 'clientId') });
      //data.setAssociation(key, get(value, 'clientId'));
      // put the client id in `key` in the data hash
      return value;
    } else {
      // Embedded belongsTo associations should not look for
      // a foreign key.
      if (embedded) {
        key = options.key || key;

      // Non-embedded associations should look for a foreign key.
      // For example, instead of person, we might look for person_id
      } else {
        key = options.key || get(this, 'namingConvention').foreignKey(key);
      }
      id = findRecord(store, type, data, key, true);
      association = id ? store.find(type, id) : null;
    }

    return association;
  }).property('data').cacheable().meta(meta);
};

DS.belongsTo = function(type, options) {

  return hasAssociation(type, options);
};

})();



(function() {
var get = Ember.get, set = Ember.set, getPath = Ember.getPath;
var embeddedFindRecord = function(store, type, data, key) {
  var association = get(data, key);
  return association ? store.loadMany(type, association).ids : [];
};

var referencedFindRecord = function(store, type, data, key, one) {
  return get(data, key);
};

var hasAssociation = function(type, options) {
  options = options || {};

  var embedded = options.embedded,
      findRecord = embedded ? embeddedFindRecord : referencedFindRecord;

  var meta = { type: type, isAssociation: true, options: options, kind: 'hasMany' };

  return Ember.computed(function(key, value) {
    var data = get(this, 'data'),
        store = get(this, 'store'),
        ids, id, association;

    if (typeof type === 'string') {
      type = getPath(this, type, false) || getPath(window, type);
    }

    key = options.key || key;
    ids = findRecord(store, type, data, key);
    association = store.findMany(type, ids);
    set(association, 'parentRecord', this);

    return association;
  }).property().cacheable().meta(meta);
};

DS.hasMany = function(type, options) {

  return hasAssociation(type, options);
};

})();



(function() {
var get = Ember.get, getPath = Ember.getPath;

DS.Model.reopenClass({
  typeForAssociation: function(name) {
    var association = get(this, 'associationsByName').get(name);
    return association && association.type;
  },

  associations: Ember.computed(function() {
    var map = Ember.Map.create();

    this.eachComputedProperty(function(name, meta) {
      if (meta.isAssociation) {
        var type = meta.type,
            typeList = map.get(type);

        if (typeof type === 'string') {
          type = getPath(this, type, false) || getPath(window, type);
          meta.type = type;
        }

        if (!typeList) {
          typeList = [];
          map.set(type, typeList);
        }

        typeList.push({ name: name, kind: meta.kind });
      }
    });

    return map;
  }).cacheable(),

  associationsByName: Ember.computed(function() {
    var map = Ember.Map.create(), type;

    this.eachComputedProperty(function(name, meta) {
      if (meta.isAssociation) {
        meta.key = name;
        type = meta.type;

        if (typeof type === 'string') {
          type = getPath(this, type, false) || getPath(window, type);
          meta.type = type;
        }

        map.set(name, meta);
      }
    });

    return map;
  }).cacheable()
});

})();



(function() {

})();



(function() {
DS.Adapter = Ember.Object.extend({
  commit: function(store, commitDetails) {
    commitDetails.updated.eachType(function(type, array) {
      this.updateRecords(store, type, array.slice());
    }, this);

    commitDetails.created.eachType(function(type, array) {
      this.createRecords(store, type, array.slice());
    }, this);

    commitDetails.deleted.eachType(function(type, array) {
      this.deleteRecords(store, type, array.slice());
    }, this);
  },

  createRecords: function(store, type, models) {
    models.forEach(function(model) {
      this.createRecord(store, type, model);
    }, this);
  },

  updateRecords: function(store, type, models) {
    models.forEach(function(model) {
      this.updateRecord(store, type, model);
    }, this);
  },

  deleteRecords: function(store, type, models) {
    models.forEach(function(model) {
      this.deleteRecord(store, type, model);
    }, this);
  },

  findMany: function(store, type, ids) {
    ids.forEach(function(id) {
      this.find(store, type, id);
    }, this);
  }
});

})();



(function() {
DS.fixtureAdapter = DS.Adapter.create({
  find: function(store, type, id) {
    var fixtures = type.FIXTURES;

    if (fixtures.hasLoaded) { return; }

    setTimeout(function() {
      store.loadMany(type, fixtures);
      fixtures.hasLoaded = true;
    }, 300);
  },

  findMany: function() {
    this.find.apply(this, arguments);
  },

  findAll: function(store, type) {
    var fixtures = type.FIXTURES;


    var ids = fixtures.map(function(item, index, self){ return item.id; });
    store.loadMany(type, ids, fixtures);
  }

});

})();



(function() {
/*global jQuery*/

var get = Ember.get, set = Ember.set, getPath = Ember.getPath;

DS.RESTAdapter = DS.Adapter.extend({
  createRecord: function(store, type, model) {
    var root = this.rootForType(type);

    var data = {};
    data[root] = model.toJSON();

    this.ajax(this.buildURL(root), "POST", {
      data: data,
      success: function(json) {
        this.sideload(store, type, json, root);
        store.didCreateRecord(model, json[root]);
      }
    });
  },

  createRecords: function(store, type, models) {
    if (get(this, 'bulkCommit') === false) {
      return this._super(store, type, models);
    }

    var root = this.rootForType(type),
        plural = this.pluralize(root);

    var data = {};
    data[plural] = models.map(function(model) {
      return model.toJSON();
    });

    this.ajax(this.buildURL(root), "POST", {
      data: data,

      success: function(json) {
        this.sideload(store, type, json, plural);
        store.didCreateRecords(type, models, json[plural]);
      }
    });
  },

  updateRecord: function(store, type, model) {
    var id = get(model, 'id');
    var root = this.rootForType(type);

    var data = {};
    data[root] = model.toJSON();

    this.ajax(this.buildURL(root, id), "PUT", {
      data: data,
      success: function(json) {
        this.sideload(store, type, json, root);
        store.didUpdateRecord(model, json && json[root]);
      }
    });
  },

  updateRecords: function(store, type, models) {
    if (get(this, 'bulkCommit') === false) {
      return this._super(store, type, models);
    }

    var root = this.rootForType(type),
        plural = this.pluralize(root);

    var data = {};
    data[plural] = models.map(function(model) {
      return model.toJSON();
    });

    this.ajax(this.buildURL(root, "bulk"), "PUT", {
      data: data,
      success: function(json) {
        this.sideload(store, type, json, plural);
        store.didUpdateRecords(models, json[plural]);
      }
    });
  },

  deleteRecord: function(store, type, model) {
    var id = get(model, 'id');
    var root = this.rootForType(type);

    this.ajax(this.buildURL(root, id), "DELETE", {
      success: function(json) {
        if (json) { this.sideload(store, type, json); }
        store.didDeleteRecord(model);
      }
    });
  },

  deleteRecords: function(store, type, models) {
    if (get(this, 'bulkCommit') === false) {
      return this._super(store, type, models);
    }

    var root = this.rootForType(type),
        plural = this.pluralize(root);

    var data = {};
    data[plural] = models.map(function(model) {
      return get(model, 'id');
    });

    this.ajax(this.buildURL(root, 'bulk'), "DELETE", {
      data: data,
      success: function(json) {
        if (json) { this.sideload(store, type, json); }
        store.didDeleteRecords(models);
      }
    });
  },

  find: function(store, type, id) {
    var root = this.rootForType(type);

    this.ajax(this.buildURL(root, id), "GET", {
      success: function(json) {
        store.load(type, json[root]);
        this.sideload(store, type, json, root);
      }
    });
  },

  findMany: function(store, type, ids) {
    var root = this.rootForType(type), plural = this.pluralize(root);

    this.ajax(this.buildURL(root), "GET", {
      data: { ids: ids },
      success: function(json) {
        store.loadMany(type, ids, json[plural]);
        this.sideload(store, type, json, plural);
      }
    });
  },

  findAll: function(store, type) {
    var root = this.rootForType(type), plural = this.pluralize(root);

    this.ajax(this.buildURL(root), "GET", {
      success: function(json) {
        store.loadMany(type, json[plural]);
        this.sideload(store, type, json, plural);
      }
    });
  },

  findQuery: function(store, type, query, modelArray) {
    var root = this.rootForType(type), plural = this.pluralize(root);

    this.ajax(this.buildURL(root), "GET", {
      data: query,
      success: function(json) {
        modelArray.load(json[plural]);
        this.sideload(store, type, json, plural);
      }
    });
  },

  // HELPERS

  plurals: {},

  // define a plurals hash in your subclass to define
  // special-case pluralization
  pluralize: function(name) {
    return this.plurals[name] || name + "s";
  },

  rootForType: function(type) {
    if (type.url) { return type.url; }

    // use the last part of the name as the URL
    var parts = type.toString().split(".");
    var name = parts[parts.length - 1];
    return name.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1);
  },

  ajax: function(url, type, hash) {
    hash.url = url;
    hash.type = type;
    hash.dataType = 'json';
    hash.contentType = 'application/json';
    hash.context = this;

    if (hash.data && type !== 'GET') {
      hash.data = JSON.stringify(hash.data);
    }

    jQuery.ajax(hash);
  },

  sideload: function(store, type, json, root) {
    var sideloadedType, mappings;

    for (var prop in json) {
      if (!json.hasOwnProperty(prop)) { continue; }
      if (prop === root) { continue; }

      sideloadedType = type.typeForAssociation(prop);

      if (!sideloadedType) {
        mappings = get(this, 'mappings');


        sideloadedType = get(get(this, 'mappings'), prop);

      }

      this.loadValue(store, sideloadedType, json[prop]);
    }
  },

  loadValue: function(store, type, value) {
    if (value instanceof Array) {
      store.loadMany(type, value);
    } else {
      store.load(type, value);
    }
  },

  buildURL: function(model, suffix) {
    var url = [""];

    if (this.namespace !== undefined) {
      url.push(this.namespace);
    }

    url.push(this.pluralize(model));
    if (suffix !== undefined) {
      url.push(suffix);
    }

    return url.join("/");
  }
});


})();



(function() {
//Copyright (C) 2011 by Living Social, Inc.

//Permission is hereby granted, free of charge, to any person obtaining a copy of
//this software and associated documentation files (the "Software"), to deal in
//the Software without restriction, including without limitation the rights to
//use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
//of the Software, and to permit persons to whom the Software is furnished to do
//so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all
//copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//SOFTWARE.

})();

