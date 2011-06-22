$(function() {
  $("#clear").click(function() {
    if (!confirm("THIS IS SERIOUS MUM!!!\n"+
       "You're about to delete all of your Control Freak scripts PERMANENTLY."))
       return;
    scriptDAO.clear();
    repaint();
  });
  $("#refresh").click(repaint);
  repaint();
});

function repaint() {
  var scriptTemplate = _.template($("#scriptTemplate").val());
  var script_ul = $("ul#scripts").empty();
  _(scriptDAO.all()).each(function(script) {
    var list_item = $("<li/>").html(scriptTemplate(script));
    list_item.children("a.delete").click(
      _.bind(item_delete_handler, script));
    list_item.children("a.preview").click(
      _.bind(function(){$(this).children('pre').slideToggle();}, list_item));
    list_item.appendTo(script_ul);
  });
}

function item_delete_handler() {
  scriptDAO.rm(this.scriptType, this.scope);
  repaint();
}

function renderScope(scope) {
  if (scope=="*") return "All Websites";
  return "<a href='"+
         (isURL(scope) ? scope : "http://"+scope) + "'>"+summary(scope)+"</a>";
}
