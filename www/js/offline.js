(function () {
"use strict";

let redirecting = false;

function getOfflinePage() {
const path = window.location.pathname;
const appRoot = path.split("/simulators/")[0];

return window.location.origin + appRoot + "/offline.html";

}

function showOfflinePage() {
if (redirecting) return;

if (window.location.pathname.endsWith("/offline.html")) {
  return;
}

redirecting = true;
window.location.replace(getOfflinePage());

}

async function checkConnection() {
if (!navigator.onLine) {
showOfflinePage();
return;
}

const controller = new AbortController();

const timeout = setTimeout(() => {
  controller.abort();
}, 5000);

try {
  await fetch(
    "https://hasankutainy77-sketch.github.io/SynapseMed-App/",
    {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal
    }
  );
} catch (error) {
  showOfflinePage();
} finally {
  clearTimeout(timeout);
}

}

window.addEventListener("offline", showOfflinePage);
window.addEventListener("online", checkConnection);

window.addEventListener("pageshow", checkConnection);

})();
