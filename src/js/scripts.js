$(function() {
  $("#clear").click(function() {
    if (!confirm("THIS IS SERIOUS MUM!!!\n"+
       "You're about to delete all of your Control Freak scripts PERMANENTLY."))
       return;

    scriptDAO.clear(repaint);
  });

  $("#refresh").click(repaint);
  repaint();

  window.addEventListener("storage", repaint, false);

  $("#sync").click(function () {
    chrome.permissions.request({
      permissions: ["storage"]
    }, function () {
      console.log(arguments);
//       chrome.storage.sync.get("smth", function (obj) {
//   console.log(obj)
// })
      chrome.storage.onChanged.addListener(function (changes, areaName) {
        console.log([areaName, changes]);
      });
    })
  });
});

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
