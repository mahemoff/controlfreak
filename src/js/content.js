(function () {
    var lastVisitedURL;

    // send message on inserted
    informBackend();

    // listen to History API changes
    window.addEventListener("popstate", informBackend, false);

    function informBackend() {
        if (lastVisitedURL !== document.location.href) {
            lastVisitedURL = document.location.href;
            chrome.runtime.sendMessage({action: "content", url: lastVisitedURL});
        }
    }
})();
