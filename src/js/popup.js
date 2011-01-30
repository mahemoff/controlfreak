var editor;

if (!localStorage["scopeLevel"]) localStorage["scopeLevel"] = "all";
if (!localStorage["scriptType"]) localStorage["scriptType"] = "js";

$(function() {

  editor = CodeMirror.fromTextArea("code", {
    basefiles: ["../lib/codemirror/codemirror-base.min.js"],
    stylesheet: ["../lib/codemirror/jscolors.css",
                 "../lib/codemirror/csscolors.css"],
    height: "190px",
    saveFunction: save, // map cmd+s to the save button's function
    autoMatchParens: true, // auto insert parens where needed
    onLoad: setupPageUpdating
  });

  $(".scopeLevel").click(function() {
    updateScopeLevel($(this).attr("id"));
    editor.focus();
  });

  $(".scriptType").click(function() {
    updateScriptType($(this).attr("id"));
    editor.focus();
  });

});

function onPageChange(page) {
  updateScopeLevel(localStorage["scopeLevel"]);
  updateScriptType(localStorage["scriptType"]);
}
function updateScopeLevel(scopeLevel) {
  localStorage["scopeLevel"] = scopeLevel;
  repaint();
}
function updateScriptType(scriptType) {
  localStorage["scriptType"] = scriptType;
  repaint();
}

function repaint() {
  $(".active").removeClass("active");

  var scopeLevel=localStorage["scopeLevel"], scriptType=localStorage["scriptType"];
  
  $("#scopeDisplay").html(scopeLevel=="all" ? "all sites" : (scopeLevel=="host" ? currentPage.getHost() : currentPage.getURL()));
  $(".scopeLevel[id="+scopeLevel+"]").addClass("active");
  editor.setCode(scriptDAO.load(localStorage["scriptType"], getScope())||"");
  
  $(".scriptType[id="+scriptType+"]").addClass("active");
  editor.setCode(scriptDAO.load(localStorage["scriptType"], getScope())||"");
  
  $(".scopeLevel").each(function(i, aScopeLevel) {
    $(this).classIf(scriptDAO.defined(scriptType, getScope(aScopeLevel.id)),
      "defined", "undefined");
  });

  $(".scriptType").each(function(i, aScriptType) {
    $(this).classIf(scriptDAO.defined(aScriptType.id, getScope(scopeLevel)),
      "defined", "undefined");
  });
  
  //force a re-highlight of the new loaded code.
  editor.editor.highlightDirty();
}

function save() {
  scriptDAO.save(editor.getCode(), localStorage["scriptType"], getScope());
  repaint();
}

function getScope(scopeLevel) {
  var scopeLevel = scopeLevel || localStorage["scopeLevel"];
  return scopeLevel=="all" ? "*" : (scopeLevel=="host" ? currentPage.getHost() : currentPage.getURL());
}

function log(m) {
  console.log(m);
}
