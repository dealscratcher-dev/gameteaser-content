/**
 * Production AdSense — gameteaser.netlify.app
 * Publisher: ca-pub-4190145625443935
 */
(function () {
  const PUB = "ca-pub-4190145625443935";

  /** Paste AdSense slot IDs here after creating display ad units (optional) */
  const SLOTS = {
    leaderboard: "",
    incontent: "",
    rectangle: "",
    footer: "",
  };

  function hasSlot(v) {
    return v && /^\d{8,16}$/.test(v) && !/^0+$/.test(v);
  }

  function initUnits() {
    document.querySelectorAll("[data-ad-unit]").forEach((el) => {
      const key = el.getAttribute("data-ad-unit");
      const slot = SLOTS[key];
      el.setAttribute("data-ad-client", PUB);
      if (hasSlot(slot)) {
        el.setAttribute("data-ad-slot", slot);
      }
    });
  }

  function pushUnits() {
    let n = 0;
    document.querySelectorAll("ins.adsbygoogle[data-ad-slot]").forEach(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        n += 1;
      } catch (e) {
        console.warn("[AdSense]", e);
      }
    });
    return n;
  }

  function showCookieNotice() {
    if (sessionStorage.getItem("gtCookieSeen")) return;
    const bar = document.createElement("div");
    bar.className = "cookie-notice";
    bar.innerHTML =
      '<p>This site uses Google AdSense cookies. <a href="privacy.html">Privacy</a></p>' +
      '<button type="button" id="cookie-got-it">Got it</button>';
    document.body.appendChild(bar);
    bar.querySelector("#cookie-got-it").onclick = () => {
      sessionStorage.setItem("gtCookieSeen", "1");
      bar.remove();
    };
  }

  function boot() {
    initUnits();
    document.body.classList.add("adsense-live");

    const manual = pushUnits();
    if (manual === 0) {
      document.body.classList.add("adsense-auto-only");
    }

    showCookieNotice();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
