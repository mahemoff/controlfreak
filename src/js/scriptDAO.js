var syncStorageProto = {
  changeSyncState: function (enable, callback) {
    var dao = this;

    // create temporary array of existing tweaks
    this.all(function (tweaks) {
      // copy tweaks between chrome.storage areas
      var tweaksMap = Object.create(null);
      tweaks.forEach(function (tweakData) {
        if (tweakData.text.length > chrome.storage.sync.QUOTA_BYTES_PER_ITEM)
          return;

        tweaksMap[tweakData.scriptType+"-"+tweakData.scope] = tweakData.text;
      });

      dao.storageArea = enable ? "sync" : "local";
      dao.save(tweaksMap, callback);
    });
  },

  clear: function (callback) {
    chrome.storage[this.storageArea].clear(callback);
  },

  rm: function(scriptType, scope, callback) {
    this.defined(scriptType, scope, function (defined) {
      if (!defined)
        return callback();

      chrome.storage[this.storageArea].remove(scriptType+"-"+scope, callback);
    });
  },

  // @todo rework, val should be string
  save: function(val, scriptType, scope, callback) {
    if (arguments.length === 2)
      return chrome.storage[this.storageArea].set(arguments[0], callback);

    var key = scriptType+"-"+scope;
    if ((typeof val === "string" || val instanceof Array) && !val.length) {
      chrome.storage[this.storageArea].remove(key, callback);
    } else {
      var data = {};
      data[key] = JSON.stringify(val);

      chrome.storage[this.storageArea].set(data, callback);
    }
  },

  load: function(scriptType, scope, callback) {
    var key = scriptType+"-"+scope;

    chrome.storage[this.storageArea].get(key, function (obj) {
      callback(parse(obj[key]));
    });
  },

  all: function(callback) {
    chrome.storage[this.storageArea].get(null, function (obj) {
      var scripts = [];

      for (var key in obj) {
        var matches = key.match(/^(js|css|libs)-(.+)/);
        if (matches) {
          scripts.push({
            scriptType: matches[1],
            scope: matches[2],
            text: JSON.stringify(obj[key]) // TODO "text"->"val"
          });
        }
      }

      scripts.sort(function(scriptA, scriptB) {
        if (scriptA.scope=="*" && scriptB.scope!="*") return -1;
        if (scriptB.scope=="*" && scriptA.scope!="*") return 1;
        if (!isURL(scriptA.scope) && isURL(scriptB.scope)) return -1;
        if (!isURL(scriptB.scope) && isURL(scriptA.scope)) return 1;
        if (scriptA.scope<scriptB.scope) return -1;
        if (scriptB.scope<scriptA.scope) return 1;
        return scriptA.scriptType < scriptB.scriptType;
      });

      callback(scripts);
    });
  },

  defined: function(scriptType, scope, callback) {
    var key = scriptType+"-"+scope;

    chrome.storage[this.storageArea].get(key, function (obj) {
      callback(parse(obj[key]) ? true : false);
    });
  }
};

var localStorageProto = {
  changeSyncState: function (enable, callback) {
    var dao = this;

    // create temporary array of existing tweaks
    this.all(function (tweaks) {
      dao.__proto__ = syncStorageProto;
      dao.storageArea = "sync";

      // copy tweaks from localStorage to chrome.storage.sync
      var tweaksMap = Object.create(null);
      tweaks.forEach(function (tweakData) {
        if (tweakData.text.length > chrome.storage.sync.QUOTA_BYTES_PER_ITEM)
          return;

        tweaksMap[tweakData.scriptType+"-"+tweakData.scope] = tweakData.text;
      });

      dao.save(tweaksMap, callback);
    });
  },

  clear: function (callback) {
    for (key in localStorage) {
      if (/^(js|css|libs)-/.test(key)) delete localStorage[key];
    }

    callback && callback();
  },

  rm: function(scriptType, scope, callback) {
    if (this.defined(scriptType, scope))
      delete localStorage[scriptType+"-"+scope];

    callback && callback();
  },

  // @todo rework, val should be string
  save: function(val, scriptType, scope, callback) {
    if ((typeof val === "string" || val instanceof Array) && !val.length)
      delete localStorage[scriptType+"-"+scope];
    else
      localStorage[scriptType+"-"+scope] = JSON.stringify(val);
  },

  load: function(scriptType, scope, callback) {
    callback && callback(parse(localStorage[scriptType+"-"+scope]));
  },

  all: function(callback) {
    var scripts = [];
    for (var key in localStorage) {
      var matches = key.match(/^(js|css|libs)-(.+)/);

      if (matches) {
        if (!localStorage[key].trim().length) {
          delete localStorage[key];
        } else {
          scripts.push({
            scriptType: matches[1],
            scope: matches[2],
            text: JSON.stringify(localStorage[key]) // TODO "text"->"val"
          });
        }
      }
    }
    scripts.sort(function(scriptA, scriptB) {
      if (scriptA.scope=="*" && scriptB.scope!="*") return -1;
      if (scriptB.scope=="*" && scriptA.scope!="*") return 1;
      if (!isURL(scriptA.scope) && isURL(scriptB.scope)) return -1;
      if (!isURL(scriptB.scope) && isURL(scriptA.scope)) return 1;
      if (scriptA.scope<scriptB.scope) return -1;
      if (scriptB.scope<scriptA.scope) return 1;
      return scriptA.scriptType < scriptB.scriptType;
    });
    
    callback && callback(scripts);
  },

  defined: function(scriptType, scope, callback) {
    callback && callback(parse(localStorage[scriptType+"-"+scope]) ? true : false);
  }
};

// choose storage type (localStorage, chrome.storage.sync and chome.storage.local)
switch (localStorage.getItem("storage_option")) {
  case "sync":
    scriptDAO = Object.create(syncStorageProto);
    scriptDAO.storageArea = "sync";
    break;

  case "local":
    scriptDAO = Object.create(syncStorageProto);
    scriptDAO.storageArea = "local";
    break;

  default: // before 1.2
    scriptDAO = Object.create(localStorageProto);
}

if (!localStorage["js"]) localStorage["js"] = [];
if (!localStorage["css"]) localStorage["css"] = [];
if (!localStorage["libs"]) localStorage["libs"] = [];

function isURL(s) {
  return /^(http|https|file):\/\//.test(s);
}

function parse(o) { return o ? JSON.parse(o) : null; }
