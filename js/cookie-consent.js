/* -----------------------------------------------------
   GDPR-COMPATIBLE COOKIE CONSENT SYSTEM – DARK VERSION
------------------------------------------------------ */

(() => {
  const STORAGE_KEY = "cookieConsent";
  const CONSENT_VERSION = "1.0";

  const defaultConsent = {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: null
  };

  function loadConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.version !== CONSENT_VERSION) return null;
      return parsed;
    } catch (e) {
      console.warn("Nem sikerült beolvasni a hozzájárulást:", e);
      return null;
    }
  }

  function saveConsent(consent) {
    const result = {
      ...defaultConsent,
      ...consent,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    return result;
  }

  function dispatchConsentEvent(consent) {
    window.dispatchEvent(
      new CustomEvent("cookieConsentApplied", { detail: consent })
    );
  }

  function applyUIFromConsent(consent) {
    const analytics = document.getElementById("consent-analytics");
    const marketing = document.getElementById("consent-marketing");

    if (analytics) analytics.checked = !!consent.analytics;
    if (marketing) marketing.checked = !!consent.marketing;
  }

  /* Banner megjelenítése / elrejtése – többször is működjön */
  function showBanner() {
    const banner = document.getElementById("cookie-banner");
    if (!banner) return;
    // ha valahol maradt volna "hidden" class, vegyük le
    banner.classList.remove("hidden");
    banner.classList.add("show");
  }

  function hideBanner() {
    const banner = document.getElementById("cookie-banner");
    if (!banner) return;
    banner.classList.remove("show");
  }

  /* UI események bekötése */
  function initUI(consent) {
    const acceptAll       = document.getElementById("cookie-accept-all");
    const rejectAll       = document.getElementById("cookie-reject-all");
    const acceptSelected  = document.getElementById("cookie-accept-selected");
    const settingsToggle  = document.getElementById("cookie-settings-toggle");

    if (!acceptAll || !rejectAll || !acceptSelected) return;

    // Összes elfogadása
    acceptAll.addEventListener("click", () => {
      const newConsent = saveConsent({
        analytics: true,
        marketing: true
      });
      hideBanner();
      dispatchConsentEvent(newConsent);
    });

    // Csak szükséges sütik
    rejectAll.addEventListener("click", () => {
      const newConsent = saveConsent({
        analytics: false,
        marketing: false
      });
      hideBanner();
      dispatchConsentEvent(newConsent);
    });

    // Kiválasztottak mentése
    acceptSelected.addEventListener("click", () => {
      const analyticsEl = document.getElementById("consent-analytics");
      const marketingEl = document.getElementById("consent-marketing");

      const analytics = analyticsEl ? !!analyticsEl.checked : false;
      const marketing = marketingEl ? !!marketingEl.checked : false;

      const newConsent = saveConsent({
        analytics,
        marketing
      });

      hideBanner();
      dispatchConsentEvent(newConsent);
    });

    // „Süti beállítások” gomb – bármikor nyisson
    if (settingsToggle) {
      settingsToggle.addEventListener("click", () => {
        const stored = loadConsent() || defaultConsent;
        applyUIFromConsent(stored);
        showBanner();
      });
    }
  }

  /* Publikus API – GA, egyéb script később ehhez igazodhat */
  function exposeAPI() {
    window.cookieConsent = {
      getConsent() {
        return loadConsent() || { ...defaultConsent };
      },
      hasConsent(type) {
        const c = loadConsent() || { ...defaultConsent };
        return !!c[type];
      },
      openSettings() {
        const c = loadConsent() || defaultConsent;
        applyUIFromConsent(c);
        showBanner();
      }
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    exposeAPI();

    const consent = loadConsent();
    initUI(consent || defaultConsent);

    // első látogatáskor – automatikus megjelenítés
    if (!consent) {
      showBanner();
    } else {
      // ha már döntött, jelezzük az esetleges scripteknek
      dispatchConsentEvent(consent);
    }
  });
})();
