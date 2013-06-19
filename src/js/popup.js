document.addEventListener("DOMContentLoaded", function () {
  document.title = chrome.i18n.getMessage("popupWindowTitle");

  var placeholders = ["popupScopeDisplayAll", "popupScopeAll", "popupScopeOrigin", "popupScopePage", "popupTabsLibs", "popupManageAll", "popupSaveButtonTitle", "popupResetButtonTitle"];
  var tplData = {};
  placeholders.forEach(function (placeholder) {
    tplData[placeholder] = chrome.i18n.getMessage(placeholder);
  });

  var html = Templates.render("popup", tplData);
  document.body.html(html);

  var freaks = {};
  var priority = ["page", "origin", "all"];
  var scopes = ["js", "css", "libs"];
  var myCodeMirror;

  // show debug link when needed
  if (config.DEBUG)
    $(".tabs-zone a.hidden").removeClass("hidden");

  // prepare libraries list
  var libsSelect = $(".arena-zone select");
  var isCIS = [/^ru/, /^uk/, /^be/, /^kk/].some(function (lang) { return lang.test(navigator.language); });
  var optgroup, option, versions = [];
  var order, yandexPos;

  for (var libName in config.LIBS) {
    versions.length = 0;
    optgroup = $("<optgroup/>").attr("label", libName);

    // output Yandex CDN for CIS countries first
    order = Object.keys(config.LIBS[libName]);
    yandexPos = order.indexOf("Yandex");
    if (isCIS && yandexPos !== -1) {
      order.splice(yandexPos, 1);
      order.unshift("Yandex");
    }

    for (var i = 0; i < order.length; i++) {
      if (config.LIBS[libName][order[i]].versions) { // library with versions
        config.LIBS[libName][order[i]].versions.forEach(function (version) {
          if (versions.indexOf(version) !== -1)
            return;

          option = $("<option/>").val(config.LIBS[libName][order[i]].placeholder.replace("%version%", version)).html(version + " (" + order[i] + " CDN)");
          optgroup.append(option);

          versions.push(version);
        });
      } else { // without (json2 etc.)
        option = $("<option/>").val(config.LIBS[libName][order[i]].placeholder).html(order[i] + " CDN");
        optgroup.append(option);
      }
    }

    libsSelect.append(optgroup);
  }

  // bind change scopes handler
  $$(".scope-zone [data-id]").bind("click", function () {
    if (this.hasClass("active"))
      return;

    // save temporary unsaved value
    var textarea = $(".arena-zone textarea");
    if (textarea.data("state") === "changed")
      $("#save").click();

    $$(this.parentNode, "li").removeClass("active");
    this.addClass("active");

    $("#scopeDisplay").text(this.data("title"));

    var nonEmptyScope = null;
    for (var i = 0; i < scopes.length; i++) {
      if (freaks[scopes[i] + "_" + this.data("id")]) {
        nonEmptyScope = scopes[i];
        break;
      }
    }

    nonEmptyScope = nonEmptyScope || "js";
    $(".tabs-zone [data-id='" + nonEmptyScope + "']").removeClass("active").click();
  });

  // bind change tabs handler
  $$(".tabs-zone [data-id]").bind("click", function () {
    if (this.hasClass("active"))
      return;

    // save temporary unsaved value
    var textarea = $(".arena-zone textarea");
    if (textarea.data("state") === "changed")
      $("#save").click();

    var scope = $(".scope-zone .active").data("id");
    var el = this;
    var tabSelected = this.data("id");

    $$(this.parentNode, "li").removeClass("active").each(function () {
      if (this === el)
        this.addClass("active");

      if (freaks[this.data("id") + "_" + scope]) {
        this.addClass("defined");
      } else {
        this.removeClass("defined");
      }
    });

    var data = freaks[tabSelected + "_" + scope];

    if (tabSelected === "libs") {
      data = data || [];
      textarea.val(data.join("\n")).addClass("small").removeClass("hidden");
      $(".arena-zone select").removeClass("hidden").focus();

      // select options
      $$(".arena-zone option").each(function () {
        if (data.indexOf(this.value) !== -1) {
          this.selected = true;
        } else {
          this.selected = false;
        }
      });
    } else {
      data = data || "";
      textarea.val(data).removeClass("small", "hidden").focus();
      $(".arena-zone select").addClass("hidden");
    }

    switch (tabSelected) {
      case "css":
        myCodeMirror.setOption("mode", "css");
        break;

      case "js":
        myCodeMirror.setOption("mode", "javascript");
        break;

      case "libs":
        myCodeMirror.setOption("mode", "null");
        break;
    }

    updateEditor();
  });

  // bind change libs handler
  $(".arena-zone select").bind("change", function () {
    var libsSelected = [];
    var libsList = [];

    for (var i = 0; i < this.options.length; i++) {
      libsList.push(this.options[i].value);

      if (this.options[i].selected) {
        libsSelected.push(this.options[i].value);
      }
    }

    var currentLibs = $(".arena-zone textarea").val().split("\n").filter(function (el) {
      if (!el.trim().length)
        return false;

      if (libsList.indexOf(el.trim()) !== -1)
        return false;

      return true;
    });

    currentLibs = libsSelected.concat(currentLibs);
    $(".arena-zone textarea").val(currentLibs.join("\n")).data("state", "changed");

    updateEditor();
  });

  // bind keypress handler on textarea keypress
  $(".arena-zone textarea").bind("keypress", function () {
    this.data("state", "changed")
  });

  // bind save action handler
  $("#save").bind("click", function () {
    var btn = this.html(chrome.i18n.getMessage("popupSaveButtonTitleSaving") + "...").attr("disabled", true);
    var scope = $(".scope-zone .active").data("id");
    var tab = $(".tabs-zone .active").data("id");
    var areaData = $(".arena-zone textarea").data("state", "saved").val().trim();

    var cacheKey = tab + "_" + scope;
    var storageType = localStorage.type === "sync" ? "sync" : "local";
    var storageKey = (scope === "all")
      ? tab + "-*"
      : tab + "-" + $("#scopeDisplay").text();

    var onSaved = function () {
      btn.html(chrome.i18n.getMessage("popupSaveButtonTitleSaved") + "!");
      window.setTimeout(function () {
        btn.removeAttr("disabled").html(chrome.i18n.getMessage("popupSaveButtonTitle"));
      }, 1000);
    };

    if (areaData.length) {
      var saveData = {};
      saveData[storageKey] = (tab === "libs")
        ? areaData.split("\n")
        : areaData;

      chrome.storage[storageType].set(saveData, onSaved);
      freaks[cacheKey] = saveData[storageKey];
    } else {
      chrome.storage[storageType].remove(storageKey, onSaved);
      delete freaks[cacheKey];
    }
  });

  // @todo
  $("#reset").bind("click", function () {
    location.reload();
  });

  // update page properties
  chrome.tabs.getSelected(null, function (tab) {
    var currentPageOrigin = $("<a/>").attr("href", tab.url).origin;
    $(".scope-zone li[data-id='origin']").data("title", currentPageOrigin);
    $(".scope-zone li[data-id='page']").data("title", tab.url);

    // get all freaks for this page & select scope (all, origin, page) and tab (js, css, libs)
    chrome.runtime.sendMessage({action: "search", url: tab.url}, function (res) {
      // cache control freaks
      freaks = res;

      var freaksFound = false;
      var key;

      // @todo what if the tweak was made for index page?
      for (var i = 0; i < priority.length; i++) {
        for (var j = 0; j < scopes.length; j++) {
          key = scopes[j] + "_" + priority[i];

          if (res[key]) {
            if (!freaksFound) {
              $(".scope-zone li[data-id='" + priority[i] + "']").click();
              $(".tabs-zone li[data-id='" + scopes[j] + "']").click();

              freaksFound = true;
            }

            $(".scope-zone li[data-id='" + priority[i] + "']").addClass("defined");
          }
        }
      }

      if (!freaksFound) {
        $(".scope-zone li[data-id='page']").click();
        $(".tabs-zone li[data-id='js']").click();
      }
    });
  });

  // initialize codemirror editor
  var textarea = $(".arena-zone textarea");
  var selectedTab = $(".tabs-zone .active[data-id]");

  var mode;
  if (selectedTab) {
    mode = (selectedTab === "css") ? "css" : "javascript";
  } else {
    mode = "null";
  }

  myCodeMirror = CodeMirror.fromTextArea(textarea, {
    matchBrackets: true,
    mode: mode,
    tabSize: 2,
    lineNumbers: true,
    dragDrop: false
  });

  // bind textarea value update on codemirror value change
  myCodeMirror.on("change", function (obj) {
    textarea.val(obj.doc.getValue()).data("state", "changed");
  });

  function updateEditor() {
    myCodeMirror.setSize("height", parseInt(getComputedStyle(textarea).height, 10));
    myCodeMirror.setValue(textarea.value);
  }
}, false);
