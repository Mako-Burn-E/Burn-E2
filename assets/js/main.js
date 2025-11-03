// 🔥 $BURN-E main JS — tabs + FAQ accordion + sparks + modal

// --- Basic console signal
console.log("🔥 $BURN-E JS loaded");

// --- Smooth “back to top”
document.getElementById('fabTop')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- Tabs (no remote fetch; content is embedded)
const tabButtons = Array.from(document.querySelectorAll('.tablist [role="tab"]'));
const panels = Array.from(document.querySelectorAll('.tabpanel'));

function activateTab(id) {
  // set selected state on tabs
  tabButtons.forEach(btn => {
    const selected = btn.id === id;
    btn.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
  // show the associated panel
  panels.forEach(p => {
    p.classList.toggle('active', p.getAttribute('aria-labelledby') === id);
  });

  // If FAQ tab became active, ensure accordion is initialized
  if (id === 'tab-faq') {
    const faqPanel = document.getElementById('panel-faq');
    initFaqAccordion(faqPanel);
  }
}

// click -> activate
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.id));
});

// --- FAQ Accordion (one open at a time)
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
  // After transition ends, if still closed, hide display for accessibility
  const onEnd = (ev) => {
    if (btn.getAttribute('aria-expanded') === 'false') {
      a.style.display = 'block'; // keep block for height calc; we control visibility via max-height
    }
    a.removeEventListener('transitionend', onEnd);
  };
  a.addEventListener('transitionend', onEnd);
}

// If FAQ panel starts active on load, initialize it
document.addEventListener('DOMContentLoaded', () => {
  const activeTab = tabButtons.find(b => b.getAttribute('aria-selected') === 'true');
  if (activeTab?.id === 'tab-faq') {
    const faqPanel = document.getElementById('panel-faq');
    initFaqAccordion(faqPanel);
  }
});

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

// --- Email signup modal
const signupBackdrop = document.getElementById('signupBackdrop');
const signupClose = document.getElementById('signupClose');
const signupNotNow = document.getElementById('signupNotNow');
const signupForm = document.getElementById('signupForm');

// Show modal after slight delay (only once per session)
setTimeout(() => {
  if (!signupBackdrop) return;
  if (sessionStorage.getItem('burne_signup_dismissed') === '1') return;
  signupBackdrop.hidden = false;
  signupBackdrop.style.display = 'flex';
}, 1200);

function closeSignup() {
  if (!signupBackdrop) return;
  signupBackdrop.style.display = 'none';
  signupBackdrop.hidden = true;
  sessionStorage.setItem('burne_signup_dismissed', '1');
}
signupClose?.addEventListener('click', closeSignup);
signupNotNow?.addEventListener('click', closeSignup);

// Fake submit (replace with your API call)
signupForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('signupEmail')?.value || '';
  console.log('Signup email:', email);
  closeSignup();
  alert('🔥 Subscribed! You’re on the list.');
});
