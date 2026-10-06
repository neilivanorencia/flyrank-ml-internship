/**
 * Adds eased scrolling for mouse users with the Lenis library and routes in-page link clicks through it.
 * Touch devices and people who reduce motion keep the browser's native scrolling.
 */

import Lenis from "lenis";

import reducedMotion from "@/scripts/reduced-motion";

/** How much of the remaining distance Lenis covers each frame, where a smaller number gives a longer glide. */
const LERP = 0.1;

/**
 * Starts Lenis when smooth scrolling suits the visitor.
 * @returns The Lenis instance, or `undefined` for people who reduce motion and for devices without a fine pointer.
 */
const startSmoothScroll = (): Lenis | undefined => {
  const finePointer = globalThis.matchMedia("(pointer: fine)").matches;
  // Touch screens already scroll smoothly, and reduced motion asks for no easing.
  if (reducedMotion || !finePointer) {
    return undefined;
  }
  // Nested scroll areas such as dialogs scroll natively, and Lenis runs its own frame loop.
  return new Lenis({
    allowNestedScroll: true,
    autoRaf: true,
    autoToggle: true,
    lerp: LERP,
  });
};

/** The running Lenis instance, or `undefined` when smooth scrolling is off. */
const smoothScroll = startSmoothScroll();

/**
 * Scrolls to an in-page anchor through Lenis so the jump glides like the rest of the page.
 * @param lenis - The running Lenis instance.
 * @param event - The click event to inspect.
 */
const followAnchor = (lenis: Lenis, event: MouseEvent): void => {
  // A click with no `detail` comes from the keyboard, and modified clicks open tabs, so both keep the native behavior.
  const plainClick =
    event.button === 0 && event.detail > 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey;
  if (!plainClick || !(event.target instanceof Element)) {
    return;
  }
  const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
  // Links that are not in-page anchors, or that point at nothing on the page, are left alone.
  if (link === null || link.hash === "" || document.querySelector(link.hash) === null) {
    return;
  }
  event.preventDefault();
  // The history entry keeps the address bar and the Back button working as they would with a native jump.
  history.pushState(null, "", link.hash);
  lenis.scrollTo(link.hash, { lock: true });
};

if (smoothScroll) {
  document.addEventListener("click", (event) => {
    followAnchor(smoothScroll, event);
  });
}

export default smoothScroll;
