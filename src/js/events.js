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
          var loadLibsTasks = {
            js: [],
            css: []
          };

          ["libs_all", "libs_origin", "libs_page"].forEach(function (tabScope) {
            if (!res[tabScope])
              return;

            for (var i = 0; i < res[tabScope].length; i++) {
              (function (libraryURL, taskType) {
                loadLibsTasks[taskType].push(function (callback) {
                  requestExternalContent(libraryURL, callback);
                });
              })(res[tabScope][i], /\.js$/i.test(res[tabScope][i]) ? "js" : "css");
            }
          });

          // parallelize JS libraries loading
          parallel(loadLibsTasks.js, function (libs) {
            var scriptData = libs.join("\n\n");

            // append js data
            ["all", "origin", "page"].forEach(function (scope) {
              var key = "js_" + scope;
              if (!res[key])
                return;

              scriptData += "\n\n" + res[key];
            });

            if (scriptData.length) {
              chrome.tabs.executeScript(sender.tab.id, {code: scriptData});
            }
          });

          // parallelize CSS libraries loading
          parallel(loadLibsTasks.css, function (libs) {
            var stylesData = libs.join("\n\n");

            // append js data
            ["all", "origin", "page"].forEach(function (scope) {
              var key = "css_" + scope;
              if (!res[key])
                return;

              stylesData += "\n\n" + res[key];
            });

            if (stylesData.length) {
              chrome.tabs.insertCSS(sender.tab.id, {code: stylesData});
            }
          });
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

  // xmlhttprequests
  function request(url, headers, callback) {
    if (typeof headers === "function") {
      callback = headers;
      headers = {};
    }

    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, true);

    for (var header in headers) {
      if (headers[header]) {
        xhr.setRequestHeader(header, headers[header]);
      }
    }

    xhr.onload = function () {
      callback(null, {
        status: xhr.status,
        lastModified: xhr.getResponseHeader("last-modified"),
        eTag: xhr.getResponseHeader("etag"),
        data: xhr.responseText
      });
    };

    xhr.onerror = xhr.onabort = function (evt) {
      callback("Error: " + evt.type)
    };

    xhr.send();
  }

  // get filesystem point
  function requestFileSystem(callback) {
    (window.webkitRequestFileSystem || window.requestFileSystem)(window.TEMPORARY, 0, function (windowFsLink) {
      callback(null, windowFsLink);
    }, function (err) {
      callback("Filesystem not available: " + err);
    });
  }

  // try to get URL contents with proper cache headers
  function requestExternalContent(url, callback) {
    var errComment = "/* Unable to load " + url + " */\n";

    requestFileSystem(function (err, fsLink) {
      if (err) {
        return request(url, function (err, res) {
          callback(err ? errComment : res.data);
        });
      }

      var fileName = url.replace(/[^\w]+/g, "") + ".json";
      var data;

      var requestCallback = function (err, res) {
        if (err)
          return callback(data || errComment);

        if (res.status === 304)
          return callback(data);

        fsLink.root.getFile(fileName, {create: true}, function (fileEntry) {
          fileEntry.createWriter(function (fileWriter) {
            delete res.status;
            var blob = new Blob([JSON.stringify(res, null, "\t")], {type: "text/plain"});

            fileWriter.write(blob);
            callback(res.data);
          }, function (err) {
            callback(res.data);
          });
        }, function (err) {
          callback(res.data);
        });
      };

      fsLink.root.getFile(fileName, {create: false}, function (fileEntry) {
        fileEntry.file(function (file) {
          var reader = new FileReader;

          reader.onloadend = function (evt) {
            try {
              var cacheData = JSON.parse(reader.result);
              data = cacheData.data;

              request(url, {"If-Modified-Since": cacheData.lastModified, "If-None-Match": cacheData.eTag}, requestCallback);
            } catch (ex) {
              request(url, requestCallback);
            }
          };

          reader.readAsText(file);
        }, function (err) {
          request(url, requestCallback);
        });
      }, function (err) {
        request(url, requestCallback);
      });
    });
  }
})();
