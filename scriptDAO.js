scriptDAO = {
  clear: function() {
    for (key in localStorage) {
      if (/^(js|css)-/.test(key)) delete localStorage[key];
    }
  },
  save: function(script, scriptType, scope) {
    localStorage[scriptType+"-"+scope] = script;
  },
  load: function(scriptType, scope) {
    return localStorage[scriptType+"-"+scope];
  },
  all: function() {
    var scripts = [];
    for (var key in localStorage) {
      var matches = key.match(/^(js|css)-(.+)/);

      if (matches) {

        console.log("key", key, "--", localStorage[key]);
        if (! $.trim(localStorage[key]).length)
          delete localStorage[key];
        else
          scripts.push({
            scriptType: matches[1],
            scope: matches[2],
            text: localStorage[key]
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
    return localStorage[scriptType+"-"+scope] ? true : false;
  }
};
if (!localStorage["js"]) localStorage["js"] = [];
if (!localStorage["css"]) localStorage["css"] = [];

function isURL(s) {
  return /^(http|https|file):\/\//.test(s);
}
