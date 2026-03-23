// ── APP STATE ──
const AppState = {
  doctor: null,
  currentPage: 'login',
  eyeResult: null,
  symptomsResult: null,
  predictResult: null,
};

// ── CONFIG ──
const API_BASE = 'https://sriomdash-retinopathydetection.hf.space';
const DEFAULT_PASSWORD = '123';

// ── NAVIGATION ──
function navigateTo(page) {
  if (page !== 'login' && !AppState.doctor) {
    showToast('Please login first', 'error');
    return;
  }

  AppState.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');

  // Nav links
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  // Show/hide nav
  const nav = document.getElementById('main-nav');
  nav.style.display = page === 'login' ? 'none' : 'flex';
}

// ── TOAST ──
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { error: '✕', success: '✓', info: 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── FEATURE IMPORTANCE CHART ──
function renderFeatureChart(containerId, importance, limit = 8) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Sort by absolute value
  const sorted = Object.entries(importance)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, limit);

  const maxVal = Math.max(...sorted.map(([, v]) => Math.abs(v)));

  container.innerHTML = sorted.map(([name, val]) => {
    const pct = maxVal > 0 ? (Math.abs(val) / maxVal) * 100 : 0;
    const isPos = val >= 0;
    const displayName = name.replace(/_/g, ' ');
    return `
      <div class="feat-row">
        <span class="feat-name">${displayName}</span>
        <div class="feat-bar-track">
          <div class="feat-bar-fill ${isPos ? 'positive' : 'negative'}"
               style="width:0"
               data-width="${pct.toFixed(1)}">
          </div>
        </div>
        <span class="feat-val">${val >= 0 ? '+' : ''}${val.toFixed(3)}</span>
      </div>
    `;
  }).join('');

  // Animate bars
  requestAnimationFrame(() => {
    container.querySelectorAll('.feat-bar-fill').forEach(bar => {
      setTimeout(() => {
        bar.style.width = bar.dataset.width + '%';
      }, 100);
    });
  });
}

// ── CONFIDENCE RING ──
function renderConfidenceRing(containerId, pct, color = '#00d4b8') {
  const el = document.getElementById(containerId);
  if (!el) return;
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  el.innerHTML = `
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle class="track" cx="40" cy="40" r="${r}" />
      <circle class="fill" cx="40" cy="40" r="${r}"
        stroke="${color}"
        stroke-dasharray="${circ}"
        stroke-dashoffset="${circ}"
        style="transition: stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" />
    </svg>
    <div class="conf-pct" style="color:${color}">${Math.round(pct)}%</div>
  `;

  requestAnimationFrame(() => {
    setTimeout(() => {
      el.querySelector('.fill').style.strokeDashoffset = offset;
    }, 150);
  });
}

// ── LOGOUT ──
function logout() {
  AppState.doctor = null;
  AppState.eyeResult = null;
  AppState.symptomsResult = null;
  AppState.predictResult = null;
  navigateTo('login');
  showToast('Logged out successfully', 'info');
}

// ── ON LOAD ──
document.addEventListener('DOMContentLoaded', () => {
  navigateTo('login');

  // Nav link clicks
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(a.dataset.page);
    });
  });
});
