(function () {
    var lastVisitedURL;

    // send message on inserted
    informBackend();

    // listen to History API changes
    window.addEventListener("popstate", informBackend, false);

    function informBackend() {
        var currentURL = document.location.href.replace(new RegExp(document.location.hash + "$"), "");

        if (lastVisitedURL !== currentURL) {
            lastVisitedURL = currentURL;
            chrome.runtime.sendMessage({action: "content", url: lastVisitedURL});
        }
    }
})();
