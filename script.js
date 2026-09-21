const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
const navScrim = document.querySelector('[data-nav-scrim]');
const backToTop = document.querySelector('[data-back-to-top]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const navigationSections = [...nav.querySelectorAll('a[href^="#"]')]
  .map((link) => ({ link, section: document.querySelector(link.hash) }))
  .filter(({ section }) => section);

const setHeaderState = () => {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
  const showBackToTop = window.scrollY > Math.max(600, window.innerHeight * 0.75);
  backToTop.classList.toggle('is-visible', showBackToTop);
  backToTop.setAttribute('aria-hidden', String(!showBackToTop));
  backToTop.tabIndex = showBackToTop ? 0 : -1;
};

const setActiveNavigation = () => {
  const activationLine = header.getBoundingClientRect().height + 48;
  let activeLink = null;

  navigationSections.forEach(({ link, section }) => {
    if (section.getBoundingClientRect().top <= activationLine) activeLink = link;
  });

  navigationSections.forEach(({ link }) => {
    if (link === activeLink) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
};

const setPageState = () => {
  setHeaderState();
  setActiveNavigation();
};

setPageState();
let headerFrame = 0;
window.addEventListener('scroll', () => {
  if (headerFrame) return;
  headerFrame = requestAnimationFrame(() => {
    setPageState();
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
  setPageState();
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

const subnetLab = document.querySelector('[data-subnet-lab]');
const labForm = subnetLab.querySelector('[data-lab-form]');
const labChoices = subnetLab.querySelector('[data-lab-choices]');
const labFeedback = subnetLab.querySelector('[data-lab-feedback]');
const labSolution = subnetLab.querySelector('[data-lab-solution]');
const labNext = subnetLab.querySelector('[data-lab-next]');
const labScenarios = [
  { network: '10.24.8.0', prefix: 26 },
  { network: '192.168.10.64', prefix: 27 },
  { network: '172.16.4.128', prefix: 28 },
  { network: '10.0.12.0', prefix: 24 },
  { network: '192.168.50.200', prefix: 29 },
];
let labIndex = 0;

function clearLabAnswer() {
  labFeedback.textContent = '';
  delete labFeedback.dataset.correct;
  labSolution.hidden = true;
}

function renderLab({ focus = false } = {}) {
  const { network, prefix } = labScenarios[labIndex];
  const addressCount = 2 ** (32 - prefix);
  subnetLab.querySelector('[data-lab-network]').textContent = `${network}/${prefix}`;
  subnetLab.querySelector('[data-lab-progress]').textContent = `LAB ${labIndex + 1} / ${labScenarios.length}`;
  labNext.replaceChildren(labIndex === labScenarios.length - 1 ? 'Start again ↻' : 'Next subnet →');
  clearLabAnswer();
  labChoices.replaceChildren();
  const answers = [addressCount / 2 - 2, addressCount - 2, addressCount, addressCount * 2 - 2];
  // Rotate the options so the correct answer does not stay in the same position.
  const offset = labIndex % answers.length;
  [...answers.slice(offset), ...answers.slice(0, offset)].forEach((answer) => {
    const label = document.createElement('label');
    label.className = 'subnet-lab__choice';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'hosts';
    radio.value = String(answer);
    const caption = document.createElement('span');
    caption.textContent = String(answer);
    label.append(radio, caption);
    labChoices.append(label);
  });
  if (focus) labChoices.querySelector('input').focus({ preventScroll: true });
}

labForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const selected = labChoices.querySelector('input:checked');
  if (!selected) {
    labFeedback.textContent = 'Choose an answer before checking.';
    labChoices.querySelector('input').focus({ preventScroll: true });
    return;
  }

  const { network, prefix } = labScenarios[labIndex];
  const hostBits = 32 - prefix;
  const addressCount = 2 ** hostBits;
  const usable = addressCount - 2;
  const correct = Number(selected.value) === usable;
  labFeedback.dataset.correct = String(correct);
  labFeedback.textContent = `${correct ? 'Correct' : 'Not quite'} — ${usable} usable host addresses.`;
  subnetLab.querySelector('[data-lab-explanation]').textContent =
    `32 − ${prefix} = ${hostBits} host bits. 2^${hostBits} = ${addressCount} addresses. Reserve 2 for network and broadcast: ${usable} remain for hosts.`;
  // These /24–/29 examples all fit inside one final octet.
  const octets = network.split('.');
  const start = Number(octets.pop());
  const address = (offset) => `${octets.join('.')}.${start + offset}`;
  subnetLab.querySelector('[data-lab-address="network"]').textContent = network;
  subnetLab.querySelector('[data-lab-address="range"]').textContent = `${address(1)} – ${address(addressCount - 2)}`;
  subnetLab.querySelector('[data-lab-address="broadcast"]').textContent = address(addressCount - 1);
  labSolution.hidden = false;
});
labChoices.addEventListener('change', clearLabAnswer);
labNext.addEventListener('click', () => {
  labIndex = (labIndex + 1) % labScenarios.length;
  renderLab({ focus: true });
});
renderLab();
subnetLab.hidden = false;

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
const formNote = formStatus.textContent;
form.addEventListener('input', (event) => {
  const field = event.target;
  if (!field.matches('[required]')) return;
  if (field.hasAttribute('aria-invalid')) {
    field.setAttribute('aria-invalid', String(!field.validity.valid));
  }
  if (!form.querySelector('[aria-invalid="true"]')) {
    formStatus.textContent = formNote;
    formStatus.classList.remove('is-success');
  }
});
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
