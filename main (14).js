
(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');

  const setMenu = open => {
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
  };

  menuButton.addEventListener('click', () =>
      setMenu(menuButton.getAttribute('aria-expanded') !== 'true')
  );

  nav.querySelectorAll('a').forEach(link =>
      link.addEventListener('click', () => setMenu(false))
  );

  const languageButton = document.querySelector('.lang-toggle');
  const languageOptions = document.querySelector('.lang-options');

  const setLanguageOpen = open => {
    languageOptions.hidden = !open;
    languageButton.setAttribute('aria-expanded', String(open));
  };

  languageButton.addEventListener('click', () =>
      setLanguageOpen(languageOptions.hidden)
  );

  languageOptions.querySelectorAll('[data-lang]').forEach(button =>
      button.addEventListener('click', () => {
        setLanguageOpen(false);
        alert(
            'Переклад ' + button.dataset.lang.toUpperCase() +
            ' ще не підключено. У WordPress для реальних мовних версій використайте Polylang.'
        );
      })
  );

  document.addEventListener('click', e => {
    if (!e.target.closest('.language')) setLanguageOpen(false);

    if (
        window.innerWidth <= 850 &&
        !e.target.closest('.nav') &&
        !e.target.closest('.menu-toggle')
    ) {
      setMenu(false);
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      setMenu(false);
      setLanguageOpen(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 850) setMenu(false);
  });

  const reveals = document.querySelectorAll('.reveal');

  if (
      'IntersectionObserver' in window &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    const observer = new IntersectionObserver(
        entries => entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        }),
        {
          threshold: 0.08,
          rootMargin: '0px 0px -25px 0px'
        }
    );

    reveals.forEach(item => observer.observe(item));
  } else {
    reveals.forEach(item => item.classList.add('visible'));
  }

  document.querySelector('#contact-form').addEventListener('submit', e => {
    e.preventDefault();
    document.querySelector('#form-status').textContent =
        'Форма працює у демонстраційному режимі. Для надсилання потрібно підключити серверний обробник або CRM.';
  });
})();





// CONSULT HUB — BACK TO TOP

document.addEventListener("DOMContentLoaded", () => {
  const backToTop = document.getElementById("backToTop");

  if (!backToTop) return;

  const toggleBackToTop = () => {
    const visible = window.scrollY > 400;

    backToTop.classList.toggle("is-visible", visible);
    backToTop.tabIndex = visible ? 0 : -1;
  };

  window.addEventListener("scroll", toggleBackToTop, {
    passive: true
  });

  toggleBackToTop();

  backToTop.addEventListener("click", () => {
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "instant" : "smooth"
    });
  });
});





/* CONSULT HUB — COOKIE CONSENT */

function initCookieConsent() {
  const KEY = 'consult_hub_cookie_consent_v1';

  const banner = document.getElementById('cookie-banner');
  const settings = document.getElementById('cookie-settings');
  const reopen = document.getElementById('cookie-reopen');
  const analytics = document.getElementById('cookie-analytics');
  const marketing = document.getElementById('cookie-marketing');
  const customize = document.getElementById('cookie-customize');

  if (!banner || !settings || !reopen ||
      !analytics || !marketing || !customize) return;

  function readConsent() {
    try {
      return JSON.parse(localStorage.getItem(KEY));
    } catch {
      return null;
    }
  }

  function saveConsent(analyticsAllowed, marketingAllowed) {
    const consent = {
      necessary: true,
      analytics: analyticsAllowed,
      marketing: marketingAllowed,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(KEY, JSON.stringify(consent));
    } catch (error) {
      console.warn('Cookie consent could not be saved', error);
    }

    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
      detail: consent
    }));

    banner.hidden = true;
    reopen.hidden = false;
    settings.hidden = true;
    customize.textContent = 'Налаштувати';
  }

  function openSettings() {
    const saved = readConsent();
    analytics.checked = saved?.analytics === true;
    marketing.checked = saved?.marketing === true;
    settings.hidden = false;
    customize.textContent = 'Зберегти вибір';
  }

  document.getElementById('cookie-accept')
      .addEventListener('click', () => saveConsent(true, true));

  document.getElementById('cookie-reject')
      .addEventListener('click', () => saveConsent(false, false));

  customize.addEventListener('click', () => {
    if (settings.hidden) {
      openSettings();
    } else {
      saveConsent(analytics.checked, marketing.checked);
    }
  });

  document.getElementById('cookie-close')
      .addEventListener('click', () => {
        banner.hidden = true;
        reopen.hidden = false;
        // Closing does not grant consent.
      });

  reopen.addEventListener('click', () => {
    banner.hidden = false;
    reopen.hidden = true;
    openSettings();
  });

  const saved = readConsent();

  if (saved) {
    banner.hidden = true;
    reopen.hidden = false;
  } else {
    banner.hidden = false;
    reopen.hidden = true;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCookieConsent);
} else {
  initCookieConsent();
}



/* ========================================
   CONSULT HUB — ANIMATED COUNTERS
======================================== */

document.addEventListener("DOMContentLoaded", () => {

  const section = document.querySelector(".ch-results");

  if (!section) return;

  const counters = section.querySelectorAll(".ch-counter");
  const duration = 1900; // milliseconds
  let animationStarted = false;

  function animateCounter(element) {

    const target = Number(element.dataset.target);
    const startTime = performance.now();

    function update(currentTime) {

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth ease-out animation
      const eased = 1 - Math.pow(1 - progress, 3);

      const value = Math.round(target * eased);

      element.textContent = value;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target;
      }
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

      if (entry.isIntersecting && !animationStarted) {

        animationStarted = true;

        // Respect reduced-motion accessibility setting
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        counters.forEach(counter => {
          if (reducedMotion) {
            counter.textContent = counter.dataset.target;
          } else {
            animateCounter(counter);
          }
        });

        observer.unobserve(section);
      }

    });

  }, {
    threshold: 0.25
  });

  observer.observe(section);

});



