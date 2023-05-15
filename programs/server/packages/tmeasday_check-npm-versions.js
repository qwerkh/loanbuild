(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"tmeasday:check-npm-versions":{"check-npm-versions.ts":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/tmeasday_check-npm-versions/check-npm-versions.ts                                                       //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
!function (module1) {
  module1.export({
    checkNpmVersions: () => checkNpmVersions
  });
  let Meteor;
  module1.link("meteor/meteor", {
    Meteor(v) {
      Meteor = v;
    }

  }, 0);
  let semver;
  module1.link("semver", {
    default(v) {
      semver = v;
    }

  }, 1);

  // Returns:
  //   - true      if a version of the package in the range is installed
  //   - false     if no version is installed
  //   - version#  if incompatible version is installed
  const compatibleVersionIsInstalled = (name, range) => {
    try {
      const installedVersion = require("".concat(name, "/package.json")).version;

      if (semver.satisfies(installedVersion, range)) {
        return true;
      } else {
        return installedVersion;
      }
    } catch (e) {
      // XXX add something to the tool to make this more reliable
      const message = e.toString(); // One message comes out of the install npm package the other from npm directly

      if (message.includes('Cannot find module') === true || message.includes("Can't find npm module") === true) {
        return false;
      } else {
        throw e;
      }
    }
  };

  const checkNpmVersions = (packages, packageName) => {
    if (Meteor.isDevelopment) {
      const failures = {};
      Object.keys(packages).forEach(name => {
        const range = packages[name];
        const failure = compatibleVersionIsInstalled(name, range);

        if (failure !== true) {
          failures[name] = failure;
        }
      });

      if (Object.keys(failures).length === 0) {
        return;
      }

      const errors = [];
      Object.keys(failures).forEach(name => {
        const installed = failures[name];
        const requirement = "".concat(name, "@").concat(packages[name]);

        if (installed) {
          errors.push(" - ".concat(name, "@").concat(installed, " installed, ").concat(requirement, " needed"));
        } else {
          errors.push(" - ".concat(name, "@").concat(packages[name], " not installed."));
        }
      });
      const qualifier = packageName ? "(for ".concat(packageName, ") ") : '';
      console.warn("WARNING: npm peer requirements ".concat(qualifier, "not installed:\n  ").concat(errors.join('\n'), "\n\n  Read more about installing npm peer dependencies:\n    http://guide.meteor.com/using-packages.html#peer-npm-dependencies\n  "));
    }
  };
}.call(this, module);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"semver":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/tmeasday_check-npm-versions/node_modules/semver/package.json                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.exports = {
  "name": "semver",
  "version": "6.3.0",
  "main": "semver.js"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"semver.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/tmeasday_check-npm-versions/node_modules/semver/semver.js                                    //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".ts"
  ]
});

var exports = require("/node_modules/meteor/tmeasday:check-npm-versions/check-npm-versions.ts");

/* Exports */
Package._define("tmeasday:check-npm-versions", exports);

})();

//# sourceURL=meteor://💻app/packages/tmeasday_check-npm-versions.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvdG1lYXNkYXk6Y2hlY2stbnBtLXZlcnNpb25zL2NoZWNrLW5wbS12ZXJzaW9ucy50cyJdLCJuYW1lcyI6WyJtb2R1bGUxIiwiY2hlY2tOcG1WZXJzaW9ucyIsIk1ldGVvciIsImRlZmF1bHQiLCJzZW12ZXIiLCJjb21wYXRpYmxlVmVyc2lvbklzSW5zdGFsbGVkIiwibmFtZSIsInJhbmdlIiwiaW5zdGFsbGVkVmVyc2lvbiIsInJlcXVpcmUiLCJ2ZXJzaW9uIiwic2F0aXNmaWVzIiwiZSIsIm1lc3NhZ2UiLCJ0b1N0cmluZyIsImluY2x1ZGVzIiwicGFja2FnZXMiLCJwYWNrYWdlTmFtZSIsImlzRGV2ZWxvcG1lbnQiLCJmYWlsdXJlcyIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwiZmFpbHVyZSIsImxlbmd0aCIsImVycm9ycyIsImluc3RhbGxlZCIsInJlcXVpcmVtZW50IiwicHVzaCIsInF1YWxpZmllciIsImNvbnNvbGUiLCJ3YXJuIiwiam9pbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLFNBQU8sT0FBUCxDQUFlO0FBQUFDLG9CQUFRO0FBQVIsR0FBZjtBQUF1QztBQUFBRDtBQUFBRTtBQUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQUY7QUFBQUc7QUFBQUM7QUFBQTs7QUFBQTs7QUFhdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFNQyw0QkFBNEIsR0FBRyxDQUFDQyxJQUFELEVBQWVDLEtBQWYsS0FBNkQ7QUFDaEcsUUFBSTtBQUNGLFlBQU1DLGdCQUFnQixHQUFHQyxPQUFPLFdBQUlILElBQUosbUJBQVAsQ0FBZ0NJLE9BQXpEOztBQUNBLFVBQUlOLE1BQU0sQ0FBQ08sU0FBUCxDQUFpQkgsZ0JBQWpCLEVBQW1DRCxLQUFuQyxDQUFKLEVBQStDO0FBQzdDLGVBQU8sSUFBUDtBQUNELE9BRkQsTUFFTztBQUNMLGVBQU9DLGdCQUFQO0FBQ0Q7QUFDRixLQVBELENBT0UsT0FBT0ksQ0FBUCxFQUFVO0FBQ1Y7QUFDQSxZQUFNQyxPQUFPLEdBQUdELENBQUMsQ0FBQ0UsUUFBRixFQUFoQixDQUZVLENBR1Y7O0FBQ0EsVUFBSUQsT0FBTyxDQUFDRSxRQUFSLENBQWlCLG9CQUFqQixNQUEyQyxJQUEzQyxJQUFtREYsT0FBTyxDQUFDRSxRQUFSLENBQWlCLHVCQUFqQixNQUE4QyxJQUFyRyxFQUEyRztBQUN6RyxlQUFPLEtBQVA7QUFDRCxPQUZELE1BRU87QUFDTCxjQUFNSCxDQUFOO0FBQ0Q7QUFDRjtBQUNGLEdBbEJEOztBQW9CTyxRQUFNWCxnQkFBZ0IsR0FBRyxDQUFDZSxRQUFELEVBQXFCQyxXQUFyQixLQUFrRDtBQUNoRixRQUFJZixNQUFNLENBQUNnQixhQUFYLEVBQTBCO0FBQ3hCLFlBQU1DLFFBQVEsR0FBc0IsRUFBcEM7QUFFQUMsWUFBTSxDQUFDQyxJQUFQLENBQVlMLFFBQVosRUFBc0JNLE9BQXRCLENBQStCaEIsSUFBRCxJQUFTO0FBQ3JDLGNBQU1DLEtBQUssR0FBR1MsUUFBUSxDQUFDVixJQUFELENBQXRCO0FBQ0EsY0FBTWlCLE9BQU8sR0FBR2xCLDRCQUE0QixDQUFDQyxJQUFELEVBQU9DLEtBQVAsQ0FBNUM7O0FBRUEsWUFBSWdCLE9BQU8sS0FBSyxJQUFoQixFQUFzQjtBQUNwQkosa0JBQVEsQ0FBQ2IsSUFBRCxDQUFSLEdBQWlCaUIsT0FBakI7QUFDRDtBQUNGLE9BUEQ7O0FBU0EsVUFBSUgsTUFBTSxDQUFDQyxJQUFQLENBQVlGLFFBQVosRUFBc0JLLE1BQXRCLEtBQWlDLENBQXJDLEVBQXdDO0FBQ3RDO0FBQ0Q7O0FBRUQsWUFBTUMsTUFBTSxHQUFhLEVBQXpCO0FBRUFMLFlBQU0sQ0FBQ0MsSUFBUCxDQUFZRixRQUFaLEVBQXNCRyxPQUF0QixDQUErQmhCLElBQUQsSUFBUztBQUNyQyxjQUFNb0IsU0FBUyxHQUFHUCxRQUFRLENBQUNiLElBQUQsQ0FBMUI7QUFDQSxjQUFNcUIsV0FBVyxhQUFNckIsSUFBTixjQUFjVSxRQUFRLENBQUNWLElBQUQsQ0FBdEIsQ0FBakI7O0FBRUEsWUFBSW9CLFNBQUosRUFBZTtBQUNiRCxnQkFBTSxDQUFDRyxJQUFQLGNBQWtCdEIsSUFBbEIsY0FBMEJvQixTQUExQix5QkFBa0RDLFdBQWxEO0FBQ0QsU0FGRCxNQUVPO0FBQ0xGLGdCQUFNLENBQUNHLElBQVAsY0FBa0J0QixJQUFsQixjQUEwQlUsUUFBUSxDQUFDVixJQUFELENBQWxDO0FBQ0Q7QUFDRixPQVREO0FBV0EsWUFBTXVCLFNBQVMsR0FBR1osV0FBVyxrQkFBV0EsV0FBWCxVQUE2QixFQUExRDtBQUNBYSxhQUFPLENBQUNDLElBQVIsMENBQStDRixTQUEvQywrQkFDQUosTUFBTSxDQUFDTyxJQUFQLENBQVksSUFBWixDQURBO0FBTUQ7QUFDRixHQXRDTSIsImZpbGUiOiIvcGFja2FnZXMvdG1lYXNkYXlfY2hlY2stbnBtLXZlcnNpb25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5cbnR5cGUgYm9vbE9yU3RyaW5nID0gYm9vbGVhbiB8IHN0cmluZztcblxuaW50ZXJmYWNlIGluZGV4Qm9vbG9yU3RyaW5nIHtcbiAgW2tleTogc3RyaW5nXTogYm9vbE9yU3RyaW5nXG59XG5cbmludGVyZmFjZSBpbmRleEFueSB7XG4gIFtrZXk6IHN0cmluZ106IGFueVxufVxuXG4vLyBSZXR1cm5zOlxuLy8gICAtIHRydWUgICAgICBpZiBhIHZlcnNpb24gb2YgdGhlIHBhY2thZ2UgaW4gdGhlIHJhbmdlIGlzIGluc3RhbGxlZFxuLy8gICAtIGZhbHNlICAgICBpZiBubyB2ZXJzaW9uIGlzIGluc3RhbGxlZFxuLy8gICAtIHZlcnNpb24jICBpZiBpbmNvbXBhdGlibGUgdmVyc2lvbiBpcyBpbnN0YWxsZWRcbmNvbnN0IGNvbXBhdGlibGVWZXJzaW9uSXNJbnN0YWxsZWQgPSAobmFtZTogc3RyaW5nLCByYW5nZTogc3RyaW5nIHwgc2VtdmVyLlJhbmdlKTogYm9vbE9yU3RyaW5nID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBpbnN0YWxsZWRWZXJzaW9uID0gcmVxdWlyZShgJHtuYW1lfS9wYWNrYWdlLmpzb25gKS52ZXJzaW9uO1xuICAgIGlmIChzZW12ZXIuc2F0aXNmaWVzKGluc3RhbGxlZFZlcnNpb24sIHJhbmdlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBpbnN0YWxsZWRWZXJzaW9uO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIFhYWCBhZGQgc29tZXRoaW5nIHRvIHRoZSB0b29sIHRvIG1ha2UgdGhpcyBtb3JlIHJlbGlhYmxlXG4gICAgY29uc3QgbWVzc2FnZSA9IGUudG9TdHJpbmcoKTtcbiAgICAvLyBPbmUgbWVzc2FnZSBjb21lcyBvdXQgb2YgdGhlIGluc3RhbGwgbnBtIHBhY2thZ2UgdGhlIG90aGVyIGZyb20gbnBtIGRpcmVjdGx5XG4gICAgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJ0Nhbm5vdCBmaW5kIG1vZHVsZScpID09PSB0cnVlIHx8IG1lc3NhZ2UuaW5jbHVkZXMoXCJDYW4ndCBmaW5kIG5wbSBtb2R1bGVcIikgPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBjaGVja05wbVZlcnNpb25zID0gKHBhY2thZ2VzOiBpbmRleEFueSwgcGFja2FnZU5hbWU6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBpZiAoTWV0ZW9yLmlzRGV2ZWxvcG1lbnQpIHtcbiAgICBjb25zdCBmYWlsdXJlczogaW5kZXhCb29sb3JTdHJpbmcgPSB7fTtcblxuICAgIE9iamVjdC5rZXlzKHBhY2thZ2VzKS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICBjb25zdCByYW5nZSA9IHBhY2thZ2VzW25hbWVdO1xuICAgICAgY29uc3QgZmFpbHVyZSA9IGNvbXBhdGlibGVWZXJzaW9uSXNJbnN0YWxsZWQobmFtZSwgcmFuZ2UpO1xuXG4gICAgICBpZiAoZmFpbHVyZSAhPT0gdHJ1ZSkge1xuICAgICAgICBmYWlsdXJlc1tuYW1lXSA9IGZhaWx1cmU7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoT2JqZWN0LmtleXMoZmFpbHVyZXMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICAgIE9iamVjdC5rZXlzKGZhaWx1cmVzKS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICBjb25zdCBpbnN0YWxsZWQgPSBmYWlsdXJlc1tuYW1lXTtcbiAgICAgIGNvbnN0IHJlcXVpcmVtZW50ID0gYCR7bmFtZX1AJHtwYWNrYWdlc1tuYW1lXX1gO1xuXG4gICAgICBpZiAoaW5zdGFsbGVkKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKGAgLSAke25hbWV9QCR7aW5zdGFsbGVkfSBpbnN0YWxsZWQsICR7cmVxdWlyZW1lbnR9IG5lZWRlZGApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyb3JzLnB1c2goYCAtICR7bmFtZX1AJHtwYWNrYWdlc1tuYW1lXX0gbm90IGluc3RhbGxlZC5gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHF1YWxpZmllciA9IHBhY2thZ2VOYW1lID8gYChmb3IgJHtwYWNrYWdlTmFtZX0pIGAgOiAnJztcbiAgICBjb25zb2xlLndhcm4oYFdBUk5JTkc6IG5wbSBwZWVyIHJlcXVpcmVtZW50cyAke3F1YWxpZmllcn1ub3QgaW5zdGFsbGVkOlxuICAke2Vycm9ycy5qb2luKCdcXG4nKX1cblxuICBSZWFkIG1vcmUgYWJvdXQgaW5zdGFsbGluZyBucG0gcGVlciBkZXBlbmRlbmNpZXM6XG4gICAgaHR0cDovL2d1aWRlLm1ldGVvci5jb20vdXNpbmctcGFja2FnZXMuaHRtbCNwZWVyLW5wbS1kZXBlbmRlbmNpZXNcbiAgYCk7XG4gIH1cbn07XG4iXX0=
