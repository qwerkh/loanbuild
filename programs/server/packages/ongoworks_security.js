(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var _ = Package.underscore._;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var ECMAScript = Package.ecmascript.ECMAScript;
var MongoID = Package['mongo-id'].MongoID;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var rulesByCollection, addFuncForAll, ensureCreated, ensureDefaultAllow, getRulesForCollectionAndType, getCollectionName, Security, types, collections, arg, fieldNames;

var require = meteorInstall({"node_modules":{"meteor":{"ongoworks:security":{"lib":{"server":{"utility.js":function module(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ongoworks_security/lib/server/utility.js                                                                 //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
/* global _, rulesByCollection:true, addFuncForAll:true, ensureCreated:true, ensureDefaultAllow:true */
rulesByCollection = {};
var created = {
  allow: {
    insert: {},
    update: {},
    remove: {},
    download: {} // for use with CollectionFS packages

  },
  deny: {
    insert: {},
    update: {},
    remove: {},
    download: {} // for use with CollectionFS packages

  }
};
/**
 * Adds the given function as an allow or deny function for all specified collections and types.
 * @param {Array(Mongo.Collection)} collections Array of Mongo.Collection instances
 * @param {String}                  allowOrDeny "allow" or "deny"
 * @param {Array(String)}           types       Array of types ("insert", "update", "remove")
 * @param {Array(String)|null}      fetch       `fetch` property to use
 * @param {Function}                func        The function
 */

addFuncForAll = function addFuncForAll(collections, allowOrDeny, types, fetch, func) {
  // We always disable transformation, but we transform for specific
  // rules upon running our deny function if requested.
  var rules = {
    transform: null
  };

  if (_.isArray(fetch)) {
    rules.fetch = fetch;
  }

  _.each(types, function (t) {
    rules[t] = func;
  });

  _.each(collections, function (c) {
    c[allowOrDeny](rules);
  });
};
/**
 * Creates the allow or deny function for the given collections if not already created. This ensures that this package only ever creates up to one allow and one deny per collection.
 * @param   {String}                  allowOrDeny "allow" or "deny"
 * @param   {Array(Mongo.Collection)} collections An array of collections
 * @param   {Array(String)}           types       An array of types ("insert", "update", "remove")
 * @param   {Array(String)|null}      fetch       `fetch` property to use
 * @param   {Function}                func        The function
 */


ensureCreated = function ensureCreated(allowOrDeny, collections, types, fetch, func) {
  _.each(types, t => {
    // Ignore "read"
    if (!_.contains(['insert', 'update', 'remove', 'download'], t)) return;
    collections = _.reject(collections, c => {
      return _.has(created[allowOrDeny][t], getCollectionName(c));
    });
    addFuncForAll(collections, allowOrDeny, [t], null, func); // mark that we've defined function for collection-type combo

    _.each(collections, c => {
      created[allowOrDeny][t][getCollectionName(c)] = true;
    });
  });
};
/**
 * Sets up default allow functions for the collections and types.
 * @param   {Array(Mongo.Collection)} collections Array of Mongo.Collection instances
 * @param   {Array(String)}           types       Array of types ("insert", "update", "remove")
 */


ensureDefaultAllow = function ensureDefaultAllow(collections, types) {
  ensureCreated("allow", collections, types, [], function () {
    return true;
  });
};
/**
 * Return only those rules that apply to the given collection and operation type
 */


getRulesForCollectionAndType = function getRulesForCollectionAndType(collectionName, type) {
  var rules = rulesByCollection[collectionName] || [];
  return _.select(rules, function (rule) {
    return _.contains(rule._types, type);
  });
};

getCollectionName = function getCollectionName(collection) {
  // CollectionFS has underlying collection on `files` property
  return collection._name || collection.files && collection.files._name;
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Security.js":function module(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ongoworks_security/lib/server/Security.js                                                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
// The `Security` object is exported and provides the package API
Security = {
  // Putting these on the exported object allows package users to override if necessary
  errorMessages: {
    multipleCan: 'You may not combine more than one insert, update, or remove on a Security.can chain',
    notAllowed: 'Action not allowed',
    requiresDefinition: 'Security.defineMethod requires a "definition" argument',
    requiresAllow: 'Security.defineMethod requires an "allow" function',
    collectionsArg: 'The collections argument must be a Mongo.Collection instance or an array of them',
    noCollectionOrType: 'At a minimum, you must call permit and collections methods for a security rule.'
  },
  // the starting point of the chain
  permit: function permit(types) {
    return new Security.Rule(types);
  },
  can: function can(userId) {
    return new Security.Check(userId);
  },
  defineMethod: function securityDefineMethod(name, definition) {
    // Check whether a rule with the given name already exists; can't overwrite
    if (Security.Rule.prototype[name]) {
      throw new Error('A security method with the name "' + name + '" has already been defined');
    }

    if (!definition) throw new Error(Security.errorMessages.requiresDefinition); // If "deny" is used, convert to "allow" for backwards compatibility

    if (definition.deny) {
      definition.allow = function () {
        return !definition.deny(...arguments);
      };
    } // Make sure the definition argument is an object that has an `allow` property


    if (!definition.allow) throw new Error(Security.errorMessages.requiresAllow); // Wrap transform, if provided

    if (definition.transform) {
      definition.transform = LocalCollection.wrapTransform(definition.transform);
    }

    Security.Rule.prototype[name] = function (arg) {
      this._restrictions.push({
        definition,
        arg
      });

      return this;
    };
  }
};

Mongo.Collection.prototype.permit = function (types) {
  return Security.permit(types).collections(this);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Security.Rule.js":function module(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ongoworks_security/lib/server/Security.Rule.js                                                           //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Security.Rule = class {
  constructor(types) {
    if (!_.isArray(types)) types = [types];
    this._types = types;
    this._restrictions = [];
  }

  collections(collections) {
    // Make sure the `collections` argument is either a `Mongo.Collection` instance or
    // an array of them. If it's a single collection, convert it to a one-item array.
    if (!_.isArray(collections)) collections = [collections]; // Keep list keyed by collection name

    _.each(collections, collection => {
      if (!(collection instanceof Mongo.Collection) && // CollectionFS has underlying collection on `files` property
      !(collection.files instanceof Mongo.Collection)) {
        throw new Error(Security.errorMessages.collectionsArg);
      } // CollectionFS has underlying collection on `files` property


      const collectionName = getCollectionName(collection);
      rulesByCollection[collectionName] = rulesByCollection[collectionName] || [];
      rulesByCollection[collectionName].push(this);
    });

    this._collections = collections;
    return this;
  }

  combinedFetch() {
    // We need a combined `fetch` array. The `fetch` is optional and can be either an array
    // or a function that takes the argument passed to the restriction method and returns an array.
    let fetch = [];

    _.every(this._restrictions, restriction => {
      if (_.isArray(restriction.definition.fetch)) {
        fetch = _.union(fetch, restriction.definition.fetch);
      } else if (typeof restriction.definition.fetch === "function") {
        fetch = _.union(fetch, restriction.definition.fetch(restriction.arg));
      } else if (!restriction.definition.hasOwnProperty('fetch')) {
        // If `fetch` property isn't present, we should fetch the full doc.
        fetch = null;
        return false; // Exit loop
      }

      return true;
    });

    return fetch;
  }

  allowInClientCode() {
    if (!this._collections || !this._types) throw new Error(Security.errorMessages.noCollectionOrType);
    ensureSecureDeny(this._collections, this._types);
  }

  allow(type, collection, userId, doc, modifier) {
    for (var _len = arguments.length, args = new Array(_len > 5 ? _len - 5 : 0), _key = 5; _key < _len; _key++) {
      args[_key - 5] = arguments[_key];
    }

    let fields;
    if (type === 'update') fields = computeChangedFieldsFromModifier(modifier); // Loop through all defined restrictions. Restrictions are additive for this chained
    // rule, so if any allow function returns false, this function should return false.

    return _.every(this._restrictions, restriction => {
      // Clone the doc in case we need to transform it. Transformations
      // should apply to only the one restriction.
      let loopDoc = _.clone(doc); // If transform is a function, apply that


      let transform = restriction.definition.transform;

      if (transform !== null) {
        transform = transform || collection._transform;

        if (typeof transform === 'function') {
          let addedRandomId = false;

          if (type === 'insert' && !loopDoc._id) {
            // The wrapped transform requires an _id, but we
            // don't have access to the generatedId from Meteor API,
            // so we'll fudge one and then remove it.
            loopDoc._id = Random.id();
            addedRandomId = true;
          }

          loopDoc = transform(loopDoc);
          if (addedRandomId) delete loopDoc._id;
        }
      }

      return restriction.definition.allow(type, restriction.arg, userId, loopDoc, fields, modifier, ...args);
    });
  }

};

function ensureSecureDeny(collections, types) {
  // If we haven't yet done so, set up a default, permissive `allow` function for all of
  // the given collections and types. We control all security through `deny` functions only, but
  // there must first be at least one `allow` function for each collection or all writes
  // will be denied.
  ensureDefaultAllow(collections, types);

  _.each(types, t => {
    _.each(collections, collection => {
      ensureCreated('deny', [collection], [t], null, function () {
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        const userId = args.shift(); // If type is update, remove the `fields` argument. We will create our own
        // for consistency.

        if (t === 'update') args = [args[0], args[2]];
        return !Security.can(userId)[t](...args).for(collection).check();
      });
    });
  });
}

function computeChangedFieldsFromModifier(modifier) {
  var fields = []; // This is the same logic Meteor's mongo package uses in
  // https://github.com/meteor/meteor/blob/devel/packages/mongo/collection.js

  _.each(modifier, function (params) {
    _.each(_.keys(params), function (field) {
      // treat dotted fields as if they are replacing their
      // top-level part
      if (field.indexOf('.') !== -1) field = field.substring(0, field.indexOf('.')); // record the field we are trying to change

      if (!_.contains(fields, field)) fields.push(field);
    });
  });

  return fields;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Security.Check.js":function module(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ongoworks_security/lib/server/Security.Check.js                                                          //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Security.Check = class {
  constructor(userId) {
    this.userId = userId || null;
  }

  for(collection) {
    this.collection = collection;
    this.collectionName = getCollectionName(collection);
    return this;
  }

  insert(doc) {
    if (this.type) throw new Error(Security.errorMessages.multipleCan);
    this.type = 'insert';
    this.doc = doc;

    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    this.args = args;
    return this;
  }

  update(doc, modifier) {
    if (this.type) throw new Error(Security.errorMessages.multipleCan);
    this.type = 'update';
    this.doc = doc;
    this.modifier = modifier;

    for (var _len2 = arguments.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
      args[_key2 - 2] = arguments[_key2];
    }

    this.args = args;
    return this;
  }

  remove(doc) {
    if (this.type) throw new Error(Security.errorMessages.multipleCan);
    this.type = 'remove';
    this.doc = doc;

    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }

    this.args = args;
    return this;
  }

  read(doc) {
    if (this.type) throw new Error(Security.errorMessages.multipleCan);
    this.type = 'read';
    this.doc = doc;

    for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      args[_key4 - 1] = arguments[_key4];
    }

    this.args = args;
    return this;
  }

  download(doc) {
    if (this.type) throw new Error(Security.errorMessages.multipleCan);
    this.type = 'download';
    this.doc = doc;

    for (var _len5 = arguments.length, args = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
      args[_key5 - 1] = arguments[_key5];
    }

    this.args = args;
    return this;
  } // EXAMPLES:
  // Security.can(userId).insert(doc).for(MyCollection).check()
  // Security.can(userId).update(id, modifier).for(MyCollection).check()
  // Security.can(userId).remove(id).for(MyCollection).check()


  check() {
    // Select only those rules that apply to this operation type
    const rules = getRulesForCollectionAndType(this.collectionName, this.type); // If this.doc is an ID, we will look up the doc, fetching only the fields needed.
    // To find out which fields are needed, we will combine all the `fetch` arrays from
    // all the restrictions in all the rules.

    if (typeof this.doc === 'string' || this.doc instanceof MongoID.ObjectID) {
      let fields = {};

      _.every(rules, rule => {
        const fetch = rule.combinedFetch();

        if (fetch === null) {
          fields = null;
          return false; // Exit loop
        }

        rule.combinedFetch().forEach(field => {
          fields[field] = 1;
        });
        return true;
      });

      let options = {};

      if (fields) {
        if (_.isEmpty(fields)) {
          options = {
            _id: 1
          };
        } else {
          options = {
            fields
          };
        }
      }

      this.doc = this.collection.findOne(this.doc, options);
    } // Loop through all defined rules for this collection. There is an OR relationship among
    // all rules for the collection, so if any "allow" function DO return true, we allow.


    return _.any(rules, rule => rule.allow(this.type, this.collection, this.userId, this.doc, this.modifier, ...this.args));
  } // EXAMPLES:
  // Security.can(userId).insert(doc).for(MyCollection).throw()
  // Security.can(userId).update(id, modifier).for(MyCollection).throw()
  // Security.can(userId).remove(id).for(MyCollection).throw()


  throw() {
    if (!this.check()) throw new Meteor.Error('access-denied', Security.errorMessages.notAllowed);
  }

};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"builtInRules.js":function module(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/ongoworks_security/lib/builtInRules.js                                                                   //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
/*
 * This file defines built-in restriction methods
 */

/*
 * No one
 */
Security.defineMethod("never", {
  fetch: [],
  transform: null,

  allow() {
    return false;
  }

});
/*
 * Logged In
 */

Security.defineMethod("ifLoggedIn", {
  fetch: [],
  transform: null,

  allow(type, arg, userId) {
    return !!userId;
  }

});
/*
 * Specific User ID
 */

Security.defineMethod("ifHasUserId", {
  fetch: [],
  transform: null,

  allow(type, arg, userId) {
    return userId === arg;
  }

});
/*
 * Specific Roles
 */

/*
 * alanning:roles support
 */

if (Package && Package["alanning:roles"]) {
  var Roles = Package["alanning:roles"].Roles;
  Security.defineMethod("ifHasRole", {
    fetch: [],
    transform: null,

    allow(type, arg, userId) {
      if (!arg) throw new Error('ifHasRole security rule method requires an argument');

      if (arg.role) {
        return Roles.userIsInRole(userId, arg.role, arg.group);
      } else {
        return Roles.userIsInRole(userId, arg);
      }
    }

  });
}
/*
 * nicolaslopezj:roles support
 * Note: doesn't support groups
 */


if (Package && Package["nicolaslopezj:roles"]) {
  var Roles = Package["nicolaslopezj:roles"].Roles;
  Security.defineMethod("ifHasRole", {
    fetch: [],
    transform: null,

    allow(type, arg, userId) {
      if (!arg) throw new Error('ifHasRole security rule method requires an argument');
      return Roles.userHasRole(userId, arg);
    }

  });
}
/*
 * Specific Properties
 */


Security.defineMethod("onlyProps", {
  fetch: [],
  transform: null,

  allow(type, arg, userId, doc, fieldNames) {
    if (!_.isArray(arg)) arg = [arg];
    fieldNames = fieldNames || _.keys(doc);
    return _.every(fieldNames, function (fieldName) {
      return _.contains(arg, fieldName);
    });
  }

});
Security.defineMethod("exceptProps", {
  fetch: [],
  transform: null,

  allow(type, arg, userId, doc, fieldNames) {
    if (!_.isArray(arg)) arg = [arg];
    fieldNames = fieldNames || _.keys(doc);
    return !_.any(fieldNames, function (fieldName) {
      return _.contains(arg, fieldName);
    });
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/ongoworks:security/lib/server/utility.js");
require("/node_modules/meteor/ongoworks:security/lib/server/Security.js");
require("/node_modules/meteor/ongoworks:security/lib/server/Security.Rule.js");
require("/node_modules/meteor/ongoworks:security/lib/server/Security.Check.js");
require("/node_modules/meteor/ongoworks:security/lib/builtInRules.js");

/* Exports */
Package._define("ongoworks:security", {
  Security: Security
});

})();

//# sourceURL=meteor://💻app/packages/ongoworks_security.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb25nb3dvcmtzOnNlY3VyaXR5L2xpYi9zZXJ2ZXIvdXRpbGl0eS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb25nb3dvcmtzOnNlY3VyaXR5L2xpYi9zZXJ2ZXIvU2VjdXJpdHkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29uZ293b3JrczpzZWN1cml0eS9saWIvc2VydmVyL1NlY3VyaXR5LlJ1bGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29uZ293b3JrczpzZWN1cml0eS9saWIvc2VydmVyL1NlY3VyaXR5LkNoZWNrLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vbmdvd29ya3M6c2VjdXJpdHkvbGliL2J1aWx0SW5SdWxlcy5qcyJdLCJuYW1lcyI6WyJydWxlc0J5Q29sbGVjdGlvbiIsImNyZWF0ZWQiLCJhbGxvdyIsImluc2VydCIsInVwZGF0ZSIsInJlbW92ZSIsImRvd25sb2FkIiwiZGVueSIsImFkZEZ1bmNGb3JBbGwiLCJjb2xsZWN0aW9ucyIsImFsbG93T3JEZW55IiwidHlwZXMiLCJmZXRjaCIsImZ1bmMiLCJydWxlcyIsInRyYW5zZm9ybSIsIl8iLCJpc0FycmF5IiwiZWFjaCIsInQiLCJjIiwiZW5zdXJlQ3JlYXRlZCIsImNvbnRhaW5zIiwicmVqZWN0IiwiaGFzIiwiZ2V0Q29sbGVjdGlvbk5hbWUiLCJlbnN1cmVEZWZhdWx0QWxsb3ciLCJnZXRSdWxlc0ZvckNvbGxlY3Rpb25BbmRUeXBlIiwiY29sbGVjdGlvbk5hbWUiLCJ0eXBlIiwic2VsZWN0IiwicnVsZSIsIl90eXBlcyIsImNvbGxlY3Rpb24iLCJfbmFtZSIsImZpbGVzIiwiU2VjdXJpdHkiLCJlcnJvck1lc3NhZ2VzIiwibXVsdGlwbGVDYW4iLCJub3RBbGxvd2VkIiwicmVxdWlyZXNEZWZpbml0aW9uIiwicmVxdWlyZXNBbGxvdyIsImNvbGxlY3Rpb25zQXJnIiwibm9Db2xsZWN0aW9uT3JUeXBlIiwicGVybWl0IiwiUnVsZSIsImNhbiIsInVzZXJJZCIsIkNoZWNrIiwiZGVmaW5lTWV0aG9kIiwic2VjdXJpdHlEZWZpbmVNZXRob2QiLCJuYW1lIiwiZGVmaW5pdGlvbiIsInByb3RvdHlwZSIsIkVycm9yIiwiTG9jYWxDb2xsZWN0aW9uIiwid3JhcFRyYW5zZm9ybSIsImFyZyIsIl9yZXN0cmljdGlvbnMiLCJwdXNoIiwiTW9uZ28iLCJDb2xsZWN0aW9uIiwiY29uc3RydWN0b3IiLCJfY29sbGVjdGlvbnMiLCJjb21iaW5lZEZldGNoIiwiZXZlcnkiLCJyZXN0cmljdGlvbiIsInVuaW9uIiwiaGFzT3duUHJvcGVydHkiLCJhbGxvd0luQ2xpZW50Q29kZSIsImVuc3VyZVNlY3VyZURlbnkiLCJkb2MiLCJtb2RpZmllciIsImFyZ3MiLCJmaWVsZHMiLCJjb21wdXRlQ2hhbmdlZEZpZWxkc0Zyb21Nb2RpZmllciIsImxvb3BEb2MiLCJjbG9uZSIsIl90cmFuc2Zvcm0iLCJhZGRlZFJhbmRvbUlkIiwiX2lkIiwiUmFuZG9tIiwiaWQiLCJzaGlmdCIsImZvciIsImNoZWNrIiwicGFyYW1zIiwia2V5cyIsImZpZWxkIiwiaW5kZXhPZiIsInN1YnN0cmluZyIsInJlYWQiLCJNb25nb0lEIiwiT2JqZWN0SUQiLCJmb3JFYWNoIiwib3B0aW9ucyIsImlzRW1wdHkiLCJmaW5kT25lIiwiYW55IiwidGhyb3ciLCJNZXRlb3IiLCJQYWNrYWdlIiwiUm9sZXMiLCJyb2xlIiwidXNlcklzSW5Sb2xlIiwiZ3JvdXAiLCJ1c2VySGFzUm9sZSIsImZpZWxkTmFtZXMiLCJmaWVsZE5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFFQUEsaUJBQWlCLEdBQUcsRUFBcEI7QUFFQSxJQUFJQyxPQUFPLEdBQUc7QUFDWkMsT0FBSyxFQUFFO0FBQ0xDLFVBQU0sRUFBRSxFQURIO0FBRUxDLFVBQU0sRUFBRSxFQUZIO0FBR0xDLFVBQU0sRUFBRSxFQUhIO0FBSUxD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RXJCa0QsY0FBVSxHQUFHQSxVQUFVLElBQUkzRixDQUFDLENBQUN1RSxJQUFGLENBQU9oQixHQUFQLENBQTNCO0FBRUEsV0FBTyxDQUFDdkQsQ0FBQyxDQUFDa0YsR0FBRixDQUFNUyxVQUFOLEVBQWtCLFVBQVVDLFNBQVYsRUFBcUI7QUFDN0MsYUFBTzVGLENBQUMsQ0FBQ00sUUFBRixDQUFXbUMsR0FBWCxFQUFnQm1ELFNBQWhCLENBQVA7QUFDRCxLQUZPLENBQVI7QUFHRDs7QUFYa0MsQ0FBckMsRSIsImZpbGUiOiIvcGFja2FnZXMvb25nb3dvcmtzX3NlY3VyaXR5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFsIF8sIHJ1bGVzQnlDb2xsZWN0aW9uOnRydWUsIGFkZEZ1bmNGb3JBbGw6dHJ1ZSwgZW5zdXJlQ3JlYXRlZDp0cnVlLCBlbnN1cmVEZWZhdWx0QWxsb3c6dHJ1ZSAqL1xuXG5ydWxlc0J5Q29sbGVjdGlvbiA9IHt9O1xuXG52YXIgY3JlYXRlZCA9IHtcbiAgYWxsb3c6IHtcbiAgICBpbnNlcnQ6IHt9LFxuICAgIHVwZGF0ZToge30sXG4gICAgcmVtb3ZlOiB7fSxcbiAgICBkb3dubG9hZDoge30gLy8gZm9yIHVzZSB3aXRoIENvbGxlY3Rpb25GUyBwYWNrYWdlc1xuICB9LFxuICBkZW55OiB7XG4gICAgaW5zZXJ0OiB7fSxcbiAgICB1cGRhdGU6IHt9LFxuICAgIHJlbW92ZToge30sXG4gICAgZG93bmxvYWQ6IHt9IC8vIGZvciB1c2Ugd2l0aCBDb2xsZWN0aW9uRlMgcGFja2FnZXNcbiAgfVxufTtcblxuLyoqXG4gKiBBZGRzIHRoZSBnaXZlbiBmdW5jdGlvbiBhcyBhbiBhbGxvdyBvciBkZW55IGZ1bmN0aW9uIGZvciBhbGwgc3BlY2lmaWVkIGNvbGxlY3Rpb25zIGFuZCB0eXBlcy5cbiAqIEBwYXJhbSB7QXJyYXkoTW9uZ28uQ29sbGVjdGlvbil9IGNvbGxlY3Rpb25zIEFycmF5IG9mIE1vbmdvLkNvbGxlY3Rpb24gaW5zdGFuY2VzXG4gKiBAcGFyYW0ge1N0cmluZ30gICAgICAgICAgICAgICAgICBhbGxvd09yRGVueSBcImFsbG93XCIgb3IgXCJkZW55XCJcbiAqIEBwYXJhbSB7QXJyYXkoU3RyaW5nKX0gICAgICAgICAgIHR5cGVzICAgICAgIEFycmF5IG9mIHR5cGVzIChcImluc2VydFwiLCBcInVwZGF0ZVwiLCBcInJlbW92ZVwiKVxuICogQHBhcmFtIHtBcnJheShTdHJpbmcpfG51bGx9ICAgICAgZmV0Y2ggICAgICAgYGZldGNoYCBwcm9wZXJ0eSB0byB1c2VcbiAqIEBwYXJhbSB7RnVuY3Rpb259ICAgICAgICAgICAgICAgIGZ1bmMgICAgICAgIFRoZSBmdW5jdGlvblxuICovXG5hZGRGdW5jRm9yQWxsID0gZnVuY3Rpb24gYWRkRnVuY0ZvckFsbChjb2xsZWN0aW9ucywgYWxsb3dPckRlbnksIHR5cGVzLCBmZXRjaCwgZnVuYykge1xuICAvLyBXZSBhbHdheXMgZGlzYWJsZSB0cmFuc2Zvcm1hdGlvbiwgYnV0IHdlIHRyYW5zZm9ybSBmb3Igc3BlY2lmaWNcbiAgLy8gcnVsZXMgdXBvbiBydW5uaW5nIG91ciBkZW55IGZ1bmN0aW9uIGlmIHJlcXVlc3RlZC5cbiAgdmFyIHJ1bGVzID0ge3RyYW5zZm9ybTogbnVsbH07XG4gIGlmIChfLmlzQXJyYXkoZmV0Y2gpKSB7XG4gICAgcnVsZXMuZmV0Y2ggPSBmZXRjaDtcbiAgfVxuICBfLmVhY2godHlwZXMsIGZ1bmN0aW9uICh0KSB7XG4gICAgcnVsZXNbdF0gPSBmdW5jO1xuICB9KTtcbiAgXy5lYWNoKGNvbGxlY3Rpb25zLCBmdW5jdGlvbiAoYykge1xuICAgIGNbYWxsb3dPckRlbnldKHJ1bGVzKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGFsbG93IG9yIGRlbnkgZnVuY3Rpb24gZm9yIHRoZSBnaXZlbiBjb2xsZWN0aW9ucyBpZiBub3QgYWxyZWFkeSBjcmVhdGVkLiBUaGlzIGVuc3VyZXMgdGhhdCB0aGlzIHBhY2thZ2Ugb25seSBldmVyIGNyZWF0ZXMgdXAgdG8gb25lIGFsbG93IGFuZCBvbmUgZGVueSBwZXIgY29sbGVjdGlvbi5cbiAqIEBwYXJhbSAgIHtTdHJpbmd9ICAgICAgICAgICAgICAgICAgYWxsb3dPckRlbnkgXCJhbGxvd1wiIG9yIFwiZGVueVwiXG4gKiBAcGFyYW0gICB7QXJyYXkoTW9uZ28uQ29sbGVjdGlvbil9IGNvbGxlY3Rpb25zIEFuIGFycmF5IG9mIGNvbGxlY3Rpb25zXG4gKiBAcGFyYW0gICB7QXJyYXkoU3RyaW5nKX0gICAgICAgICAgIHR5cGVzICAgICAgIEFuIGFycmF5IG9mIHR5cGVzIChcImluc2VydFwiLCBcInVwZGF0ZVwiLCBcInJlbW92ZVwiKVxuICogQHBhcmFtICAge0FycmF5KFN0cmluZyl8bnVsbH0gICAgICBmZXRjaCAgICAgICBgZmV0Y2hgIHByb3BlcnR5IHRvIHVzZVxuICogQHBhcmFtICAge0Z1bmN0aW9ufSAgICAgICAgICAgICAgICBmdW5jICAgICAgICBUaGUgZnVuY3Rpb25cbiAqL1xuZW5zdXJlQ3JlYXRlZCA9IGZ1bmN0aW9uIGVuc3VyZUNyZWF0ZWQoYWxsb3dPckRlbnksIGNvbGxlY3Rpb25zLCB0eXBlcywgZmV0Y2gsIGZ1bmMpIHtcbiAgXy5lYWNoKHR5cGVzLCB0ID0+IHtcbiAgICAvLyBJZ25vcmUgXCJyZWFkXCJcbiAgICBpZiAoIV8uY29udGFpbnMoWydpbnNlcnQnLCAndXBkYXRlJywgJ3JlbW92ZScsICdkb3dubG9hZCddLCB0KSkgcmV0dXJuO1xuXG4gICAgY29sbGVjdGlvbnMgPSBfLnJlamVjdChjb2xsZWN0aW9ucywgYyA9PiB7XG4gICAgICByZXR1cm4gXy5oYXMoY3JlYXRlZFthbGxvd09yRGVueV1bdF0sIGdldENvbGxlY3Rpb25OYW1lKGMpKTtcbiAgICB9KTtcbiAgICBhZGRGdW5jRm9yQWxsKGNvbGxlY3Rpb25zLCBhbGxvd09yRGVueSwgW3RdLCBudWxsLCBmdW5jKTtcbiAgICAvLyBtYXJrIHRoYXQgd2UndmUgZGVmaW5lZCBmdW5jdGlvbiBmb3IgY29sbGVjdGlvbi10eXBlIGNvbWJvXG4gICAgXy5lYWNoKGNvbGxlY3Rpb25zLCBjID0+IHtcbiAgICAgIGNyZWF0ZWRbYWxsb3dPckRlbnldW3RdW2dldENvbGxlY3Rpb25OYW1lKGMpXSA9IHRydWU7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBTZXRzIHVwIGRlZmF1bHQgYWxsb3cgZnVuY3Rpb25zIGZvciB0aGUgY29sbGVjdGlvbnMgYW5kIHR5cGVzLlxuICogQHBhcmFtICAge0FycmF5KE1vbmdvLkNvbGxlY3Rpb24pfSBjb2xsZWN0aW9ucyBBcnJheSBvZiBNb25nby5Db2xsZWN0aW9uIGluc3RhbmNlc1xuICogQHBhcmFtICAge0FycmF5KFN0cmluZyl9ICAgICAgICAgICB0eXBlcyAgICAgICBBcnJheSBvZiB0eXBlcyAoXCJpbnNlcnRcIiwgXCJ1cGRhdGVcIiwgXCJyZW1vdmVcIilcbiAqL1xuZW5zdXJlRGVmYXVsdEFsbG93ID0gZnVuY3Rpb24gZW5zdXJlRGVmYXVsdEFsbG93KGNvbGxlY3Rpb25zLCB0eXBlcykge1xuICBlbnN1cmVDcmVhdGVkKFwiYWxsb3dcIiwgY29sbGVjdGlvbnMsIHR5cGVzLCBbXSwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9KTtcbn07XG5cbi8qKlxuICogUmV0dXJuIG9ubHkgdGhvc2UgcnVsZXMgdGhhdCBhcHBseSB0byB0aGUgZ2l2ZW4gY29sbGVjdGlvbiBhbmQgb3BlcmF0aW9uIHR5cGVcbiAqL1xuZ2V0UnVsZXNGb3JDb2xsZWN0aW9uQW5kVHlwZSA9IGZ1bmN0aW9uIGdldFJ1bGVzRm9yQ29sbGVjdGlvbkFuZFR5cGUoY29sbGVjdGlvbk5hbWUsIHR5cGUpIHtcbiAgdmFyIHJ1bGVzID0gcnVsZXNCeUNvbGxlY3Rpb25bY29sbGVjdGlvbk5hbWVdIHx8IFtdO1xuICByZXR1cm4gXy5zZWxlY3QocnVsZXMsIGZ1bmN0aW9uIChydWxlKSB7XG4gICAgcmV0dXJuIF8uY29udGFpbnMocnVsZS5fdHlwZXMsIHR5cGUpO1xuICB9KTtcbn07XG5cbmdldENvbGxlY3Rpb25OYW1lID0gZnVuY3Rpb24gZ2V0Q29sbGVjdGlvbk5hbWUoY29sbGVjdGlvbikge1xuICAvLyBDb2xsZWN0aW9uRlMgaGFzIHVuZGVybHlpbmcgY29sbGVjdGlvbiBvbiBgZmlsZXNgIHByb3BlcnR5XG4gIHJldHVybiBjb2xsZWN0aW9uLl9uYW1lIHx8IChjb2xsZWN0aW9uLmZpbGVzICYmIGNvbGxlY3Rpb24uZmlsZXMuX25hbWUpO1xufTtcbiIsIi8vIFRoZSBgU2VjdXJpdHlgIG9iamVjdCBpcyBleHBvcnRlZCBhbmQgcHJvdmlkZXMgdGhlIHBhY2thZ2UgQVBJXG5TZWN1cml0eSA9IHtcbiAgLy8gUHV0dGluZyB0aGVzZSBvbiB0aGUgZXhwb3J0ZWQgb2JqZWN0IGFsbG93cyBwYWNrYWdlIHVzZXJzIHRvIG92ZXJyaWRlIGlmIG5lY2Vzc2FyeVxuICBlcnJvck1lc3NhZ2VzOiB7XG4gICAgbXVsdGlwbGVDYW46ICdZb3UgbWF5IG5vdCBjb21iaW5lIG1vcmUgdGhhbiBvbmUgaW5zZXJ0LCB1cGRhdGUsIG9yIHJlbW92ZSBvbiBhIFNlY3VyaXR5LmNhbiBjaGFpbicsXG4gICAgbm90QWxsb3dlZDogJ0FjdGlvbiBub3QgYWxsb3dlZCcsXG4gICAgcmVxdWlyZXNEZWZpbml0aW9uOiAnU2VjdXJpdHkuZGVmaW5lTWV0aG9kIHJlcXVpcmVzIGEgXCJkZWZpbml0aW9uXCIgYXJndW1lbnQnLFxuICAgIHJlcXVpcmVzQWxsb3c6ICdTZWN1cml0eS5kZWZpbmVNZXRob2QgcmVxdWlyZXMgYW4gXCJhbGxvd1wiIGZ1bmN0aW9uJyxcbiAgICBjb2xsZWN0aW9uc0FyZzogJ1RoZSBjb2xsZWN0aW9ucyBhcmd1bWVudCBtdXN0IGJlIGEgTW9uZ28uQ29sbGVjdGlvbiBpbnN0YW5jZSBvciBhbiBhcnJheSBvZiB0aGVtJyxcbiAgICBub0NvbGxlY3Rpb25PclR5cGU6ICdBdCBhIG1pbmltdW0sIHlvdSBtdXN0IGNhbGwgcGVybWl0IGFuZCBjb2xsZWN0aW9ucyBtZXRob2RzIGZvciBhIHNlY3VyaXR5IHJ1bGUuJyxcbiAgfSxcbiAgLy8gdGhlIHN0YXJ0aW5nIHBvaW50IG9mIHRoZSBjaGFpblxuICBwZXJtaXQ6IGZ1bmN0aW9uIHBlcm1pdCh0eXBlcykge1xuICAgIHJldHVybiBuZXcgU2VjdXJpdHkuUnVsZSh0eXBlcyk7XG4gIH0sXG4gIGNhbjogZnVuY3Rpb24gY2FuKHVzZXJJZCkge1xuICAgIHJldHVybiBuZXcgU2VjdXJpdHkuQ2hlY2sodXNlcklkKTtcbiAgfSxcbiAgZGVmaW5lTWV0aG9kOiBmdW5jdGlvbiBzZWN1cml0eURlZmluZU1ldGhvZChuYW1lLCBkZWZpbml0aW9uKSB7XG4gICAgLy8gQ2hlY2sgd2hldGhlciBhIHJ1bGUgd2l0aCB0aGUgZ2l2ZW4gbmFtZSBhbHJlYWR5IGV4aXN0czsgY2FuJ3Qgb3ZlcndyaXRlXG4gICAgaWYgKFNlY3VyaXR5LlJ1bGUucHJvdG90eXBlW25hbWVdKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Egc2VjdXJpdHkgbWV0aG9kIHdpdGggdGhlIG5hbWUgXCInICsgbmFtZSArICdcIiBoYXMgYWxyZWFkeSBiZWVuIGRlZmluZWQnKTtcbiAgICB9XG4gICAgaWYgKCFkZWZpbml0aW9uKSB0aHJvdyBuZXcgRXJyb3IoU2VjdXJpdHkuZXJyb3JNZXNzYWdlcy5yZXF1aXJlc0RlZmluaXRpb24pO1xuICAgIC8vIElmIFwiZGVueVwiIGlzIHVzZWQsIGNvbnZlcnQgdG8gXCJhbGxvd1wiIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgIGlmIChkZWZpbml0aW9uLmRlbnkpIHtcbiAgICAgIGRlZmluaXRpb24uYWxsb3cgPSAoLi4uYXJncykgPT4ge1xuICAgICAgICByZXR1cm4gIWRlZmluaXRpb24uZGVueSguLi5hcmdzKTtcbiAgICAgIH07XG4gICAgfVxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgZGVmaW5pdGlvbiBhcmd1bWVudCBpcyBhbiBvYmplY3QgdGhhdCBoYXMgYW4gYGFsbG93YCBwcm9wZXJ0eVxuICAgIGlmICghZGVmaW5pdGlvbi5hbGxvdykgdGhyb3cgbmV3IEVycm9yKFNlY3VyaXR5LmVycm9yTWVzc2FnZXMucmVxdWlyZXNBbGxvdyk7XG4gICAgLy8gV3JhcCB0cmFuc2Zvcm0sIGlmIHByb3ZpZGVkXG4gICAgaWYgKGRlZmluaXRpb24udHJhbnNmb3JtKSB7XG4gICAgICBkZWZpbml0aW9uLnRyYW5zZm9ybSA9IExvY2FsQ29sbGVjdGlvbi53cmFwVHJhbnNmb3JtKGRlZmluaXRpb24udHJhbnNmb3JtKTtcbiAgICB9XG4gICAgU2VjdXJpdHkuUnVsZS5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbiAoYXJnKSB7XG4gICAgICB0aGlzLl9yZXN0cmljdGlvbnMucHVzaCh7XG4gICAgICAgIGRlZmluaXRpb24sXG4gICAgICAgIGFyZyxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgfVxufTtcblxuTW9uZ28uQ29sbGVjdGlvbi5wcm90b3R5cGUucGVybWl0ID0gZnVuY3Rpb24gKHR5cGVzKSB7XG4gIHJldHVybiBTZWN1cml0eS5wZXJtaXQodHlwZXMpLmNvbGxlY3Rpb25zKHRoaXMpO1xufTtcbiIsIlNlY3VyaXR5LlJ1bGUgPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKHR5cGVzKSB7XG4gICAgaWYgKCFfLmlzQXJyYXkodHlwZXMpKSB0eXBlcyA9IFt0eXBlc107XG4gICAgdGhpcy5fdHlwZXMgPSB0eXBlcztcbiAgICB0aGlzLl9yZXN0cmljdGlvbnMgPSBbXTtcbiAgfVxuXG4gIGNvbGxlY3Rpb25zKGNvbGxlY3Rpb25zKSB7XG4gICAgLy8gTWFrZSBzdXJlIHRoZSBgY29sbGVjdGlvbnNgIGFyZ3VtZW50IGlzIGVpdGhlciBhIGBNb25nby5Db2xsZWN0aW9uYCBpbnN0YW5jZSBvclxuICAgIC8vIGFuIGFycmF5IG9mIHRoZW0uIElmIGl0J3MgYSBzaW5nbGUgY29sbGVjdGlvbiwgY29udmVydCBpdCB0byBhIG9uZS1pdGVtIGFycmF5LlxuICAgIGlmICghXy5pc0FycmF5KGNvbGxlY3Rpb25zKSkgY29sbGVjdGlvbnMgPSBbY29sbGVjdGlvbnNdO1xuXG4gICAgLy8gS2VlcCBsaXN0IGtleWVkIGJ5IGNvbGxlY3Rpb24gbmFtZVxuICAgIF8uZWFjaChjb2xsZWN0aW9ucywgY29sbGVjdGlvbiA9PiB7XG4gICAgICBpZiAoIShjb2xsZWN0aW9uIGluc3RhbmNlb2YgTW9uZ28uQ29sbGVjdGlvbikgJiZcbiAgICAgICAgICAvLyBDb2xsZWN0aW9uRlMgaGFzIHVuZGVybHlpbmcgY29sbGVjdGlvbiBvbiBgZmlsZXNgIHByb3BlcnR5XG4gICAgICAgICEoY29sbGVjdGlvbi5maWxlcyBpbnN0YW5jZW9mIE1vbmdvLkNvbGxlY3Rpb24pKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihTZWN1cml0eS5lcnJvck1lc3NhZ2VzLmNvbGxlY3Rpb25zQXJnKTtcbiAgICAgIH1cbiAgICAgIC8vIENvbGxlY3Rpb25GUyBoYXMgdW5kZXJseWluZyBjb2xsZWN0aW9uIG9uIGBmaWxlc2AgcHJvcGVydHlcbiAgICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gZ2V0Q29sbGVjdGlvbk5hbWUoY29sbGVjdGlvbik7XG4gICAgICBydWxlc0J5Q29sbGVjdGlvbltjb2xsZWN0aW9uTmFtZV0gPSBydWxlc0J5Q29sbGVjdGlvbltjb2xsZWN0aW9uTmFtZV0gfHwgW107XG4gICAgICBydWxlc0J5Q29sbGVjdGlvbltjb2xsZWN0aW9uTmFtZV0ucHVzaCh0aGlzKTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2NvbGxlY3Rpb25zID0gY29sbGVjdGlvbnM7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGNvbWJpbmVkRmV0Y2goKSB7XG4gICAgLy8gV2UgbmVlZCBhIGNvbWJpbmVkIGBmZXRjaGAgYXJyYXkuIFRoZSBgZmV0Y2hgIGlzIG9wdGlvbmFsIGFuZCBjYW4gYmUgZWl0aGVyIGFuIGFycmF5XG4gICAgLy8gb3IgYSBmdW5jdGlvbiB0aGF0IHRha2VzIHRoZSBhcmd1bWVudCBwYXNzZWQgdG8gdGhlIHJlc3RyaWN0aW9uIG1ldGhvZCBhbmQgcmV0dXJucyBhbiBhcnJheS5cbiAgICBsZXQgZmV0Y2ggPSBbXTtcbiAgICBfLmV2ZXJ5KHRoaXMuX3Jlc3RyaWN0aW9ucywgcmVzdHJpY3Rpb24gPT4ge1xuICAgICAgaWYgKF8uaXNBcnJheShyZXN0cmljdGlvbi5kZWZpbml0aW9uLmZldGNoKSkge1xuICAgICAgICBmZXRjaCA9IF8udW5pb24oZmV0Y2gsIHJlc3RyaWN0aW9uLmRlZmluaXRpb24uZmV0Y2gpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcmVzdHJpY3Rpb24uZGVmaW5pdGlvbi5mZXRjaCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGZldGNoID0gXy51bmlvbihmZXRjaCwgcmVzdHJpY3Rpb24uZGVmaW5pdGlvbi5mZXRjaChyZXN0cmljdGlvbi5hcmcpKTtcbiAgICAgIH0gZWxzZSBpZiAoIXJlc3RyaWN0aW9uLmRlZmluaXRpb24uaGFzT3duUHJvcGVydHkoJ2ZldGNoJykpIHtcbiAgICAgICAgLy8gSWYgYGZldGNoYCBwcm9wZXJ0eSBpc24ndCBwcmVzZW50LCB3ZSBzaG91bGQgZmV0Y2ggdGhlIGZ1bGwgZG9jLlxuICAgICAgICBmZXRjaCA9IG51bGw7XG4gICAgICAgIHJldHVybiBmYWxzZTsgLy8gRXhpdCBsb29wXG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gZmV0Y2g7XG4gIH1cblxuICBhbGxvd0luQ2xpZW50Q29kZSgpIHtcbiAgICBpZiAoIXRoaXMuX2NvbGxlY3Rpb25zIHx8ICF0aGlzLl90eXBlcykgdGhyb3cgbmV3IEVycm9yKFNlY3VyaXR5LmVycm9yTWVzc2FnZXMubm9Db2xsZWN0aW9uT3JUeXBlKTtcbiAgICBlbnN1cmVTZWN1cmVEZW55KHRoaXMuX2NvbGxlY3Rpb25zLCB0aGlzLl90eXBlcyk7XG4gIH1cblxuICBhbGxvdyh0eXBlLCBjb2xsZWN0aW9uLCB1c2VySWQsIGRvYywgbW9kaWZpZXIsIC4uLmFyZ3MpIHtcbiAgICBsZXQgZmllbGRzO1xuICAgIGlmICh0eXBlID09PSAndXBkYXRlJykgZmllbGRzID0gY29tcHV0ZUNoYW5nZWRGaWVsZHNGcm9tTW9kaWZpZXIobW9kaWZpZXIpO1xuXG4gICAgLy8gTG9vcCB0aHJvdWdoIGFsbCBkZWZpbmVkIHJlc3RyaWN0aW9ucy4gUmVzdHJpY3Rpb25zIGFyZSBhZGRpdGl2ZSBmb3IgdGhpcyBjaGFpbmVkXG4gICAgLy8gcnVsZSwgc28gaWYgYW55IGFsbG93IGZ1bmN0aW9uIHJldHVybnMgZmFsc2UsIHRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiBmYWxzZS5cbiAgICByZXR1cm4gXy5ldmVyeSh0aGlzLl9yZXN0cmljdGlvbnMsIHJlc3RyaWN0aW9uID0+IHtcbiAgICAgIC8vIENsb25lIHRoZSBkb2MgaW4gY2FzZSB3ZSBuZWVkIHRvIHRyYW5zZm9ybSBpdC4gVHJhbnNmb3JtYXRpb25zXG4gICAgICAvLyBzaG91bGQgYXBwbHkgdG8gb25seSB0aGUgb25lIHJlc3RyaWN0aW9uLlxuICAgICAgbGV0IGxvb3BEb2MgPSBfLmNsb25lKGRvYyk7XG5cbiAgICAgIC8vIElmIHRyYW5zZm9ybSBpcyBhIGZ1bmN0aW9uLCBhcHBseSB0aGF0XG4gICAgICBsZXQgdHJhbnNmb3JtID0gcmVzdHJpY3Rpb24uZGVmaW5pdGlvbi50cmFuc2Zvcm07XG4gICAgICBpZiAodHJhbnNmb3JtICE9PSBudWxsKSB7XG4gICAgICAgIHRyYW5zZm9ybSA9IHRyYW5zZm9ybSB8fCBjb2xsZWN0aW9uLl90cmFuc2Zvcm07XG4gICAgICAgIGlmICh0eXBlb2YgdHJhbnNmb3JtID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgbGV0IGFkZGVkUmFuZG9tSWQgPSBmYWxzZTtcbiAgICAgICAgICBpZiAodHlwZSA9PT0gJ2luc2VydCcgJiYgIWxvb3BEb2MuX2lkKSB7XG4gICAgICAgICAgICAvLyBUaGUgd3JhcHBlZCB0cmFuc2Zvcm0gcmVxdWlyZXMgYW4gX2lkLCBidXQgd2VcbiAgICAgICAgICAgIC8vIGRvbid0IGhhdmUgYWNjZXNzIHRvIHRoZSBnZW5lcmF0ZWRJZCBmcm9tIE1ldGVvciBBUEksXG4gICAgICAgICAgICAvLyBzbyB3ZSdsbCBmdWRnZSBvbmUgYW5kIHRoZW4gcmVtb3ZlIGl0LlxuICAgICAgICAgICAgbG9vcERvYy5faWQgPSBSYW5kb20uaWQoKTtcbiAgICAgICAgICAgIGFkZGVkUmFuZG9tSWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsb29wRG9jID0gdHJhbnNmb3JtKGxvb3BEb2MpO1xuICAgICAgICAgIGlmIChhZGRlZFJhbmRvbUlkKSBkZWxldGUgbG9vcERvYy5faWQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3RyaWN0aW9uLmRlZmluaXRpb24uYWxsb3codHlwZSwgcmVzdHJpY3Rpb24uYXJnLCB1c2VySWQsIGxvb3BEb2MsIGZpZWxkcywgbW9kaWZpZXIsIC4uLmFyZ3MpO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGVuc3VyZVNlY3VyZURlbnkoY29sbGVjdGlvbnMsIHR5cGVzKSB7XG4gIC8vIElmIHdlIGhhdmVuJ3QgeWV0IGRvbmUgc28sIHNldCB1cCBhIGRlZmF1bHQsIHBlcm1pc3NpdmUgYGFsbG93YCBmdW5jdGlvbiBmb3IgYWxsIG9mXG4gIC8vIHRoZSBnaXZlbiBjb2xsZWN0aW9ucyBhbmQgdHlwZXMuIFdlIGNvbnRyb2wgYWxsIHNlY3VyaXR5IHRocm91Z2ggYGRlbnlgIGZ1bmN0aW9ucyBvbmx5LCBidXRcbiAgLy8gdGhlcmUgbXVzdCBmaXJzdCBiZSBhdCBsZWFzdCBvbmUgYGFsbG93YCBmdW5jdGlvbiBmb3IgZWFjaCBjb2xsZWN0aW9uIG9yIGFsbCB3cml0ZXNcbiAgLy8gd2lsbCBiZSBkZW5pZWQuXG4gIGVuc3VyZURlZmF1bHRBbGxvdyhjb2xsZWN0aW9ucywgdHlwZXMpO1xuXG4gIF8uZWFjaCh0eXBlcywgdCA9PiB7XG4gICAgXy5lYWNoKGNvbGxlY3Rpb25zLCBjb2xsZWN0aW9uID0+IHtcbiAgICAgIGVuc3VyZUNyZWF0ZWQoJ2RlbnknLCBbY29sbGVjdGlvbl0sIFt0XSwgbnVsbCwgZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgY29uc3QgdXNlcklkID0gYXJncy5zaGlmdCgpO1xuXG4gICAgICAgIC8vIElmIHR5cGUgaXMgdXBkYXRlLCByZW1vdmUgdGhlIGBmaWVsZHNgIGFyZ3VtZW50LiBXZSB3aWxsIGNyZWF0ZSBvdXIgb3duXG4gICAgICAgIC8vIGZvciBjb25zaXN0ZW5jeS5cbiAgICAgICAgaWYgKHQgPT09ICd1cGRhdGUnKSBhcmdzID0gW2FyZ3NbMF0sIGFyZ3NbMl1dO1xuXG4gICAgICAgIHJldHVybiAhU2VjdXJpdHkuY2FuKHVzZXJJZClbdF0oLi4uYXJncykuZm9yKGNvbGxlY3Rpb24pLmNoZWNrKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVDaGFuZ2VkRmllbGRzRnJvbU1vZGlmaWVyKG1vZGlmaWVyKSB7XG4gIHZhciBmaWVsZHMgPSBbXTtcbiAgLy8gVGhpcyBpcyB0aGUgc2FtZSBsb2dpYyBNZXRlb3IncyBtb25nbyBwYWNrYWdlIHVzZXMgaW5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21ldGVvci9tZXRlb3IvYmxvYi9kZXZlbC9wYWNrYWdlcy9tb25nby9jb2xsZWN0aW9uLmpzXG4gIF8uZWFjaChtb2RpZmllciwgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgIF8uZWFjaChfLmtleXMocGFyYW1zKSwgZnVuY3Rpb24gKGZpZWxkKSB7XG4gICAgICAvLyB0cmVhdCBkb3R0ZWQgZmllbGRzIGFzIGlmIHRoZXkgYXJlIHJlcGxhY2luZyB0aGVpclxuICAgICAgLy8gdG9wLWxldmVsIHBhcnRcbiAgICAgIGlmIChmaWVsZC5pbmRleE9mKCcuJykgIT09IC0xKVxuICAgICAgICBmaWVsZCA9IGZpZWxkLnN1YnN0cmluZygwLCBmaWVsZC5pbmRleE9mKCcuJykpO1xuXG4gICAgICAvLyByZWNvcmQgdGhlIGZpZWxkIHdlIGFyZSB0cnlpbmcgdG8gY2hhbmdlXG4gICAgICBpZiAoIV8uY29udGFpbnMoZmllbGRzLCBmaWVsZCkpXG4gICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiBmaWVsZHM7XG59XG4iLCJTZWN1cml0eS5DaGVjayA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3IodXNlcklkKSB7XG4gICAgdGhpcy51c2VySWQgPSB1c2VySWQgfHwgbnVsbDtcbiAgfVxuXG4gIGZvcihjb2xsZWN0aW9uKSB7XG4gICAgdGhpcy5jb2xsZWN0aW9uID0gY29sbGVjdGlvbjtcbiAgICB0aGlzLmNvbGxlY3Rpb25OYW1lID0gZ2V0Q29sbGVjdGlvbk5hbWUoY29sbGVjdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBpbnNlcnQoZG9jLCAuLi5hcmdzKSB7XG4gICAgaWYgKHRoaXMudHlwZSkgdGhyb3cgbmV3IEVycm9yKFNlY3VyaXR5LmVycm9yTWVzc2FnZXMubXVsdGlwbGVDYW4pO1xuICAgIHRoaXMudHlwZSA9ICdpbnNlcnQnO1xuICAgIHRoaXMuZG9jID0gZG9jO1xuICAgIHRoaXMuYXJncyA9IGFyZ3M7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1cGRhdGUoZG9jLCBtb2RpZmllciwgLi4uYXJncykge1xuICAgIGlmICh0aGlzLnR5cGUpIHRocm93IG5ldyBFcnJvcihTZWN1cml0eS5lcnJvck1lc3NhZ2VzLm11bHRpcGxlQ2FuKTtcbiAgICB0aGlzLnR5cGUgPSAndXBkYXRlJztcbiAgICB0aGlzLmRvYyA9IGRvYztcbiAgICB0aGlzLm1vZGlmaWVyID0gbW9kaWZpZXI7XG4gICAgdGhpcy5hcmdzID0gYXJncztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbW92ZShkb2MsIC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpcy50eXBlKSB0aHJvdyBuZXcgRXJyb3IoU2VjdXJpdHkuZXJyb3JNZXNzYWdlcy5tdWx0aXBsZUNhbik7XG4gICAgdGhpcy50eXBlID0gJ3JlbW92ZSc7XG4gICAgdGhpcy5kb2MgPSBkb2M7XG4gICAgdGhpcy5hcmdzID0gYXJncztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlYWQoZG9jLCAuLi5hcmdzKSB7XG4gICAgaWYgKHRoaXMudHlwZSkgdGhyb3cgbmV3IEVycm9yKFNlY3VyaXR5LmVycm9yTWVzc2FnZXMubXVsdGlwbGVDYW4pO1xuICAgIHRoaXMudHlwZSA9ICdyZWFkJztcbiAgICB0aGlzLmRvYyA9IGRvYztcbiAgICB0aGlzLmFyZ3MgPSBhcmdzO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZG93bmxvYWQoZG9jLCAuLi5hcmdzKSB7XG4gICAgaWYgKHRoaXMudHlwZSkgdGhyb3cgbmV3IEVycm9yKFNlY3VyaXR5LmVycm9yTWVzc2FnZXMubXVsdGlwbGVDYW4pO1xuICAgIHRoaXMudHlwZSA9ICdkb3dubG9hZCc7XG4gICAgdGhpcy5kb2MgPSBkb2M7XG4gICAgdGhpcy5hcmdzID0gYXJncztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIEVYQU1QTEVTOlxuICAvLyBTZWN1cml0eS5jYW4odXNlcklkKS5pbnNlcnQoZG9jKS5mb3IoTXlDb2xsZWN0aW9uKS5jaGVjaygpXG4gIC8vIFNlY3VyaXR5LmNhbih1c2VySWQpLnVwZGF0ZShpZCwgbW9kaWZpZXIpLmZvcihNeUNvbGxlY3Rpb24pLmNoZWNrKClcbiAgLy8gU2VjdXJpdHkuY2FuKHVzZXJJZCkucmVtb3ZlKGlkKS5mb3IoTXlDb2xsZWN0aW9uKS5jaGVjaygpXG4gIGNoZWNrKCkge1xuICAgIC8vIFNlbGVjdCBvbmx5IHRob3NlIHJ1bGVzIHRoYXQgYXBwbHkgdG8gdGhpcyBvcGVyYXRpb24gdHlwZVxuICAgIGNvbnN0IHJ1bGVzID0gZ2V0UnVsZXNGb3JDb2xsZWN0aW9uQW5kVHlwZSh0aGlzLmNvbGxlY3Rpb25OYW1lLCB0aGlzLnR5cGUpO1xuXG4gICAgLy8gSWYgdGhpcy5kb2MgaXMgYW4gSUQsIHdlIHdpbGwgbG9vayB1cCB0aGUgZG9jLCBmZXRjaGluZyBvbmx5IHRoZSBmaWVsZHMgbmVlZGVkLlxuICAgIC8vIFRvIGZpbmQgb3V0IHdoaWNoIGZpZWxkcyBhcmUgbmVlZGVkLCB3ZSB3aWxsIGNvbWJpbmUgYWxsIHRoZSBgZmV0Y2hgIGFycmF5cyBmcm9tXG4gICAgLy8gYWxsIHRoZSByZXN0cmljdGlvbnMgaW4gYWxsIHRoZSBydWxlcy5cbiAgICBpZiAodHlwZW9mIHRoaXMuZG9jID09PSAnc3RyaW5nJyB8fCB0aGlzLmRvYyBpbnN0YW5jZW9mIE1vbmdvSUQuT2JqZWN0SUQpIHtcbiAgICAgIGxldCBmaWVsZHMgPSB7fTtcbiAgICAgIF8uZXZlcnkocnVsZXMsIHJ1bGUgPT4ge1xuICAgICAgICBjb25zdCBmZXRjaCA9IHJ1bGUuY29tYmluZWRGZXRjaCgpO1xuICAgICAgICBpZiAoZmV0Y2ggPT09IG51bGwpIHtcbiAgICAgICAgICBmaWVsZHMgPSBudWxsO1xuICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gRXhpdCBsb29wXG4gICAgICAgIH1cbiAgICAgICAgcnVsZS5jb21iaW5lZEZldGNoKCkuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgICAgZmllbGRzW2ZpZWxkXSA9IDE7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgICBsZXQgb3B0aW9ucyA9IHt9O1xuICAgICAgaWYgKGZpZWxkcykge1xuICAgICAgICBpZiAoXy5pc0VtcHR5KGZpZWxkcykpIHtcbiAgICAgICAgICBvcHRpb25zID0ge19pZDogMX07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3B0aW9ucyA9IHtmaWVsZHN9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmRvYyA9IHRoaXMuY29sbGVjdGlvbi5maW5kT25lKHRoaXMuZG9jLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBMb29wIHRocm91Z2ggYWxsIGRlZmluZWQgcnVsZXMgZm9yIHRoaXMgY29sbGVjdGlvbi4gVGhlcmUgaXMgYW4gT1IgcmVsYXRpb25zaGlwIGFtb25nXG4gICAgLy8gYWxsIHJ1bGVzIGZvciB0aGUgY29sbGVjdGlvbiwgc28gaWYgYW55IFwiYWxsb3dcIiBmdW5jdGlvbiBETyByZXR1cm4gdHJ1ZSwgd2UgYWxsb3cuXG4gICAgcmV0dXJuIF8uYW55KHJ1bGVzLCBydWxlID0+IHJ1bGUuYWxsb3codGhpcy50eXBlLCB0aGlzLmNvbGxlY3Rpb24sIHRoaXMudXNlcklkLCB0aGlzLmRvYywgdGhpcy5tb2RpZmllciwgLi4udGhpcy5hcmdzKSk7XG4gIH1cblxuICAvLyBFWEFNUExFUzpcbiAgLy8gU2VjdXJpdHkuY2FuKHVzZXJJZCkuaW5zZXJ0KGRvYykuZm9yKE15Q29sbGVjdGlvbikudGhyb3coKVxuICAvLyBTZWN1cml0eS5jYW4odXNlcklkKS51cGRhdGUoaWQsIG1vZGlmaWVyKS5mb3IoTXlDb2xsZWN0aW9uKS50aHJvdygpXG4gIC8vIFNlY3VyaXR5LmNhbih1c2VySWQpLnJlbW92ZShpZCkuZm9yKE15Q29sbGVjdGlvbikudGhyb3coKVxuICB0aHJvdygpIHtcbiAgICBpZiAoIXRoaXMuY2hlY2soKSkgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignYWNjZXNzLWRlbmllZCcsIFNlY3VyaXR5LmVycm9yTWVzc2FnZXMubm90QWxsb3dlZCk7XG4gIH1cbn1cbiIsIi8qXG4gKiBUaGlzIGZpbGUgZGVmaW5lcyBidWlsdC1pbiByZXN0cmljdGlvbiBtZXRob2RzXG4gKi9cblxuLypcbiAqIE5vIG9uZVxuICovXG5cblNlY3VyaXR5LmRlZmluZU1ldGhvZChcIm5ldmVyXCIsIHtcbiAgZmV0Y2g6IFtdLFxuICB0cmFuc2Zvcm06IG51bGwsXG4gIGFsbG93KCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcbn0pO1xuXG4vKlxuICogTG9nZ2VkIEluXG4gKi9cblxuU2VjdXJpdHkuZGVmaW5lTWV0aG9kKFwiaWZMb2dnZWRJblwiLCB7XG4gIGZldGNoOiBbXSxcbiAgdHJhbnNmb3JtOiBudWxsLFxuICBhbGxvdyh0eXBlLCBhcmcsIHVzZXJJZCkge1xuICAgIHJldHVybiAhIXVzZXJJZDtcbiAgfSxcbn0pO1xuXG4vKlxuICogU3BlY2lmaWMgVXNlciBJRFxuICovXG5cblNlY3VyaXR5LmRlZmluZU1ldGhvZChcImlmSGFzVXNlcklkXCIsIHtcbiAgZmV0Y2g6IFtdLFxuICB0cmFuc2Zvcm06IG51bGwsXG4gIGFsbG93KHR5cGUsIGFyZywgdXNlcklkKSB7XG4gICAgcmV0dXJuIHVzZXJJZCA9PT0gYXJnO1xuICB9LFxufSk7XG5cbi8qXG4gKiBTcGVjaWZpYyBSb2xlc1xuICovXG5cbi8qXG4gKiBhbGFubmluZzpyb2xlcyBzdXBwb3J0XG4gKi9cbmlmIChQYWNrYWdlICYmIFBhY2thZ2VbXCJhbGFubmluZzpyb2xlc1wiXSkge1xuXG4gIHZhciBSb2xlcyA9IFBhY2thZ2VbXCJhbGFubmluZzpyb2xlc1wiXS5Sb2xlcztcblxuICBTZWN1cml0eS5kZWZpbmVNZXRob2QoXCJpZkhhc1JvbGVcIiwge1xuICAgIGZldGNoOiBbXSxcbiAgICB0cmFuc2Zvcm06IG51bGwsXG4gICAgYWxsb3codHlwZSwgYXJnLCB1c2VySWQpIHtcbiAgICAgIGlmICghYXJnKSB0aHJvdyBuZXcgRXJyb3IoJ2lmSGFzUm9sZSBzZWN1cml0eSBydWxlIG1ldGhvZCByZXF1aXJlcyBhbiBhcmd1bWVudCcpO1xuICAgICAgaWYgKGFyZy5yb2xlKSB7XG4gICAgICAgIHJldHVybiBSb2xlcy51c2VySXNJblJvbGUodXNlcklkLCBhcmcucm9sZSwgYXJnLmdyb3VwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBSb2xlcy51c2VySXNJblJvbGUodXNlcklkLCBhcmcpO1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xuXG59XG5cbi8qXG4gKiBuaWNvbGFzbG9wZXpqOnJvbGVzIHN1cHBvcnRcbiAqIE5vdGU6IGRvZXNuJ3Qgc3VwcG9ydCBncm91cHNcbiAqL1xuaWYgKFBhY2thZ2UgJiYgUGFja2FnZVtcIm5pY29sYXNsb3Blemo6cm9sZXNcIl0pIHtcblxuICB2YXIgUm9sZXMgPSBQYWNrYWdlW1wibmljb2xhc2xvcGV6ajpyb2xlc1wiXS5Sb2xlcztcblxuICBTZWN1cml0eS5kZWZpbmVNZXRob2QoXCJpZkhhc1JvbGVcIiwge1xuICAgIGZldGNoOiBbXSxcbiAgICB0cmFuc2Zvcm06IG51bGwsXG4gICAgYWxsb3codHlwZSwgYXJnLCB1c2VySWQpIHtcbiAgICAgIGlmICghYXJnKSB0aHJvdyBuZXcgRXJyb3IoJ2lmSGFzUm9sZSBzZWN1cml0eSBydWxlIG1ldGhvZCByZXF1aXJlcyBhbiBhcmd1bWVudCcpO1xuICAgICAgcmV0dXJuIFJvbGVzLnVzZXJIYXNSb2xlKHVzZXJJZCwgYXJnKTtcbiAgICB9XG4gIH0pO1xuXG59XG5cbi8qXG4gKiBTcGVjaWZpYyBQcm9wZXJ0aWVzXG4gKi9cblxuU2VjdXJpdHkuZGVmaW5lTWV0aG9kKFwib25seVByb3BzXCIsIHtcbiAgZmV0Y2g6IFtdLFxuICB0cmFuc2Zvcm06IG51bGwsXG4gIGFsbG93KHR5cGUsIGFyZywgdXNlcklkLCBkb2MsIGZpZWxkTmFtZXMpIHtcbiAgICBpZiAoIV8uaXNBcnJheShhcmcpKSBhcmcgPSBbYXJnXTtcblxuICAgIGZpZWxkTmFtZXMgPSBmaWVsZE5hbWVzIHx8IF8ua2V5cyhkb2MpO1xuXG4gICAgcmV0dXJuIF8uZXZlcnkoZmllbGROYW1lcywgZnVuY3Rpb24gKGZpZWxkTmFtZSkge1xuICAgICAgcmV0dXJuIF8uY29udGFpbnMoYXJnLCBmaWVsZE5hbWUpO1xuICAgIH0pO1xuICB9LFxufSk7XG5cblNlY3VyaXR5LmRlZmluZU1ldGhvZChcImV4Y2VwdFByb3BzXCIsIHtcbiAgZmV0Y2g6IFtdLFxuICB0cmFuc2Zvcm06IG51bGwsXG4gIGFsbG93KHR5cGUsIGFyZywgdXNlcklkLCBkb2MsIGZpZWxkTmFtZXMpIHtcbiAgICBpZiAoIV8uaXNBcnJheShhcmcpKSBhcmcgPSBbYXJnXTtcblxuICAgIGZpZWxkTmFtZXMgPSBmaWVsZE5hbWVzIHx8IF8ua2V5cyhkb2MpO1xuXG4gICAgcmV0dXJuICFfLmFueShmaWVsZE5hbWVzLCBmdW5jdGlvbiAoZmllbGROYW1lKSB7XG4gICAgICByZXR1cm4gXy5jb250YWlucyhhcmcsIGZpZWxkTmFtZSk7XG4gICAgfSk7XG4gIH0sXG59KTtcbiJdfQ==
