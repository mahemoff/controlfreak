var editor;

if (!localStorage["scopeLevel"]) localStorage["scopeLevel"] = "all";
if (!localStorage["tab"]) localStorage["tab"] = "js";

document.addEventListener("DOMContentLoaded", function () {
  var scopeLevels = $$(".scopeLevel");
  scopeLevels && scopeLevels.bind("click", function () {
    updateScopeLevel(this.id);
  });

  var tabs = $$(".tab");
  tabs && tabs.bind("click", function () {
    updateTab(this.id);
  });

  $("#save").bind("click", save);

  setupEditor();
  setupLibs();
  setupPageUpdating();
  repaint();
}, false);

function setupEditor() {
  editor = CodeMirror.fromTextArea($("#code"), {
    mode: translatedScriptType(),
    height: "200px",
    tabMode: "indent",
    saveFunction: save, // map cmd+s to the save button's function
    matchBrackets: true, // auto insert parens where needed
    lineNumbers: true
  });
}

function translatedScriptType() {
  return localStorage["tab"] === "js" ? "javascript" : "css"
}

function setupLibs() {
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
}

function showLibs() {
  $("#libs").css("display", "block");
}

function onPageChange(page) {
  updateScopeLevel(localStorage["scopeLevel"]);
  updateTab(localStorage["tab"]);
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
