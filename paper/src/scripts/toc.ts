/**
 * Drives the floating contents button, whose ring fills with reading progress and whose panel is a reading map.
 * The panel is a native popover, so Esc and outside clicks close it without JavaScript, and this script adds the reading state, the focus handling, and closing after a link is used.
 */

import { scroll } from "motion";

import reducedMotion from "@/scripts/reduced-motion";

/** The share of the viewport height, measured from the top, where a section counts as being read. */
const READ_LINE = 0.4;
/** The share of the viewport height before the end of the hero at which the button appears. */
const SHOW_AFTER_HERO = 0.5;
/** The percent step at which the button's accessible label changes, so assistive tech is not updated on every scroll. */
const LABEL_STEP = 10;
/** The number that turns a progress between 0 and 1 into a percentage. */
const PERCENT = 100;
/** The pixels from the bottom of the page within which the reader counts as having reached the end, because eased scrolling and fractional scroll positions can stop short of the exact bottom, and the last section is too short to scroll its reading line past. */
const END_SLACK = 48;
/** The reading speed used for the minutes left estimate. */
const WORDS_PER_MINUTE = 230;
/** The milliseconds the panel waits before hiding, which matches the `toc-out` animation in `components/toc-button.astro`. */
const CLOSE_MS = 200;

/** Where a section stands relative to the reading line. */
type SectionState = "current" | "read" | "upcoming";

/** The page positions in pixels where a section starts and ends. */
interface Range {
  readonly end: number;
  readonly start: number;
}

/** The wrapper of the whole contents button, which carries the state flags. */
const root = document.querySelector<HTMLElement>("[data-toc]");
/** The progress ring around the button. */
const ring = root?.querySelector<SVGCircleElement>("[data-toc-progress]");
/** The round button that opens and closes the panel. */
const toggle = root?.querySelector<HTMLButtonElement>("[data-toc-toggle]");
/** The popover panel that lists the sections. */
const panel = root?.querySelector<HTMLElement>("[popover]");
/** The text that shows the percentage read. */
const percentText = root?.querySelector<HTMLElement>("[data-toc-percent]");
/** The text that shows the minutes left. */
const minutesText = root?.querySelector<HTMLElement>("[data-toc-minutes]");
/** The panel links, one per section, in reading order. */
const links = [...(root?.querySelectorAll<HTMLAnchorElement>("[data-toc-link]") ?? [])];
/** The hero element, after which the button appears. */
const hero = document.querySelector<HTMLElement>("[data-toc-after]");
/** The number of words in the main content, used for the minutes left estimate. */
const totalWords = (document.querySelector("main")?.textContent ?? "")
  .split(/\s+/u)
  .filter(Boolean).length;

/** The page range of every section, in the same order as `links`. */
let ranges: Range[] = [];
/** The last percent step announced in the button label, so the label only changes when the step does. */
let lastLabelStep = -1;

/**
 * Finds where a section starts on the page.
 * @param link - The panel link that points at the section.
 * @returns The distance in pixels from the top of the page, or 0 when the section is missing.
 */
const topOf = (link: HTMLAnchorElement): number => {
  const section = document.querySelector<HTMLElement>(`#${CSS.escape(link.hash.slice(1))}`);
  return (section?.getBoundingClientRect().top ?? 0) + globalThis.scrollY;
};

/** Measures every section's range, which runs from its own top to the top of the next section or the end of the page. */
const measure = (): void => {
  const tops = links.map((link) => topOf(link));
  const pageEnd = document.documentElement.scrollHeight;
  ranges = tops.map((start, index) => ({ end: tops[index + 1] ?? pageEnd, start }));
};

/**
 * Tells whether the page is scrolled to its bottom edge, within a small slack for fractional scroll positions.
 * @returns `true` once the bottom of the viewport is at the end of the page.
 */
const isAtEnd = (): boolean =>
  globalThis.scrollY + globalThis.innerHeight >= document.documentElement.scrollHeight - END_SLACK;

/**
 * Finds where the reading line sits on the page.
 * @param progress - The scroll progress through the whole page, from 0 to 1.
 * @returns The distance in pixels from the top of the page, which is the end of the page once the reader is at the bottom so the last section counts as read.
 */
const readingLine = (progress: number): number => {
  if (isAtEnd()) {
    return document.documentElement.scrollHeight;
  }
  // The line moves from the read line down to the bottom edge as the page scrolls, so the last section can be reached at the very end.
  return globalThis.scrollY + globalThis.innerHeight * (READ_LINE + (1 - READ_LINE) * progress);
};

/**
 * Corrects the scroll progress at the end of the page, where it can stop a hair short of 1.
 * @param scrolled - The scroll progress through the whole page, from 0 to 1.
 * @returns 1 at the end of the page, and the given progress elsewhere.
 */
const settle = (scrolled: number): number => {
  if (isAtEnd()) {
    return 1;
  }
  return scrolled;
};

/**
 * Compares a section's range with the reading line.
 * @param range - The section's page range.
 * @param line - The reading line's position in pixels from the top of the page.
 * @returns `read` once the line has passed the section, `current` while it is inside, and `upcoming` before it.
 */
const stateOf = (range: Range, line: number): SectionState => {
  if (line >= range.end) {
    return "read";
  }
  if (line >= range.start) {
    return "current";
  }
  return "upcoming";
};

/**
 * Updates every panel link with its reading state and its progress through its section.
 * @param progress - The scroll progress through the whole page, from 0 to 1.
 */
const markSections = (progress: number): void => {
  const line = readingLine(progress);
  for (const [index, link] of links.entries()) {
    const range = ranges[index] ?? { end: 0, start: 0 };
    const state = stateOf(range, line);
    link.dataset.state = state;
    link.toggleAttribute("aria-current", state === "current");
    // The section progress is how far the line is through the section, kept between 0 and 1, and the `max` avoids dividing by zero.
    const within = (line - range.start) / Math.max(range.end - range.start, 1);
    const clamped = Math.min(Math.max(within, 0), 1);
    link.style.setProperty("--section-progress", String(clamped));
  }
};

/**
 * Estimates the reading time left.
 * @param progress - The scroll progress through the whole page, from 0 to 1.
 * @returns The minutes left as text, or `done` when none are left.
 */
const minutesLeft = (progress: number): string => {
  // The read-out never shows minutes left beside 100% read, since the percentage rounds up near the end.
  if (Math.round(progress * PERCENT) >= PERCENT) {
    return "done";
  }
  const minutes = Math.ceil((totalWords * (1 - progress)) / WORDS_PER_MINUTE);
  if (minutes > 0) {
    return `${minutes} min left`;
  }
  return "done";
};

/**
 * Updates the percentage, the minutes left, and the button's accessible label.
 * @param progress - The scroll progress through the whole page, from 0 to 1.
 */
const updateText = (progress: number): void => {
  const step = Math.floor((progress * PERCENT) / LABEL_STEP);
  if (percentText) {
    percentText.textContent = `${Math.round(progress * PERCENT)}% read`;
  }
  if (minutesText) {
    minutesText.textContent = minutesLeft(progress);
  }
  // The label only changes when the percent step does, so a screen reader is not interrupted on every scroll.
  if (step !== lastLabelStep) {
    lastLabelStep = step;
    toggle?.setAttribute("aria-label", `Contents, ${step * LABEL_STEP}% read`);
  }
};

/**
 * Tells whether the panel is showing.
 * @returns `true` while the popover is open.
 */
const isOpen = (): boolean => panel?.matches(":popover-open") === true;

/** Opens the panel and records the open state on the wrapper and the button. */
const openPanel = (): void => {
  panel?.showPopover();
  root?.toggleAttribute("data-open", true);
  toggle?.setAttribute("aria-expanded", "true");
};

/** Plays the outro, then hides the panel and returns focus to the button if it was inside the panel. */
const closePanel = (): void => {
  // A panel that is already closed or already closing is ignored.
  if (!panel || !isOpen() || Object.hasOwn(panel.dataset, "closing")) {
    return;
  }
  root?.toggleAttribute("data-open", false);
  toggle?.setAttribute("aria-expanded", "false");
  const hide = (): void => {
    delete panel.dataset.closing;
    panel.hidePopover();
    // Focus would be lost when the focused link disappears, so it goes back to the button.
    if (panel.contains(document.activeElement)) {
      toggle?.focus();
    }
  };
  // People who reduce motion get an instant close with no outro.
  if (reducedMotion) {
    hide();
    return;
  }
  // The attribute starts the outro in the CSS, and the panel hides once it has had time to play.
  panel.dataset.closing = "";
  globalThis.setTimeout(hide, CLOSE_MS);
};

/**
 * Reads the scroll progress straight from the page, for when the layout changes without a scroll.
 * @returns The scroll progress through the whole page, from 0 to 1.
 */
const currentProgress = (): number => {
  const scrollable = document.documentElement.scrollHeight - globalThis.innerHeight;
  return Math.min(Math.max(globalThis.scrollY / Math.max(scrollable, 1), 0), 1);
};

/**
 * Updates the whole button for the current scroll position.
 * @param scrolled - The scroll progress through the whole page, from 0 to 1.
 */
const onScroll = (scrolled: number): void => {
  // The end of the page counts as fully read even when the scroll progress stops a hair short of 1.
  const progress = settle(scrolled);
  ring?.style.setProperty("stroke-dashoffset", String(1 - progress));
  const heroEnd = (hero?.offsetTop ?? 0) + (hero?.offsetHeight ?? 0);
  const visible = globalThis.scrollY > heroEnd - globalThis.innerHeight * SHOW_AFTER_HERO;
  root?.toggleAttribute("data-visible", visible);
  // A hidden button must not leave its panel open.
  if (!visible) {
    closePanel();
  }
  markSections(progress);
  updateText(progress);
};

/** Adds the listeners for opening and closing the panel. */
const watchPanel = (): void => {
  toggle?.addEventListener("click", (event) => {
    event.preventDefault();
    if (isOpen()) {
      closePanel();
    } else {
      openPanel();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePanel();
    }
  });
  // A press outside the contents button closes the panel.
  document.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Node && root?.contains(event.target) === false) {
      closePanel();
    }
  });
  // When the panel opens, focus moves to the current section link, or the first link when none is current.
  panel?.addEventListener("toggle", (event) => {
    if (event instanceof ToggleEvent && event.newState === "open") {
      (links.find((link) => link.hasAttribute("aria-current")) ?? links[0])?.focus();
    }
  });
  // Using a link closes the panel so it does not cover the section the reader jumped to.
  for (const link of links) {
    link.addEventListener("click", closePanel);
  }
};

// Nothing runs on a page that has no contents button.
if (root !== null && root !== undefined) {
  // The flag tells the CSS that the script is running, so it can show the read-out and the live open state.
  root.toggleAttribute("data-live", true);
  measure();
  // The ranges depend on the layout, so they are measured again whenever the page changes size, and the read-out is refreshed because a size change can move the reader to the end without a scroll.
  new ResizeObserver(() => {
    measure();
    onScroll(currentProgress());
  }).observe(document.body);
  scroll(onScroll);
  watchPanel();
}
