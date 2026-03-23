// ── SYMPTOMS PAGE ──

const SYMPTOMS_CONFIG = [
  { key: 'Polyuria',           label: 'Polyuria',             icon: '💧', desc: 'Excessive urination' },
  { key: 'Polydipsia',         label: 'Polydipsia',           icon: '🥤', desc: 'Excessive thirst' },
  { key: 'sudden_weight_loss', label: 'Sudden Weight Loss',   icon: '⚖️', desc: 'Unexplained weight loss' },
  { key: 'weakness',           label: 'Weakness',             icon: '🫷', desc: 'General body weakness' },
  { key: 'Polyphagia',         label: 'Polyphagia',           icon: '🍽️', desc: 'Excessive hunger' },
  { key: 'Genital_thrush',     label: 'Genital Thrush',       icon: '🔴', desc: 'Yeast infection' },
  { key: 'visual_blurring',    label: 'Visual Blurring',      icon: '👁️', desc: 'Blurred vision' },
  { key: 'Itching',            label: 'Itching',              icon: '🤔', desc: 'Skin itching' },
  { key: 'Irritability',       label: 'Irritability',         icon: '😤', desc: 'Mood changes' },
  { key: 'delayed_healing',    label: 'Delayed Healing',      icon: '🩹', desc: 'Slow wound healing' },
  { key: 'partial_paresis',    label: 'Partial Paresis',      icon: '🦵', desc: 'Partial paralysis' },
  { key: 'muscle_stiffness',   label: 'Muscle Stiffness',     icon: '💪', desc: 'Stiff muscles' },
  { key: 'Alopecia',           label: 'Alopecia',             icon: '💇', desc: 'Hair loss' },
  { key: 'Obesity',            label: 'Obesity',              icon: '📊', desc: 'High BMI' },
];

document.addEventListener('DOMContentLoaded', () => {
  const symptomsGrid = document.getElementById('symptoms-grid');
  const predictBtn = document.getElementById('symptoms-predict-btn');
  const loader = document.getElementById('symptoms-loader');
  const resultSection = document.getElementById('symptoms-result');

  // ── Build toggle cards ──
  symptomsGrid.innerHTML = SYMPTOMS_CONFIG.map(s => `
    <div class="symptom-card" id="card-${s.key}">
      <span class="symptom-icon">${s.icon}</span>
      <div style="flex:1">
        <div class="symptom-name">${s.label}</div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:2px">${s.desc}</div>
      </div>
      <div class="toggle-wrap">
        <span class="toggle-label" id="lbl-${s.key}">NO</span>
        <label class="toggle">
          <input type="checkbox" id="sym-${s.key}" data-key="${s.key}" />
          <div class="toggle-track">
            <div class="toggle-thumb"></div>
          </div>
        </label>
      </div>
    </div>
  `).join('');

  // Update labels on toggle
  symptomsGrid.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      const lbl = document.getElementById(`lbl-${cb.dataset.key}`);
      const card = document.getElementById(`card-${cb.dataset.key}`);
      lbl.textContent = cb.checked ? 'YES' : 'NO';
      lbl.classList.toggle('active', cb.checked);
      card.style.borderColor = cb.checked ? 'var(--teal-dim)' : '';
      card.style.background = cb.checked ? 'var(--bg-card-hover)' : '';
    });
  });

  // Quick select buttons
  document.getElementById('select-all-btn')?.addEventListener('click', () => {
    symptomsGrid.querySelectorAll('input[type=checkbox]').forEach(cb => {
      if (!cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change')); }
    });
  });

  document.getElementById('clear-all-btn')?.addEventListener('click', () => {
    symptomsGrid.querySelectorAll('input[type=checkbox]').forEach(cb => {
      if (cb.checked) { cb.checked = false; cb.dispatchEvent(new Event('change')); }
    });
  });

  document.getElementById('random-btn')?.addEventListener('click', () => {
    symptomsGrid.querySelectorAll('input[type=checkbox]').forEach(cb => {
      const val = Math.random() > 0.5;
      if (cb.checked !== val) { cb.checked = val; cb.dispatchEvent(new Event('change')); }
    });
  });

  // Gender buttons
  document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // ── Predict ──
  predictBtn?.addEventListener('click', async () => {
    const age = parseInt(document.getElementById('sym-age').value) || 40;
    const genderEl = document.querySelector('.gender-btn.selected');
    const gender = genderEl ? parseInt(genderEl.dataset.val) : 1;

    const features = {
      Age: age,
      Gender: gender,
    };

    SYMPTOMS_CONFIG.forEach(s => {
      features[s.key] = document.getElementById(`sym-${s.key}`)?.checked ? 1 : 0;
    });

    predictBtn.disabled = true;
    loader.classList.add('visible');
    resultSection.classList.remove('visible');

    try {
      const response = await fetch(`${API_BASE}/predict-symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
      });

      if (!response.ok) throw new Error((await response.json()).detail);
      const data = await response.json();
      AppState.symptomsResult = data;
      renderSymptomsResult(data);
      showToast('Symptoms analyzed', 'success');
    } catch (err) {
      if (err.message.includes('fetch') || err.message.includes('Failed')) {
        const demo = demoSymptomsResult();
        AppState.symptomsResult = demo;
        renderSymptomsResult(demo);
        showToast('Demo mode: Showing simulated result', 'info');
      } else {
        showToast(err.message, 'error');
      }
    } finally {
      predictBtn.disabled = false;
      loader.classList.remove('visible');
    }
  });

  function demoSymptomsResult() {
    const checked = document.querySelectorAll('#symptoms-grid input:checked').length;
    const prob = Math.min(0.95, 0.1 + checked * 0.06);
    const pred = prob > 0.5 ? 1 : 0;
    const features = {};
    SYMPTOMS_CONFIG.forEach(s => { features[s.key] = (Math.random() - 0.4) * 0.8; });
    features['Age'] = (Math.random() - 0.3) * 0.6;
    features['Gender'] = (Math.random() - 0.5) * 0.2;
    return { prediction: pred, probability: prob, feature_importance: features };
  }

  function renderSymptomsResult(data) {
    const isPositive = data.prediction === 1;
    const prob = Math.round(data.probability * 100);

    // Result badge
    const badge = document.getElementById('sym-result-badge');
    badge.textContent = isPositive ? 'Diabetes Likely' : 'Diabetes Unlikely';
    badge.className = `result-badge ${isPositive ? 'badge-positive' : 'badge-negative'}`;

    // Probability
    document.getElementById('sym-prob-text').textContent = `${prob}%`;
    document.getElementById('sym-prob-text').style.color = isPositive ? 'var(--red)' : 'var(--green)';

    // Risk bar
    const bar = document.getElementById('sym-risk-bar');
    bar.style.width = '0';
    bar.style.background = isPositive
      ? 'linear-gradient(90deg, var(--amber), var(--red))'
      : 'linear-gradient(90deg, var(--teal-dim), var(--green))';
    setTimeout(() => { bar.style.width = prob + '%'; }, 100);

    // Confidence ring
    const color = isPositive ? '#ef4444' : '#10b981';
    renderConfidenceRing('sym-conf-ring', prob, color);

    // Feature chart
    renderFeatureChart('sym-feat-chart', data.feature_importance, 8);

    // Summary text
    document.getElementById('sym-summary').textContent = isPositive
      ? `Based on ${Object.values(data.feature_importance).filter(v => v > 0).length} positive indicators, diabetes risk is elevated. Clinical evaluation recommended.`
      : `Symptom profile does not strongly indicate diabetes. Maintain healthy lifestyle and monitor periodically.`;

    resultSection.classList.add('visible');
    setTimeout(() => resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  }
});
