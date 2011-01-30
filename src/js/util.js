$.fn.classIf = function(cond, trueClass, falseClass) {
  cond ? $(this).addClass(trueClass).removeClass(falseClass)
       : $(this).removeClass(trueClass).addClass(falseClass);
}

function summary(s) {
  return s.length < 50 ? s : s.substr(0,23) + "..." + s.substr(s.length-23);
}
