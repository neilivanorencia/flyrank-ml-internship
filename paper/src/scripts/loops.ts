/**
 * Plays the illustration loops only while they are on screen, to save battery.
 * The CSS pauses every `[data-loop]` animation unless the element carries `[data-playing]`, which this script toggles.
 */

/** Marks a loop as playing while it is visible and clears the mark when it scrolls out of view. */
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    entry.target.toggleAttribute("data-playing", entry.isIntersecting);
  }
});

for (const loop of document.querySelectorAll("[data-loop]")) {
  observer.observe(loop);
}
