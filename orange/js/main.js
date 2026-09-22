const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobilePanel = document.querySelector('[data-mobile-panel]');
const revealItems = document.querySelectorAll('.reveal');
const canObserve = 'IntersectionObserver' in window;
const queueFrame = window.requestAnimationFrame
  ? window.requestAnimationFrame.bind(window)
  : (callback) => window.setTimeout(() => callback(Date.now()), 16);

if (canObserve) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
}

const activateVisibleReveals = () => {
  revealItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      item.classList.add('is-visible');
    }
  });
};

const emphWords = document.querySelectorAll('.emph-word');
const triggerEmphWord = (word) => {
  word.classList.remove('is-emph-visible');
  void word.offsetWidth;
  word.classList.add('is-emph-visible');
};
const activateVisibleEmphWords = () => {
  emphWords.forEach((word) => {
    const rect = word.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight * 0.86 && rect.bottom > window.innerHeight * 0.08;
    if (isVisible && !word.classList.contains('is-emph-visible')) {
      triggerEmphWord(word);
    } else if (!isVisible) {
      word.classList.remove('is-emph-visible');
    }
  });
};
if (canObserve) {
  const emphObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const word = entry.target;
      if (entry.isIntersecting) {
        triggerEmphWord(word);
      } else {
        word.classList.remove('is-emph-visible');
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.18 });
  emphWords.forEach((word) => emphObserver.observe(word));
}
queueFrame(() => {
  activateVisibleReveals();
  activateVisibleEmphWords();
});

window.addEventListener('scroll', () => {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 12);
  activateVisibleReveals();
  activateVisibleEmphWords();
}, { passive: true });
window.addEventListener('resize', () => {
  activateVisibleReveals();
  activateVisibleEmphWords();
});

if (menuToggle && mobilePanel) {
  menuToggle.addEventListener('click', () => mobilePanel.classList.toggle('is-open'));
  mobilePanel.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => mobilePanel.classList.remove('is-open')));
}

const formatCount = (el, progress) => {
  const raw = el.dataset.count;
  const target = Number(raw);
  const value = target * progress;
  if (raw === '2.1') return el.textContent = `$${value.toFixed(1)}B+`;
  if (raw === '18.6') return el.textContent = `${value.toFixed(1)}%`;
  if (raw === '17500') return el.textContent = `${Math.round(value).toLocaleString()}+`;
  if (raw === '99') return el.textContent = `${Math.round(value)}%`;
  if (raw === '72') return el.textContent = `${Math.round(value)}`;
};

let statsStarted = false;
const startStats = () => {
  if (statsStarted) return;
  statsStarted = true;
  const statNumbers = document.querySelectorAll('[data-count]');
  const duration = 1300;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    statNumbers.forEach((el) => formatCount(el, eased));
    if (progress < 1) queueFrame(tick);
  };
  queueFrame(tick);
};

const statsBand = document.querySelector('.stats-band');
if (statsBand && canObserve) {
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        startStats();
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.35 });
  statsObserver.observe(statsBand);
} else if (statsBand) {
  startStats();
}

function renderSparkline(el, color = '#6f8f68') {
  const points = (el.dataset.points || '').split(',').map(n => Number(n.trim())).filter(n => !Number.isNaN(n));
  if (!points.length) return;
  const width = 110;
  const height = 34;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coords = points.map((value, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  el.setAttribute('viewBox', `0 0 ${width} ${height}`);
  el.innerHTML = `<polyline fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${coords}" />`;
}

document.querySelectorAll('.sparkline').forEach((el) => {
  const row = el.closest('tr');
  let color = '#6f8f68';
  if (row && row.querySelector('.score.risk')) color = '#f15a24';
  if (row && row.querySelector('.score.neutral')) color = '#b59b64';
  renderSparkline(el, color);
});

const parallaxItems = document.querySelectorAll('.parallax');
let ticking = false;
const applyParallax = () => {
  const vh = window.innerHeight || 1;
  parallaxItems.forEach((el) => {
    const speed = Number(el.dataset.speed || 0.04);
    const rect = el.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const offset = (center - vh / 2) * speed;
    el.style.setProperty('--parallax-y', `${-offset}px`);
    if (el.classList.contains('philosophy-sphere')) {
      el.style.transform = `translate(-50%, ${-offset}px)`;
    } else {
      el.style.transform = `translateY(${-offset}px) scale(1.04)`;
    }
  });
  ticking = false;
};
window.addEventListener('scroll', () => {
  if (!ticking) {
    queueFrame(applyParallax);
    ticking = true;
  }
}, { passive: true });
window.addEventListener('resize', applyParallax);
applyParallax();

// Prevent demo form submits.
document.querySelectorAll('form').forEach((form) => {
  form.addEventListener('submit', (event) => event.preventDefault());
});
