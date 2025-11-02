// Basic console signal
console.log("🔥 $BURN-E JS loaded");

// Smooth “back to top”
document.getElementById('fabTop')?.addEventListener('click', () =>
  window.scrollTo({ top: 0, behavior: 'smooth' })
);

// Tab switching (no remote fetch; content is embedded)
const tabButtons = Array.from(document.querySelectorAll('.tablist [role="tab"]'));
const panels = Array.from(document.querySelectorAll('.tabpanel'));

function activateTab(id) {
  tabButtons.forEach(btn => {
    const selected = btn.id === id;
    btn.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
  panels.forEach(p => {
    p.classList.toggle('active', p.getAttribute('aria-labelledby') === id);
  });
}
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.id));
});

// Minimal sparks background (kept behind content)
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

// Email signup modal
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
