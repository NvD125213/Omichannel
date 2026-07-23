/** Set before redirecting unauthorized /ai access — triggers recovery on Back. */
export const AUTH_RECOVER_SESSION_KEY = "omni-auth-recover";

/**
 * Must run in <head> before React — pageshow/popstate fire before useEffect.
 * @see https://web.dev/articles/bfcache
 */
export const AUTH_NAV_RECOVERY_INLINE_SCRIPT = `
(function () {
  var RECOVER_KEY = "${AUTH_RECOVER_SESSION_KEY}";

  function recoverIfNeeded() {
    try {
      if (sessionStorage.getItem(RECOVER_KEY) === "1") {
        sessionStorage.removeItem(RECOVER_KEY);
        window.location.reload();
        return true;
      }
    } catch (e) {}
    return false;
  }

  window.addEventListener("unload", function () {});

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      recoverIfNeeded();
      return;
    }
    recoverIfNeeded();
  });

  window.addEventListener("popstate", function () {
    recoverIfNeeded();
  });
})();
`;
