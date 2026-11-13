(function () {
"use strict";

let redirecting = false;

function showOfflinePage() {
if (redirecting) return;

const current = window.location.pathname;

if (current.endsWith("/offline.html")) return;

redirecting = true;

window.location.href = new URL(
  "offline.html",
  window.location.href
).href;

}

async function checkConnection() {
if (!navigator.onLine) {
showOfflinePage();
return;
}

try {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    5000
  );

  await fetch(
    "https://hasankutainy77-sketch.github.io/SynapseMed-App/",
    {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal
    }
  );

  clearTimeout(timeout);
} catch (error) {
  showOfflinePage();
}

}

window.addEventListener("offline", showOfflinePage);

window.addEventListener("online", checkConnection);

document.addEventListener("click", function (event) {
const link = event.target.closest("a");

if (!link) return;

if (!navigator.onLine) {
  event.preventDefault();
  showOfflinePage();
}

});

window.addEventListener("pageshow", function () {
checkConnection();
});

})();
