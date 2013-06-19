(function () {
    var lastVisitedURL;

    // change install link on userscripts.org
    if (/scripts\/show\/[\d]+/.test(document.location.href) && document.location.hostname === "userscripts.org") {
        $("#install_script a.userjs").bind("click", function (evt) {
            var installBtn = this;

            chrome.runtime.sendMessage({
                action: "export",
                url: this.attr("href")
            }, function (res) {
                if (res.error) {
                    installBtn.html(res.error);
                    return;
                }

                console.log(res);
            });

            evt.preventDefault();
        }, false);
    }

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
