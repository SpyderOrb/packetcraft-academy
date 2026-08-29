const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
const navScrim = document.querySelector('[data-nav-scrim]');
const backToTop = document.querySelector('[data-back-to-top]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const setHeaderState = () => {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
  const showBackToTop = window.scrollY > Math.max(600, window.innerHeight * 0.75);
  backToTop.classList.toggle('is-visible', showBackToTop);
  backToTop.setAttribute('aria-hidden', String(!showBackToTop));
  backToTop.tabIndex = showBackToTop ? 0 : -1;
};

setHeaderState();
let headerFrame = 0;
window.addEventListener('scroll', () => {
  if (headerFrame) return;
  headerFrame = requestAnimationFrame(() => {
    setHeaderState();
    headerFrame = 0;
  });
}, { passive: true });

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
});

const closeNavigation = ({ restoreFocus = false } = {}) => {
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.querySelector('.sr-only').textContent = 'Open navigation';
  nav.classList.remove('is-open');
  document.body.classList.remove('nav-open');
  if (restoreFocus) navToggle.focus();
};

navToggle.addEventListener('click', () => {
  const willOpen = navToggle.getAttribute('aria-expanded') !== 'true';
  navToggle.setAttribute('aria-expanded', String(willOpen));
  navToggle.querySelector('.sr-only').textContent = willOpen ? 'Close navigation' : 'Open navigation';
  nav.classList.toggle('is-open', willOpen);
  document.body.classList.toggle('nav-open', willOpen);
  if (willOpen) nav.querySelector('a').focus({ preventScroll: true });
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeNavigation();
});
navScrim.addEventListener('click', () => closeNavigation({ restoreFocus: true }));

document.addEventListener('keydown', (event) => {
  if (!nav.classList.contains('is-open')) return;
  if (event.key === 'Escape') {
    closeNavigation({ restoreFocus: true });
    return;
  }

  if (event.key === 'Tab') {
    const focusable = [...nav.querySelectorAll('a'), navToggle];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

window.addEventListener('resize', () => {
  setHeaderState();
  if (window.innerWidth > 760 && nav.classList.contains('is-open')) closeNavigation();
});

const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

function activateTab(nextTab, { keyboard = false } = {}) {
  tabs.forEach((tab) => {
    const active = tab === nextTab;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  panels.forEach((panel) => {
    const active = panel.id === nextTab.getAttribute('aria-controls');
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
    panel.classList.remove('is-entering');
    if (active && !keyboard && !reduceMotion.matches) {
      requestAnimationFrame(() => panel.classList.add('is-entering'));
    }
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else nextIndex = (index - 1 + tabs.length) % tabs.length;
    activateTab(tabs[nextIndex], { keyboard: true });
    tabs[nextIndex].focus();
  });
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('is-pending');
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -48px' },
  );
  revealItems.forEach((item) => {
    if (item.getBoundingClientRect().top < window.innerHeight * 0.93) {
      item.classList.add('is-visible');
    } else {
      item.classList.add('is-pending');
      observer.observe(item);
    }
  });
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const form = document.querySelector('[data-form]');
const formStatus = document.querySelector('[data-form-status]');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = [...form.querySelectorAll('[required]')];
  fields.forEach((field) => field.setAttribute('aria-invalid', String(!field.validity.valid)));
  const firstInvalid = fields.find((field) => !field.validity.valid);
  if (firstInvalid) {
    formStatus.textContent = 'Please complete the highlighted fields.';
    formStatus.classList.remove('is-success');
    firstInvalid.focus();
    return;
  }

  formStatus.textContent = 'Demo complete — in a live version, this request would now reach an advisor.';
  formStatus.classList.add('is-success');
  fields.forEach((field) => field.removeAttribute('aria-invalid'));
  form.reset();
});

document.querySelector('[data-year]').textContent = new Date().getFullYear();
