(function () {
    "use strict";

    function updateConnectionStatus() {
        const isOnline = navigator.onLine;

        document.documentElement.classList.toggle(
            "is-offline",
            !isOnline
        );

        window.dispatchEvent(
            new CustomEvent("synapsemed:connectivity", {
                detail: {
                    online: isOnline
                }
            })
        );
    }

    window.addEventListener("online", updateConnectionStatus);
    window.addEventListener("offline", updateConnectionStatus);

    updateConnectionStatus();

})();
