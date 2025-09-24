// Helper: throttle
function throttle(fn, wait) {
  let last = 0, timer = null;
  return function throttled(...args) {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      clearTimeout(timer); timer = null; last = now; fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => { last = Date.now(); timer = null; fn.apply(this, args); }, remaining);
    }
  };
}

// Navbar effects
const navbar = document.getElementById('navbar');
const navLinks = Array.from(document.querySelectorAll('.nav-link'));
const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

function updateNavbarState() {
  const scrolled = window.scrollY > 12;
  navbar.classList.toggle('scrolled', scrolled);
}

function updateActiveLink() {
  const fromTop = window.scrollY + 120;
  let current = sections[0];
  for (const section of sections) {
    if (section.offsetTop <= fromTop) current = section;
  }
  navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + current.id));
}

window.addEventListener('scroll', throttle(() => { updateNavbarState(); updateActiveLink(); }, 100));
function applyBodyOffsetForNavbar() {
  const offset = (navbar?.offsetHeight || 0);
  document.body.style.paddingTop = offset + 'px';
}
applyBodyOffsetForNavbar();
updateNavbarState();
updateActiveLink();
window.addEventListener('resize', throttle(applyBodyOffsetForNavbar, 150));

// Back to top button
const backToTop = document.getElementById('backToTop');
function updateBackToTop() {
  backToTop.classList.toggle('visible', window.scrollY > 400);
}
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
window.addEventListener('scroll', throttle(updateBackToTop, 50));
updateBackToTop();

// Parallax layers
const parallaxLayers = Array.from(document.querySelectorAll('[data-parallax]'));
function onParallax() {
  const y = window.scrollY;
  parallaxLayers.forEach(el => {
    const factor = parseFloat(el.dataset.parallax || '0.2');
    el.style.transform = `translate3d(0, ${y * factor}px, 0)`;
  });
}
window.addEventListener('scroll', throttle(onParallax, 16));
onParallax();

// Reveal on scroll (IntersectionObserver)
const revealEls = Array.from(document.querySelectorAll('.reveal'));
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal-visible');
      io.unobserve(entry.target);
    }
  }
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

// Tilt effect for cards and avatar
function createTilt(el) {
  const rect = () => el.getBoundingClientRect();
  const maxDeg = 10;
  function onMove(e) {
    const r = rect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) / (r.width / 2);
    const dy = (e.clientY - cy) / (r.height / 2);
    const rx = (dy * -maxDeg).toFixed(2);
    const ry = (dx * maxDeg).toFixed(2);
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }
  function reset() { el.style.transform = 'rotateX(0) rotateY(0)'; }
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerleave', reset);
}
document.querySelectorAll('[data-tilt]').forEach(createTilt);

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
function setTheme(mode) { document.documentElement.dataset.theme = mode; localStorage.setItem('theme', mode); themeToggle.textContent = mode === 'dark' ? '☾' : '☀'; }
const saved = localStorage.getItem('theme');
if (saved) setTheme(saved); else setTheme(prefersDark.matches ? 'dark' : 'light');
prefersDark.addEventListener('change', e => { if (!localStorage.getItem('theme')) setTheme(e.matches ? 'dark' : 'light'); });
themeToggle.addEventListener('click', () => { const mode = (document.documentElement.dataset.theme === 'dark') ? 'light' : 'dark'; setTheme(mode); });

// Apply theme variables swap
const themeStyle = document.createElement('style');
themeStyle.innerHTML = `
  :root[data-theme="light"] { --bg: #f7f9fc; --surface: #ffffff; --text: #0e1320; --muted: #4e5d78; --accent: #1f6bff; --accent-2: #00c2d7; --card: #ffffff; --glow: 0 0 28px rgba(31, 107, 255, 0.25); }
  :root[data-theme="dark"]  { --bg: #0b0f17; --surface: #0f1420; --text: #e6eefc; --muted: #93a1bd; --accent: #6aa2ff; --accent-2: #7ef0ff; --card: #101724; --glow: 0 0 40px rgba(106, 162, 255, 0.25); }
`;
document.head.appendChild(themeStyle);

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Smooth scroll for nav links with offset for sticky navbar
const navAnchors = Array.from(document.querySelectorAll('a.nav-link[href^="#"]'));
function getNavOffset() { return (navbar?.offsetHeight || 0) + 12; }
function smoothScrollTo(targetY, duration = 600) {
  const startY = window.scrollY;
  const diff = targetY - startY;
  const startTime = performance.now();
  const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function step(now) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    const eased = easeInOutCubic(t);
    window.scrollTo(0, startY + diff * eased);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
navAnchors.forEach(a => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const y = Math.max(0, target.getBoundingClientRect().top + window.scrollY - getNavOffset());
    smoothScrollTo(y, 650);
    history.replaceState(null, '', href);
  });
});


