/**
 * Fills grids and rows of items as the reader scrolls past them, so a count builds up with the scroll.
 * A `[data-scrub]` container turns its `[data-scrub-item]` children on in order, and `data-scrub="rows"` fills each `[data-scrub-row]` to its own limit.
 */

import { scroll } from "motion";

import reducedMotion from "@/scripts/reduced-motion";

/** The scroll range that drives the fill, from the container entering the viewport to its center reaching the viewport center. */
const OFFSET = ["start end", "center center"] as const;

/**
 * Marks items as off from a given index onward and leaves the earlier ones on.
 * @param items - The items in fill order.
 * @param onCount - How many items at the start stay on.
 */
const setOff = (items: readonly Element[], onCount: number): void => {
  for (const [index, item] of items.entries()) {
    item.toggleAttribute("data-off", index >= onCount);
  }
};

/**
 * Fills each row of a container up to its own limit.
 * @param container - The `[data-scrub]` element that holds the rows.
 * @param progress - The scroll progress from 0 to 1.
 */
const scrubRows = (container: Element, progress: number): void => {
  for (const row of container.querySelectorAll<HTMLElement>("[data-scrub-row]")) {
    // Each row declares how many of its items can be on, so the rows end at different lengths.
    const limit = Number(row.dataset.scrubRow);
    setOff([...row.querySelectorAll("[data-scrub-item]")], Math.round(progress * limit));
  }
};

/**
 * Fills all the items of a container as one list and flags the container when every item is on.
 * @param container - The `[data-scrub]` element that holds the items.
 * @param progress - The scroll progress from 0 to 1.
 */
const scrubItems = (container: Element, progress: number): void => {
  const items = [...container.querySelectorAll("[data-scrub-item]")];
  const onCount = Math.round(progress * items.length);
  setOff(items, onCount);
  container.toggleAttribute("data-complete", onCount === items.length);
};

/**
 * Starts driving a container from the scroll position.
 * @param container - The `[data-scrub]` element to fill.
 */
const watch = (container: HTMLElement): void => {
  const update = (progress: number): void => {
    // The rows mode fills each row to its own limit.
    if (container.dataset.scrub === "rows") {
      scrubRows(container, progress);
      return;
    }
    // Any other value fills the container's items as one list.
    scrubItems(container, progress);
  };
  scroll(update, { offset: [...OFFSET], target: container });
};

for (const container of document.querySelectorAll<HTMLElement>("[data-scrub]")) {
  // People who reduce motion get the finished state at once.
  if (reducedMotion) {
    container.toggleAttribute("data-complete", true);
  } else {
    watch(container);
  }
}
