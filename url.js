function Page(url) {
  this.url = url;
  return this;
}
Page.prototype.getURL = function() {
  return this.url;
}
Page.prototype.getHost = function() {
  return this.url ? jQuery.url.setUrl(this.url).attr("host") : null;
}
Page.prototype.getSummaryURL = function() {
  return this.url.substr(15);
}

var currentPage = new Page();
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
