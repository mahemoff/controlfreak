chrome.extension.sendRequest(document.location.href, function(response) {
  _(response.jsScripts).each(function(script) {
   try {
     // see http://is.gd/Dr4hq0
     window.eval.call(window,script);
   } catch(e) {
     console.log("error running", script);
   }
  });
  _(response.cssScripts).each(function(script) {
     var style = document.createElement("style");
     style.innerHTML = script;
     document.documentElement.firstChild.appendChild(style);
  });

});
