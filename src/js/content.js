chrome.extension.sendRequest(document.location.href, function(response) {

  require(response.libs, loadJSScripts);

  _(response.cssScripts).each(function(script) {
     var style = document.createElement("style");
     style.innerHTML = script;
     document.documentElement.firstChild.appendChild(style);
  });

  function loadJSScripts() {
    _(response.jsScripts).each(function(script) {
      var scriptTag = document.createElement("script");
      scriptTag.innerHTML = script;
      document.body.appendChild(scriptTag);
    });
  }

});
