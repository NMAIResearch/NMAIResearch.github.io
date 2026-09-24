// Use a saved site preference, otherwise follow the system colour scheme.
(() => {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  try {
    const saved = localStorage.getItem('nmai-theme');
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {
    // Storage denial leaves the system preference available.
  }
  const current = () => preference || (system.matches ? 'dark' : 'light');
  function apply() {
    const theme = current();
    root.dataset.theme = theme;
    const button = document.getElementById('themeToggle');
    if (button) {
      button.hidden = false;
      button.textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
      button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    }
  }
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      preference = current() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('nmai-theme', preference); } catch {
        // The selected theme still applies for this page when storage is denied.
      }
      apply();
    });
    system.addEventListener('change', () => { if (!preference) apply(); });
  });
})();
