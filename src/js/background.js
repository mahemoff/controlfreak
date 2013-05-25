chrome.extension.onRequest.addListener(function(req, sender, sendResponse) {
  var page = new Page(req);

  asyncParallel({
    libs: function (callback) {
      composeScripts(page, "libs", function (scripts) {
        callback(null, _(scripts).flatten());
      });
    },
    jsScripts: function (callback) {
      composeScripts(page, "js", function (scripts) {
        callback(null, scripts);
      });
    },
    cssScripts: function (callback) {
      composeScripts(page, "css", function (scripts) {
        callback(null, scripts);
      });
    }
  }, function (err, results) {
    sendResponse(results);
  });
});

function composeScripts(page, scriptType, callback) {
  asyncParallel([
    function (callback) {
      scriptDAO.load(scriptType, "*", function (contents) {
        callback(null, contents);
      });
    },
    function (callback) {
      scriptDAO.load(scriptType, page.getHost(), function (contents) {
        callback(null, contents);
      });
    },
    function (callback) {
      scriptDAO.load(scriptType, page.getURL(), function (contents) {
        callback(null, contents);
      });
    }
  ], function (err, results) {
    results = results.filter(function (script) {
      return !_.isEmpty(script);
    });

    callback(results);
  });
}

// async.parallel example
function asyncParallel(tasks, concurrency, callback) {
  if (arguments.length === 2) {
    callback = concurrency;
    concurrency = 0;
  }

  var isNamedQueue = !Array.isArray(tasks);
  var tasksKeys = isNamedQueue ? Object.keys(tasks) : new Array(tasks.length);
  var resultsData = isNamedQueue ? {} : [];

  if (!tasksKeys.length)
    return callback(null, resultsData);

  var tasksProcessedNum = 0;
  var tasksBeingProcessed = 0;
  var tasksTotalNum = tasksKeys.length;

  (function processTasks() {
    if (!tasksKeys.length || (concurrency && concurrency <= tasksBeingProcessed))
      return;

    var taskIndex = tasksKeys.pop() || tasksKeys.length;
    tasksBeingProcessed += 1;

    tasks[taskIndex](function (err, data) {
      tasksBeingProcessed -= 1;

      if (err) {
        var originalCallback = callback;
        callback = function () { return true };

        return originalCallback(err);
      }

      resultsData[taskIndex] = data;
      tasksProcessedNum += 1;

      if (tasksProcessedNum === tasksTotalNum)
        return callback(null, resultsData);

      processTasks();
    });

    processTasks();
  })();
}