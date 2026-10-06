/**
 * Whether the visitor has asked the system to reduce motion, read once when the page loads.
 * Every script that animates checks this first, so people who opt out see the finished state instead.
 */

/** `true` when the `prefers-reduced-motion: reduce` media query matches. */
const reducedMotion = globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default reducedMotion;
