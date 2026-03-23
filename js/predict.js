// ── PREDICT PAGE (Sliders) ──

const SLIDER_CONFIG = [
  {
    key: 'Glucose',
    label: 'Glucose',
    unit: 'mg/dL',
    min: 0, max: 300, step: 1, default: 120,
    refMin: 70, refMax: 140,
    refLabel: 'Normal: 70–140 mg/dL',
  },
  {
    key: 'BloodPressure',
    label: 'Blood Pressure',
    unit: 'mmHg',
    min: 0, max: 180, step: 1, default: 72,
    refMin: 60, refMax: 90,
    refLabel: 'Normal diastolic: 60–90 mmHg',
  },
  {
    key: 'SkinThickness',
    label: 'Skin Thickness',
    unit: 'mm',
    min: 0, max: 100, step: 1, default: 20,
    refMin: 10, refMax: 40,
    refLabel: 'Triceps skinfold: 10–40 mm',
  },
  {
    key: 'Insulin',
    label: 'Insulin',
    unit: 'µU/mL',
    min: 0, max: 900, step: 1, default: 79,
    refMin: 2, refMax: 25,
    refLabel: 'Fasting normal: 2–25 µU/mL',
  },
  {
    key: 'BMI',
    label: 'Body Mass Index',
    unit: 'kg/m²',
    min: 10, max: 70, step: 0.1, default: 25.0,
    refMin: 18.5, refMax: 24.9,
    refLabel: 'Healthy: 18.5–24.9 kg/m²',
    fullWidth: true,
  },
  {
    key: 'DiabetesPedigreeFunction',
    label: 'Pedigree Function',
    unit: '',
    min: 0, max: 2.5, step: 0.001, default: 0.471,
    refLabel: 'Genetic likelihood score',
  },
  {
    key: 'Age',
    label: 'Age',
    unit: 'yrs',
    min: 1, max: 120, step: 1, default: 33,
    refLabel: 'Patient age in years',
  },
];

document.addEventListener('DOMContentLoaded', () => {
  const slidersGrid  = document.getElementById('sliders-grid');
  const predictBtn   = document.getElementById('diabetes-predict-btn');
  const loader       = document.getElementById('predict-loader');
  const resultSection= document.getElementById('predict-result');

  // ── Pregnancies counter ──
  let pregnanciesVal = 1;

  function updatePregnancies(val) {
    pregnanciesVal = Math.max(0, Math.min(20, val));
    document.getElementById('preg-display').textContent = pregnanciesVal;
  }

  document.getElementById('preg-dec')?.addEventListener('click', () => updatePregnancies(pregnanciesVal - 1));
  document.getElementById('preg-inc')?.addEventListener('click', () => updatePregnancies(pregnanciesVal + 1));

  // ── Build sliders ──
  slidersGrid.innerHTML = SLIDER_CONFIG.map(cfg => `
    <div class="slider-card${cfg.fullWidth ? ' full-width' : ''}">
      <div class="slider-header">
        <span class="slider-name">${cfg.label}</span>
        <span>
          <span class="slider-val-display" id="val-${cfg.key}">${cfg.default}</span>
          <span class="slider-unit">${cfg.unit}</span>
        </span>
      </div>
      <div class="range-wrap">
        <input
          type="range"
          id="range-${cfg.key}"
          min="${cfg.min}"
          max="${cfg.max}"
          step="${cfg.step}"
          value="${cfg.default}"
        />
      </div>
      <div class="range-labels">
        <span>${cfg.min}${cfg.unit ? ' ' + cfg.unit : ''}</span>
        <span>${cfg.max}${cfg.unit ? ' ' + cfg.unit : ''}</span>
      </div>
      <div class="ref-zone">
        <span>${cfg.refLabel}</span>
      </div>
    </div>
  `).join('');

  // Wire up range inputs
  SLIDER_CONFIG.forEach(cfg => {
    const input = document.getElementById(`range-${cfg.key}`);
    const display = document.getElementById(`val-${cfg.key}`);
    if (!input) return;

    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      display.textContent = cfg.step < 1 ? val.toFixed(cfg.step === 0.001 ? 3 : 1) : val;
      updateRangeColor(input, cfg);
    });

    updateRangeColor(input, cfg);
  });

  function updateRangeColor(input, cfg) {
    const val = parseFloat(input.value);
    const pct = ((val - cfg.min) / (cfg.max - cfg.min)) * 100;
    input.style.background = `linear-gradient(90deg, var(--teal) ${pct}%, var(--border) ${pct}%)`;

    // Color the display based on reference range
    const display = document.getElementById(`val-${cfg.key}`);
    if (cfg.refMin !== undefined && cfg.refMax !== undefined) {
      if (val < cfg.refMin || val > cfg.refMax) {
        display.style.color = 'var(--amber)';
      } else {
        display.style.color = 'var(--teal)';
      }
    }
  }

  // ── Predict ──
  predictBtn?.addEventListener('click', async () => {
    const features = {
      Pregnancies: pregnanciesVal,
    };

    SLIDER_CONFIG.forEach(cfg => {
      features[cfg.key] = parseFloat(document.getElementById(`range-${cfg.key}`)?.value || cfg.default);
    });

    predictBtn.disabled = true;
    loader.classList.add('visible');
    resultSection.classList.remove('visible');

    try {
      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
      });

      if (!response.ok) throw new Error((await response.json()).detail);
      const data = await response.json();
      AppState.predictResult = data;
      renderPredictResult(data, features);
      showToast('Prediction complete', 'success');
    } catch (err) {
      if (err.message.includes('fetch') || err.message.includes('Failed')) {
        const demo = demoPredictResult(features);
        AppState.predictResult = demo;
        renderPredictResult(demo, features);
        showToast('Demo mode: Showing simulated result', 'info');
      } else {
        showToast(err.message, 'error');
      }
    } finally {
      predictBtn.disabled = false;
      loader.classList.remove('visible');
    }
  });

  function demoPredictResult(features) {
    // Simple heuristic for demo
    const glucose = features.Glucose / 300;
    const bmi = (features.BMI - 10) / 60;
    const age = features.Age / 120;
    const prob = Math.min(0.95, Math.max(0.05, (glucose * 0.5 + bmi * 0.3 + age * 0.2) + (Math.random() - 0.5) * 0.15));
    const pred = prob > 0.5 ? 1 : 0;
    const importance = {};
    const names = ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age'];
    names.forEach(n => { importance[n] = (Math.random() - 0.35) * 1.2; });
    importance['Glucose'] = prob * 0.8;
    importance['BMI'] = prob * 0.5;
    return { prediction: pred, probability: prob, feature_importance: importance };
  }

  function renderPredictResult(data, features) {
    const isPositive = data.prediction === 1;
    const prob = Math.round(data.probability * 100);

    // Badge
    const badge = document.getElementById('pred-result-badge');
    badge.textContent = isPositive ? 'Diabetes Detected' : 'No Diabetes Detected';
    badge.className = `result-badge ${isPositive ? 'badge-positive' : 'badge-negative'}`;

    // Risk percentage
    document.getElementById('pred-risk-pct').textContent = `${prob}%`;
    document.getElementById('pred-risk-pct').style.color = isPositive ? 'var(--red)' : 'var(--green)';

    // Risk bar
    const bar = document.getElementById('pred-risk-bar');
    bar.style.width = '0';
    bar.style.background = isPositive
      ? 'linear-gradient(90deg, var(--amber), var(--red))'
      : 'linear-gradient(90deg, var(--teal-dim), var(--green))';
    setTimeout(() => { bar.style.width = prob + '%'; }, 100);

    // Confidence ring
    const color = isPositive ? '#ef4444' : '#10b981';
    renderConfidenceRing('pred-conf-ring', prob, color);

    // Feature importance chart
    renderFeatureChart('pred-feat-chart', data.feature_importance, 8);

    // Summary
    document.getElementById('pred-summary').textContent = isPositive
      ? `Clinical indicators suggest elevated diabetes risk (${prob}%). Glucose and BMI are primary contributing factors. Immediate consultation recommended.`
      : `Current clinical profile does not indicate diabetes (${prob}% risk). Maintain healthy glucose levels and regular monitoring.`;

    resultSection.classList.add('visible');
    setTimeout(() => resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  }
});
