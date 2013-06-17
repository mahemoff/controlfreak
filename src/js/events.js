(function () {
  // migration process
  chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "update" && (/^0\./.test(details.previousVersion) || /^1\./.test(details.previousVersion))) {
      migrate();
    }
  });

  // messages listener
  chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
    switch (req.action) {
      case "search":
        searchFreaks(req.url, sendResponse);
        return true;
        break;

      case "content":
        // search for scripts on this page
        searchFreaks(req.url, function (res) {
          // @todo libs first
          for (var key in res) {
            if (/^js_/.test(key)) {
              chrome.tabs.executeScript(sender.tab.id, {code: res[key]});
            } else if (/^css_/.test(key)) {
              chrome.tabs.insertCSS(sender.tab.id, {code: res[key]});
            }
          }
        });

        return false;
        break;
    }
  });

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

  // migrate to 2.x
  // @see https://github.com/1999/controlfreak/issues/8
  function migrate() {
    var saveData = {};
    var hasFreaks = false;

    for (var key in localStorage) {
      if (/^js\-/.test(key) || /^css\-/.test(key) || /^libs\-/.test(key)) {
        try {
          saveData[key] = JSON.parse(localStorage[key]);
          hasFreaks = true;
        } catch (ex) {}
      }
    }

    if (hasFreaks) {
      chrome.storage.local.set(saveData);
    }
  }
})();
