// ── EYE DETECTION PAGE ──

const RETINOPATHY_INFO = {
  'No DR':        { level: 0, desc: 'No signs of diabetic retinopathy detected. The retina appears healthy with no visible lesions or abnormalities. Routine follow-up recommended.', color: '#10b981' },
  'Mild':         { level: 1, desc: 'Mild nonproliferative diabetic retinopathy. Microaneurysms are present. Close monitoring every 9–12 months is advised.', color: '#f59e0b' },
  'Moderate':     { level: 2, desc: 'Moderate NPDR. More microaneurysms, dot and blot hemorrhages, and possible hard exudates. Follow-up every 6 months.', color: '#f59e0b' },
  'Severe':       { level: 3, desc: 'Severe NPDR. Extensive retinal hemorrhages in all quadrants. High risk of progression. Ophthalmologist referral required urgently.', color: '#ef4444' },
  'Proliferative':{ level: 4, desc: 'Proliferative diabetic retinopathy. Neovascularization detected. Immediate specialist intervention required — vitreoretinal surgery may be needed.', color: '#ef4444' },
};

document.addEventListener('DOMContentLoaded', () => {
  const uploadZone   = document.getElementById('upload-zone');
  const fileInput    = document.getElementById('eye-file');
  const previewPanel = document.getElementById('preview-panel');
  const previewImg   = document.getElementById('preview-img');
  const previewName  = document.getElementById('preview-name');
  const previewSize  = document.getElementById('preview-size');
  const analyzeBtn   = document.getElementById('analyze-btn');
  const changeBtn    = document.getElementById('change-img-btn');
  const loader       = document.getElementById('eye-loader');
  const resultSection= document.getElementById('eye-result');

  let selectedFile = null;

  // Drag & Drop
  uploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large (max 10MB)', 'error');
      return;
    }

    selectedFile = file;
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewName.textContent = file.name;
    previewSize.textContent = (file.size / 1024).toFixed(1) + ' KB';

    uploadZone.style.display = 'none';
    previewPanel.classList.add('visible');
    resultSection.classList.remove('visible');
  }

  changeBtn?.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    uploadZone.style.display = '';
    previewPanel.classList.remove('visible');
    resultSection.classList.remove('visible');
  });

  analyzeBtn?.addEventListener('click', async () => {
    if (!selectedFile) return;

    analyzeBtn.disabled = true;
    loader.classList.add('visible');
    resultSection.classList.remove('visible');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE}/detect`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Detection failed');
      }

      const data = await response.json();
      AppState.eyeResult = data;
      renderEyeResult(data);
      showToast('Analysis complete', 'success');
    } catch (err) {
      // For demo mode (no backend)
      if (err.message.includes('fetch') || err.message.includes('Failed')) {
        const demo = demoEyeResult();
        AppState.eyeResult = demo;
        renderEyeResult(demo);
        showToast('Demo mode: Showing simulated result', 'info');
      } else {
        showToast(err.message, 'error');
      }
    } finally {
      analyzeBtn.disabled = false;
      loader.classList.remove('visible');
    }
  });

  function demoEyeResult() {
    const levels = Object.keys(RETINOPATHY_INFO);
    const label = levels[Math.floor(Math.random() * levels.length)];
    return {
      id: 1,
      retinopathy_level: label,
      confidence: 0.72 + Math.random() * 0.25,
    };
  }

  function renderEyeResult(data) {
    const info = RETINOPATHY_INFO[data.retinopathy_level] || RETINOPATHY_INFO['No DR'];
    const confPct = Math.round(data.confidence * 100);

    // Level text
    document.getElementById('result-level-text').textContent = data.retinopathy_level;
    document.getElementById('result-level-text').className = `retinopathy-level level-${info.level}`;
    document.getElementById('result-description').textContent = info.desc;

    // Badge
    const badge = document.getElementById('result-badge');
    badge.textContent = info.level >= 3 ? 'High Risk' : info.level >= 1 ? 'Monitor' : 'Healthy';
    badge.className = `result-badge ${info.level >= 3 ? 'badge-positive' : info.level >= 1 ? 'badge-warning' : 'badge-negative'}`;

    // Severity pips
    const pips = document.querySelectorAll('.severity-pip');
    pips.forEach((pip, i) => {
      pip.className = 'severity-pip';
      if (i <= info.level) pip.classList.add(`active-${info.level}`);
    });

    // Confidence ring
    renderConfidenceRing('conf-ring', confPct, info.color);

    // Confidence text
    document.getElementById('conf-label').textContent = `${confPct}% Confidence`;
    document.getElementById('conf-model-info').textContent = `Ensemble: Model A + Model B`;

    resultSection.classList.add('visible');

    // Smooth scroll to result
    setTimeout(() => {
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }
});
