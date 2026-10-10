// Music Vault: a track's YouTube player (privacy-enhanced mode) loads only when someone presses play. Without
// JavaScript the same link opens the video on YouTube. Starting another track puts the previous one back.
(function () {
  "use strict";
  var current = null;

  function restore() {
    if (current) {
      current.frame.replaceWith(current.link);
      current = null;
    }
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a.track-play[data-video]");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    var id = link.getAttribute("data-video");
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) {
      return;
    }
    event.preventDefault();
    restore();
    var frame = document.createElement("iframe");
    frame.className = "track-frame";
    frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    frame.title = link.getAttribute("data-title") + " (YouTube video player)";
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    link.replaceWith(frame);
    current = { frame: frame, link: link };
    frame.focus();
  });
})();
