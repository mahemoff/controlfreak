$(function() {
  $("#clear").click(function() {
    if (!confirm("THIS IS SERIOUS MUM!!!\n"+
       "You're about to delete all of your Control Freak scripts PERMANENTLY."))
       return;

    scriptDAO.clear(repaint);
  });

  $("#refresh").click(repaint);
  repaint();

  $("#quota").html(chrome.storage.sync.QUOTA_BYTES_PER_ITEM);

  var syncCheckbox = $("#sync");
  if (localStorage.getItem("storage_option") === "sync")
    syncCheckbox.prop("checked", true);

  syncCheckbox.click(function () {
    var syncState = this.checked;

    chrome.permissions.request({
      permissions: ["storage"]
    }, function (granted) {
      if (!granted)
        return;

      localStorage.setItem("storage_option", syncState ? "sync" : "local");
      scriptDAO.changeSyncState(syncState, function () {
        repaint();
        listenToStorageChanges();
      });
    });
  });

  listenToStorageChanges();
});

// listen to chrome.storage and localStorage changes
function listenToStorageChanges() {
  window.removeEventListener("storage", repaint, false);
  try {
    chrome.storage.onChanged.removeListener(repaint);
  } catch (ex) {}

  window.addEventListener("storage", repaint, false);
  try {
    chrome.storage.onChanged.addListener(repaint);
  } catch (ex) {}
}

function repaint() {
  var scriptTemplate = _.template($("#scriptTemplate").val());
  var script_ul = $("ul#scripts").empty();

  scriptDAO.all(function (tweaks) {
    _(tweaks).each(function(script) {
      var list_item = $("<li/>").html(scriptTemplate(script));
      list_item.children("a.delete").click(
        _.bind(item_delete_handler, script));
      list_item.children("a.preview").click(
        _.bind(function(){$(this).children('pre').slideToggle();}, list_item));
      list_item.appendTo(script_ul);
    });
  });
}

function item_delete_handler() {
  scriptDAO.rm(this.scriptType, this.scope, repaint);
}

function renderScope(scope) {
  if (scope=="*") return "All Websites";
  return "<a href='"+
         (isURL(scope) ? scope : "http://"+scope) + "'>"+summary(scope)+"</a>";
}
