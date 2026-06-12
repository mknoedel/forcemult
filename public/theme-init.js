// Applies the persisted theme before first paint to prevent a flash of the
// wrong theme. Loaded synchronously from <head> in app/layout.tsx.
(function () {
  try {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {
    /* localStorage unavailable — default (light) theme applies */
  }
})();
