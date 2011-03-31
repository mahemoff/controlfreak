function Page(url) {
  this.url = url;
  return this;
}
Page.prototype.getURL = function() {
  return this.url;
}
Page.prototype.getHost = function() {
  if (!this.url) return null;
  var url = jQuery.url.setUrl(this.url);
  var host = url.attr("host");
  if (url.attr("protocol") && url.attr("protocol")!="http") host = url.attr("protocol")+"://" + host;
  if (url.attr("port")) host = host + ":" + url.attr("port");
  return this.url ? host : null;
}
Page.prototype.getSummaryURL = function() {
  return this.url.substr(15);
}

var currentPage = new Page();

function setupPageUpdating() {

  chrome.tabs.getSelected(null, function(tab) {
    currentPage = new Page(tab.url);
    if (typeof(onPageChange)!="undefined") onPageChange(currentPage);
  });

  chrome.tabs.onSelectionChanged.addListener(function(tabID, selectInfo) {
    chrome.tabs.get(tabID, function(tab) {
      currentPage = new Page(tab.url);
      if (typeof(onPageChange)!="undefined") onPageChange(currentPage);
    });
  });

}
