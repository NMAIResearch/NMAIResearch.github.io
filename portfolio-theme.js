// Use a saved site preference, otherwise follow the system colour scheme.
(() => {
  const root = document.documentElement;
  const THEME_TEXT = {en: {light: 'Light theme', dark: 'Dark theme', toLight: 'Switch to light theme', toDark: 'Switch to dark theme'},
    hu: {light: 'Világos téma', dark: 'Sötét téma', toLight: 'Váltás világos témára', toDark: 'Váltás sötét témára'}};
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
      const t = THEME_TEXT[root.lang === 'hu' ? 'hu' : 'en'];
      button.textContent = theme === 'dark' ? t.light : t.dark;
      button.setAttribute('aria-label', theme === 'dark' ? t.toLight : t.toDark);
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
