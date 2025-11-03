// 🔥 $BURN-E main JS — tabs + FAQ accordion + sparks + modal

// --- Basic console signal
console.log("🔥 $BURN-E JS loaded");

// --- Smooth “back to top”
document.getElementById('fabTop')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- Tabs (now support remote fetch via data-file)
const tabButtons = Array.from(document.querySelectorAll('.tablist [role="tab"]'));
const panels = Array.from(document.querySelectorAll('.tabpanel'));

function getPanelForTab(tabEl) {
  const pid = tabEl.getAttribute('aria-controls');
  return pid ? document.getElementById(pid) : null;
}

function activateTab(id) {
  // set selected state on tabs
  tabButtons.forEach(btn => {
    const selected = btn.id === id;
    btn.setAttribute('aria-selected', selected ? 'true' : 'false');
  });

  // show the associated panel (use hidden attribute to match HTML)
  panels.forEach(p => {
    const active = p.getAttribute('aria-labelledby') === id;
    p.toggleAttribute('hidden', !active);
  });

  // If FAQ tab became active, ensure accordion is initialized
  if (id === 'tab-faq') {
    const faqPanel = document.getElementById('panel-faq');
    initFaqAccordion(faqPanel);
  }
}

async function loadInto(panel, url) {
  if (!panel || !url) return;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const html = await res.text();
   panel.innerHTML = html;

// ✅ Only run the accordion setup on the FAQ panel
if (panel.id === 'panel-faq' || panel.querySelector('.faq-section')) {
  initFaqAccordion(panel);
}

panel.dataset.loaded = '1';

  } catch (err) {
    console.error(err);
    // leave fallback content in place
  }
}

// click -> activate (+ lazy-load if needed)
tabButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const panel = getPanelForTab(btn);
    activateTab(btn.id);

    const url = btn.dataset.file;
    if (url && panel && panel.dataset.loaded !== '1') {
      await loadInto(panel, url);
    }
  });
});

// If the initially selected tab has data-file, load it on ready
document.addEventListener('DOMContentLoaded', async () => {
  const activeTab = tabButtons.find(b => b.getAttribute('aria-selected') === 'true');
  if (activeTab) {
    const panel = getPanelForTab(activeTab);
    const url = activeTab.dataset.file;
    if (url && panel && panel.dataset.loaded !== '1') {
      await loadInto(panel, url); // loadInto now conditionally wires FAQ only
    }

    // ✅ Only initialize accordions for the FAQ tab
    if (activeTab.id === 'tab-faq') {
      const faqPanel = document.getElementById('panel-faq');
      initFaqAccordion(faqPanel);
    }
  }
});

// --- FAQ Accordion (one open at a time) — unchanged API
function initFaqAccordion(panel) {
  if (!panel || panel.dataset.accordionInit === '1') return;

  // Find a container for FAQ; default to panel itself
  const container = panel.querySelector('.faq-section') || panel;

  // Collect all H4 questions that haven't been converted yet
  const headings = Array.from(container.querySelectorAll('h4')).filter(h =>
    !h.closest('.faq-item')
  );

  if (!headings.length) {
    panel.dataset.accordionInit = '1';
    return;
  }

  headings.forEach(h4 => {
    // Create wrapper
    const item = document.createElement('div');
    item.className = 'faq-item';

    // Create button for the question
    const q = document.createElement('button');
    q.type = 'button';
    q.className = 'faq-q';
    q.setAttribute('aria-expanded', 'false');
    q.innerHTML = h4.innerHTML;

    // Create answer container
    const a = document.createElement('div');
    a.className = 'faq-a';
    // Inline styles to avoid needing extra CSS edits
    a.style.overflow = 'hidden';
    a.style.maxHeight = '0px';
    a.style.transition = 'max-height 240ms ease';

    // Gather all content nodes until next H4 (supports multiple paragraphs/lists)
    let node = h4.nextElementSibling;
    const toMove = [];
    while (node && node.tagName !== 'H4') {
      toMove.push(node);
      node = node.nextElementSibling;
    }
    toMove.forEach(n => a.appendChild(n)); // move into answer

    // Replace original H4 with the accordion item
    h4.replaceWith(item);
    item.appendChild(q);
    item.appendChild(a);
  });

  // Open first item by default (optional)
  const firstItem = container.querySelector('.faq-item');
  if (firstItem) openItem(firstItem, { animate: false });

  // Delegated click: one open at a time
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-q');
    if (!btn) return;
    const item = btn.parentElement;
    const isOpen = btn.getAttribute('aria-expanded') === 'true';

    // Close all
    container.querySelectorAll('.faq-item').forEach(it => closeItem(it));

    // Open the clicked one if it was closed
    if (!isOpen) openItem(item);
  });

  panel.dataset.accordionInit = '1';
}

function openItem(item, { animate = true } = {}) {
  const btn = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  if (!btn || !a) return;
  btn.setAttribute('aria-expanded', 'true');
  // Measure & expand
  a.style.display = 'block';
  const target = a.scrollHeight;
  if (!animate) {
    a.style.maxHeight = target + 'px';
    return;
  }
  // start from current (0) to target
  requestAnimationFrame(() => {
    a.style.maxHeight = target + 'px';
  });
}

function closeItem(item) {
  const btn = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  if (!btn || !a) return;
  btn.setAttribute('aria-expanded', 'false');
  a.style.maxHeight = '0px';
  // After transition ends, if still closed, keep display block for height calc
  const onEnd = () => {
    if (btn.getAttribute('aria-expanded') === 'false') {
      a.style.display = 'block';
    }
    a.removeEventListener('transitionend', onEnd);
  };
  a.addEventListener('transitionend', onEnd);
}

// --- Minimal sparks background (kept behind content)
(function sparks() {
  const canvas = document.getElementById('sparks');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let sparks = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function makeSpark() {
    sparks.push({
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      speed: Math.random() * 1 + 0.5,
      size: Math.random() * 2 + 1,
      life: Math.random() * 120 + 60,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.y -= s.speed;
      s.life--;
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
      grad.addColorStop(0, 'rgba(255,180,80,1)');
      grad.addColorStop(1, 'rgba(255,122,26,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      if (s.life <= 0) sparks.splice(i, 1);
    }
    if (Math.random() < 0.3) makeSpark();
    requestAnimationFrame(draw);
  }
  draw();
})();

// --- Email signup modal (30s initial, 3m follow-up, max 2 shows per session) ---
const signupBackdrop = document.getElementById('signupBackdrop');
const signupClose = document.getElementById('signupClose');
const signupNotNow = document.getElementById('signupNotNow');
const signupForm = document.getElementById('signupForm');

const INITIAL_DELAY_MS  = 30_000;   // 30 seconds
const FOLLOWUP_DELAY_MS = 180_000;  // 3 minutes

// storage keys for this session
const KEY_DISMISS_COUNT   = 'burne_signup_dismiss_count';      // "0", "1", "2"
const KEY_LAST_DISMISS_MS = 'burne_signup_last_dismiss_ms';    // timestamp ms
const KEY_FOLLOWUP_DONE   = 'burne_signup_followup_done';      // "1" once scheduled/shown

function getDismissCount() {
  return Number(sessionStorage.getItem(KEY_DISMISS_COUNT) || '0');
}

function setDismissCount(n) {
  sessionStorage.setItem(KEY_DISMISS_COUNT, String(n));
}

function showSignup() {
  if (!signupBackdrop) return;
  // Do not show if already dismissed twice
  if (getDismissCount() >= 2) return;

  // Reveal with animation class if your CSS supports it
  signupBackdrop.hidden = false;
  signupBackdrop.classList.add('open'); // matches the CSS animation we discussed
  // Fallback (in case you didn't add the animation CSS):
  signupBackdrop.style.display = 'flex';
}

function closeSignup() {
  if (!signupBackdrop) return;

  // Hide (with fade-out if you kept the .open CSS)
  signupBackdrop.classList.remove('open');
  setTimeout(() => { signupBackdrop.hidden = true; }, 200);
  signupBackdrop.style.display = 'none';

  // Track dismissals in this session
  const next = getDismissCount() + 1;
  setDismissCount(next);
  sessionStorage.setItem(KEY_LAST_DISMISS_MS, String(Date.now()));

  // After first dismissal, schedule exactly one follow-up within 3 minutes
  if (next === 1) {
    // reset follow-up flag so we can schedule it now
    sessionStorage.removeItem(KEY_FOLLOWUP_DONE);
    scheduleFollowupIfNeeded();
  }
  // After second dismissal, do nothing else (no more popups this session)
}

function scheduleInitial() {
  if (!signupBackdrop) return;
  if (getDismissCount() >= 2) return; // user already dismissed twice
  setTimeout(showSignup, INITIAL_DELAY_MS);
}

function scheduleFollowupIfNeeded() {
  if (!signupBackdrop) return;

  // Only if dismissed exactly once and we haven't already done the follow-up
  if (getDismissCount() !== 1) return;
  if (sessionStorage.getItem(KEY_FOLLOWUP_DONE) === '1') return;

  const last = Number(sessionStorage.getItem(KEY_LAST_DISMISS_MS) || '0');
  const elapsed = Date.now() - last;

  // If user reloaded, we honor remaining time; never negative
  const delay = Math.max(FOLLOWUP_DELAY_MS - Math.max(elapsed, 0), 0);

  setTimeout(() => {
    // Check again right before showing (user might have dismissed again elsewhere)
    if (getDismissCount() === 1 && sessionStorage.getItem(KEY_FOLLOWUP_DONE) !== '1') {
      showSignup();
      sessionStorage.setItem(KEY_FOLLOWUP_DONE, '1');
    }
  }, delay);
}

// Wire close buttons
signupClose?.addEventListener('click', closeSignup);
signupNotNow?.addEventListener('click', closeSignup);

// Kickoff on load:
// 1) Schedule the initial 30s popup if user hasn't dismissed twice.
// 2) If they already dismissed once this session, schedule the 3-minute follow-up (with remainder if reloaded).
document.addEventListener('DOMContentLoaded', () => {
  const dismisses = getDismissCount();

  if (dismisses < 2) {
    scheduleInitial();
  }

  if (dismisses === 1) {
    scheduleFollowupIfNeeded();
  }
});

// (Keep your existing submit handler below; it can still call closeSignup() on success.)
