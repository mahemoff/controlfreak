chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
  switch (req.action) {
    case "search":
      searchFreaks(req.url, sendResponse);
      return true;

      // var res = chrome.tabs.executeScript(sender.tab.id, {file: 'http://yandex.st/jquery/2.0.2/jquery.min.js'}, sendResponse)
      // return true;
      
    //   chrome.tabs.executeScript({
    //   code: 'document.body.style.backgroundColor="red"'
    // });
      break;

    case "search222":
      // search for scripts on this page
      parallel({
        all: function (callback) {
          chrome.storage.local.get("js-*", callback);
        },
        origin: function (callback) {
          chrome.storage.local.get("js-" + origin, callback);
        },
        page: function (callback) {
          chrome.storage.local.get("js-" + url, callback);
        }
      }, sendResponse);

      break;
  }

  // @see https://npmjs.org/package/async#parallel
  function parallel(tasks, callback) {
    var isNamedQueue = !Array.isArray(tasks);
    var tasksKeys = isNamedQueue ? Object.keys(tasks) : new Array(tasks.length);
    var resultsData = isNamedQueue ? {} : [];

    if (!tasksKeys.length)
      return callback(resultsData);

    var tasksTotalNum = tasksKeys.length;
    var tasksProcessedNum = 0;

    (function processTasks() {
      if (!tasksKeys.length)
        return;

      var taskIndex = tasksKeys.pop() || tasksKeys.length;
      tasks[taskIndex](function (data) {
        resultsData[taskIndex] = data;
        tasksProcessedNum += 1;

        if (tasksProcessedNum === tasksTotalNum)
          return callback(resultsData);

        processTasks();
      });

      processTasks();
    })();
  }

  // get all freaks for page
  function searchFreaks(url, callback) {
    var storageType = localStorage.type === "sync" ? "sync" : "local";
    var parseLink = document.createElement("a");
    parseLink.setAttribute("href", url);

    var tasks = {};
    ["all", "origin", "page"].forEach(function (scope) {
      ["js", "css", "libs"].forEach(function (tab) {
        tasks[tab + "_" + scope] = function (callback) {
          var storageKey = tab + "-";
          switch (scope) {
            case "all": storageKey += "*"; break;
            case "origin": storageKey += parseLink.origin; break;
            case "page": storageKey += url; break;
          }

          chrome.storage[storageType].get(storageKey, function (obj) {
            callback(obj[storageKey]);
          });
        };
      });
    })

    parallel(tasks, function (results) {
      var output = {};
      for (var key in results) {
        if (results[key]) {
          output[key] = results[key];
        }
      }

      callback(output);
    });
  }

//   var page = new Page(req);

//   asyncParallel({
//     libs: function (callback) {
//       composeScripts(page, "libs", function (scripts) {
//         // @todo was: _(scripts).flatten()
//         callback(null, scripts);
//       });
//     },
//     jsScripts: function (callback) {
//       composeScripts(page, "js", function (scripts) {
//         callback(null, scripts);
//       });
//     },
//     cssScripts: function (callback) {
//       composeScripts(page, "css", function (scripts) {
//         callback(null, scripts);
//       });
//     }
//   }, function (err, results) {
//     sendResponse(results);
//   });
// });

// function composeScripts(page, scriptType, callback) {
//   asyncParallel([
//     function (callback) {
//       scriptDAO.load(scriptType, "*", function (contents) {
//         callback(null, contents);
//       });
//     },
//     function (callback) {
//       scriptDAO.load(scriptType, page.getHost(), function (contents) {
//         callback(null, contents);
//       });
//     },
//     function (callback) {
//       scriptDAO.load(scriptType, page.getURL(), function (contents) {
//         callback(null, contents);
//       });
//     }
//   ], function (err, results) {
//     results = results.filter(function (script) {
//       // @todo can objects be here?
//       return (typeof script === "string" || string instanceof Array)
//         ? (string.length > 0)
//         : (Object.keys(string).length > 0);
//     });

//     callback(results);
//   });
});
