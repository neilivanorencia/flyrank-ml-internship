/**
 * Plays the scroll-in animations as elements enter the viewport, using the Motion library.
 * `[data-reveal]` groups rise in, `[data-chart]` charts grow and draw, and a single number in `[data-count]` counts up to the value already in the HTML.
 */

import { animate, inView, stagger } from "motion";

import reducedMotion from "@/scripts/reduced-motion";

/** The first control point x value of the shared easing curve, which starts fast. */
const EASE_X1 = 0.16;
/** The second control point x value of the shared easing curve, which settles gently. */
const EASE_X2 = 0.3;
/** The cubic bezier curve that every animation here uses, so they all move with the same feel. */
const EASE = [EASE_X1, 1, EASE_X2, 1] as const;
/** The seconds one revealed child takes to rise in. */
const REVEAL_S = 0.8;
/** The seconds between one revealed child starting and the next. */
const REVEAL_STAGGER_S = 0.07;
/** The distance in pixels a revealed child rises. */
const RISE_PX = 20;
/** The seconds one chart bar takes to grow. */
const GROW_S = 0.9;
/** The seconds between one chart bar starting and the next. */
const GROW_STAGGER_S = 0.03;
/** The seconds the chart lines take to draw. */
const DRAW_S = 0.6;
/** The seconds the chart labels take to fade in. */
const FADE_S = 0.4;
/** The seconds a number takes to count up. */
const COUNT_S = 1.2;
/** The viewport margin that makes a reveal wait until the group is well inside the screen. */
const VIEW_MARGIN = "0px 0px -15% 0px";
/** The share of a chart that must be visible before it draws. */
const CHART_AMOUNT = 0.35;
/** The share of a number that must be visible before it counts up. */
const COUNT_AMOUNT = 0.6;
/** Splits text into the `before` text, the `digits` with optional commas and decimals, and the `after` text. */
const NUMBER = /^(?<before>\D*)(?<digits>\d[\d,]*(?:\.\d+)?)(?<after>.*)$/su;

/**
 * Fades and lifts each child of a group in turn.
 * @param group - The `[data-reveal]` element whose children animate.
 */
const revealGroup = (group: Element): void => {
  animate(
    [...group.children],
    { opacity: [0, 1], transform: [`translateY(${RISE_PX}px)`, "translateY(0px)"] },
    { delay: stagger(REVEAL_STAGGER_S), duration: REVEAL_S, ease: EASE }
  );
};

/**
 * Grows the bars of a chart, then draws its lines, then fades in its labels.
 * @param chart - The `[data-chart]` element to animate.
 */
const drawChart = (chart: Element): void => {
  const growY = chart.querySelectorAll('[data-grow="y"]');
  const growX = chart.querySelectorAll('[data-grow="x"]');
  const draws = chart.querySelectorAll("[data-draw]");
  const fades = chart.querySelectorAll("[data-fade]");
  // The lines wait for the slowest group of bars to finish, and the labels wait for the lines.
  const growEnd = GROW_S + GROW_STAGGER_S * Math.max(growY.length, growX.length);
  const options = { delay: stagger(GROW_STAGGER_S), duration: GROW_S, ease: EASE };
  animate(growY, { scaleY: [0, 1] }, options);
  animate(growX, { scaleX: [0, 1] }, options);
  animate(draws, { scaleX: [0, 1] }, { delay: growEnd, duration: DRAW_S, ease: EASE });
  animate(fades, { opacity: [0, 1] }, { delay: growEnd + DRAW_S, duration: FADE_S });
};

/**
 * Counts a number up from zero to the value already written in the element.
 * @param element - The `[data-count]` element that holds a single number.
 */
const countUp = (element: Element): void => {
  const text = element.textContent ?? "";
  const parts = NUMBER.exec(text.trim())?.groups;
  // Text with no number in it is left as it is.
  if (parts?.digits === undefined) {
    return;
  }
  const target = Number(parts.digits.replaceAll(",", ""));
  // The count keeps the original number of decimals and thousands separators, so it reads like the final value throughout.
  const decimals = parts.digits.split(".")[1]?.length ?? 0;
  const format = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
    useGrouping: parts.digits.includes(","),
  });
  animate(0, target, {
    duration: COUNT_S,
    ease: EASE,
    // The original text is put back at the end, so rounding in the count can never change the final figure.
    onComplete: () => {
      element.textContent = text;
    },
    onUpdate: (value) => {
      element.textContent = `${parts.before ?? ""}${format.format(value)}${parts.after ?? ""}`;
    },
  });
};

// People who reduce motion see everything in its final state, so no animation is set up.
if (!reducedMotion) {
  inView("[data-reveal]", revealGroup, { margin: VIEW_MARGIN });
  inView("[data-chart]", drawChart, { amount: CHART_AMOUNT });
  inView("[data-count]", countUp, { amount: COUNT_AMOUNT });
}
