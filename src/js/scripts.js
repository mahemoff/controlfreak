document.addEventListener("DOMContentLoaded", function () {
  document.title = chrome.i18n.getMessage("listWindowTitle");

  var placeholders = ["listWindowTitle", "listClearTweaks", "listSyncTweaks"];
  var tplData = {};
  placeholders.forEach(function (placeholder) {
    tplData[placeholder] = chrome.i18n.getMessage(placeholder);
  });

  var html = Templates.render("scripts", tplData);
  document.body.html(html);

  var labelHTML = $("#sync-option").html();
  $("#sync-option").html(labelHTML.replace("%quota%", "<span id='quota'>" + chrome.storage.sync.QUOTA_BYTES_PER_ITEM + "</span>"));

  // bind clear freaks handler
  $("#clear").bind("click", function () {
    if (!confirm(chrome.i18n.getMessage("listClearWarning")))
      return;

    var storageType = localStorage.type === "sync" ? "sync" : "local";
    chrome.storage[storageType].clear();
  });

  // update sync checkbox state
  var syncCheckbox = $("#sync");
  var storageType = localStorage.type === "sync" ? "sync" : "local";
  syncCheckbox.checked = (storageType === "sync");

  // bind change sync state
  syncCheckbox.bind("click", function () {
    var syncState = this.checked;
    this.disabled = true;

    chrome.runtime.sendMessage({action: "changeStorageType", sync: syncState}, function () {
      syncCheckbox.disabled = false;
    });
  });

  // repaint data on storage change
  chrome.storage.onChanged.addListener(repaint);

  // paint freaks on load
  repaint();

  function repaint() {
    var script_ul = $("#scripts").empty();
    var storageType = localStorage.type === "sync" ? "sync" : "local";

    chrome.storage[storageType].get(null, function (obj) {
      var scripts = [];
      var tplData = [];

      for (var key in obj) {
        var matches = key.match(/^(js|css|libs)-(.+)/);
        if (matches) {
          scripts.push({
            scriptType: matches[1],
            scope: matches[2],
            text: obj[key],
            location: $("<a/>").attr("href", matches[2])
          });
        }
      }

      scripts.sort(function (scriptA, scriptB) {
        if (scriptA.scope=="*" && scriptB.scope!="*") return -1;
        if (scriptB.scope=="*" && scriptA.scope!="*") return 1;
        // @todo sort with pathname & origin?
        if (scriptA.scope<scriptB.scope) return -1;
        if (scriptB.scope<scriptA.scope) return 1;
        return scriptA.scriptType < scriptB.scriptType;
      });

      scripts.forEach(function (script) {
        var highlight, scope;

        switch (script.scriptType) {
          case "js": highlight = "javascript"; break;
          case "css": highlight = "css"; break;
          case "libs": highlight = "json"; break;
        }

        if (script.scope === "*")
          scope = chrome.i18n.getMessage("listScopeAll");
        else
          scope = $("<a/>").attr({href: script.scope, target: "_blank", title: chrome.i18n.getMessage("listOpenNewTab")}).html(script.scope).outerHTML;

        tplData.push({
          type: script.scriptType.toUpperCase(),
          scope: scope,
          listDelete: chrome.i18n.getMessage("listDelete"),
          highlight: highlight,
          text: (typeof script.text === "string") ? script.text : JSON.stringify(script.text, null, "  "),
          key: script.scriptType + "-" + script.scope
        });
      });

      script_ul.html(Templates.render("list", {tweaks: tplData}));

      $$(script_ul, "a.delete").bind("click", function (evt) {
        if (confirm(chrome.i18n.getMessage("listRemoveWarning"))) {
          var storageType = localStorage.type === "sync" ? "sync" : "local";
          var key = this.closestParent("li").data("key");
          chrome.storage[storageType].remove(key);
        }

        evt.preventDefault();
      });

      // highlight
      $$("pre code").each(function () {
        hljs.highlightBlock(this);
      });
    });
  }
}, false);
