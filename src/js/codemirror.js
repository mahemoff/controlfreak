(function () {
  var textarea = $(".arena-zone textarea");
  var myCodeMirror = CodeMirror.fromTextArea(textarea, {
    mode: "css",
    tabSize: 2,
    lineNumbers: true,
    dragDrop: false
  });

  $$(".tabs-zone [data-id]").bind("click", function () {
    switch (this.data("id")) {
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

  $(".arena-zone select").bind("change", updateEditor);

  function updateEditor() {
    myCodeMirror.setSize("height", parseInt(getComputedStyle(textarea).height, 10));
    myCodeMirror.setValue(textarea.value);
  }
})();
