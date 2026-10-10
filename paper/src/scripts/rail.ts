/**
 * Draws the playbook's progress rail, a line that fills as the reader scrolls and lights each step it reaches.
 * A `[data-rail]` wrapper holds `[data-rail-step]` steps, and each step has a `[data-rail-badge]` that the line runs through.
 */

import { scroll } from "motion";

import reducedMotion from "@/scripts/reduced-motion";

/** The scroll range that drives the rail, from the wrapper's top reaching 65% of the viewport to its bottom reaching the same line. */
const OFFSET = ["start 65%", "end 65%"] as const;
/** The slack in pixels when comparing a badge position with the line, so a badge on the line counts as reached. */
const TOLERANCE_PX = 1;
/** Two, used to find the middle of a badge. */
const HALF = 2;

/**
 * Measures where each badge sits.
 * @param wrap - The `[data-rail]` wrapper.
 * @returns The vertical center of every badge in pixels from the top of the wrapper.
 */
const badgeCenters = (wrap: HTMLElement): number[] => {
  const { top } = wrap.getBoundingClientRect();
  return [...wrap.querySelectorAll("[data-rail-badge]")].map((badge) => {
    const box = badge.getBoundingClientRect();
    return box.top + box.height / HALF - top;
  });
};

/**
 * Lights the steps the line has reached and marks the last of them as the current one.
 * @param steps - The step elements in order.
 * @param centers - The badge centers from `badgeCenters`, in the same order.
 * @param reach - How far down the wrapper the line extends, in pixels.
 */
const lightSteps = (
  steps: readonly HTMLElement[],
  centers: readonly number[],
  reach: number
): void => {
  let current = -1;
  for (const [index, step] of steps.entries()) {
    // A step with no measured badge is treated as unreachable.
    const lit = (centers[index] ?? Number.POSITIVE_INFINITY) <= reach + TOLERANCE_PX;
    step.toggleAttribute("data-lit", lit);
    if (lit) {
      current = index;
    }
  }
  // The current step is the last lit one, so it is set in a second pass once that is known.
  for (const [index, step] of steps.entries()) {
    step.toggleAttribute("data-current", index === current);
  }
};

/**
 * Wires one rail to the scroll position and keeps its line sized to its badges.
 * @param wrap - The `[data-rail]` wrapper.
 */
const setUpRail = (wrap: HTMLElement): void => {
  const steps = [...wrap.querySelectorAll<HTMLElement>("[data-rail-step]")];
  let centers = badgeCenters(wrap);
  // Places the line from the first badge to the last, and runs again whenever the wrapper changes size.
  const place = (): void => {
    centers = badgeCenters(wrap);
    const first = centers[0] ?? 0;
    wrap.style.setProperty("--rail-top", `${first}px`);
    wrap.style.setProperty("--rail-length", `${(centers.at(-1) ?? first) - first}px`);
  };
  // Fills the line to the scroll progress and lights the steps it has reached.
  const update = (progress: number): void => {
    const first = centers[0] ?? 0;
    wrap.style.setProperty("--rail-progress", String(progress));
    lightSteps(steps, centers, first + progress * ((centers.at(-1) ?? first) - first));
  };
  place();
  new ResizeObserver(place).observe(wrap);
  // The flag tells the CSS that the script is running, so it shows the line and dims the steps not yet reached.
  wrap.toggleAttribute("data-live", true);
  scroll(update, { offset: [...OFFSET], target: wrap });
};

for (const wrap of document.querySelectorAll<HTMLElement>("[data-rail]")) {
  // People who reduce motion see every step lit and no moving line.
  if (reducedMotion) {
    for (const step of wrap.querySelectorAll("[data-rail-step]")) {
      step.toggleAttribute("data-lit", true);
    }
  } else {
    setUpRail(wrap);
  }
}
