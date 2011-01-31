var editor;

if (!localStorage["scopeLevel"]) localStorage["scopeLevel"] = "all";
if (!localStorage["tab"]) localStorage["tab"] = "js";

$(function() {

  $(".scopeLevel").click(function() {
    updateScopeLevel($(this).attr("id"));
  });

  $(".tab").click(function() {
    updateTab($(this).attr("id"));
  });

  $("#save").click(save);

  setupEditor();
  setupLibs();

});

function setupEditor() {
  editor = CodeMirror.fromTextArea("code", {
    basefiles: ["../lib/codemirror/codemirror-base.min.js"],
    stylesheet: ["../lib/codemirror/jscolors.css",
                 "../lib/codemirror/csscolors.css"],
    height: "220px",
    saveFunction: save, // map cmd+s to the save button's function
    autoMatchParens: true, // auto insert parens where needed
    onLoad: setupPageUpdating
  });
}

function setupLibs() {

  $("#libsList").change(function() {
  });
  $("#libsList").keyup(function() { $(this).change(); });

  $("#popularLibs").change(function() {
    var libsList = ($("#libsList")).val();
    if (libsList.length) libsList+="\n";
    libsList+=$("#popularLibs").val();
    $("#libsList").val(libsList);
  });

}

function showLibs() {
  $("#libs").show();
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
  
  $("#scopeDisplay").html(scopeLevel=="all" ? "all sites" : (scopeLevel=="host" ? currentPage.getHost() : currentPage.getURL()));
  $(".scopeLevel[id="+scopeLevel+"]").addClass("active");
  editor.setCode(scriptDAO.load(localStorage["scriptType"], getScope())||"");
  
  $(".tab[id="+tab+"]").addClass("active");
  if (tab == "libs") {
    repaintLibs();
  } else {
    repaintEditor();
  }

  repaintPresenceIndicators();
  
}

function repaintLibs() {
  $("#editLibs").radio();
  $("#newLib").empty();
  $("#popularLibs").val("");
  $("#libsList").val((scriptDAO.load("libs", getScope())||[]).join("\n"));
}

function repaintEditor() {
  $(editor.wrapping).radio();
  // $(".CodeMirror-wrapping").show();
  editor.focus();
  editor.editor.highlightDirty(); // re-highlight new loaded code.
  editor.setCode(scriptDAO.load(localStorage["tab"], getScope())||"");
}

function repaintPresenceIndicators(tab, scopeLevel) {
  // TODO maybe change this to show if any? are relevant
  $(".scopeLevel").each(function(i, aScopeLevel) {
    $(this).classIf(scriptDAO.defined(tab, getScope(aScopeLevel.id)),
      "defined", "undefined");
  });

  $(".tab").each(function(i, aScriptType) {
    $(this).classIf(scriptDAO.defined(aScriptType.id, getScope()),
      "defined", "undefined");
  });
}

// only need to save current tab, since switching tab forces a save
function save() {
  if (localStorage["tab"]=="libs") {
    var libsList = $.trim($("#libsList").val());
    var libs = libsList.length ? libsList.split(/[ \t\n]+/) : [];
    scriptDAO.save(libs, "libs", getScope());
  } else {
    scriptDAO.save(editor.getCode(), localStorage["tab"], getScope());
  }
  repaint();
}

function getScope(scopeLevel) {
  var scopeLevel = scopeLevel || localStorage["scopeLevel"];
  return scopeLevel=="all" ? "*" : (scopeLevel=="host" ? currentPage.getHost() : currentPage.getURL());
}

function log(m) { console.log(m); }

$.fn.radio = function() { $(this).show().siblings().hide(); }
