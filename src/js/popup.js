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
  setupPageUpdating();
  repaint();

});

function setupEditor() {
  
  editor = CodeMirror.fromTextArea($("#code").get(0), {
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
  
  editor.setOption("mode", translatedScriptType() );

  $("#scopeDisplay").html(scopeLevel=="all" ? "all sites" : (scopeLevel=="host" ? currentPage.getHost() : currentPage.getURL()));
  $(".scopeLevel[id="+scopeLevel+"]").addClass("active");
  editor.setValue(scriptDAO.load(localStorage["scriptType"], getScope())||"");
  
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
  $("#popularLibs").val("");
  $("#libsList").val((scriptDAO.load("libs", getScope())||[]).join("\n"));
}

function repaintEditor() {
  $(".CodeMirror").radio();
  editor.focus();
  editor.setValue(scriptDAO.load(localStorage["tab"], getScope())||"");
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
    scriptDAO.save(editor.getValue(), localStorage["tab"], getScope());
  }
  repaint();
}

function getScope(scopeLevel) {
  var scopeLevel = scopeLevel || localStorage["scopeLevel"];
  return scopeLevel=="all" ? "*" : (scopeLevel=="host" ? currentPage.getHost() : currentPage.getURL());
}

function log(m) { console.log(m); }

$.fn.radio = function() { $(this).show().siblings().hide(); }
