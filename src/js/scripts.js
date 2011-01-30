$(function() {
  $("#clear").click(function() {
    if (!confirm("THIS IS SERIOUS MUM!!!\n"+
       "You're about to delete all of your Control Freak scripts PERMANENTLY."))
       return;
    for (key in localStorage) delete localStorage[key];
    repaint();
  });
  $("#refresh").click(repaint);
  repaint();
});

function repaint() {
  var scriptTemplate = _.template($("#scriptTemplate").val());
  $("ul").empty();
  _(scriptDAO.all()).each(function(script) {
    $("<li>").html(scriptTemplate(script)).appendTo("ul");
  });
}

function renderScope(scope) {
  if (scope=="*") return "All Websites";
  return "<a href='"+
         (isURL(scope) ? scope : "http://"+scope) + "'>"+summary(scope)+"</a>";
}
