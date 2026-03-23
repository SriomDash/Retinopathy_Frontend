// ── LOGIN PAGE ──

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const nameInput = document.getElementById('doctor-name');
  const passInput = document.getElementById('doctor-pass');
  const nameError = document.getElementById('name-error');
  const passError = document.getElementById('pass-error');
  const loginBtn = document.getElementById('login-btn');
  const btnText = document.getElementById('login-btn-text');

  // Predefined doctor accounts
  const DOCTORS = [
    { name: 'Dr. Smith',   password: '123' },
    { name: 'Dr. Patel',   password: '123' },
    { name: 'Dr. Johnson', password: '123' },
  ];

  function clearErrors() {
    nameInput.classList.remove('error');
    passInput.classList.remove('error');
    nameError.classList.remove('visible');
    passError.classList.remove('visible');
  }

  function validateAndLogin(e) {
    e.preventDefault();
    clearErrors();

    const name = nameInput.value.trim();
    const pass = passInput.value.trim();

    let valid = true;

    if (!name) {
      nameInput.classList.add('error');
      nameError.textContent = 'Doctor name is required';
      nameError.classList.add('visible');
      valid = false;
    }

    if (!pass) {
      passInput.classList.add('error');
      passError.textContent = 'Password is required';
      passError.classList.add('visible');
      valid = false;
    }

    if (!valid) return;

    // Check password (default: 123 for any doctor name)
    if (pass !== DEFAULT_PASSWORD) {
      passInput.classList.add('error');
      passError.textContent = 'Invalid password';
      passError.classList.add('visible');
      return;
    }

    // Animate button
    loginBtn.disabled = true;
    btnText.textContent = 'Authenticating...';
    loginBtn.style.opacity = '0.8';

    setTimeout(() => {
      // Store doctor
      AppState.doctor = {
        name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
        loginTime: new Date().toLocaleTimeString(),
      };

      // Update nav user display
      document.getElementById('nav-doctor-name').textContent = AppState.doctor.name;

      loginBtn.disabled = false;
      btnText.textContent = '→ Access Portal';
      loginBtn.style.opacity = '1';

      showToast(`Welcome, ${AppState.doctor.name}`, 'success');
      navigateTo('eye');
    }, 800);
  }

  form.addEventListener('submit', validateAndLogin);

  // Enter key
  [nameInput, passInput].forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') validateAndLogin(e);
    });
    inp.addEventListener('input', clearErrors);
  });
});
