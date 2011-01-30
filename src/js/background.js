chrome.extension.onRequest.addListener(function(req, sender, sendResponse) {
  var page = new Page(req);
  sendResponse({jsScripts: composeScripts(page, "js"),
                cssScripts: composeScripts(page, "css")});
});
function composeScripts(page, scriptType) {
  return _(["*", page.getHost(), page.getURL()])
    .chain()
    .map(function(scope) { return scriptDAO.load(scriptType, scope); })
    .reject(function(script) { return _.isEmpty(script); })
    .value();
}
