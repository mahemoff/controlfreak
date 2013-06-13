document.addEventListener("DOMContentLoaded", function () {
  $("#clear").bind("click", function () {
    if (!confirm("THIS IS SERIOUS MUM!!!\n"+
       "You're about to delete all of your Control Freak scripts PERMANENTLY."))
       return;

    scriptDAO.clear(repaint);
  });

  $("#refresh").bind("click", repaint);
  repaint();

  $("#quota").html(chrome.storage.sync.QUOTA_BYTES_PER_ITEM);

  var syncCheckbox = $("#sync");
  if (localStorage.getItem("storage_option") === "sync")
    syncCheckbox.prop("checked", true);

  syncCheckbox.bind("click", function () {
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
}, false);

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
      $$(list_item, "a.delete").bind("click", item_delete_handler.bind(script));

      $$(list_item, "a.preview").bind("click", function () {
        $$(list_item, "pre").each(function () {
          // @todo
          this.toggleClass("hidden");
        });
      });

      script_ul.append(list_item);
    });
  });
}

function item_delete_handler() {
  scriptDAO.rm(this.scriptType, this.scope, repaint);
}

function renderScope(scope) {
  if (scope=="*")
    return "All Websites";

  var linkTitle = scopr.length < 50 ? scope : scope.substr(0,23) + "..." + scope.substr(scope.length-23);
  return "<a href='"+(isURL(scope) ? scope : "http://"+scope) + "'>"+linkTitle+"</a>";
}
