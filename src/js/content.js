(function () {
    var lastVisitedURL;

    // send message on inserted
    informBackend();

    // listen to History API changes
    window.addEventListener("popstate", informBackend, false);

    function informBackend() {
        if (lastVisitedURL !== document.location.href) {
            lastVisitedURL = document.location.href;
            chrome.runtime.sendMessage({action: "content", url: lastVisitedURL}, function (res) {
                if (res.chrome)
                    return;

                if (res.css.length) {
                    var style = document.createElement("style");
                    style.innerHTML = res.css;
                    document.querySelector("head").appendChild(style);
                }

                if (res.js.length) {
                    var scriptTag = document.createElement("script");
                    scriptTag.innerHTML = res.js;
                    document.body.appendChild(scriptTag);
                }
            });
        }
    }
})();
