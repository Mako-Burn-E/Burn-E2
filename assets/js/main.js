/* ================================
   UTIL
================================ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ================================
   SMOOTH SCROLL TOP
================================ */
(() => {
  const btn = $('#fabTop');
  if (!btn) return;
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ================================
   CTA LINKS (plug your real URLs)
================================ */
(() => {
  const LINKS = {
    launch: '#', // e.g., 'https://play.playdefi.org/burn-e/launch'
    buy:    '#', // e.g., 'https://raydium.io/swap?input=SOL&output=BURN-E'
    fuel:   '#'
  };

  const wire = (id, url) => {
    const a = $(id);
    if (a && url && url !== '#') a.href = url;
  };

  wire('#launchBtn',  LINKS.launch);
  wire('#launchBtn2', LINKS.launch);
  wire('#fabLaunch',  LINKS.launch);
  wire('#buyBtn',     LINKS.buy);
  wire('#fuelBtn',    LINKS.fuel);
})();

/* ================================
   TABS: FETCH & CACHE CONTENT
   - Keeps Chapter 1–4 in one row (CSS handles nowrap)
   - Loads from /assets/docs/{data-file}
================================ */
(() => {
  const tablist = $('.tablist');
  if (!tablist) return;

  const buttons = $$('.tablist [role="tab"]', tablist);
  const panels = $$('.tabpanel');
  const cache = new Map();

  const setActive = (btn) => {
    buttons.forEach(b => b.setAttribute('aria-selected', b === btn ? 'true' : 'false'));
    panels.forEach(p => p.classList.remove('active'));
    const panel = $('#' + btn.getAttribute('aria-controls'));
    panel?.classList.add('active');

    // Keep the selected tab visible in the horizontal scroller
    btn.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  };

  const loadFile = async (file) => {
    if (cache.has(file)) return cache.get(file);
    const url = `assets/docs/${file}`;
    const res = await fetch(url, { cache: 'no-cache' });
    const html = await res.text();
    cache.set(file, html);
    return html;
  };

  const handleClick = async (btn) => {
    const file = btn.getAttribute('data-file');
    const panelId = btn.getAttribute('aria-controls');
    const panel = $('#' + panelId);

    setActive(btn);
    if (!panel) return;

    panel.innerHTML = '<p class="meta">Loading…</p>';
    try {
      const html = await loadFile(file);
      panel.innerHTML = html;
    } catch (e) {
      panel.innerHTML = '<p class="meta">Could not load this section right now.</p>';
      console.error('Tab load error:', e);
    }
  };

  // Wire clicks
  buttons.forEach(btn => {
    btn.addEventListener('click', () => handleClick(btn));
  });

  // Load default active (Chapter 1)
  const defaultBtn = $('#tab-about') || buttons[0];
  if (defaultBtn) handleClick(defaultBtn);
})();

/* ================================
   BURN LEDGER: LIGHT STUB
   (Replace with real on-chain pulls)
================================ */
(() => {
  const START = 1_000_000_000; // 1B
  const GOAL  = 23_000_000;    // 23M

  const $kpiStart         = $('#kpiStart');
  const $kpiGoal          = $('#kpiGoal');
  const $kpiCurrentSupply = $('#kpiCurrentSupply');
  const $kpiTotalBurned   = $('#kpiTotalBurned');
  const $kpiPctGoal       = $('#kpiPctGoal');
  const $kpiLastBurn      = $('#kpiLastBurn');
  const $burnsEmpty       = $('#burnsEmpty');
  const $burnsBody        = $('#burnsBody');

  const fmt = (n) => n.toLocaleString();

  // Demo (keep UI alive)
  const current = START; // replace with real
  const burned  = START - current;
  const pct     = ((START - current) / (START - GOAL)) * 100;

  if ($kpiStart)         $kpiStart.textContent = fmt(START);
  if ($kpiGoal)          $kpiGoal.textContent = fmt(GOAL);
  if ($kpiCurrentSupply) $kpiCurrentSupply.textContent = fmt(current);
  if ($kpiTotalBurned)   $kpiTotalBurned.textContent = fmt(burned);
  if ($kpiPctGoal)       $kpiPctGoal.textContent = isFinite(pct) ? `${pct.toFixed(2)}%` : '0.00%';
  if ($kpiLastBurn)      $kpiLastBurn.textContent = '—';

  if ($burnsEmpty) $burnsEmpty.hidden = false;
  if ($burnsBody)  $burnsBody.innerHTML = '';
})();

/* ================================
   SUBSCRIBE POPUP (subscribe* IDs)
   - Shows once after 30s
   - If dismissed (not “Don’t show again”), shows once more after 5m
================================ */
(() => {
  const FIRST_DELAY_MS = 30_000;
  const SECOND_DELAY_MS = 5 * 60_000;
  const STORAGE_KEY = 'burne_subscribe_state_v1';

  const $backdrop = $('#subscribeBackdrop');
  const $modal    = $('.modal.burne', $backdrop || document);
  const $email    = $('#subscribeEmail');
  const $form     = $('#subscribeForm');
  const $close    = $('#subscribeClose');
  const $dontShow = $('#dontShowLink');
  const $submit   = $('#subscribeSubmit');

  if (!$backdrop || !$modal) return;

  let firstTimer = null;
  let secondTimer = null;

  const readState = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  };
  const writeState = (next) => localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  const showModal = () => {
    if ($backdrop.classList.contains('show')) return;
    $backdrop.setAttribute('aria-hidden', 'false');
    $backdrop.classList.add('show');
    $modal.classList.add('show');
    setTimeout(() => $email?.focus(), 50);

    const st = readState();
    if (!st.firstShownAt) {
      st.firstShownAt = Date.now();
      writeState(st);
    }
  };

  const hideModal = () => {
    $modal.classList.remove('show');
    $backdrop.classList.remove('show');
    $backdrop.setAttribute('aria-hidden', 'true');
  };

  const scheduleSecond = () => {
    clearTimeout(secondTimer);
    secondTimer = setTimeout(() => {
      const st = readState();
      if (st.dismissedOnce && !st.secondShownAt && !st.subscribedAt && !st.dontShowAgain) {
        st.secondShownAt = Date.now();
        writeState(st);
        showModal();
      }
    }, SECOND_DELAY_MS);
  };

  // Show once at 30s if never shown and user not subscribed
  (() => {
    const st = readState();
    if (!st.firstShownAt && !st.subscribedAt && !st.dontShowAgain) {
      clearTimeout(firstTimer);
      firstTimer = setTimeout(showModal, FIRST_DELAY_MS);
    }
  })();

  // Submit (replace with real endpoint)
  $form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $email?.value?.trim();
    if (!email) return;
    $submit.disabled = true;
    $submit.textContent = 'Thanks! 🔥';

    // Simulate success
    setTimeout(() => {
      hideModal();
      const st = readState();
      writeState({ ...st, subscribedAt: Date.now(), dismissedOnce: true });
    }, 600);
  });

  const dismiss = (dontShowAgain = false) => {
    hideModal();
    const st = readState();
    writeState({ ...st, dismissedOnce: true, dontShowAgain });
    if (!dontShowAgain && !st.subscribedAt) scheduleSecond();
  };

  $close?.addEventListener('click', () => dismiss(false));
  $dontShow?.addEventListener('click', (e) => { e.preventDefault(); dismiss(true); });

  // Click outside to close
  $backdrop.addEventListener('click', (e) => { if (e.target === $backdrop) dismiss(false); });

  // Esc to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $backdrop.classList.contains('show')) dismiss(false);
  });
})();

/* ================================
   EMBER SPARKS CANVAS (visual)
================================ */
(() => {
  const canvas = $('#sparks');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let sparks = [];

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  const makeSpark = () => {
    const x = Math.random() * canvas.width;
    const y = canvas.height + 10;
    const speed = Math.random() * 1 + 0.5;
    const size = Math.random() * 2 + 1;
    const life = Math.random() * 120 + 60;
    sparks.push({ x, y, speed, size, life });
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.y -= s.speed;
      s.life--;

      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
      g.addColorStop(0, 'rgba(255,180,80,1)');
      g.addColorStop(1, 'rgba(255,122,26,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();

      if (s.life <= 0) sparks.splice(i, 1);
    }
    if (Math.random() < 0.3) makeSpark();
    requestAnimationFrame(draw);
  };
  draw();

  // Keep behind content
  Object.assign(canvas.style, {
    position: 'fixed',
    left: 0, top: 0,
    pointerEvents: 'none',
    zIndex: 0,
    width: '100%',
    height: '100%'
  });
})();
