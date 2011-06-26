scriptDAO = {
  clear: function() {
    for (key in localStorage) {
      if (/^(js|css|libs)-/.test(key)) delete localStorage[key];
    }
  },
  rm: function(scriptType, scope) {
    if (this.defined(scriptType, scope))
      delete localStorage[scriptType+"-"+scope];
  },
  save: function(val, scriptType, scope) {
    if (_(val).isEmpty())
      delete localStorage[scriptType+"-"+scope];
    else 
      localStorage[scriptType+"-"+scope] = JSON.stringify(val);
  },
  load: function(scriptType, scope) {
    return parse(localStorage[scriptType+"-"+scope]);
  },
  all: function() {
    var scripts = [];
    for (var key in localStorage) {
      var matches = key.match(/^(js|css|libs)-(.+)/);

      if (matches) {

        if (! $.trim(localStorage[key]).length)
          delete localStorage[key];
        else
          scripts.push({
            scriptType: matches[1],
            scope: matches[2],
            text: JSON.stringify(localStorage[key]) // TODO "text"->"val"
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
    return scripts;
  },
  defined: function(scriptType, scope) {
    return parse(localStorage[scriptType+"-"+scope]) ? true : false;
  }
};
if (!localStorage["js"]) localStorage["js"] = [];
if (!localStorage["css"]) localStorage["css"] = [];
if (!localStorage["libs"]) localStorage["libs"] = [];

function isURL(s) {
  return /^(http|https|file):\/\//.test(s);
}

function parse(o) { return o ? JSON.parse(o) : null; }
