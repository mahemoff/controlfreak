document.addEventListener("DOMContentLoaded", function () {
  var freaks = {};
  var priority = ["page", "origin", "all"];
  var scopes = ["js", "css", "libs"];

  // show debug link when needed
  if (config.DEBUG)
    $(".tabs-zone a.hidden").removeClass("hidden");

  // bind change scopes handler
  $$(".scope-zone [data-id]").bind("click", function () {
    if (this.hasClass("active"))
      return;

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
    $(".tabs-zone [data-id='" + nonEmptyScope + "']").click();
  });

  // bind change tabs handler
  $$(".tabs-zone [data-id]").bind("click", function () {
    if (this.hasClass("active"))
      return;

    $$(this.parentNode, "li").removeClass("active");
    this.addClass("active");

    var scope = $(".scope-zone .active").data("id");
    var data = freaks[this.data("id") + "_" + scope];

    if (this.data("id") === "libs") {
      data = (data || []).join("\n");
    } else {
      data = data || "";
    }

    $(".arena-zone textarea").val(data);
  });

  // bind save action handler
  $("#save").bind("click", function () {
    var scope = $(".scope-zone .active").data("id");
    var tab = $(".tabs-zone .active").data("id");
    var areaData = $(".arena-zone textarea").val().trim();

    var storageType = localStorage.type === "sync" ? "sync" : "local";
    var storageKey = (scope === "all")
      ? tab + "-*"
      : tab + "-" + $("#scopeDisplay").text();

    if (areaData.length) {
      var saveData = {};
      saveData[storageKey] = (tab === "libs")
        ? areaData.split("\n")
        : areaData;

      chrome.storage[storageType].set(saveData);
    } else {
      chrome.storage[storageType].remove(storageKey);
    }
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
      stuff: {
        for (var i = 0; i < priority.length; i++) {
          for (var j = 0; j < scopes.length; j++) {
            key = scopes[j] + "_" + priority[i];

            if (res[key]) {
              $(".scope-zone li[data-id='" + priority[i] + "']").click();
              $(".tabs-zone li[data-id='" + scopes[j] + "']").click();

              freaksFound = true;
              break stuff;
            }
          }
        }
      } 

      if (!freaksFound) {
        $(".scope-zone li[data-id='page']").click();
        $(".tabs-zone li[data-id='js']").click();
      }
    });

    

    // search for all tweaks for this page on css/js/libs
    // then select proper tab on "all-origin-page" and "css-js/lib"

    // chrome.runtime.sendMessage({action: "search", type: "js", url: tab.url}, function (res) {

    // });


    
    

    // currentPage = new Page(tab.url);
    // 
    // $("#scopeDisplay").html(scopeLevel=="all" ? "all sites" : (scopeLevel=="host" ? currentPage.getHost() : currentPage.getURL()));
    // load scripts and fill "defined" classes
    


    return;

    
    
    // initialize CodeMirror editor
    var editor = CodeMirror.fromTextArea($("#code"), {
      mode: translatedScriptType(),
      height: "200px",
      tabMode: "indent",
      saveFunction: save, // map cmd+s to the save button's function
      matchBrackets: true, // auto insert parens where needed
      lineNumbers: true
    });

    if (!localStorage["scopeLevel"]) localStorage["scopeLevel"] = "all";
    if (!localStorage["tab"]) localStorage["tab"] = "js";

    updateScopeLevel(localStorage["scopeLevel"]);
    updateTab(localStorage["tab"]);

    function translatedScriptType() {
      return localStorage["tab"] === "js" ? "javascript" : "css"
    }

    function showLibs() {
      $("#libs").css("display", "block");
    }

    function updateScopeLevel(scopeLevel) {
      localStorage["scopeLevel"] = scopeLevel;
      repaint();
    }

    function updateTab(scriptType) {
      save();
      localStorage["tab"] = scriptType;
      repaint();
    }

    function repaint() {
      $(".active").removeClass("active");
      var scopeLevel=localStorage["scopeLevel"], tab=localStorage["tab"];
      
      editor.setOption("mode", translatedScriptType() );

      $("#scopeDisplay").html(scopeLevel=="all" ? "all sites" : (scopeLevel=="host" ? currentPage.getHost() : currentPage.getURL()));
      $(".scopeLevel[id="+scopeLevel+"]").addClass("active");

      scriptDAO.load(localStorage["scriptType"], getScope(), function (contents) {
        editor.setValue(contents||"");
      
        $(".tab[id="+tab+"]").addClass("active");
        if (tab == "libs") {
          repaintLibs();
        } else {
          repaintEditor();
        }

        repaintPresenceIndicators();
      });
    }

    function repaintLibs() {
      radio($("#editLibs"));
      $("#popularLibs").val("");

      scriptDAO.load("libs", getScope(), function (contents) {
        contents = contents || [];
        $("#libsList").val(contents.join("\n"));
      });
    }

    function repaintEditor() {
      radio($(".CodeMirror"));
      editor.focus();

      scriptDAO.load(localStorage["tab"], getScope(), function (contents) {
        editor.setValue(contents||"");
      });
    }

    function repaintPresenceIndicators(tab, scopeLevel) {
      // TODO maybe change this to show if any? are relevant
      $$(".scopeLevel").each(function () {
        var el = this;

        scriptDAO.defined(tab, getScope(this.id), function (defined) {
          if (defined) {
            el.addClass("defined");
            el.removeClass("undefined");
          } else {
            el.addClass("defined");
            el.removeClass("undefined");
          }
        });
      });

      $$(".tab").each(function () {
        var el = this;

        scriptDAO.defined(this.id, getScope(), function (defined) {
          if (defined) {
            el.addClass("defined");
            el.removeClass("undefined");
          } else {
            el.removeClass("defined");
            el.addClass("undefined");
          }
        });
      });
    }

    // only need to save current tab, since switching tab forces a save
    function save() {
      var saveData;

      if (localStorage["tab"]=="libs") {
        var libsList = $("#libsList").val().trim();
        var libs = libsList.length ? libsList.split(/[ \t\n]+/) : [];
        saveData = [libs, "libs", getScope()];
      } else {
        saveData = [editor.getValue(), localStorage["tab"], getScope()];
      }

      scriptDAO.save.apply(scriptDAO, saveData.concat(repaint));
    }

    function getScope(scopeLevel) {
      var scopeLevel = scopeLevel || localStorage["scopeLevel"];
      return scopeLevel=="all" ? "*" : (scopeLevel=="host" ? currentPage.getHost() : currentPage.getURL());
    }

    function radio(el) {
      Array.prototype.forEach.call(el.parentNode.childNodes, function (elem) {
        if (el === elem) {
          el.css("display", "block");
        } else {
          el.css("display", "none");
        }
      });
    }

    $$(".scopeLevel").bind("click", function () {
      updateScopeLevel(this.id);
    });

    $$(".tab").bind("click", function () {
      updateTab(this.id);
    });

    $("#save").bind("click", save);

    // setup libs
    $("#libsList").bind("keyup", function () {
      // dispatch change event
    });

    $("#popularLibs").bind("change", function () {
      var libsList = $("#libsList");

      var libsListValue = libsList.val();
      if (libsListValue.length)
        libsListValue+="\n";

      libsListValue += this.val();
      libsList.val(libsListValue);
    });

    repaint();
  });

  
}, false);
