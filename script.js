// Helper: debounce for resize events
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Selectors
const navbar = document.getElementById('navbar');
const navLinks = Array.from(document.querySelectorAll('.nav-link'));
const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const backToTop = document.getElementById('backToTop');
const parallaxLayers = Array.from(document.querySelectorAll('[data-parallax]'));
const revealEls = Array.from(document.querySelectorAll('.reveal'));

// Layout: Apply offset for fixed navbar
function applyBodyOffsetForNavbar() {
  const offset = (navbar?.offsetHeight || 0);
  document.body.style.paddingTop = offset + 'px';
}
applyBodyOffsetForNavbar();
window.addEventListener('resize', debounce(applyBodyOffsetForNavbar, 150));

// Active links: IntersectionObserver instead of scroll event
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, { rootMargin: '-40% 0px -60% 0px', threshold: 0 });
sections.forEach(section => section && sectionObserver.observe(section));

// Scroll loop: requestAnimationFrame for 60fps performance
let lastScrollY = window.scrollY;
let ticking = false;

function updateScrollEffects() {
  // Navbar bg state
  if (navbar) navbar.classList.toggle('scrolled', lastScrollY > 12);
  
  // Back to top visibility
  if (backToTop) backToTop.classList.toggle('visible', lastScrollY > 400);
  
  // Parallax
  for (let i = 0; i < parallaxLayers.length; i++) {
    const el = parallaxLayers[i];
    const factor = parseFloat(el.dataset.parallax || '0.2');
    el.style.transform = `translate3d(0, ${lastScrollY * factor}px, 0)`;
  }
  
  ticking = false;
}

window.addEventListener('scroll', () => {
  lastScrollY = window.scrollY;
  if (!ticking) {
    window.requestAnimationFrame(updateScrollEffects);
    ticking = true;
  }
}, { passive: true });

// Initialize scroll effects
updateScrollEffects();

// Reveal on scroll (IntersectionObserver)
const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal-visible');
      revealObserver.unobserve(entry.target);
    }
  }
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));

// Tilt effect: Cache BoundingClientRect for performance
function createTilt(el) {
  let rect;
  const maxDeg = 10;
  
  function onEnter() {
    rect = el.getBoundingClientRect();
  }
  
  function onMove(e) {
    if (!rect) rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const rx = (dy * -maxDeg).toFixed(2);
    const ry = (dx * maxDeg).toFixed(2);
    
    // Use requestAnimationFrame for smoother tilt rendering
    window.requestAnimationFrame(() => {
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
  }
  
  function onLeave() { 
    window.requestAnimationFrame(() => {
      el.style.transform = 'rotateX(0) rotateY(0)'; 
    });
    rect = null;
  }
  
  el.addEventListener('pointerenter', onEnter, { passive: true });
  el.addEventListener('pointermove', onMove, { passive: true });
  el.addEventListener('pointerleave', onLeave, { passive: true });
}
document.querySelectorAll('[data-tilt]').forEach(createTilt);

// Back to top click
if (backToTop) {
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Smooth scroll for internal links with offset for sticky navbar
const navAnchors = Array.from(document.querySelectorAll('a.nav-link[href^="#"], a.logo[href^="#"], a.btn[href^="#"]'));
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
    if (t < 1) window.requestAnimationFrame(step);
  }
  window.requestAnimationFrame(step);
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

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
