// The front page's music-note button (N.'s 958): Orchestra in My Pocket plays when the button is pressed and pauses on the next press.
// It never starts by itself: the audio element is made inside the click handler, so nothing of the song loads before the first press.
// The button stays hidden without this script, and where the browser says it cannot play FLAC. Its name, in the page's language, says what a press does.
(() => {
  const TEXT = {en: {play: 'Play ', pause: 'Pause '}, hu: {play: 'Lejátszás: ', pause: 'Szüneteltetés: '}};
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('musicToggle');
    if (!button || !button.dataset.src || !button.dataset.title) return;
    const probe = document.createElement('audio');
    if (typeof probe.canPlayType !== 'function' || !probe.canPlayType('audio/flac')) return;
    const caption = document.getElementById('musicCaption');
    const t = TEXT[document.documentElement.lang === 'hu' ? 'hu' : 'en'];
    let audio = null;
    const show = (playing) => {
      const label = (playing ? t.pause : t.play) + button.dataset.title;
      button.setAttribute('aria-label', label);
      button.title = label;
      button.classList.toggle('is-playing', playing);
    };
    show(false);
    button.hidden = false;
    button.addEventListener('click', () => {
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'musicTrack';
        audio.preload = 'auto';
        audio.src = button.dataset.src;
        audio.addEventListener('play', () => show(true));
        audio.addEventListener('pause', () => show(false));
        audio.addEventListener('ended', () => show(false));
        button.after(audio);
      }
      if (caption) caption.hidden = false;
      if (audio.paused) {
        const started = audio.play();
        if (started && typeof started.catch === 'function') started.catch(() => show(false));
      } else {
        audio.pause();
      }
    });
  });
})();
