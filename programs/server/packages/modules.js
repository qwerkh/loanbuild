(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package['modules-runtime'].meteorInstall;

var require = meteorInstall({"node_modules":{"meteor":{"modules":{"server.js":function module(require){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/modules/server.js                                                                       //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
require("./install-packages.js");
require("./process.js");
require("./reify.js");

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"install-packages.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/modules/install-packages.js                                                             //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
function install(name, mainModule) {
  var meteorDir = {};

  // Given a package name <name>, install a stub module in the
  // /node_modules/meteor directory called <name>.js, so that
  // require.resolve("meteor/<name>") will always return
  // /node_modules/meteor/<name>.js instead of something like
  // /node_modules/meteor/<name>/index.js, in the rare but possible event
  // that the package contains a file called index.js (#6590).

  if (typeof mainModule === "string") {
    // Set up an alias from /node_modules/meteor/<package>.js to the main
    // module, e.g. meteor/<package>/index.js.
    meteorDir[name + ".js"] = mainModule;
  } else {
    // back compat with old Meteor packages
    meteorDir[name + ".js"] = function (r, e, module) {
      module.exports = Package[name];
    };
  }

  meteorInstall({
    node_modules: {
      meteor: meteorDir
    }
  });
}

// This file will be modified during computeJsOutputFilesMap to include
// install(<name>) calls for every Meteor package.

install("meteor");
install("meteor-base");
install("mobile-experience");
install("npm-mongo");
install("ecmascript-runtime");
install("modules-runtime");
install("modules", "meteor/modules/server.js");
install("modern-browsers", "meteor/modern-browsers/modern.js");
install("es5-shim");
install("promise", "meteor/promise/server.js");
install("ecmascript-runtime-client", "meteor/ecmascript-runtime-client/versions.js");
install("ecmascript-runtime-server", "meteor/ecmascript-runtime-server/runtime.js");
install("babel-compiler");
install("react-fast-refresh");
install("ecmascript");
install("babel-runtime", "meteor/babel-runtime/babel-runtime.js");
install("fetch", "meteor/fetch/server.js");
install("inter-process-messaging", "meteor/inter-process-messaging/inter-process-messaging.js");
install("dynamic-import", "meteor/dynamic-import/server.js");
install("base64", "meteor/base64/base64.js");
install("ejson", "meteor/ejson/ejson.js");
install("diff-sequence", "meteor/diff-sequence/diff.js");
install("geojson-utils", "meteor/geojson-utils/main.js");
install("id-map", "meteor/id-map/id-map.js");
install("random", "meteor/random/main_server.js");
install("mongo-id", "meteor/mongo-id/id.js");
install("ordered-dict", "meteor/ordered-dict/ordered_dict.js");
install("tracker");
install("mongo-decimal", "meteor/mongo-decimal/decimal.js");
install("minimongo", "meteor/minimongo/minimongo_server.js");
install("check", "meteor/check/match.js");
install("retry", "meteor/retry/retry.js");
install("callback-hook", "meteor/callback-hook/hook.js");
install("ddp-common");
install("reload");
install("socket-stream-client", "meteor/socket-stream-client/node.js");
install("ddp-client", "meteor/ddp-client/server/server.js");
install("underscore");
install("rate-limit", "meteor/rate-limit/rate-limit.js");
install("ddp-rate-limiter", "meteor/ddp-rate-limiter/ddp-rate-limiter.js");
install("logging", "meteor/logging/logging.js");
install("routepolicy", "meteor/routepolicy/main.js");
install("boilerplate-generator", "meteor/boilerplate-generator/generator.js");
install("webapp-hashing");
install("webapp", "meteor/webapp/webapp_server.js");
install("ddp-server");
install("ddp");
install("allow-deny");
install("binary-heap", "meteor/binary-heap/binary-heap.js");
install("mongo");
install("reactive-var");
install("minifier-css", "meteor/minifier-css/minifier.js");
install("standard-minifier-css");
install("standard-minifier-js");
install("shell-server", "meteor/shell-server/main.js");
install("akryum:vue-component");
install("akryum:vue-less");
install("akryum:vue-sass");
install("static-html");
install("url", "meteor/url/server.js");
install("accounts-base", "meteor/accounts-base/server_main.js");
install("sha");
install("email", "meteor/email/email.js");
install("accounts-password");
install("less");
install("natestrauser:animate-css");
install("danappelxx:hover.css");
install("matb33:collection-hooks", "meteor/matb33:collection-hooks/server.js");
install("momentjs:moment");
install("risul:moment-timezone");
install("sakulstra:aggregate");
install("255kb:meteor-status");
install("jquery");
install("alanning:roles");
install("ongoworks:security");
install("simple:json-routes");
install("raix:eventemitter");
install("typescript");
install("tmeasday:check-npm-versions", "meteor/tmeasday:check-npm-versions/check-npm-versions.ts");
install("aldeed:collection2", "meteor/aldeed:collection2/collection2.js");
install("aldeed:simple-schema");
install("hot-code-push");
install("launch-screen");
install("autoupdate", "meteor/autoupdate/autoupdate_server.js");
install("service-configuration");
install("mdg:validation-error");

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"process.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/modules/process.js                                                                      //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
if (! global.process) {
  try {
    // The application can run `npm install process` to provide its own
    // process stub; otherwise this module will provide a partial stub.
    global.process = require("process");
  } catch (missing) {
    global.process = {};
  }
}

var proc = global.process;

if (Meteor.isServer) {
  // Make require("process") work on the server in all versions of Node.
  meteorInstall({
    node_modules: {
      "process.js": function (r, e, module) {
        module.exports = proc;
      }
    }
  });
} else {
  proc.platform = "browser";
  proc.nextTick = proc.nextTick || Meteor._setImmediate;
}

if (typeof proc.env !== "object") {
  proc.env = {};
}

var hasOwn = Object.prototype.hasOwnProperty;
for (var key in meteorEnv) {
  if (hasOwn.call(meteorEnv, key)) {
    proc.env[key] = meteorEnv[key];
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"reify.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/modules/reify.js                                                                        //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
require("@meteorjs/reify/lib/runtime").enable(
  module.constructor.prototype
);

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"@meteorjs":{"reify":{"lib":{"runtime":{"index.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/meteor/modules/node_modules/@meteorjs/reify/lib/runtime/index.js                    //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
meteorInstall({"node_modules":{"moment-timezone":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/moment-timezone/package.json                                                        //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.exports = {
  "name": "moment-timezone",
  "version": "0.5.28",
  "main": "./index.js"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/moment-timezone/index.js                                                            //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}},"numeral":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/numeral/package.json                                                                //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.exports = {
  "name": "numeral",
  "version": "2.0.6",
  "main": "./numeral.js"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"numeral.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/numeral/numeral.js                                                                  //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}},"mathjs":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/mathjs/package.json                                                                 //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.exports = {
  "name": "mathjs",
  "version": "7.1.0",
  "main": "main/es5"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"main":{"es5":{"index.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/mathjs/main/es5/index.js                                                            //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"xlsx":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/xlsx/package.json                                                                   //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.exports = {
  "name": "xlsx",
  "version": "0.15.6",
  "main": "./xlsx"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"xlsx.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/xlsx/xlsx.js                                                                        //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}},"jsonwebtoken":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/jsonwebtoken/package.json                                                           //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.exports = {
  "name": "jsonwebtoken",
  "version": "8.5.1",
  "main": "index.js"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/jsonwebtoken/index.js                                                               //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lodash":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/lodash/package.json                                                                 //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.exports = {
  "name": "lodash",
  "version": "4.17.20",
  "main": "lodash.js"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"lodash.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/lodash/lodash.js                                                                    //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}},"axios":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/axios/package.json                                                                  //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.exports = {
  "name": "axios",
  "version": "0.19.2",
  "main": "index.js"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/axios/index.js                                                                      //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}},"moment":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/moment/package.json                                                                 //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.exports = {
  "name": "moment",
  "version": "2.24.0",
  "main": "./moment.js"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"moment.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/moment/moment.js                                                                    //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node-schedule":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/node-schedule/package.json                                                          //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.exports = {
  "name": "node-schedule",
  "version": "2.1.1",
  "main": "index.js"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/node-schedule/index.js                                                              //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}},"@babel":{"runtime":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/@babel/runtime/package.json                                                         //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.exports = {
  "author": {
    "name": "Sebastian McKenzie",
    "email": "sebmck@gmail.com"
  },
  "bugs": {
    "url": "https://github.com/babel/babel/issues"
  },
  "dependencies": {
    "regenerator-runtime": "^0.13.4"
  },
  "description": "babel's modular runtime helpers",
  "devDependencies": {
    "@babel/helpers": "^7.9.2"
  },
  "gitHead": "2399e0df23cbd574a5ab39822288c438f5380ae8",
  "homepage": "https://babeljs.io/docs/en/next/babel-runtime",
  "license": "MIT",
  "name": "@babel/runtime",
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/babel/babel.git",
    "directory": "packages/babel-runtime"
  },
  "version": "7.9.2"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpers":{"objectSpread2.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/@babel/runtime/helpers/objectSpread2.js                                             //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

},"objectWithoutProperties.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/@babel/runtime/helpers/objectWithoutProperties.js                                   //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"simpl-schema":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/simpl-schema/package.json                                                           //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.exports = {
  "name": "simpl-schema",
  "version": "1.7.0",
  "main": "./dist/main.js"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"main.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// node_modules/simpl-schema/dist/main.js                                                           //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".mjs",
    ".vue"
  ]
});

var exports = require("/node_modules/meteor/modules/server.js");

/* Exports */
Package._define("modules", exports, {
  meteorInstall: meteorInstall
});

})();
