(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var EJSON = Package.ejson.EJSON;
var EventEmitter = Package['raix:eventemitter'].EventEmitter;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Collection2;

var require = meteorInstall({"node_modules":{"meteor":{"aldeed:collection2":{"collection2.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/aldeed_collection2/collection2.js                                                                        //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let _objectSpread;

module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }

}, 0);
let EventEmitter;
module.link("meteor/raix:eventemitter", {
  EventEmitter(v) {
    EventEmitter = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 2);
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 3);
let EJSON;
module.link("meteor/ejson", {
  EJSON(v) {
    EJSON = v;
  }

}, 4);
let isEmpty;
module.link("lodash.isempty", {
  default(v) {
    isEmpty = v;
  }

}, 5);
let isEqual;
module.link("lodash.isequal", {
  default(v) {
    isEqual = v;
  }

}, 6);
let isObject;
module.link("lodash.isobject", {
  default(v) {
    isObject = v;
  }

}, 7);
let flattenSelector;
module.link("./lib", {
  flattenSelector(v) {
    flattenSelector = v;
  }

}, 8);
checkNpmVersions({
  'simpl-schema': '>=0.0.0'
}, 'aldeed:collection2');

const SimpleSchema = require('simpl-schema').default; // Exported only for listening to events


const Collection2 = new EventEmitter();
Collection2.cleanOptions = {
  filter: true,
  autoConvert: true,
  removeEmptyStrings: true,
  trimStrings: true,
  removeNullsFromArrays: false
};
/**
 * Mongo.Collection.prototype.attachSchema
 * @param {SimpleSchema|Object} ss - SimpleSchema instance or a schema definition object
 *    from which to create a new SimpleSchema instance
 * @param {Object} [options]
 * @param {Boolean} [options.transform=false] Set to `true` if your document must be passed
 *    through the collection's transform to properly validate.
 * @param {Boolean} [options.replace=false] Set to `true` to replace any existing schema instead of combining
 * @return {undefined}
 *
 * Use this method to attach a schema to a collection created by another package,
 * such as Meteor.users. It is most likely unsafe to call this method more than
 * once for a single collection, or to call this for a collection that had a
 * schema object passed to its constructor.
 */

Mongo.Collection.prototype.attachSchema = function c2AttachSchema(ss, options) {
  options = options || {}; // Allow passing just the schema object

  if (!SimpleSchema.isSimpleSchema(ss)) {
    ss = new SimpleSchema(ss);
  }

  function attachTo(obj) {
    // we need an array to hold multiple schemas
    // position 0 is reserved for the "base" schema
    obj._c2 = obj._c2 || {};
    obj._c2._simpleSchemas = obj._c2._simpleSchemas || [null];

    if (typeof options.selector === "object") {
      // Selector Schemas
      // Extend selector schema with base schema
      const baseSchema = obj._c2._simpleSchemas[0];

      if (baseSchema) {
        ss = extendSchema(baseSchema.schema, ss);
      } // Index of existing schema with identical selector


      let schemaIndex; // Loop through existing schemas with selectors,

      for (schemaIndex = obj._c2._simpleSchemas.length - 1; 0 < schemaIndex; schemaIndex--) {
        const schema = obj._c2._simpleSchemas[schemaIndex];
        if (schema && isEqual(schema.selector, options.selector)) break;
      }

      if (schemaIndex <= 0) {
        // We didn't find the schema in our array - push it into the array
        obj._c2._simpleSchemas.push({
          schema: ss,
          selector: options.selector
        });
      } else {
        // We found a schema with an identical selector in our array,
        if (options.replace === true) {
          // Replace existing selector schema with new selector schema
          obj._c2._simpleSchemas[schemaIndex].schema = ss;
        } else {
          // Extend existing selector schema with new selector schema.
          obj._c2._simpleSchemas[schemaIndex].schema = extendSchema(obj._c2._simpleSchemas[schemaIndex].schema, ss);
        }
      }
    } else {
      // Base Schema
      if (options.replace === true) {
        // Replace base schema and delete all other schemas
        obj._c2._simpleSchemas = [{
          schema: ss,
          selector: options.selector
        }];
      } else {
        // Set base schema if not yet set
        if (!obj._c2._simpleSchemas[0]) {
          return obj._c2._simpleSchemas[0] = {
            schema: ss,
            selector: undefined
          };
        } // Extend base schema and therefore extend all schemas


        obj._c2._simpleSchemas.forEach((schema, index) => {
          if (obj._c2._simpleSchemas[index]) {
            obj._c2._simpleSchemas[index].schema = extendSchema(obj._c2._simpleSchemas[index].schema, ss);
          }
        });
      }
    }
  }

  attachTo(this); // Attach the schema to the underlying LocalCollection, too

  if (this._collection instanceof LocalCollection) {
    this._collection._c2 = this._collection._c2 || {};
    attachTo(this._collection);
  }

  defineDeny(this, options);
  keepInsecure(this);
  Collection2.emit('schema.attached', this, ss, options);
};

[Mongo.Collection, LocalCollection].forEach(obj => {
  /**
   * simpleSchema
   * @description function detect the correct schema by given params. If it
   * detect multi-schema presence in the collection, then it made an attempt to find a
   * `selector` in args
   * @param {Object} doc - It could be <update> on update/upsert or document
   * itself on insert/remove
   * @param {Object} [options] - It could be <update> on update/upsert etc
   * @param {Object} [query] - it could be <query> on update/upsert
   * @return {Object} Schema
   */
  obj.prototype.simpleSchema = function (doc, options, query) {
    if (!this._c2) return null;
    if (this._c2._simpleSchema) return this._c2._simpleSchema;
    const schemas = this._c2._simpleSchemas;

    if (schemas && schemas.length > 0) {
      let schema, selector, target; // Position 0 reserved for base schema

      for (var i = 1; i < schemas.length; i++) {
        schema = schemas[i];
        selector = Object.keys(schema.selector)[0]; // We will set this to undefined because in theory you might want to select
        // on a null value.

        target = undefined; // here we are looking for selector in different places
        // $set should have more priority here

        if (doc.$set && typeof doc.$set[selector] !== 'undefined') {
          target = doc.$set[selector];
        } else if (typeof doc[selector] !== 'undefined') {
          target = doc[selector];
        } else if (options && options.selector) {
          target = options.selector[selector];
        } else if (query && query[selector]) {
          // on upsert/update operations
          target = query[selector];
        } // we need to compare given selector with doc property or option to
        // find right schema


        if (target !== undefined && target === schema.selector[selector]) {
          return schema.schema;
        }
      }

      if (schemas[0]) {
        return schemas[0].schema;
      } else {
        throw new Error("No default schema");
      }
    }

    return null;
  };
}); // Wrap DB write operation methods

['insert', 'update'].forEach(methodName => {
  const _super = Mongo.Collection.prototype[methodName];

  Mongo.Collection.prototype[methodName] = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    let options = methodName === "insert" ? args[1] : args[2]; // Support missing options arg

    if (!options || typeof options === "function") {
      options = {};
    }

    if (this._c2 && options.bypassCollection2 !== true) {
      let userId = null;

      try {
        // https://github.com/aldeed/meteor-collection2/issues/175
        userId = Meteor.userId();
      } catch (err) {}

      args = doValidate(this, methodName, args, Meteor.isServer || this._connection === null, // getAutoValues
      userId, Meteor.isServer // isFromTrustedCode
      );

      if (!args) {
        // doValidate already called the callback or threw the error so we're done.
        // But insert should always return an ID to match core behavior.
        return methodName === "insert" ? this._makeNewID() : undefined;
      }
    } else {
      // We still need to adjust args because insert does not take options
      if (methodName === "insert" && typeof args[1] !== 'function') args.splice(1, 1);
    }

    return _super.apply(this, args);
  };
});
/*
 * Private
 */

function doValidate(collection, type, args, getAutoValues, userId, isFromTrustedCode) {
  let doc, callback, error, options, isUpsert, selector, last, hasCallback;

  if (!args.length) {
    throw new Error(type + " requires an argument");
  } // Gather arguments and cache the selector


  if (type === "insert") {
    doc = args[0];
    options = args[1];
    callback = args[2]; // The real insert doesn't take options

    if (typeof options === "function") {
      args = [doc, options];
    } else if (typeof callback === "function") {
      args = [doc, callback];
    } else {
      args = [doc];
    }
  } else if (type === "update") {
    selector = args[0];
    doc = args[1];
    options = args[2];
    callback = args[3];
  } else {
    throw new Error("invalid type argument");
  }

  const validatedObjectWasInitiallyEmpty = isEmpty(doc); // Support missing options arg

  if (!callback && typeof options === "function") {
    callback = options;
    options = {};
  }

  options = options || {};
  last = args.length - 1;
  hasCallback = typeof args[last] === 'function'; // If update was called with upsert:true, flag as an upsert

  isUpsert = type === "update" && options.upsert === true; // we need to pass `doc` and `options` to `simpleSchema` method, that's why
  // schema declaration moved here

  let schema = collection.simpleSchema(doc, options, selector);
  const isLocalCollection = collection._connection === null; // On the server and for local collections, we allow passing `getAutoValues: false` to disable autoValue functions

  if ((Meteor.isServer || isLocalCollection) && options.getAutoValues === false) {
    getAutoValues = false;
  } // Process pick/omit options if they are present


  const picks = Array.isArray(options.pick) ? options.pick : null;
  const omits = Array.isArray(options.omit) ? options.omit : null;

  if (picks && omits) {
    // Pick and omit cannot both be present in the options
    throw new Error('pick and omit options are mutually exclusive');
  } else if (picks) {
    schema = schema.pick(...picks);
  } else if (omits) {
    schema = schema.omit(...omits);
  } // Determine validation context


  let validationContext = options.validationContext;

  if (validationContext) {
    if (typeof validationContext === 'string') {
      validationContext = schema.namedContext(validationContext);
    }
  } else {
    validationContext = schema.namedContext();
  } // Add a default callback function if we're on the client and no callback was given


  if (Meteor.isClient && !callback) {
    // Client can't block, so it can't report errors by exception,
    // only by callback. If they forget the callback, give them a
    // default one that logs the error, so they aren't totally
    // baffled if their writes don't work because their database is
    // down.
    callback = function (err) {
      if (err) {
        Meteor._debug(type + " failed: " + (err.reason || err.stack));
      }
    };
  } // If client validation is fine or is skipped but then something
  // is found to be invalid on the server, we get that error back
  // as a special Meteor.Error that we need to parse.


  if (Meteor.isClient && hasCallback) {
    callback = args[last] = wrapCallbackForParsingServerErrors(validationContext, callback);
  }

  const schemaAllowsId = schema.allowsKey("_id");

  if (type === "insert" && !doc._id && schemaAllowsId) {
    doc._id = collection._makeNewID();
  } // Get the docId for passing in the autoValue/custom context


  let docId;

  if (type === 'insert') {
    docId = doc._id; // might be undefined
  } else if (type === "update" && selector) {
    docId = typeof selector === 'string' || selector instanceof Mongo.ObjectID ? selector : selector._id;
  } // If _id has already been added, remove it temporarily if it's
  // not explicitly defined in the schema.


  let cachedId;

  if (doc._id && !schemaAllowsId) {
    cachedId = doc._id;
    delete doc._id;
  }

  const autoValueContext = {
    isInsert: type === "insert",
    isUpdate: type === "update" && options.upsert !== true,
    isUpsert,
    userId,
    isFromTrustedCode,
    docId,
    isLocalCollection
  };

  const extendAutoValueContext = _objectSpread(_objectSpread(_objectSpread({}, (schema._cleanOptions || {}).extendAutoValueContext || {}), autoValueContext), options.extendAutoValueContext);

  const cleanOptionsForThisOperation = {};
  ["autoConvert", "filter", "removeEmptyStrings", "removeNullsFromArrays", "trimStrings"].forEach(prop => {
    if (typeof options[prop] === "boolean") {
      cleanOptionsForThisOperation[prop] = options[prop];
    }
  }); // Preliminary cleaning on both client and server. On the server and for local
  // collections, automatic values will also be set at this point.

  schema.clean(doc, _objectSpread(_objectSpread(_objectSpread(_objectSpread({
    mutate: true,
    // Clean the doc/modifier in place
    isModifier: type !== "insert"
  }, Collection2.cleanOptions), schema._cleanOptions || {}), cleanOptionsForThisOperation), {}, {
    extendAutoValueContext,
    // This was extended separately above
    getAutoValues // Force this override

  })); // We clone before validating because in some cases we need to adjust the
  // object a bit before validating it. If we adjusted `doc` itself, our
  // changes would persist into the database.

  let docToValidate = {};

  for (var prop in doc) {
    // We omit prototype properties when cloning because they will not be valid
    // and mongo omits them when saving to the database anyway.
    if (Object.prototype.hasOwnProperty.call(doc, prop)) {
      docToValidate[prop] = doc[prop];
    }
  } // On the server, upserts are possible; SimpleSchema handles upserts pretty
  // well by default, but it will not know about the fields in the selector,
  // which are also stored in the database if an insert is performed. So we
  // will allow these fields to be considered for validation by adding them
  // to the $set in the modifier, while stripping out query selectors as these
  // don't make it into the upserted document and break validation.
  // This is no doubt prone to errors, but there probably isn't any better way
  // right now.


  if (Meteor.isServer && isUpsert && isObject(selector)) {
    const set = docToValidate.$set || {};
    docToValidate.$set = flattenSelector(selector);
    if (!schemaAllowsId) delete docToValidate.$set._id;
    Object.assign(docToValidate.$set, set);
  } // Set automatic values for validation on the client.
  // On the server, we already updated doc with auto values, but on the client,
  // we will add them to docToValidate for validation purposes only.
  // This is because we want all actual values generated on the server.


  if (Meteor.isClient && !isLocalCollection) {
    schema.clean(docToValidate, {
      autoConvert: false,
      extendAutoValueContext,
      filter: false,
      getAutoValues: true,
      isModifier: type !== "insert",
      mutate: true,
      // Clean the doc/modifier in place
      removeEmptyStrings: false,
      removeNullsFromArrays: false,
      trimStrings: false
    });
  } // XXX Maybe move this into SimpleSchema


  if (!validatedObjectWasInitiallyEmpty && isEmpty(docToValidate)) {
    throw new Error('After filtering out keys not in the schema, your ' + (type === 'update' ? 'modifier' : 'object') + ' is now empty');
  } // Validate doc


  let isValid;

  if (options.validate === false) {
    isValid = true;
  } else {
    isValid = validationContext.validate(docToValidate, {
      modifier: type === "update" || type === "upsert",
      upsert: isUpsert,
      extendedCustomContext: _objectSpread({
        isInsert: type === "insert",
        isUpdate: type === "update" && options.upsert !== true,
        isUpsert,
        userId,
        isFromTrustedCode,
        docId,
        isLocalCollection
      }, options.extendedCustomContext || {})
    });
  }

  if (isValid) {
    // Add the ID back
    if (cachedId) {
      doc._id = cachedId;
    } // Update the args to reflect the cleaned doc
    // XXX not sure this is necessary since we mutate


    if (type === "insert") {
      args[0] = doc;
    } else {
      args[1] = doc;
    } // If callback, set invalidKey when we get a mongo unique error


    if (Meteor.isServer && hasCallback) {
      args[last] = wrapCallbackForParsingMongoValidationErrors(validationContext, args[last]);
    }

    return args;
  } else {
    var _Meteor$settings, _Meteor$settings$pack, _Meteor$settings$pack2;

    error = getErrorObject(validationContext, (_Meteor$settings = Meteor.settings) !== null && _Meteor$settings !== void 0 && (_Meteor$settings$pack = _Meteor$settings.packages) !== null && _Meteor$settings$pack !== void 0 && (_Meteor$settings$pack2 = _Meteor$settings$pack.collection2) !== null && _Meteor$settings$pack2 !== void 0 && _Meteor$settings$pack2.disableCollectionNamesInValidation ? '' : "in ".concat(collection._name, " ").concat(type));

    if (callback) {
      // insert/update/upsert pass `false` when there's an error, so we do that
      callback(error, false);
    } else {
      throw error;
    }
  }
}

function getErrorObject(context) {
  let appendToMessage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  let message;
  const invalidKeys = typeof context.validationErrors === 'function' ? context.validationErrors() : context.invalidKeys();

  if (invalidKeys.length) {
    const firstErrorKey = invalidKeys[0].name;
    const firstErrorMessage = context.keyErrorMessage(firstErrorKey); // If the error is in a nested key, add the full key to the error message
    // to be more helpful.

    if (firstErrorKey.indexOf('.') === -1) {
      message = firstErrorMessage;
    } else {
      message = "".concat(firstErrorMessage, " (").concat(firstErrorKey, ")");
    }
  } else {
    message = "Failed validation";
  }

  message = "".concat(message, " ").concat(appendToMessage).trim();
  const error = new Error(message);
  error.invalidKeys = invalidKeys;
  error.validationContext = context; // If on the server, we add a sanitized error, too, in case we're
  // called from a method.

  if (Meteor.isServer) {
    error.sanitizedError = new Meteor.Error(400, message, EJSON.stringify(error.invalidKeys));
  }

  return error;
}

function addUniqueError(context, errorMessage) {
  const name = errorMessage.split('c2_')[1].split(' ')[0];
  const val = errorMessage.split('dup key:')[1].split('"')[1];
  const addValidationErrorsPropName = typeof context.addValidationErrors === 'function' ? 'addValidationErrors' : 'addInvalidKeys';
  context[addValidationErrorsPropName]([{
    name: name,
    type: 'notUnique',
    value: val
  }]);
}

function wrapCallbackForParsingMongoValidationErrors(validationContext, cb) {
  return function wrappedCallbackForParsingMongoValidationErrors() {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    const error = args[0];

    if (error && (error.name === "MongoError" && error.code === 11001 || error.message.indexOf('MongoError: E11000') !== -1) && error.message.indexOf('c2_') !== -1) {
      addUniqueError(validationContext, error.message);
      args[0] = getErrorObject(validationContext);
    }

    return cb.apply(this, args);
  };
}

function wrapCallbackForParsingServerErrors(validationContext, cb) {
  const addValidationErrorsPropName = typeof validationContext.addValidationErrors === 'function' ? 'addValidationErrors' : 'addInvalidKeys';
  return function wrappedCallbackForParsingServerErrors() {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    const error = args[0]; // Handle our own validation errors

    if (error instanceof Meteor.Error && error.error === 400 && error.reason === "INVALID" && typeof error.details === "string") {
      const invalidKeysFromServer = EJSON.parse(error.details);
      validationContext[addValidationErrorsPropName](invalidKeysFromServer);
      args[0] = getErrorObject(validationContext);
    } // Handle Mongo unique index errors, which are forwarded to the client as 409 errors
    else if (error instanceof Meteor.Error && error.error === 409 && error.reason && error.reason.indexOf('E11000') !== -1 && error.reason.indexOf('c2_') !== -1) {
      addUniqueError(validationContext, error.reason);
      args[0] = getErrorObject(validationContext);
    }

    return cb.apply(this, args);
  };
}

let alreadyInsecure = {};

function keepInsecure(c) {
  // If insecure package is in use, we need to add allow rules that return
  // true. Otherwise, it would seemingly turn off insecure mode.
  if (Package && Package.insecure && !alreadyInsecure[c._name]) {
    c.allow({
      insert: function () {
        return true;
      },
      update: function () {
        return true;
      },
      remove: function () {
        return true;
      },
      fetch: [],
      transform: null
    });
    alreadyInsecure[c._name] = true;
  } // If insecure package is NOT in use, then adding the two deny functions
  // does not have any effect on the main app's security paradigm. The
  // user will still be required to add at least one allow function of her
  // own for each operation for this collection. And the user may still add
  // additional deny functions, but does not have to.

}

let alreadyDefined = {};

function defineDeny(c, options) {
  if (!alreadyDefined[c._name]) {
    const isLocalCollection = c._connection === null; // First define deny functions to extend doc with the results of clean
    // and auto-values. This must be done with "transform: null" or we would be
    // extending a clone of doc and therefore have no effect.

    c.deny({
      insert: function (userId, doc) {
        // Referenced doc is cleaned in place
        c.simpleSchema(doc).clean(doc, {
          mutate: true,
          isModifier: false,
          // We don't do these here because they are done on the client if desired
          filter: false,
          autoConvert: false,
          removeEmptyStrings: false,
          trimStrings: false,
          extendAutoValueContext: {
            isInsert: true,
            isUpdate: false,
            isUpsert: false,
            userId: userId,
            isFromTrustedCode: false,
            docId: doc._id,
            isLocalCollection: isLocalCollection
          }
        });
        return false;
      },
      update: function (userId, doc, fields, modifier) {
        // Referenced modifier is cleaned in place
        c.simpleSchema(modifier).clean(modifier, {
          mutate: true,
          isModifier: true,
          // We don't do these here because they are done on the client if desired
          filter: false,
          autoConvert: false,
          removeEmptyStrings: false,
          trimStrings: false,
          extendAutoValueContext: {
            isInsert: false,
            isUpdate: true,
            isUpsert: false,
            userId: userId,
            isFromTrustedCode: false,
            docId: doc && doc._id,
            isLocalCollection: isLocalCollection
          }
        });
        return false;
      },
      fetch: ['_id'],
      transform: null
    }); // Second define deny functions to validate again on the server
    // for client-initiated inserts and updates. These should be
    // called after the clean/auto-value functions since we're adding
    // them after. These must *not* have "transform: null" if options.transform is true because
    // we need to pass the doc through any transforms to be sure
    // that custom types are properly recognized for type validation.

    c.deny(_objectSpread({
      insert: function (userId, doc) {
        // We pass the false options because we will have done them on client if desired
        doValidate(c, "insert", [doc, {
          trimStrings: false,
          removeEmptyStrings: false,
          filter: false,
          autoConvert: false
        }, function (error) {
          if (error) {
            throw new Meteor.Error(400, 'INVALID', EJSON.stringify(error.invalidKeys));
          }
        }], false, // getAutoValues
        userId, false // isFromTrustedCode
        );
        return false;
      },
      update: function (userId, doc, fields, modifier) {
        // NOTE: This will never be an upsert because client-side upserts
        // are not allowed once you define allow/deny functions.
        // We pass the false options because we will have done them on client if desired
        doValidate(c, "update", [{
          _id: doc && doc._id
        }, modifier, {
          trimStrings: false,
          removeEmptyStrings: false,
          filter: false,
          autoConvert: false
        }, function (error) {
          if (error) {
            throw new Meteor.Error(400, 'INVALID', EJSON.stringify(error.invalidKeys));
          }
        }], false, // getAutoValues
        userId, false // isFromTrustedCode
        );
        return false;
      },
      fetch: ['_id']
    }, options.transform === true ? {} : {
      transform: null
    })); // note that we've already done this collection so that we don't do it again
    // if attachSchema is called again

    alreadyDefined[c._name] = true;
  }
}

function extendSchema(s1, s2) {
  if (s2.version >= 2) {
    const ss = new SimpleSchema(s1);
    ss.extend(s2);
    return ss;
  } else {
    return new SimpleSchema([s1, s2]);
  }
}

module.exportDefault(Collection2);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/aldeed_collection2/lib.js                                                                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  flattenSelector: () => flattenSelector
});

function flattenSelector(selector) {
  // If selector uses $and format, convert to plain object selector
  if (Array.isArray(selector.$and)) {
    selector.$and.forEach(sel => {
      Object.assign(selector, flattenSelector(sel));
    });
    delete selector.$and;
  }

  const obj = {};
  Object.entries(selector).forEach(_ref => {
    let [key, value] = _ref;

    // Ignoring logical selectors (https://docs.mongodb.com/manual/reference/operator/query/#logical)
    if (!key.startsWith("$")) {
      if (typeof value === 'object' && value !== null) {
        if (value.$eq !== undefined) {
          obj[key] = value.$eq;
        } else if (Array.isArray(value.$in) && value.$in.length === 1) {
          obj[key] = value.$in[0];
        } else if (Object.keys(value).every(v => !(typeof v === "string" && v.startsWith("$")))) {
          obj[key] = value;
        }
      } else {
        obj[key] = value;
      }
    }
  });
  return obj;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"lodash.isempty":{"package.json":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/aldeed_collection2/node_modules/lodash.isempty/package.json                                   //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.exports = {
  "name": "lodash.isempty",
  "version": "4.4.0"
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/aldeed_collection2/node_modules/lodash.isempty/index.js                                       //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.useNode();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lodash.isequal":{"package.json":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/aldeed_collection2/node_modules/lodash.isequal/package.json                                   //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.exports = {
  "name": "lodash.isequal",
  "version": "4.5.0"
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/aldeed_collection2/node_modules/lodash.isequal/index.js                                       //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.useNode();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lodash.isobject":{"package.json":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/aldeed_collection2/node_modules/lodash.isobject/package.json                                  //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.exports = {
  "name": "lodash.isobject",
  "version": "3.0.2"
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/aldeed_collection2/node_modules/lodash.isobject/index.js                                      //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.useNode();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/aldeed:collection2/collection2.js");

/* Exports */
Package._define("aldeed:collection2", exports, {
  Collection2: Collection2
});

})();

//# sourceURL=meteor://💻app/packages/aldeed_collection2.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWxkZWVkOmNvbGxlY3Rpb24yL2NvbGxlY3Rpb24yLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9hbGRlZWQ6Y29sbGVjdGlvbjIvbGliLmpzIl0sIm5hbWVzIjpbIl9vYmplY3RTcHJlYWQiLCJtb2R1bGUiLCJsaW5rIiwiZGVmYXVsdCIsInYiLCJFdmVudEVtaXR0ZXIiLCJNZXRlb3IiLCJNb25nbyIsImNoZWNrTnBtVmVyc2lvbnMiLCJFSlNPTiIsImlzRW1wdHkiLCJpc0VxdWFsIiwiaXNPYmplY3QiLCJmbGF0dGVuU2VsZWN0b3IiLCJTaW1wbGVTY2hlbWEiLCJyZXF1aXJlIiwiQ29sbGVjdGlvbjIiLCJjbGVhbk9wdGlvbnMiLCJmaWx0ZXIiLCJhdXRvQ29udmVydCIsInJlbW92ZUVtcHR5U3RyaW5ncyIsInRyaW1TdHJpbmdzIiwicmVtb3ZlTnVsbHNGcm9tQXJyYXlzIiwiQ29sbGVjdGlvbiIsInByb3RvdHlwZSIsImF0dGFjaFNjaGVtYSIsImMyQXR0YWNoU2NoZW1hIiwic3MiLCJvcHRpb25zIiwiaXNTaW1wbGVTY2hlbWEiLCJhdHRhY2hUbyIsIm9iaiIsIl9jMiIsIl9zaW1wbGVTY2hlbWFzIiwic2VsZWN0b3IiLCJiYXNlU2NoZW1hIiwiZXh0ZW5kU2NoZW1hIiwic2NoZW1hIiwic2NoZW1hSW5kZXgiLCJsZW5ndGgiLCJwdXNoIiwicmVwbGFjZSIsInVuZGVmaW5lZCIsImZvckVhY2giLCJpbmRleCIsIl9jb2xsZWN0aW9uIiwiTG9jYWxDb2xsZWN0aW9uIiwiZGVmaW5lRGVueSIsImtlZXBJbnNlY3VyZSIsImVtaXQiLCJzaW1wbGVTY2hlbWEiLCJkb2MiLCJxdWVyeSIsIl9zaW1wbGVTY2hlbWEiLCJzY2hlbWFzIiwidGFyZ2V0IiwiaSIsIk9iamVjdCIsImtleXMiLCIkc2V0IiwiRXJyb3IiLCJtZXRob2ROYW1lIiwiX3N1cGVyIiwiYXJncyIsImJ5cGFzc0NvbGxlY3Rpb24yIiwidXNlcklkIiwiZXJyIiwiZG9WYWxpZGF0ZSIsImlzU2VydmVyIiwiX2Nvbm5lY3Rpb24iLCJfbWFrZU5ld0lEIiwic3BsaWNlIiwiYXBwbHkiLCJjb2xsZWN0aW9uIiwidHlwZSIsImdldEF1dG9WYWx1ZXMiLCJpc0Zyb21UcnVzdGVkQ29kZSIsImNhbGxiYWNrIiwiZXJyb3IiLCJpc1Vwc2VydCIsImxhc3QiLCJoYXNDYWxsYmFjayIsInZhbGlkYXRlZE9iamVjdFdhc0luaXRpYWxseUVtcHR5IiwidXBzZXJ0IiwiaXNMb2NhbENvbGxlY3Rpb24iLCJwaWNrcyIsIkFycmF5IiwiaXNBcnJheSIsInBpY2siLCJvbWl0cyIsIm9taXQiLCJ2YWxpZGF0aW9uQ29udGV4dCIsIm5hbWVkQ29udGV4dCIsImlzQ2xpZW50IiwiX2RlYnVnIiwicmVhc29uIiwic3RhY2siLCJ3cmFwQ2FsbGJhY2tGb3JQYXJzaW5nU2VydmVyRXJyb3JzIiwic2NoZW1hQWxsb3dzSWQiLCJhbGxvd3NLZXkiLCJfaWQiLCJkb2NJZCIsIk9iamVjdElEIiwiY2FjaGVkSWQiLCJhdXRvVmFsdWVDb250ZXh0IiwiaXNJbnNlcnQiLCJpc1VwZGF0ZSIsImV4dGVuZEF1dG9WYWx1ZUNvbnRleHQiLCJfY2xlYW5PcHRpb25zIiwiY2xlYW5PcHRpb25zRm9yVGhpc09wZXJhdGlvbiIsInByb3AiLCJjbGVhbiIsIm11dGF0ZSIsImlzTW9kaWZpZXIiLCJkb2NUb1ZhbGlkYXRlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwic2V0IiwiYXNzaWduIiwiaXNWYWxpZCIsInZhbGlkYXRlIiwibW9kaWZpZXIiLCJleHRlbmRlZEN1c3RvbUNvbnRleHQiLCJ3cmFwQ2FsbGJhY2tGb3JQYXJzaW5nTW9uZ29WYWxpZGF0aW9uRXJyb3JzIiwiZ2V0RXJyb3JPYmplY3QiLCJzZXR0aW5ncyIsInBhY2thZ2VzIiwiY29sbGVjdGlvbjIiLCJkaXNhYmxlQ29sbGVjdGlvbk5hbWVzSW5WYWxpZGF0aW9uIiwiX25hbWUiLCJjb250ZXh0IiwiYXBwZW5kVG9NZXNzYWdlIiwibWVzc2FnZSIsImludmFsaWRLZXlzIiwidmFsaWRhdGlvbkVycm9ycyIsImZpcnN0RXJyb3JLZXkiLCJuYW1lIiwiZmlyc3RFcnJvck1lc3NhZ2UiLCJrZXlFcnJvck1lc3NhZ2UiLCJpbmRleE9mIiwidHJpbSIsInNhbml0aXplZEVycm9yIiwic3RyaW5naWZ5IiwiYWRkVW5pcXVlRXJyb3IiLCJlcnJvck1lc3NhZ2UiLCJzcGxpdCIsInZhbCIsImFkZFZhbGlkYXRpb25FcnJvcnNQcm9wTmFtZSIsImFkZFZhbGlkYXRpb25FcnJvcnMiLCJ2YWx1ZSIsImNiIiwid3JhcHBlZENhbGxiYWNrRm9yUGFyc2luZ01vbmdvVmFsaWRhdGlvbkVycm9ycyIsImNvZGUiLCJ3cmFwcGVkQ2FsbGJhY2tGb3JQYXJzaW5nU2VydmVyRXJyb3JzIiwiZGV0YWlscyIsImludmFsaWRLZXlzRnJvbVNlcnZlciIsInBhcnNlIiwiYWxyZWFkeUluc2VjdXJlIiwiYyIsIlBhY2thZ2UiLCJpbnNlY3VyZSIsImFsbG93IiwiaW5zZXJ0IiwidXBkYXRlIiwicmVtb3ZlIiwiZmV0Y2giLCJ0cmFuc2Zvcm0iLCJhbHJlYWR5RGVmaW5lZCIsImRlbnkiLCJmaWVsZHMiLCJzMSIsInMyIiwidmVyc2lvbiIsImV4dGVuZCIsImV4cG9ydERlZmF1bHQiLCJleHBvcnQiLCIkYW5kIiwic2VsIiwiZW50cmllcyIsImtleSIsInN0YXJ0c1dpdGgiLCIkZXEiLCIkaW4iLCJldmVyeSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsYUFBSjs7QUFBa0JDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLHNDQUFaLEVBQW1EO0FBQUNDLFNBQU8sQ0FBQ0MsQ0FBRCxFQUFHO0FBQUNKLGlCQUFhLEdBQUNJLENBQWQ7QUFBZ0I7O0FBQTVCLENBQW5ELEVBQWlGLENBQWpGO0FBQWxCLElBQUlDLFlBQUo7QUFBaUJKLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLDBCQUFaLEVBQXVDO0FBQUNHLGNB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O0FBQzNCWCxhQUFHLENBQUNvSixHQUFELENBQUgsR0FBVzlCLEtBQUssQ0FBQ2dDLEdBQWpCO0FBQ0QsU0FGRCxNQUVPLElBQUkvRixLQUFLLENBQUNDLE9BQU4sQ0FBYzhELEtBQUssQ0FBQ2lDLEdBQXBCLEtBQTRCakMsS0FBSyxDQUFDaUMsR0FBTixDQUFVL0ksTUFBVixLQUFxQixDQUFyRCxFQUF3RDtBQUM3RFIsYUFBRyxDQUFDb0osR0FBRCxDQUFILEdBQVc5QixLQUFLLENBQUNpQyxHQUFOLENBQVUsQ0FBVixDQUFYO0FBQ0QsU0FGTSxNQUVBLElBQUk3SCxNQUFNLENBQUNDLElBQVAsQ0FBWTJGLEtBQVosRUFBbUJrQyxLQUFuQixDQUF5Qm5MLENBQUMsSUFBSSxFQUFFLE9BQU9BLENBQVAsS0FBYSxRQUFiLElBQXlCQSxDQUFDLENBQUNnTCxVQUFGLENBQWEsR0FBYixDQUEzQixDQUE5QixDQUFKLEVBQWtGO0FBQ3ZGckosYUFBRyxDQUFDb0osR0FBRCxDQUFILEdBQVc5QixLQUFYO0FBQ0Q7QUFDRixPQVJELE1BUU87QUFDTHRILFdBQUcsQ0FBQ29KLEdBQUQsQ0FBSCxHQUFXOUIsS0FBWDtBQUNEO0FBQ0Y7QUFDRixHQWZEO0FBaUJBLFNBQU90SCxHQUFQO0FBQ0QsQyIsImZpbGUiOiIvcGFja2FnZXMvYWxkZWVkX2NvbGxlY3Rpb24yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnbWV0ZW9yL3JhaXg6ZXZlbnRlbWl0dGVyJztcbmltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgY2hlY2tOcG1WZXJzaW9ucyB9IGZyb20gJ21ldGVvci90bWVhc2RheTpjaGVjay1ucG0tdmVyc2lvbnMnO1xuaW1wb3J0IHsgRUpTT04gfSBmcm9tICdtZXRlb3IvZWpzb24nO1xuaW1wb3J0IGlzRW1wdHkgZnJvbSAnbG9kYXNoLmlzZW1wdHknO1xuaW1wb3J0IGlzRXF1YWwgZnJvbSAnbG9kYXNoLmlzZXF1YWwnO1xuaW1wb3J0IGlzT2JqZWN0IGZyb20gJ2xvZGFzaC5pc29iamVjdCc7XG5pbXBvcnQgeyBmbGF0dGVuU2VsZWN0b3IgfSBmcm9tICcuL2xpYic7XG5cbmNoZWNrTnBtVmVyc2lvbnMoeyAnc2ltcGwtc2NoZW1hJzogJz49MC4wLjAnIH0sICdhbGRlZWQ6Y29sbGVjdGlvbjInKTtcblxuY29uc3QgU2ltcGxlU2NoZW1hID0gcmVxdWlyZSgnc2ltcGwtc2NoZW1hJykuZGVmYXVsdDtcblxuLy8gRXhwb3J0ZWQgb25seSBmb3IgbGlzdGVuaW5nIHRvIGV2ZW50c1xuY29uc3QgQ29sbGVjdGlvbjIgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbkNvbGxlY3Rpb24yLmNsZWFuT3B0aW9ucyA9IHtcbiAgZmlsdGVyOiB0cnVlLFxuICBhdXRvQ29udmVydDogdHJ1ZSxcbiAgcmVtb3ZlRW1wdHlTdHJpbmdzOiB0cnVlLFxuICB0cmltU3RyaW5nczogdHJ1ZSxcbiAgcmVtb3ZlTnVsbHNGcm9tQXJyYXlzOiBmYWxzZSxcbn07XG5cbi8qKlxuICogTW9uZ28uQ29sbGVjdGlvbi5wcm90b3R5cGUuYXR0YWNoU2NoZW1hXG4gKiBAcGFyYW0ge1NpbXBsZVNjaGVtYXxPYmplY3R9IHNzIC0gU2ltcGxlU2NoZW1hIGluc3RhbmNlIG9yIGEgc2NoZW1hIGRlZmluaXRpb24gb2JqZWN0XG4gKiAgICBmcm9tIHdoaWNoIHRvIGNyZWF0ZSBhIG5ldyBTaW1wbGVTY2hlbWEgaW5zdGFuY2VcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMudHJhbnNmb3JtPWZhbHNlXSBTZXQgdG8gYHRydWVgIGlmIHlvdXIgZG9jdW1lbnQgbXVzdCBiZSBwYXNzZWRcbiAqICAgIHRocm91Z2ggdGhlIGNvbGxlY3Rpb24ncyB0cmFuc2Zvcm0gdG8gcHJvcGVybHkgdmFsaWRhdGUuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLnJlcGxhY2U9ZmFsc2VdIFNldCB0byBgdHJ1ZWAgdG8gcmVwbGFjZSBhbnkgZXhpc3Rpbmcgc2NoZW1hIGluc3RlYWQgb2YgY29tYmluaW5nXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gKlxuICogVXNlIHRoaXMgbWV0aG9kIHRvIGF0dGFjaCBhIHNjaGVtYSB0byBhIGNvbGxlY3Rpb24gY3JlYXRlZCBieSBhbm90aGVyIHBhY2thZ2UsXG4gKiBzdWNoIGFzIE1ldGVvci51c2Vycy4gSXQgaXMgbW9zdCBsaWtlbHkgdW5zYWZlIHRvIGNhbGwgdGhpcyBtZXRob2QgbW9yZSB0aGFuXG4gKiBvbmNlIGZvciBhIHNpbmdsZSBjb2xsZWN0aW9uLCBvciB0byBjYWxsIHRoaXMgZm9yIGEgY29sbGVjdGlvbiB0aGF0IGhhZCBhXG4gKiBzY2hlbWEgb2JqZWN0IHBhc3NlZCB0byBpdHMgY29uc3RydWN0b3IuXG4gKi9cbk1vbmdvLkNvbGxlY3Rpb24ucHJvdG90eXBlLmF0dGFjaFNjaGVtYSA9IGZ1bmN0aW9uIGMyQXR0YWNoU2NoZW1hKHNzLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIC8vIEFsbG93IHBhc3NpbmcganVzdCB0aGUgc2NoZW1hIG9iamVjdFxuICBpZiAoIVNpbXBsZVNjaGVtYS5pc1NpbXBsZVNjaGVtYShzcykpIHtcbiAgICBzcyA9IG5ldyBTaW1wbGVTY2hlbWEoc3MpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXR0YWNoVG8ob2JqKSB7XG4gICAgLy8gd2UgbmVlZCBhbiBhcnJheSB0byBob2xkIG11bHRpcGxlIHNjaGVtYXNcbiAgICAvLyBwb3NpdGlvbiAwIGlzIHJlc2VydmVkIGZvciB0aGUgXCJiYXNlXCIgc2NoZW1hXG4gICAgb2JqLl9jMiA9IG9iai5fYzIgfHwge307XG4gICAgb2JqLl9jMi5fc2ltcGxlU2NoZW1hcyA9IG9iai5fYzIuX3NpbXBsZVNjaGVtYXMgfHwgWyBudWxsIF07XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuc2VsZWN0b3IgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIC8vIFNlbGVjdG9yIFNjaGVtYXNcblxuICAgICAgLy8gRXh0ZW5kIHNlbGVjdG9yIHNjaGVtYSB3aXRoIGJhc2Ugc2NoZW1hXG4gICAgICBjb25zdCBiYXNlU2NoZW1hID0gb2JqLl9jMi5fc2ltcGxlU2NoZW1hc1swXTtcbiAgICAgIGlmIChiYXNlU2NoZW1hKSB7XG4gICAgICAgIHNzID0gZXh0ZW5kU2NoZW1hKGJhc2VTY2hlbWEuc2NoZW1hLCBzcyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEluZGV4IG9mIGV4aXN0aW5nIHNjaGVtYSB3aXRoIGlkZW50aWNhbCBzZWxlY3RvclxuICAgICAgbGV0IHNjaGVtYUluZGV4O1xuXG4gICAgICAvLyBMb29wIHRocm91Z2ggZXhpc3Rpbmcgc2NoZW1hcyB3aXRoIHNlbGVjdG9ycyxcbiAgICAgIGZvciAoc2NoZW1hSW5kZXggPSBvYmouX2MyLl9zaW1wbGVTY2hlbWFzLmxlbmd0aCAtIDE7IDAgPCBzY2hlbWFJbmRleDsgc2NoZW1hSW5kZXgtLSkge1xuICAgICAgICBjb25zdCBzY2hlbWEgPSBvYmouX2MyLl9zaW1wbGVTY2hlbWFzW3NjaGVtYUluZGV4XTtcbiAgICAgICAgaWYgKHNjaGVtYSAmJiBpc0VxdWFsKHNjaGVtYS5zZWxlY3Rvciwgb3B0aW9ucy5zZWxlY3RvcikpIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2NoZW1hSW5kZXggPD0gMCkge1xuICAgICAgICAvLyBXZSBkaWRuJ3QgZmluZCB0aGUgc2NoZW1hIGluIG91ciBhcnJheSAtIHB1c2ggaXQgaW50byB0aGUgYXJyYXlcbiAgICAgICAgb2JqLl9jMi5fc2ltcGxlU2NoZW1hcy5wdXNoKHtcbiAgICAgICAgICBzY2hlbWE6IHNzLFxuICAgICAgICAgIHNlbGVjdG9yOiBvcHRpb25zLnNlbGVjdG9yLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIGZvdW5kIGEgc2NoZW1hIHdpdGggYW4gaWRlbnRpY2FsIHNlbGVjdG9yIGluIG91ciBhcnJheSxcbiAgICAgICAgaWYgKG9wdGlvbnMucmVwbGFjZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgIC8vIFJlcGxhY2UgZXhpc3Rpbmcgc2VsZWN0b3Igc2NoZW1hIHdpdGggbmV3IHNlbGVjdG9yIHNjaGVtYVxuICAgICAgICAgIG9iai5fYzIuX3NpbXBsZVNjaGVtYXNbc2NoZW1hSW5kZXhdLnNjaGVtYSA9IHNzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEV4dGVuZCBleGlzdGluZyBzZWxlY3RvciBzY2hlbWEgd2l0aCBuZXcgc2VsZWN0b3Igc2NoZW1hLlxuICAgICAgICAgIG9iai5fYzIuX3NpbXBsZVNjaGVtYXNbc2NoZW1hSW5kZXhdLnNjaGVtYSA9IGV4dGVuZFNjaGVtYShvYmouX2MyLl9zaW1wbGVTY2hlbWFzW3NjaGVtYUluZGV4XS5zY2hlbWEsIHNzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBCYXNlIFNjaGVtYVxuICAgICAgaWYgKG9wdGlvbnMucmVwbGFjZSA9PT0gdHJ1ZSkge1xuICAgICAgICAvLyBSZXBsYWNlIGJhc2Ugc2NoZW1hIGFuZCBkZWxldGUgYWxsIG90aGVyIHNjaGVtYXNcbiAgICAgICAgb2JqLl9jMi5fc2ltcGxlU2NoZW1hcyA9IFt7XG4gICAgICAgICAgc2NoZW1hOiBzcyxcbiAgICAgICAgICBzZWxlY3Rvcjogb3B0aW9ucy5zZWxlY3RvcixcbiAgICAgICAgfV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTZXQgYmFzZSBzY2hlbWEgaWYgbm90IHlldCBzZXRcbiAgICAgICAgaWYgKCFvYmouX2MyLl9zaW1wbGVTY2hlbWFzWzBdKSB7XG4gICAgICAgICAgcmV0dXJuIG9iai5fYzIuX3NpbXBsZVNjaGVtYXNbMF0gPSB7IHNjaGVtYTogc3MsIHNlbGVjdG9yOiB1bmRlZmluZWQgfTtcbiAgICAgICAgfVxuICAgICAgICAvLyBFeHRlbmQgYmFzZSBzY2hlbWEgYW5kIHRoZXJlZm9yZSBleHRlbmQgYWxsIHNjaGVtYXNcbiAgICAgICAgb2JqLl9jMi5fc2ltcGxlU2NoZW1hcy5mb3JFYWNoKChzY2hlbWEsIGluZGV4KSA9PiB7XG4gICAgICAgICAgaWYgKG9iai5fYzIuX3NpbXBsZVNjaGVtYXNbaW5kZXhdKSB7XG4gICAgICAgICAgICBvYmouX2MyLl9zaW1wbGVTY2hlbWFzW2luZGV4XS5zY2hlbWEgPSBleHRlbmRTY2hlbWEob2JqLl9jMi5fc2ltcGxlU2NoZW1hc1tpbmRleF0uc2NoZW1hLCBzcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhdHRhY2hUbyh0aGlzKTtcbiAgLy8gQXR0YWNoIHRoZSBzY2hlbWEgdG8gdGhlIHVuZGVybHlpbmcgTG9jYWxDb2xsZWN0aW9uLCB0b29cbiAgaWYgKHRoaXMuX2NvbGxlY3Rpb24gaW5zdGFuY2VvZiBMb2NhbENvbGxlY3Rpb24pIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLl9jMiA9IHRoaXMuX2NvbGxlY3Rpb24uX2MyIHx8IHt9O1xuICAgIGF0dGFjaFRvKHRoaXMuX2NvbGxlY3Rpb24pO1xuICB9XG5cbiAgZGVmaW5lRGVueSh0aGlzLCBvcHRpb25zKTtcbiAga2VlcEluc2VjdXJlKHRoaXMpO1xuXG4gIENvbGxlY3Rpb24yLmVtaXQoJ3NjaGVtYS5hdHRhY2hlZCcsIHRoaXMsIHNzLCBvcHRpb25zKTtcbn07XG5cbltNb25nby5Db2xsZWN0aW9uLCBMb2NhbENvbGxlY3Rpb25dLmZvckVhY2goKG9iaikgPT4ge1xuICAvKipcbiAgICogc2ltcGxlU2NoZW1hXG4gICAqIEBkZXNjcmlwdGlvbiBmdW5jdGlvbiBkZXRlY3QgdGhlIGNvcnJlY3Qgc2NoZW1hIGJ5IGdpdmVuIHBhcmFtcy4gSWYgaXRcbiAgICogZGV0ZWN0IG11bHRpLXNjaGVtYSBwcmVzZW5jZSBpbiB0aGUgY29sbGVjdGlvbiwgdGhlbiBpdCBtYWRlIGFuIGF0dGVtcHQgdG8gZmluZCBhXG4gICAqIGBzZWxlY3RvcmAgaW4gYXJnc1xuICAgKiBAcGFyYW0ge09iamVjdH0gZG9jIC0gSXQgY291bGQgYmUgPHVwZGF0ZT4gb24gdXBkYXRlL3Vwc2VydCBvciBkb2N1bWVudFxuICAgKiBpdHNlbGYgb24gaW5zZXJ0L3JlbW92ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gSXQgY291bGQgYmUgPHVwZGF0ZT4gb24gdXBkYXRlL3Vwc2VydCBldGNcbiAgICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV0gLSBpdCBjb3VsZCBiZSA8cXVlcnk+IG9uIHVwZGF0ZS91cHNlcnRcbiAgICogQHJldHVybiB7T2JqZWN0fSBTY2hlbWFcbiAgICovXG4gIG9iai5wcm90b3R5cGUuc2ltcGxlU2NoZW1hID0gZnVuY3Rpb24gKGRvYywgb3B0aW9ucywgcXVlcnkpIHtcbiAgICBpZiAoIXRoaXMuX2MyKSByZXR1cm4gbnVsbDtcbiAgICBpZiAodGhpcy5fYzIuX3NpbXBsZVNjaGVtYSkgcmV0dXJuIHRoaXMuX2MyLl9zaW1wbGVTY2hlbWE7XG5cbiAgICBjb25zdCBzY2hlbWFzID0gdGhpcy5fYzIuX3NpbXBsZVNjaGVtYXM7XG4gICAgaWYgKHNjaGVtYXMgJiYgc2NoZW1hcy5sZW5ndGggPiAwKSB7XG5cbiAgICAgIGxldCBzY2hlbWEsIHNlbGVjdG9yLCB0YXJnZXQ7XG4gICAgICAvLyBQb3NpdGlvbiAwIHJlc2VydmVkIGZvciBiYXNlIHNjaGVtYVxuICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBzY2hlbWFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNjaGVtYSA9IHNjaGVtYXNbaV07XG4gICAgICAgIHNlbGVjdG9yID0gT2JqZWN0LmtleXMoc2NoZW1hLnNlbGVjdG9yKVswXTtcblxuICAgICAgICAvLyBXZSB3aWxsIHNldCB0aGlzIHRvIHVuZGVmaW5lZCBiZWNhdXNlIGluIHRoZW9yeSB5b3UgbWlnaHQgd2FudCB0byBzZWxlY3RcbiAgICAgICAgLy8gb24gYSBudWxsIHZhbHVlLlxuICAgICAgICB0YXJnZXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIC8vIGhlcmUgd2UgYXJlIGxvb2tpbmcgZm9yIHNlbGVjdG9yIGluIGRpZmZlcmVudCBwbGFjZXNcbiAgICAgICAgLy8gJHNldCBzaG91bGQgaGF2ZSBtb3JlIHByaW9yaXR5IGhlcmVcbiAgICAgICAgaWYgKGRvYy4kc2V0ICYmIHR5cGVvZiBkb2MuJHNldFtzZWxlY3Rvcl0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgdGFyZ2V0ID0gZG9jLiRzZXRbc2VsZWN0b3JdO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkb2Nbc2VsZWN0b3JdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHRhcmdldCA9IGRvY1tzZWxlY3Rvcl07XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnNlbGVjdG9yKSB7XG4gICAgICAgICAgdGFyZ2V0ID0gb3B0aW9ucy5zZWxlY3RvcltzZWxlY3Rvcl07XG4gICAgICAgIH0gZWxzZSBpZiAocXVlcnkgJiYgcXVlcnlbc2VsZWN0b3JdKSB7IC8vIG9uIHVwc2VydC91cGRhdGUgb3BlcmF0aW9uc1xuICAgICAgICAgIHRhcmdldCA9IHF1ZXJ5W3NlbGVjdG9yXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gY29tcGFyZSBnaXZlbiBzZWxlY3RvciB3aXRoIGRvYyBwcm9wZXJ0eSBvciBvcHRpb24gdG9cbiAgICAgICAgLy8gZmluZCByaWdodCBzY2hlbWFcbiAgICAgICAgaWYgKHRhcmdldCAhPT0gdW5kZWZpbmVkICYmIHRhcmdldCA9PT0gc2NoZW1hLnNlbGVjdG9yW3NlbGVjdG9yXSkge1xuICAgICAgICAgIHJldHVybiBzY2hlbWEuc2NoZW1hO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc2NoZW1hc1swXSkge1xuICAgICAgICByZXR1cm4gc2NoZW1hc1swXS5zY2hlbWE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBkZWZhdWx0IHNjaGVtYVwiKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcbn0pO1xuXG4vLyBXcmFwIERCIHdyaXRlIG9wZXJhdGlvbiBtZXRob2RzXG5bJ2luc2VydCcsICd1cGRhdGUnXS5mb3JFYWNoKChtZXRob2ROYW1lKSA9PiB7XG4gIGNvbnN0IF9zdXBlciA9IE1vbmdvLkNvbGxlY3Rpb24ucHJvdG90eXBlW21ldGhvZE5hbWVdO1xuICBNb25nby5Db2xsZWN0aW9uLnByb3RvdHlwZVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICBsZXQgb3B0aW9ucyA9IChtZXRob2ROYW1lID09PSBcImluc2VydFwiKSA/IGFyZ3NbMV0gOiBhcmdzWzJdO1xuXG4gICAgLy8gU3VwcG9ydCBtaXNzaW5nIG9wdGlvbnMgYXJnXG4gICAgaWYgKCFvcHRpb25zIHx8IHR5cGVvZiBvcHRpb25zID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fYzIgJiYgb3B0aW9ucy5ieXBhc3NDb2xsZWN0aW9uMiAhPT0gdHJ1ZSkge1xuICAgICAgbGV0IHVzZXJJZCA9IG51bGw7XG4gICAgICB0cnkgeyAvLyBodHRwczovL2dpdGh1Yi5jb20vYWxkZWVkL21ldGVvci1jb2xsZWN0aW9uMi9pc3N1ZXMvMTc1XG4gICAgICAgIHVzZXJJZCA9IE1ldGVvci51c2VySWQoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge31cblxuICAgICAgYXJncyA9IGRvVmFsaWRhdGUoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIG1ldGhvZE5hbWUsXG4gICAgICAgIGFyZ3MsXG4gICAgICAgIE1ldGVvci5pc1NlcnZlciB8fCB0aGlzLl9jb25uZWN0aW9uID09PSBudWxsLCAvLyBnZXRBdXRvVmFsdWVzXG4gICAgICAgIHVzZXJJZCxcbiAgICAgICAgTWV0ZW9yLmlzU2VydmVyIC8vIGlzRnJvbVRydXN0ZWRDb2RlXG4gICAgICApO1xuICAgICAgaWYgKCFhcmdzKSB7XG4gICAgICAgIC8vIGRvVmFsaWRhdGUgYWxyZWFkeSBjYWxsZWQgdGhlIGNhbGxiYWNrIG9yIHRocmV3IHRoZSBlcnJvciBzbyB3ZSdyZSBkb25lLlxuICAgICAgICAvLyBCdXQgaW5zZXJ0IHNob3VsZCBhbHdheXMgcmV0dXJuIGFuIElEIHRvIG1hdGNoIGNvcmUgYmVoYXZpb3IuXG4gICAgICAgIHJldHVybiBtZXRob2ROYW1lID09PSBcImluc2VydFwiID8gdGhpcy5fbWFrZU5ld0lEKCkgOiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdlIHN0aWxsIG5lZWQgdG8gYWRqdXN0IGFyZ3MgYmVjYXVzZSBpbnNlcnQgZG9lcyBub3QgdGFrZSBvcHRpb25zXG4gICAgICBpZiAobWV0aG9kTmFtZSA9PT0gXCJpbnNlcnRcIiAmJiB0eXBlb2YgYXJnc1sxXSAhPT0gJ2Z1bmN0aW9uJykgYXJncy5zcGxpY2UoMSwgMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9zdXBlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfTtcbn0pO1xuXG4vKlxuICogUHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGRvVmFsaWRhdGUoY29sbGVjdGlvbiwgdHlwZSwgYXJncywgZ2V0QXV0b1ZhbHVlcywgdXNlcklkLCBpc0Zyb21UcnVzdGVkQ29kZSkge1xuICBsZXQgZG9jLCBjYWxsYmFjaywgZXJyb3IsIG9wdGlvbnMsIGlzVXBzZXJ0LCBzZWxlY3RvciwgbGFzdCwgaGFzQ2FsbGJhY2s7XG5cbiAgaWYgKCFhcmdzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcih0eXBlICsgXCIgcmVxdWlyZXMgYW4gYXJndW1lbnRcIik7XG4gIH1cblxuICAvLyBHYXRoZXIgYXJndW1lbnRzIGFuZCBjYWNoZSB0aGUgc2VsZWN0b3JcbiAgaWYgKHR5cGUgPT09IFwiaW5zZXJ0XCIpIHtcbiAgICBkb2MgPSBhcmdzWzBdO1xuICAgIG9wdGlvbnMgPSBhcmdzWzFdO1xuICAgIGNhbGxiYWNrID0gYXJnc1syXTtcblxuICAgIC8vIFRoZSByZWFsIGluc2VydCBkb2Vzbid0IHRha2Ugb3B0aW9uc1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBhcmdzID0gW2RvYywgb3B0aW9uc107XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgYXJncyA9IFtkb2MsIGNhbGxiYWNrXTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXJncyA9IFtkb2NdO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlID09PSBcInVwZGF0ZVwiKSB7XG4gICAgc2VsZWN0b3IgPSBhcmdzWzBdO1xuICAgIGRvYyA9IGFyZ3NbMV07XG4gICAgb3B0aW9ucyA9IGFyZ3NbMl07XG4gICAgY2FsbGJhY2sgPSBhcmdzWzNdO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgdHlwZSBhcmd1bWVudFwiKTtcbiAgfVxuXG4gIGNvbnN0IHZhbGlkYXRlZE9iamVjdFdhc0luaXRpYWxseUVtcHR5ID0gaXNFbXB0eShkb2MpO1xuXG4gIC8vIFN1cHBvcnQgbWlzc2luZyBvcHRpb25zIGFyZ1xuICBpZiAoIWNhbGxiYWNrICYmIHR5cGVvZiBvcHRpb25zID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgb3B0aW9ucyA9IHt9O1xuICB9XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIGxhc3QgPSBhcmdzLmxlbmd0aCAtIDE7XG5cbiAgaGFzQ2FsbGJhY2sgPSAodHlwZW9mIGFyZ3NbbGFzdF0gPT09ICdmdW5jdGlvbicpO1xuXG4gIC8vIElmIHVwZGF0ZSB3YXMgY2FsbGVkIHdpdGggdXBzZXJ0OnRydWUsIGZsYWcgYXMgYW4gdXBzZXJ0XG4gIGlzVXBzZXJ0ID0gKHR5cGUgPT09IFwidXBkYXRlXCIgJiYgb3B0aW9ucy51cHNlcnQgPT09IHRydWUpO1xuXG4gIC8vIHdlIG5lZWQgdG8gcGFzcyBgZG9jYCBhbmQgYG9wdGlvbnNgIHRvIGBzaW1wbGVTY2hlbWFgIG1ldGhvZCwgdGhhdCdzIHdoeVxuICAvLyBzY2hlbWEgZGVjbGFyYXRpb24gbW92ZWQgaGVyZVxuICBsZXQgc2NoZW1hID0gY29sbGVjdGlvbi5zaW1wbGVTY2hlbWEoZG9jLCBvcHRpb25zLCBzZWxlY3Rvcik7XG4gIGNvbnN0IGlzTG9jYWxDb2xsZWN0aW9uID0gKGNvbGxlY3Rpb24uX2Nvbm5lY3Rpb24gPT09IG51bGwpO1xuXG4gIC8vIE9uIHRoZSBzZXJ2ZXIgYW5kIGZvciBsb2NhbCBjb2xsZWN0aW9ucywgd2UgYWxsb3cgcGFzc2luZyBgZ2V0QXV0b1ZhbHVlczogZmFsc2VgIHRvIGRpc2FibGUgYXV0b1ZhbHVlIGZ1bmN0aW9uc1xuICBpZiAoKE1ldGVvci5pc1NlcnZlciB8fCBpc0xvY2FsQ29sbGVjdGlvbikgJiYgb3B0aW9ucy5nZXRBdXRvVmFsdWVzID09PSBmYWxzZSkge1xuICAgIGdldEF1dG9WYWx1ZXMgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIFByb2Nlc3MgcGljay9vbWl0IG9wdGlvbnMgaWYgdGhleSBhcmUgcHJlc2VudFxuICBjb25zdCBwaWNrcyA9IEFycmF5LmlzQXJyYXkob3B0aW9ucy5waWNrKSA/IG9wdGlvbnMucGljayA6IG51bGw7XG4gIGNvbnN0IG9taXRzID0gQXJyYXkuaXNBcnJheShvcHRpb25zLm9taXQpID8gb3B0aW9ucy5vbWl0IDogbnVsbDtcblxuICBpZiAocGlja3MgJiYgb21pdHMpIHtcbiAgICAvLyBQaWNrIGFuZCBvbWl0IGNhbm5vdCBib3RoIGJlIHByZXNlbnQgaW4gdGhlIG9wdGlvbnNcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3BpY2sgYW5kIG9taXQgb3B0aW9ucyBhcmUgbXV0dWFsbHkgZXhjbHVzaXZlJyk7XG4gIH0gZWxzZSBpZiAocGlja3MpIHtcbiAgICBzY2hlbWEgPSBzY2hlbWEucGljayguLi5waWNrcyk7XG4gIH0gZWxzZSBpZiAob21pdHMpIHtcbiAgICBzY2hlbWEgPSBzY2hlbWEub21pdCguLi5vbWl0cyk7XG4gIH1cblxuICAvLyBEZXRlcm1pbmUgdmFsaWRhdGlvbiBjb250ZXh0XG4gIGxldCB2YWxpZGF0aW9uQ29udGV4dCA9IG9wdGlvbnMudmFsaWRhdGlvbkNvbnRleHQ7XG4gIGlmICh2YWxpZGF0aW9uQ29udGV4dCkge1xuICAgIGlmICh0eXBlb2YgdmFsaWRhdGlvbkNvbnRleHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB2YWxpZGF0aW9uQ29udGV4dCA9IHNjaGVtYS5uYW1lZENvbnRleHQodmFsaWRhdGlvbkNvbnRleHQpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YWxpZGF0aW9uQ29udGV4dCA9IHNjaGVtYS5uYW1lZENvbnRleHQoKTtcbiAgfVxuXG4gIC8vIEFkZCBhIGRlZmF1bHQgY2FsbGJhY2sgZnVuY3Rpb24gaWYgd2UncmUgb24gdGhlIGNsaWVudCBhbmQgbm8gY2FsbGJhY2sgd2FzIGdpdmVuXG4gIGlmIChNZXRlb3IuaXNDbGllbnQgJiYgIWNhbGxiYWNrKSB7XG4gICAgLy8gQ2xpZW50IGNhbid0IGJsb2NrLCBzbyBpdCBjYW4ndCByZXBvcnQgZXJyb3JzIGJ5IGV4Y2VwdGlvbixcbiAgICAvLyBvbmx5IGJ5IGNhbGxiYWNrLiBJZiB0aGV5IGZvcmdldCB0aGUgY2FsbGJhY2ssIGdpdmUgdGhlbSBhXG4gICAgLy8gZGVmYXVsdCBvbmUgdGhhdCBsb2dzIHRoZSBlcnJvciwgc28gdGhleSBhcmVuJ3QgdG90YWxseVxuICAgIC8vIGJhZmZsZWQgaWYgdGhlaXIgd3JpdGVzIGRvbid0IHdvcmsgYmVjYXVzZSB0aGVpciBkYXRhYmFzZSBpc1xuICAgIC8vIGRvd24uXG4gICAgY2FsbGJhY2sgPSBmdW5jdGlvbihlcnIpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgTWV0ZW9yLl9kZWJ1Zyh0eXBlICsgXCIgZmFpbGVkOiBcIiArIChlcnIucmVhc29uIHx8IGVyci5zdGFjaykpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBJZiBjbGllbnQgdmFsaWRhdGlvbiBpcyBmaW5lIG9yIGlzIHNraXBwZWQgYnV0IHRoZW4gc29tZXRoaW5nXG4gIC8vIGlzIGZvdW5kIHRvIGJlIGludmFsaWQgb24gdGhlIHNlcnZlciwgd2UgZ2V0IHRoYXQgZXJyb3IgYmFja1xuICAvLyBhcyBhIHNwZWNpYWwgTWV0ZW9yLkVycm9yIHRoYXQgd2UgbmVlZCB0byBwYXJzZS5cbiAgaWYgKE1ldGVvci5pc0NsaWVudCAmJiBoYXNDYWxsYmFjaykge1xuICAgIGNhbGxiYWNrID0gYXJnc1tsYXN0XSA9IHdyYXBDYWxsYmFja0ZvclBhcnNpbmdTZXJ2ZXJFcnJvcnModmFsaWRhdGlvbkNvbnRleHQsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIGNvbnN0IHNjaGVtYUFsbG93c0lkID0gc2NoZW1hLmFsbG93c0tleShcIl9pZFwiKTtcbiAgaWYgKHR5cGUgPT09IFwiaW5zZXJ0XCIgJiYgIWRvYy5faWQgJiYgc2NoZW1hQWxsb3dzSWQpIHtcbiAgICBkb2MuX2lkID0gY29sbGVjdGlvbi5fbWFrZU5ld0lEKCk7XG4gIH1cblxuICAvLyBHZXQgdGhlIGRvY0lkIGZvciBwYXNzaW5nIGluIHRoZSBhdXRvVmFsdWUvY3VzdG9tIGNvbnRleHRcbiAgbGV0IGRvY0lkO1xuICBpZiAodHlwZSA9PT0gJ2luc2VydCcpIHtcbiAgICBkb2NJZCA9IGRvYy5faWQ7IC8vIG1pZ2h0IGJlIHVuZGVmaW5lZFxuICB9IGVsc2UgaWYgKHR5cGUgPT09IFwidXBkYXRlXCIgJiYgc2VsZWN0b3IpIHtcbiAgICBkb2NJZCA9IHR5cGVvZiBzZWxlY3RvciA9PT0gJ3N0cmluZycgfHwgc2VsZWN0b3IgaW5zdGFuY2VvZiBNb25nby5PYmplY3RJRCA/IHNlbGVjdG9yIDogc2VsZWN0b3IuX2lkO1xuICB9XG5cbiAgLy8gSWYgX2lkIGhhcyBhbHJlYWR5IGJlZW4gYWRkZWQsIHJlbW92ZSBpdCB0ZW1wb3JhcmlseSBpZiBpdCdzXG4gIC8vIG5vdCBleHBsaWNpdGx5IGRlZmluZWQgaW4gdGhlIHNjaGVtYS5cbiAgbGV0IGNhY2hlZElkO1xuICBpZiAoZG9jLl9pZCAmJiAhc2NoZW1hQWxsb3dzSWQpIHtcbiAgICBjYWNoZWRJZCA9IGRvYy5faWQ7XG4gICAgZGVsZXRlIGRvYy5faWQ7XG4gIH1cblxuICBjb25zdCBhdXRvVmFsdWVDb250ZXh0ID0ge1xuICAgIGlzSW5zZXJ0OiAodHlwZSA9PT0gXCJpbnNlcnRcIiksXG4gICAgaXNVcGRhdGU6ICh0eXBlID09PSBcInVwZGF0ZVwiICYmIG9wdGlvbnMudXBzZXJ0ICE9PSB0cnVlKSxcbiAgICBpc1Vwc2VydCxcbiAgICB1c2VySWQsXG4gICAgaXNGcm9tVHJ1c3RlZENvZGUsXG4gICAgZG9jSWQsXG4gICAgaXNMb2NhbENvbGxlY3Rpb25cbiAgfTtcblxuICBjb25zdCBleHRlbmRBdXRvVmFsdWVDb250ZXh0ID0ge1xuICAgIC4uLigoc2NoZW1hLl9jbGVhbk9wdGlvbnMgfHwge30pLmV4dGVuZEF1dG9WYWx1ZUNvbnRleHQgfHwge30pLFxuICAgIC4uLmF1dG9WYWx1ZUNvbnRleHQsXG4gICAgLi4ub3B0aW9ucy5leHRlbmRBdXRvVmFsdWVDb250ZXh0LFxuICB9O1xuXG4gIGNvbnN0IGNsZWFuT3B0aW9uc0ZvclRoaXNPcGVyYXRpb24gPSB7fTtcbiAgW1wiYXV0b0NvbnZlcnRcIiwgXCJmaWx0ZXJcIiwgXCJyZW1vdmVFbXB0eVN0cmluZ3NcIiwgXCJyZW1vdmVOdWxsc0Zyb21BcnJheXNcIiwgXCJ0cmltU3RyaW5nc1wiXS5mb3JFYWNoKHByb3AgPT4ge1xuICAgIGlmICh0eXBlb2Ygb3B0aW9uc1twcm9wXSA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgIGNsZWFuT3B0aW9uc0ZvclRoaXNPcGVyYXRpb25bcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gUHJlbGltaW5hcnkgY2xlYW5pbmcgb24gYm90aCBjbGllbnQgYW5kIHNlcnZlci4gT24gdGhlIHNlcnZlciBhbmQgZm9yIGxvY2FsXG4gIC8vIGNvbGxlY3Rpb25zLCBhdXRvbWF0aWMgdmFsdWVzIHdpbGwgYWxzbyBiZSBzZXQgYXQgdGhpcyBwb2ludC5cbiAgc2NoZW1hLmNsZWFuKGRvYywge1xuICAgIG11dGF0ZTogdHJ1ZSwgLy8gQ2xlYW4gdGhlIGRvYy9tb2RpZmllciBpbiBwbGFjZVxuICAgIGlzTW9kaWZpZXI6ICh0eXBlICE9PSBcImluc2VydFwiKSxcbiAgICAvLyBTdGFydCB3aXRoIHNvbWUgQ29sbGVjdGlvbjIgZGVmYXVsdHMsIHdoaWNoIHdpbGwgdXN1YWxseSBiZSBvdmVyd3JpdHRlblxuICAgIC4uLkNvbGxlY3Rpb24yLmNsZWFuT3B0aW9ucyxcbiAgICAvLyBUaGUgZXh0ZW5kIHdpdGggdGhlIHNjaGVtYS1sZXZlbCBkZWZhdWx0cyAoZnJvbSBTaW1wbGVTY2hlbWEgY29uc3RydWN0b3Igb3B0aW9ucylcbiAgICAuLi4oc2NoZW1hLl9jbGVhbk9wdGlvbnMgfHwge30pLFxuICAgIC8vIEZpbmFsbHksIG9wdGlvbnMgZm9yIHRoaXMgc3BlY2lmaWMgb3BlcmF0aW9uIHNob3VsZCB0YWtlIHByZWNlZGVuY2VcbiAgICAuLi5jbGVhbk9wdGlvbnNGb3JUaGlzT3BlcmF0aW9uLFxuICAgIGV4dGVuZEF1dG9WYWx1ZUNvbnRleHQsIC8vIFRoaXMgd2FzIGV4dGVuZGVkIHNlcGFyYXRlbHkgYWJvdmVcbiAgICBnZXRBdXRvVmFsdWVzLCAvLyBGb3JjZSB0aGlzIG92ZXJyaWRlXG4gIH0pO1xuXG4gIC8vIFdlIGNsb25lIGJlZm9yZSB2YWxpZGF0aW5nIGJlY2F1c2UgaW4gc29tZSBjYXNlcyB3ZSBuZWVkIHRvIGFkanVzdCB0aGVcbiAgLy8gb2JqZWN0IGEgYml0IGJlZm9yZSB2YWxpZGF0aW5nIGl0LiBJZiB3ZSBhZGp1c3RlZCBgZG9jYCBpdHNlbGYsIG91clxuICAvLyBjaGFuZ2VzIHdvdWxkIHBlcnNpc3QgaW50byB0aGUgZGF0YWJhc2UuXG4gIGxldCBkb2NUb1ZhbGlkYXRlID0ge307XG4gIGZvciAodmFyIHByb3AgaW4gZG9jKSB7XG4gICAgLy8gV2Ugb21pdCBwcm90b3R5cGUgcHJvcGVydGllcyB3aGVuIGNsb25pbmcgYmVjYXVzZSB0aGV5IHdpbGwgbm90IGJlIHZhbGlkXG4gICAgLy8gYW5kIG1vbmdvIG9taXRzIHRoZW0gd2hlbiBzYXZpbmcgdG8gdGhlIGRhdGFiYXNlIGFueXdheS5cbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRvYywgcHJvcCkpIHtcbiAgICAgIGRvY1RvVmFsaWRhdGVbcHJvcF0gPSBkb2NbcHJvcF07XG4gICAgfVxuICB9XG5cbiAgLy8gT24gdGhlIHNlcnZlciwgdXBzZXJ0cyBhcmUgcG9zc2libGU7IFNpbXBsZVNjaGVtYSBoYW5kbGVzIHVwc2VydHMgcHJldHR5XG4gIC8vIHdlbGwgYnkgZGVmYXVsdCwgYnV0IGl0IHdpbGwgbm90IGtub3cgYWJvdXQgdGhlIGZpZWxkcyBpbiB0aGUgc2VsZWN0b3IsXG4gIC8vIHdoaWNoIGFyZSBhbHNvIHN0b3JlZCBpbiB0aGUgZGF0YWJhc2UgaWYgYW4gaW5zZXJ0IGlzIHBlcmZvcm1lZC4gU28gd2VcbiAgLy8gd2lsbCBhbGxvdyB0aGVzZSBmaWVsZHMgdG8gYmUgY29uc2lkZXJlZCBmb3IgdmFsaWRhdGlvbiBieSBhZGRpbmcgdGhlbVxuICAvLyB0byB0aGUgJHNldCBpbiB0aGUgbW9kaWZpZXIsIHdoaWxlIHN0cmlwcGluZyBvdXQgcXVlcnkgc2VsZWN0b3JzIGFzIHRoZXNlXG4gIC8vIGRvbid0IG1ha2UgaXQgaW50byB0aGUgdXBzZXJ0ZWQgZG9jdW1lbnQgYW5kIGJyZWFrIHZhbGlkYXRpb24uXG4gIC8vIFRoaXMgaXMgbm8gZG91YnQgcHJvbmUgdG8gZXJyb3JzLCBidXQgdGhlcmUgcHJvYmFibHkgaXNuJ3QgYW55IGJldHRlciB3YXlcbiAgLy8gcmlnaHQgbm93LlxuICBpZiAoTWV0ZW9yLmlzU2VydmVyICYmIGlzVXBzZXJ0ICYmIGlzT2JqZWN0KHNlbGVjdG9yKSkge1xuICAgIGNvbnN0IHNldCA9IGRvY1RvVmFsaWRhdGUuJHNldCB8fCB7fTtcbiAgICBkb2NUb1ZhbGlkYXRlLiRzZXQgPSBmbGF0dGVuU2VsZWN0b3Ioc2VsZWN0b3IpO1xuXG4gICAgaWYgKCFzY2hlbWFBbGxvd3NJZCkgZGVsZXRlIGRvY1RvVmFsaWRhdGUuJHNldC5faWQ7XG4gICAgT2JqZWN0LmFzc2lnbihkb2NUb1ZhbGlkYXRlLiRzZXQsIHNldCk7XG4gIH1cbiAgLy8gU2V0IGF1dG9tYXRpYyB2YWx1ZXMgZm9yIHZhbGlkYXRpb24gb24gdGhlIGNsaWVudC5cbiAgLy8gT24gdGhlIHNlcnZlciwgd2UgYWxyZWFkeSB1cGRhdGVkIGRvYyB3aXRoIGF1dG8gdmFsdWVzLCBidXQgb24gdGhlIGNsaWVudCxcbiAgLy8gd2Ugd2lsbCBhZGQgdGhlbSB0byBkb2NUb1ZhbGlkYXRlIGZvciB2YWxpZGF0aW9uIHB1cnBvc2VzIG9ubHkuXG4gIC8vIFRoaXMgaXMgYmVjYXVzZSB3ZSB3YW50IGFsbCBhY3R1YWwgdmFsdWVzIGdlbmVyYXRlZCBvbiB0aGUgc2VydmVyLlxuICBpZiAoTWV0ZW9yLmlzQ2xpZW50ICYmICFpc0xvY2FsQ29sbGVjdGlvbikge1xuICAgIHNjaGVtYS5jbGVhbihkb2NUb1ZhbGlkYXRlLCB7XG4gICAgICBhdXRvQ29udmVydDogZmFsc2UsXG4gICAgICBleHRlbmRBdXRvVmFsdWVDb250ZXh0LFxuICAgICAgZmlsdGVyOiBmYWxzZSxcbiAgICAgIGdldEF1dG9WYWx1ZXM6IHRydWUsXG4gICAgICBpc01vZGlmaWVyOiAodHlwZSAhPT0gXCJpbnNlcnRcIiksXG4gICAgICBtdXRhdGU6IHRydWUsIC8vIENsZWFuIHRoZSBkb2MvbW9kaWZpZXIgaW4gcGxhY2VcbiAgICAgIHJlbW92ZUVtcHR5U3RyaW5nczogZmFsc2UsXG4gICAgICByZW1vdmVOdWxsc0Zyb21BcnJheXM6IGZhbHNlLFxuICAgICAgdHJpbVN0cmluZ3M6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gWFhYIE1heWJlIG1vdmUgdGhpcyBpbnRvIFNpbXBsZVNjaGVtYVxuICBpZiAoIXZhbGlkYXRlZE9iamVjdFdhc0luaXRpYWxseUVtcHR5ICYmIGlzRW1wdHkoZG9jVG9WYWxpZGF0ZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FmdGVyIGZpbHRlcmluZyBvdXQga2V5cyBub3QgaW4gdGhlIHNjaGVtYSwgeW91ciAnICtcbiAgICAgICh0eXBlID09PSAndXBkYXRlJyA/ICdtb2RpZmllcicgOiAnb2JqZWN0JykgK1xuICAgICAgJyBpcyBub3cgZW1wdHknKTtcbiAgfVxuXG4gIC8vIFZhbGlkYXRlIGRvY1xuICBsZXQgaXNWYWxpZDtcbiAgaWYgKG9wdGlvbnMudmFsaWRhdGUgPT09IGZhbHNlKSB7XG4gICAgaXNWYWxpZCA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgaXNWYWxpZCA9IHZhbGlkYXRpb25Db250ZXh0LnZhbGlkYXRlKGRvY1RvVmFsaWRhdGUsIHtcbiAgICAgIG1vZGlmaWVyOiAodHlwZSA9PT0gXCJ1cGRhdGVcIiB8fCB0eXBlID09PSBcInVwc2VydFwiKSxcbiAgICAgIHVwc2VydDogaXNVcHNlcnQsXG4gICAgICBleHRlbmRlZEN1c3RvbUNvbnRleHQ6IHtcbiAgICAgICAgaXNJbnNlcnQ6ICh0eXBlID09PSBcImluc2VydFwiKSxcbiAgICAgICAgaXNVcGRhdGU6ICh0eXBlID09PSBcInVwZGF0ZVwiICYmIG9wdGlvbnMudXBzZXJ0ICE9PSB0cnVlKSxcbiAgICAgICAgaXNVcHNlcnQsXG4gICAgICAgIHVzZXJJZCxcbiAgICAgICAgaXNGcm9tVHJ1c3RlZENvZGUsXG4gICAgICAgIGRvY0lkLFxuICAgICAgICBpc0xvY2FsQ29sbGVjdGlvbixcbiAgICAgICAgLi4uKG9wdGlvbnMuZXh0ZW5kZWRDdXN0b21Db250ZXh0IHx8IHt9KSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBpZiAoaXNWYWxpZCkge1xuICAgIC8vIEFkZCB0aGUgSUQgYmFja1xuICAgIGlmIChjYWNoZWRJZCkge1xuICAgICAgZG9jLl9pZCA9IGNhY2hlZElkO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSB0aGUgYXJncyB0byByZWZsZWN0IHRoZSBjbGVhbmVkIGRvY1xuICAgIC8vIFhYWCBub3Qgc3VyZSB0aGlzIGlzIG5lY2Vzc2FyeSBzaW5jZSB3ZSBtdXRhdGVcbiAgICBpZiAodHlwZSA9PT0gXCJpbnNlcnRcIikge1xuICAgICAgYXJnc1swXSA9IGRvYztcbiAgICB9IGVsc2Uge1xuICAgICAgYXJnc1sxXSA9IGRvYztcbiAgICB9XG5cbiAgICAvLyBJZiBjYWxsYmFjaywgc2V0IGludmFsaWRLZXkgd2hlbiB3ZSBnZXQgYSBtb25nbyB1bmlxdWUgZXJyb3JcbiAgICBpZiAoTWV0ZW9yLmlzU2VydmVyICYmIGhhc0NhbGxiYWNrKSB7XG4gICAgICBhcmdzW2xhc3RdID0gd3JhcENhbGxiYWNrRm9yUGFyc2luZ01vbmdvVmFsaWRhdGlvbkVycm9ycyh2YWxpZGF0aW9uQ29udGV4dCwgYXJnc1tsYXN0XSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFyZ3M7XG4gIH0gZWxzZSB7XG4gICAgZXJyb3IgPSBnZXRFcnJvck9iamVjdCh2YWxpZGF0aW9uQ29udGV4dCwgTWV0ZW9yLnNldHRpbmdzPy5wYWNrYWdlcz8uY29sbGVjdGlvbjI/LmRpc2FibGVDb2xsZWN0aW9uTmFtZXNJblZhbGlkYXRpb24gPyAnJyA6IGBpbiAke2NvbGxlY3Rpb24uX25hbWV9ICR7dHlwZX1gKTtcbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIC8vIGluc2VydC91cGRhdGUvdXBzZXJ0IHBhc3MgYGZhbHNlYCB3aGVuIHRoZXJlJ3MgYW4gZXJyb3IsIHNvIHdlIGRvIHRoYXRcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRFcnJvck9iamVjdChjb250ZXh0LCBhcHBlbmRUb01lc3NhZ2UgPSAnJykge1xuICBsZXQgbWVzc2FnZTtcbiAgY29uc3QgaW52YWxpZEtleXMgPSAodHlwZW9mIGNvbnRleHQudmFsaWRhdGlvbkVycm9ycyA9PT0gJ2Z1bmN0aW9uJykgPyBjb250ZXh0LnZhbGlkYXRpb25FcnJvcnMoKSA6IGNvbnRleHQuaW52YWxpZEtleXMoKTtcbiAgaWYgKGludmFsaWRLZXlzLmxlbmd0aCkge1xuICAgIGNvbnN0IGZpcnN0RXJyb3JLZXkgPSBpbnZhbGlkS2V5c1swXS5uYW1lO1xuICAgIGNvbnN0IGZpcnN0RXJyb3JNZXNzYWdlID0gY29udGV4dC5rZXlFcnJvck1lc3NhZ2UoZmlyc3RFcnJvcktleSk7XG5cbiAgICAvLyBJZiB0aGUgZXJyb3IgaXMgaW4gYSBuZXN0ZWQga2V5LCBhZGQgdGhlIGZ1bGwga2V5IHRvIHRoZSBlcnJvciBtZXNzYWdlXG4gICAgLy8gdG8gYmUgbW9yZSBoZWxwZnVsLlxuICAgIGlmIChmaXJzdEVycm9yS2V5LmluZGV4T2YoJy4nKSA9PT0gLTEpIHtcbiAgICAgIG1lc3NhZ2UgPSBmaXJzdEVycm9yTWVzc2FnZTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWVzc2FnZSA9IGAke2ZpcnN0RXJyb3JNZXNzYWdlfSAoJHtmaXJzdEVycm9yS2V5fSlgO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBtZXNzYWdlID0gXCJGYWlsZWQgdmFsaWRhdGlvblwiO1xuICB9XG4gIG1lc3NhZ2UgPSBgJHttZXNzYWdlfSAke2FwcGVuZFRvTWVzc2FnZX1gLnRyaW0oKTtcbiAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gIGVycm9yLmludmFsaWRLZXlzID0gaW52YWxpZEtleXM7XG4gIGVycm9yLnZhbGlkYXRpb25Db250ZXh0ID0gY29udGV4dDtcbiAgLy8gSWYgb24gdGhlIHNlcnZlciwgd2UgYWRkIGEgc2FuaXRpemVkIGVycm9yLCB0b28sIGluIGNhc2Ugd2UncmVcbiAgLy8gY2FsbGVkIGZyb20gYSBtZXRob2QuXG4gIGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgICBlcnJvci5zYW5pdGl6ZWRFcnJvciA9IG5ldyBNZXRlb3IuRXJyb3IoNDAwLCBtZXNzYWdlLCBFSlNPTi5zdHJpbmdpZnkoZXJyb3IuaW52YWxpZEtleXMpKTtcbiAgfVxuICByZXR1cm4gZXJyb3I7XG59XG5cbmZ1bmN0aW9uIGFkZFVuaXF1ZUVycm9yKGNvbnRleHQsIGVycm9yTWVzc2FnZSkge1xuICBjb25zdCBuYW1lID0gZXJyb3JNZXNzYWdlLnNwbGl0KCdjMl8nKVsxXS5zcGxpdCgnICcpWzBdO1xuICBjb25zdCB2YWwgPSBlcnJvck1lc3NhZ2Uuc3BsaXQoJ2R1cCBrZXk6JylbMV0uc3BsaXQoJ1wiJylbMV07XG5cbiAgY29uc3QgYWRkVmFsaWRhdGlvbkVycm9yc1Byb3BOYW1lID0gKHR5cGVvZiBjb250ZXh0LmFkZFZhbGlkYXRpb25FcnJvcnMgPT09ICdmdW5jdGlvbicpID8gJ2FkZFZhbGlkYXRpb25FcnJvcnMnIDogJ2FkZEludmFsaWRLZXlzJztcbiAgY29udGV4dFthZGRWYWxpZGF0aW9uRXJyb3JzUHJvcE5hbWVdKFt7XG4gICAgbmFtZTogbmFtZSxcbiAgICB0eXBlOiAnbm90VW5pcXVlJyxcbiAgICB2YWx1ZTogdmFsXG4gIH1dKTtcbn1cblxuZnVuY3Rpb24gd3JhcENhbGxiYWNrRm9yUGFyc2luZ01vbmdvVmFsaWRhdGlvbkVycm9ycyh2YWxpZGF0aW9uQ29udGV4dCwgY2IpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBwZWRDYWxsYmFja0ZvclBhcnNpbmdNb25nb1ZhbGlkYXRpb25FcnJvcnMoLi4uYXJncykge1xuICAgIGNvbnN0IGVycm9yID0gYXJnc1swXTtcbiAgICBpZiAoZXJyb3IgJiZcbiAgICAgICAgKChlcnJvci5uYW1lID09PSBcIk1vbmdvRXJyb3JcIiAmJiBlcnJvci5jb2RlID09PSAxMTAwMSkgfHwgZXJyb3IubWVzc2FnZS5pbmRleE9mKCdNb25nb0Vycm9yOiBFMTEwMDAnKSAhPT0gLTEpICYmXG4gICAgICAgIGVycm9yLm1lc3NhZ2UuaW5kZXhPZignYzJfJykgIT09IC0xKSB7XG4gICAgICBhZGRVbmlxdWVFcnJvcih2YWxpZGF0aW9uQ29udGV4dCwgZXJyb3IubWVzc2FnZSk7XG4gICAgICBhcmdzWzBdID0gZ2V0RXJyb3JPYmplY3QodmFsaWRhdGlvbkNvbnRleHQpO1xuICAgIH1cbiAgICByZXR1cm4gY2IuYXBwbHkodGhpcywgYXJncyk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHdyYXBDYWxsYmFja0ZvclBhcnNpbmdTZXJ2ZXJFcnJvcnModmFsaWRhdGlvbkNvbnRleHQsIGNiKSB7XG4gIGNvbnN0IGFkZFZhbGlkYXRpb25FcnJvcnNQcm9wTmFtZSA9ICh0eXBlb2YgdmFsaWRhdGlvbkNvbnRleHQuYWRkVmFsaWRhdGlvbkVycm9ycyA9PT0gJ2Z1bmN0aW9uJykgPyAnYWRkVmFsaWRhdGlvbkVycm9ycycgOiAnYWRkSW52YWxpZEtleXMnO1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcHBlZENhbGxiYWNrRm9yUGFyc2luZ1NlcnZlckVycm9ycyguLi5hcmdzKSB7XG4gICAgY29uc3QgZXJyb3IgPSBhcmdzWzBdO1xuICAgIC8vIEhhbmRsZSBvdXIgb3duIHZhbGlkYXRpb24gZXJyb3JzXG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgTWV0ZW9yLkVycm9yICYmXG4gICAgICAgIGVycm9yLmVycm9yID09PSA0MDAgJiZcbiAgICAgICAgZXJyb3IucmVhc29uID09PSBcIklOVkFMSURcIiAmJlxuICAgICAgICB0eXBlb2YgZXJyb3IuZGV0YWlscyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uc3QgaW52YWxpZEtleXNGcm9tU2VydmVyID0gRUpTT04ucGFyc2UoZXJyb3IuZGV0YWlscyk7XG4gICAgICB2YWxpZGF0aW9uQ29udGV4dFthZGRWYWxpZGF0aW9uRXJyb3JzUHJvcE5hbWVdKGludmFsaWRLZXlzRnJvbVNlcnZlcik7XG4gICAgICBhcmdzWzBdID0gZ2V0RXJyb3JPYmplY3QodmFsaWRhdGlvbkNvbnRleHQpO1xuICAgIH1cbiAgICAvLyBIYW5kbGUgTW9uZ28gdW5pcXVlIGluZGV4IGVycm9ycywgd2hpY2ggYXJlIGZvcndhcmRlZCB0byB0aGUgY2xpZW50IGFzIDQwOSBlcnJvcnNcbiAgICBlbHNlIGlmIChlcnJvciBpbnN0YW5jZW9mIE1ldGVvci5FcnJvciAmJlxuICAgICAgICAgICAgIGVycm9yLmVycm9yID09PSA0MDkgJiZcbiAgICAgICAgICAgICBlcnJvci5yZWFzb24gJiZcbiAgICAgICAgICAgICBlcnJvci5yZWFzb24uaW5kZXhPZignRTExMDAwJykgIT09IC0xICYmXG4gICAgICAgICAgICAgZXJyb3IucmVhc29uLmluZGV4T2YoJ2MyXycpICE9PSAtMSkge1xuICAgICAgYWRkVW5pcXVlRXJyb3IodmFsaWRhdGlvbkNvbnRleHQsIGVycm9yLnJlYXNvbik7XG4gICAgICBhcmdzWzBdID0gZ2V0RXJyb3JPYmplY3QodmFsaWRhdGlvbkNvbnRleHQpO1xuICAgIH1cbiAgICByZXR1cm4gY2IuYXBwbHkodGhpcywgYXJncyk7XG4gIH07XG59XG5cbmxldCBhbHJlYWR5SW5zZWN1cmUgPSB7fTtcbmZ1bmN0aW9uIGtlZXBJbnNlY3VyZShjKSB7XG4gIC8vIElmIGluc2VjdXJlIHBhY2thZ2UgaXMgaW4gdXNlLCB3ZSBuZWVkIHRvIGFkZCBhbGxvdyBydWxlcyB0aGF0IHJldHVyblxuICAvLyB0cnVlLiBPdGhlcndpc2UsIGl0IHdvdWxkIHNlZW1pbmdseSB0dXJuIG9mZiBpbnNlY3VyZSBtb2RlLlxuICBpZiAoUGFja2FnZSAmJiBQYWNrYWdlLmluc2VjdXJlICYmICFhbHJlYWR5SW5zZWN1cmVbYy5fbmFtZV0pIHtcbiAgICBjLmFsbG93KHtcbiAgICAgIGluc2VydDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgICBmZXRjaDogW10sXG4gICAgICB0cmFuc2Zvcm06IG51bGxcbiAgICB9KTtcbiAgICBhbHJlYWR5SW5zZWN1cmVbYy5fbmFtZV0gPSB0cnVlO1xuICB9XG4gIC8vIElmIGluc2VjdXJlIHBhY2thZ2UgaXMgTk9UIGluIHVzZSwgdGhlbiBhZGRpbmcgdGhlIHR3byBkZW55IGZ1bmN0aW9uc1xuICAvLyBkb2VzIG5vdCBoYXZlIGFueSBlZmZlY3Qgb24gdGhlIG1haW4gYXBwJ3Mgc2VjdXJpdHkgcGFyYWRpZ20uIFRoZVxuICAvLyB1c2VyIHdpbGwgc3RpbGwgYmUgcmVxdWlyZWQgdG8gYWRkIGF0IGxlYXN0IG9uZSBhbGxvdyBmdW5jdGlvbiBvZiBoZXJcbiAgLy8gb3duIGZvciBlYWNoIG9wZXJhdGlvbiBmb3IgdGhpcyBjb2xsZWN0aW9uLiBBbmQgdGhlIHVzZXIgbWF5IHN0aWxsIGFkZFxuICAvLyBhZGRpdGlvbmFsIGRlbnkgZnVuY3Rpb25zLCBidXQgZG9lcyBub3QgaGF2ZSB0by5cbn1cblxubGV0IGFscmVhZHlEZWZpbmVkID0ge307XG5mdW5jdGlvbiBkZWZpbmVEZW55KGMsIG9wdGlvbnMpIHtcbiAgaWYgKCFhbHJlYWR5RGVmaW5lZFtjLl9uYW1lXSkge1xuXG4gICAgY29uc3QgaXNMb2NhbENvbGxlY3Rpb24gPSAoYy5fY29ubmVjdGlvbiA9PT0gbnVsbCk7XG5cbiAgICAvLyBGaXJzdCBkZWZpbmUgZGVueSBmdW5jdGlvbnMgdG8gZXh0ZW5kIGRvYyB3aXRoIHRoZSByZXN1bHRzIG9mIGNsZWFuXG4gICAgLy8gYW5kIGF1dG8tdmFsdWVzLiBUaGlzIG11c3QgYmUgZG9uZSB3aXRoIFwidHJhbnNmb3JtOiBudWxsXCIgb3Igd2Ugd291bGQgYmVcbiAgICAvLyBleHRlbmRpbmcgYSBjbG9uZSBvZiBkb2MgYW5kIHRoZXJlZm9yZSBoYXZlIG5vIGVmZmVjdC5cbiAgICBjLmRlbnkoe1xuICAgICAgaW5zZXJ0OiBmdW5jdGlvbih1c2VySWQsIGRvYykge1xuICAgICAgICAvLyBSZWZlcmVuY2VkIGRvYyBpcyBjbGVhbmVkIGluIHBsYWNlXG4gICAgICAgIGMuc2ltcGxlU2NoZW1hKGRvYykuY2xlYW4oZG9jLCB7XG4gICAgICAgICAgbXV0YXRlOiB0cnVlLFxuICAgICAgICAgIGlzTW9kaWZpZXI6IGZhbHNlLFxuICAgICAgICAgIC8vIFdlIGRvbid0IGRvIHRoZXNlIGhlcmUgYmVjYXVzZSB0aGV5IGFyZSBkb25lIG9uIHRoZSBjbGllbnQgaWYgZGVzaXJlZFxuICAgICAgICAgIGZpbHRlcjogZmFsc2UsXG4gICAgICAgICAgYXV0b0NvbnZlcnQ6IGZhbHNlLFxuICAgICAgICAgIHJlbW92ZUVtcHR5U3RyaW5nczogZmFsc2UsXG4gICAgICAgICAgdHJpbVN0cmluZ3M6IGZhbHNlLFxuICAgICAgICAgIGV4dGVuZEF1dG9WYWx1ZUNvbnRleHQ6IHtcbiAgICAgICAgICAgIGlzSW5zZXJ0OiB0cnVlLFxuICAgICAgICAgICAgaXNVcGRhdGU6IGZhbHNlLFxuICAgICAgICAgICAgaXNVcHNlcnQ6IGZhbHNlLFxuICAgICAgICAgICAgdXNlcklkOiB1c2VySWQsXG4gICAgICAgICAgICBpc0Zyb21UcnVzdGVkQ29kZTogZmFsc2UsXG4gICAgICAgICAgICBkb2NJZDogZG9jLl9pZCxcbiAgICAgICAgICAgIGlzTG9jYWxDb2xsZWN0aW9uOiBpc0xvY2FsQ29sbGVjdGlvblxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcbiAgICAgIHVwZGF0ZTogZnVuY3Rpb24odXNlcklkLCBkb2MsIGZpZWxkcywgbW9kaWZpZXIpIHtcbiAgICAgICAgLy8gUmVmZXJlbmNlZCBtb2RpZmllciBpcyBjbGVhbmVkIGluIHBsYWNlXG4gICAgICAgIGMuc2ltcGxlU2NoZW1hKG1vZGlmaWVyKS5jbGVhbihtb2RpZmllciwge1xuICAgICAgICAgIG11dGF0ZTogdHJ1ZSxcbiAgICAgICAgICBpc01vZGlmaWVyOiB0cnVlLFxuICAgICAgICAgIC8vIFdlIGRvbid0IGRvIHRoZXNlIGhlcmUgYmVjYXVzZSB0aGV5IGFyZSBkb25lIG9uIHRoZSBjbGllbnQgaWYgZGVzaXJlZFxuICAgICAgICAgIGZpbHRlcjogZmFsc2UsXG4gICAgICAgICAgYXV0b0NvbnZlcnQ6IGZhbHNlLFxuICAgICAgICAgIHJlbW92ZUVtcHR5U3RyaW5nczogZmFsc2UsXG4gICAgICAgICAgdHJpbVN0cmluZ3M6IGZhbHNlLFxuICAgICAgICAgIGV4dGVuZEF1dG9WYWx1ZUNvbnRleHQ6IHtcbiAgICAgICAgICAgIGlzSW5zZXJ0OiBmYWxzZSxcbiAgICAgICAgICAgIGlzVXBkYXRlOiB0cnVlLFxuICAgICAgICAgICAgaXNVcHNlcnQ6IGZhbHNlLFxuICAgICAgICAgICAgdXNlcklkOiB1c2VySWQsXG4gICAgICAgICAgICBpc0Zyb21UcnVzdGVkQ29kZTogZmFsc2UsXG4gICAgICAgICAgICBkb2NJZDogZG9jICYmIGRvYy5faWQsXG4gICAgICAgICAgICBpc0xvY2FsQ29sbGVjdGlvbjogaXNMb2NhbENvbGxlY3Rpb25cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG4gICAgICBmZXRjaDogWydfaWQnXSxcbiAgICAgIHRyYW5zZm9ybTogbnVsbFxuICAgIH0pO1xuXG4gICAgLy8gU2Vjb25kIGRlZmluZSBkZW55IGZ1bmN0aW9ucyB0byB2YWxpZGF0ZSBhZ2FpbiBvbiB0aGUgc2VydmVyXG4gICAgLy8gZm9yIGNsaWVudC1pbml0aWF0ZWQgaW5zZXJ0cyBhbmQgdXBkYXRlcy4gVGhlc2Ugc2hvdWxkIGJlXG4gICAgLy8gY2FsbGVkIGFmdGVyIHRoZSBjbGVhbi9hdXRvLXZhbHVlIGZ1bmN0aW9ucyBzaW5jZSB3ZSdyZSBhZGRpbmdcbiAgICAvLyB0aGVtIGFmdGVyLiBUaGVzZSBtdXN0ICpub3QqIGhhdmUgXCJ0cmFuc2Zvcm06IG51bGxcIiBpZiBvcHRpb25zLnRyYW5zZm9ybSBpcyB0cnVlIGJlY2F1c2VcbiAgICAvLyB3ZSBuZWVkIHRvIHBhc3MgdGhlIGRvYyB0aHJvdWdoIGFueSB0cmFuc2Zvcm1zIHRvIGJlIHN1cmVcbiAgICAvLyB0aGF0IGN1c3RvbSB0eXBlcyBhcmUgcHJvcGVybHkgcmVjb2duaXplZCBmb3IgdHlwZSB2YWxpZGF0aW9uLlxuICAgIGMuZGVueSh7XG4gICAgICBpbnNlcnQ6IGZ1bmN0aW9uKHVzZXJJZCwgZG9jKSB7XG4gICAgICAgIC8vIFdlIHBhc3MgdGhlIGZhbHNlIG9wdGlvbnMgYmVjYXVzZSB3ZSB3aWxsIGhhdmUgZG9uZSB0aGVtIG9uIGNsaWVudCBpZiBkZXNpcmVkXG4gICAgICAgIGRvVmFsaWRhdGUoXG4gICAgICAgICAgYyxcbiAgICAgICAgICBcImluc2VydFwiLFxuICAgICAgICAgIFtcbiAgICAgICAgICAgIGRvYyxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdHJpbVN0cmluZ3M6IGZhbHNlLFxuICAgICAgICAgICAgICByZW1vdmVFbXB0eVN0cmluZ3M6IGZhbHNlLFxuICAgICAgICAgICAgICBmaWx0ZXI6IGZhbHNlLFxuICAgICAgICAgICAgICBhdXRvQ29udmVydDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgJ0lOVkFMSUQnLCBFSlNPTi5zdHJpbmdpZnkoZXJyb3IuaW52YWxpZEtleXMpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF0sXG4gICAgICAgICAgZmFsc2UsIC8vIGdldEF1dG9WYWx1ZXNcbiAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgZmFsc2UgLy8gaXNGcm9tVHJ1c3RlZENvZGVcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuICAgICAgdXBkYXRlOiBmdW5jdGlvbih1c2VySWQsIGRvYywgZmllbGRzLCBtb2RpZmllcikge1xuICAgICAgICAvLyBOT1RFOiBUaGlzIHdpbGwgbmV2ZXIgYmUgYW4gdXBzZXJ0IGJlY2F1c2UgY2xpZW50LXNpZGUgdXBzZXJ0c1xuICAgICAgICAvLyBhcmUgbm90IGFsbG93ZWQgb25jZSB5b3UgZGVmaW5lIGFsbG93L2RlbnkgZnVuY3Rpb25zLlxuICAgICAgICAvLyBXZSBwYXNzIHRoZSBmYWxzZSBvcHRpb25zIGJlY2F1c2Ugd2Ugd2lsbCBoYXZlIGRvbmUgdGhlbSBvbiBjbGllbnQgaWYgZGVzaXJlZFxuICAgICAgICBkb1ZhbGlkYXRlKFxuICAgICAgICAgIGMsXG4gICAgICAgICAgXCJ1cGRhdGVcIixcbiAgICAgICAgICBbXG4gICAgICAgICAgICB7X2lkOiBkb2MgJiYgZG9jLl9pZH0sXG4gICAgICAgICAgICBtb2RpZmllcixcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdHJpbVN0cmluZ3M6IGZhbHNlLFxuICAgICAgICAgICAgICByZW1vdmVFbXB0eVN0cmluZ3M6IGZhbHNlLFxuICAgICAgICAgICAgICBmaWx0ZXI6IGZhbHNlLFxuICAgICAgICAgICAgICBhdXRvQ29udmVydDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgJ0lOVkFMSUQnLCBFSlNPTi5zdHJpbmdpZnkoZXJyb3IuaW52YWxpZEtleXMpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF0sXG4gICAgICAgICAgZmFsc2UsIC8vIGdldEF1dG9WYWx1ZXNcbiAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgZmFsc2UgLy8gaXNGcm9tVHJ1c3RlZENvZGVcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuICAgICAgZmV0Y2g6IFsnX2lkJ10sXG4gICAgICAuLi4ob3B0aW9ucy50cmFuc2Zvcm0gPT09IHRydWUgPyB7fSA6IHt0cmFuc2Zvcm06IG51bGx9KSxcbiAgICB9KTtcblxuICAgIC8vIG5vdGUgdGhhdCB3ZSd2ZSBhbHJlYWR5IGRvbmUgdGhpcyBjb2xsZWN0aW9uIHNvIHRoYXQgd2UgZG9uJ3QgZG8gaXQgYWdhaW5cbiAgICAvLyBpZiBhdHRhY2hTY2hlbWEgaXMgY2FsbGVkIGFnYWluXG4gICAgYWxyZWFkeURlZmluZWRbYy5fbmFtZV0gPSB0cnVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4dGVuZFNjaGVtYShzMSwgczIpIHtcbiAgaWYgKHMyLnZlcnNpb24gPj0gMikge1xuICAgIGNvbnN0IHNzID0gbmV3IFNpbXBsZVNjaGVtYShzMSk7XG4gICAgc3MuZXh0ZW5kKHMyKTtcbiAgICByZXR1cm4gc3M7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBTaW1wbGVTY2hlbWEoWyBzMSwgczIgXSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29sbGVjdGlvbjI7XG4iLCJleHBvcnQgZnVuY3Rpb24gZmxhdHRlblNlbGVjdG9yKHNlbGVjdG9yKSB7XG4gIC8vIElmIHNlbGVjdG9yIHVzZXMgJGFuZCBmb3JtYXQsIGNvbnZlcnQgdG8gcGxhaW4gb2JqZWN0IHNlbGVjdG9yXG4gIGlmIChBcnJheS5pc0FycmF5KHNlbGVjdG9yLiRhbmQpKSB7XG4gICAgc2VsZWN0b3IuJGFuZC5mb3JFYWNoKHNlbCA9PiB7XG4gICAgICBPYmplY3QuYXNzaWduKHNlbGVjdG9yLCBmbGF0dGVuU2VsZWN0b3Ioc2VsKSk7XG4gICAgfSk7XG5cbiAgICBkZWxldGUgc2VsZWN0b3IuJGFuZFxuICB9XG5cbiAgY29uc3Qgb2JqID0ge31cblxuICBPYmplY3QuZW50cmllcyhzZWxlY3RvcikuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgLy8gSWdub3JpbmcgbG9naWNhbCBzZWxlY3RvcnMgKGh0dHBzOi8vZG9jcy5tb25nb2RiLmNvbS9tYW51YWwvcmVmZXJlbmNlL29wZXJhdG9yL3F1ZXJ5LyNsb2dpY2FsKVxuICAgIGlmICgha2V5LnN0YXJ0c1dpdGgoXCIkXCIpKSB7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICBpZiAodmFsdWUuJGVxICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBvYmpba2V5XSA9IHZhbHVlLiRlcVxuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUuJGluKSAmJiB2YWx1ZS4kaW4ubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgb2JqW2tleV0gPSB2YWx1ZS4kaW5bMF1cbiAgICAgICAgfSBlbHNlIGlmIChPYmplY3Qua2V5cyh2YWx1ZSkuZXZlcnkodiA9PiAhKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiICYmIHYuc3RhcnRzV2l0aChcIiRcIikpKSkge1xuICAgICAgICAgIG9ialtrZXldID0gdmFsdWVcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2JqW2tleV0gPSB2YWx1ZVxuICAgICAgfVxuICAgIH1cbiAgfSlcbiAgXG4gIHJldHVybiBvYmpcbn1cbiJdfQ==
