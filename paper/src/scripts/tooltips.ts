/**
 * Shows the shared tooltip for chart marks on hover and with the arrow keys, and announces keyboard reads to screen readers.
 * A `[data-tooltips]` chart holds marks with `[data-label]` and `[data-value]`, and the chart itself takes focus so keyboard users can step through the marks.
 */

/** The gap in pixels between a mark and its tooltip. */
const GAP_PX = 10;
/** The smallest distance in pixels the tooltip keeps from the edge of the window. */
const EDGE_PX = 8;
/** Two, used to find the middle of a box. */
const HALF = 2;
/** The keys that move to the next mark. */
const NEXT_KEYS = new Set(["ArrowDown", "ArrowRight"]);
/** The keys that move to the previous mark. */
const PREVIOUS_KEYS = new Set(["ArrowLeft", "ArrowUp"]);
/** The instruction added to each chart's accessible label. */
const HINT = "Use the arrow keys to read each value.";

/** The one tooltip bubble shared by every chart. */
const tip = document.querySelector<HTMLElement>("[data-chart-tooltip]");
/** The live region that repeats keyboard reads for screen readers. */
const live = document.querySelector<HTMLElement>("[data-chart-live]");

/**
 * Lists the marks of a chart.
 * @param chart - The `[data-tooltips]` element.
 * @returns Every element with a `data-label`, in document order.
 */
const marksOf = (chart: Element): HTMLElement[] => [
  ...chart.querySelectorAll<HTMLElement>("[data-label]"),
];

/**
 * Limits a number to a range.
 * @param value - The number to limit.
 * @param low - The smallest allowed value.
 * @param high - The largest allowed value.
 * @returns `value`, or the nearest end of the range when it falls outside it.
 */
const clamp = (value: number, low: number, high: number): number =>
  Math.min(Math.max(value, low), high);

/**
 * Positions the tooltip above a mark, or below it when there is no room above.
 * @param box - The mark's position on screen.
 * @param panel - The tooltip element.
 */
const place = (box: DOMRect, panel: HTMLElement): void => {
  const halfWidth = panel.offsetWidth / HALF;
  // The tooltip is centered on the mark but kept inside the window.
  const left = clamp(
    box.left + box.width / HALF,
    EDGE_PX + halfWidth,
    innerWidth - EDGE_PX - halfWidth
  );
  const below = box.top - GAP_PX - panel.offsetHeight < EDGE_PX;
  // The flag tells the CSS to draw the tooltip below its anchor point instead of above it.
  panel.toggleAttribute("data-below", below);
  panel.style.left = `${left}px`;
  panel.style.top = `${box.top - GAP_PX}px`;
  if (below) {
    panel.style.top = `${box.bottom + GAP_PX}px`;
  }
};

/**
 * Replaces the tooltip content with a label and a value.
 * @param panel - The tooltip element.
 * @param label - The mark's name.
 * @param value - The mark's value, shown in bold.
 */
const fill = (panel: HTMLElement, label: string, value: string): void => {
  // The content is built as text nodes, so labels can never inject markup.
  const name = document.createElement("span");
  name.textContent = label;
  const amount = document.createElement("strong");
  amount.textContent = value;
  panel.replaceChildren(name, amount);
};

/** Clears the active mark and closes the tooltip. */
const hide = (): void => {
  for (const active of document.querySelectorAll<HTMLElement>("[data-tooltips] [data-active]")) {
    delete active.dataset.active;
  }
  if (tip?.matches(":popover-open") === true) {
    tip.hidePopover();
  }
};

/**
 * Shows the tooltip for a mark and marks it active.
 * @param mark - The element with the `data-label` and `data-value`.
 * @param announce - Whether to repeat the reading in the live region, which is wanted for keyboard reads but not for hover.
 */
const show = (mark: HTMLElement, announce: boolean): void => {
  // A page without the shared tooltip has nothing to show.
  if (tip === null) {
    return;
  }
  hide();
  const { label = "", value = "" } = mark.dataset;
  fill(tip, label, value);
  mark.dataset.active = "";
  tip.showPopover();
  // The tooltip is placed after it opens, because its size is unknown while it is hidden.
  place(mark.getBoundingClientRect(), tip);
  if (announce && live !== null) {
    live.textContent = `${label}: ${value}`;
  }
};

/**
 * Works out which mark a key press moves to.
 * @param key - The `key` of the keyboard event.
 * @param index - The index of the current mark.
 * @param count - How many marks the chart has.
 * @returns The new index, or `undefined` when the key does not move between marks.
 */
const nextIndex = (key: string, index: number, count: number): number | undefined => {
  if (NEXT_KEYS.has(key)) {
    return Math.min(index + 1, count - 1);
  }
  if (PREVIOUS_KEYS.has(key)) {
    return Math.max(index - 1, 0);
  }
  if (key === "Home") {
    return 0;
  }
  if (key === "End") {
    return count - 1;
  }
  return undefined;
};

/**
 * Lets keyboard users step through the marks of a chart.
 * @param chart - The focusable `[data-tooltips]` element.
 */
const watchKeys = (chart: HTMLElement): void => {
  let index = 0;
  const showAt = (target: number): void => {
    const mark = marksOf(chart)[target];
    // An index with no mark is ignored, which keeps the current one.
    if (mark !== undefined) {
      index = target;
      show(mark, true);
    }
  };
  // Focusing the chart reads the mark it stopped at last, which starts at the first.
  chart.addEventListener("focus", () => {
    showAt(index);
  });
  chart.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hide();
      return;
    }
    const target = nextIndex(event.key, index, marksOf(chart).length);
    // Only keys that move between marks are handled, and they must not also scroll the page.
    if (target !== undefined) {
      event.preventDefault();
      showAt(target);
    }
  });
  chart.addEventListener("blur", hide);
};

/**
 * Shows the tooltip for the mark under the pointer.
 * @param chart - The `[data-tooltips]` element.
 */
const watchPointer = (chart: HTMLElement): void => {
  chart.addEventListener("pointerover", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }
    const mark = event.target.closest<HTMLElement>("[data-label]");
    // Hover is not announced, because screen reader users read the marks with the keyboard.
    if (mark !== null) {
      show(mark, false);
    }
  });
  chart.addEventListener("pointerleave", hide);
};

for (const chart of document.querySelectorAll<HTMLElement>("[data-tooltips]")) {
  // The chart must take focus for the keyboard handling to work.
  chart.tabIndex = 0;
  chart.setAttribute("aria-label", `${chart.getAttribute("aria-label") ?? ""} ${HINT}`.trim());
  watchKeys(chart);
  watchPointer(chart);
}
