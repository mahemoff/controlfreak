chrome.runtime.sendMessage(document.location.href, function (response) {
  require(response.libs, function () {
    response.jsScripts.forEach(function (script) {
      var scriptTag = document.createElement("script");
      scriptTag.innerHTML = script;
      document.body.appendChild(scriptTag);
    });
  });

  response.cssScripts.forEach(function (script) {
    var style = document.createElement("style");
    style.innerHTML = script;
    document.documentElement.firstChild.appendChild(style);
  });
});
