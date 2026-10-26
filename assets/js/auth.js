/**
 * ============================================================================
 * ADMIN LOGIN CONTROLLER
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const inputUsername = document.getElementById('username');
  const inputPassword = document.getElementById('password');
  const btnSubmit = document.getElementById('btnSubmit');
  const errorBanner = document.getElementById('errorBanner');

  function showError(msg) {
    if (errorBanner) {
      errorBanner.textContent = msg;
      errorBanner.classList.add('show');
    }
  }

  function hideError() {
    if (errorBanner) {
      errorBanner.textContent = '';
      errorBanner.classList.remove('show');
    }
  }

  if (inputUsername) inputUsername.addEventListener('input', hideError);
  if (inputPassword) inputPassword.addEventListener('input', hideError);

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideError();

      const username = inputUsername.value.trim();
      const password = inputPassword.value.trim();

      if (!username || !password) {
        showError('Please enter both username and password.');
        return;
      }

      btnSubmit.disabled = true;
      const originalText = btnSubmit.innerHTML;
      btnSubmit.innerHTML = '<span>Signing In...</span>';

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Authentication failed. Please check credentials.');
        }

        // Redirect to dashboard on success
        window.location.href = data.redirect || '/index.html';

      } catch (err) {
        showError(err.message || 'Unable to connect to server. Please try again.');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
      }
    });
  }
});
