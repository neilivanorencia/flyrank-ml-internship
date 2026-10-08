/**
 * Shared number formatters and track scales that give every chart the same formats and 0 to 100 positions.
 * Charts place marks with percentage styles, so each scale here maps a data value onto a track that is 100 units long.
 */

import { format } from "d3-format";
import { scaleLinear, scaleLog } from "d3-scale";

/** Short month names indexed by month number minus one. */
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** The length of a chart track in percent, which is the range every scale maps onto. */
const FULL_TRACK = 100;
/** Matches a month pair such as `2026-05 → 2026-06` and captures the `from` and `to` month digits. */
const PAIR_PATTERN = /^\d{4}-(?<from>\d{2}) → \d{4}-(?<to>\d{2})$/u;

/** Formats a whole number with thousands separators. */
const formatInteger = format(",d");
/** Formats a number with three significant digits and an SI suffix, which keeps very large counts short. */
const formatCompact = format(".3s");
/** Formats a number with one decimal place. */
const formatOne = format(".1f");
/** Formats a number with two decimal places. */
const formatTwo = format(".2f");
/** Formats a number with three decimal places. */
const formatThree = format(".3f");
/** Formats a number with two decimal places and an explicit sign. */
const formatSignedTwo = format("+.2f");
/** Formats a number with one decimal place and an explicit sign. */
const formatSignedOne = format("+.1f");

/**
 * Formats a percentage with one decimal place.
 * @param value - The percentage as a plain number, such as `4.2`.
 * @returns The value followed by a percent sign.
 */
const percentText = (value: number): string => `${formatOne(value)}%`;

/**
 * Formats a percentage as a whole number.
 * @param value - The percentage as a plain number, such as `88`.
 * @returns The value with thousands separators, followed by a percent sign.
 */
const wholePercentText = (value: number): string => `${formatInteger(value)}%`;

/**
 * Creates a scale that maps a value range onto the track in a straight line.
 * @param min - The value at the start of the track.
 * @param max - The value at the end of the track.
 * @returns A function that turns a value into a position from 0 to 100, wrapped so callers get no d3 types.
 */
const linearTrack = (min: number, max: number): ((value: number) => number) => {
  const scale = scaleLinear().domain([min, max]).range([0, FULL_TRACK]);
  return (value) => scale(value);
};

/**
 * Creates a scale that maps values from 1 up to a maximum onto the track on a log axis.
 * @param max - The value at the end of the track.
 * @returns A function that turns a value into a position from 0 to 100, wrapped so callers get no d3 types.
 */
const logTrack = (max: number): ((value: number) => number) => {
  // The domain starts at 1 because a log scale cannot include 0.
  const scale = scaleLog().domain([1, max]).range([0, FULL_TRACK]);
  return (value) => scale(value);
};

/**
 * Looks up the short name of a month.
 * @param digits - The month number as text, such as `05`.
 * @returns The three-letter month name.
 * @throws {@link RangeError} When `digits` is not a month from 1 to 12.
 */
const monthName = (digits: string): string => {
  const name = MONTH_NAMES[Number(digits) - 1];
  // An out-of-range number indexes past the list, so the lookup comes back empty.
  if (name === undefined) {
    throw new RangeError(`"${digits}" is not a month number.`);
  }
  return name;
};

/**
 * Turns a month pair from the data into reader-friendly text.
 * @param pair - The pair as written in the data, such as `2026-05 → 2026-06`.
 * @returns The pair as short month names, such as `May to Jun`.
 * @throws {@link TypeError} When `pair` does not match the expected format.
 */
const pairLabel = (pair: string): string => {
  const groups = PAIR_PATTERN.exec(pair)?.groups;
  // A pair in another format means the data changed, so it fails instead of printing a wrong label.
  if (groups?.from === undefined || groups.to === undefined) {
    throw new TypeError(`Unrecognised month pair "${pair}".`);
  }
  return `${monthName(groups.from)} to ${monthName(groups.to)}`;
};

/**
 * Formats a track position as a CSS percentage for inline styles.
 * @param position - A position along the track, where 100 is the full length.
 * @returns The position rounded to two decimals and followed by a percent sign.
 */
const trackStyle = (position: number): string =>
  `${Math.round(position * FULL_TRACK) / FULL_TRACK}%`;

export {
  FULL_TRACK,
  formatCompact,
  formatInteger,
  formatOne,
  formatSignedOne,
  formatSignedTwo,
  formatThree,
  formatTwo,
  linearTrack,
  logTrack,
  pairLabel,
  percentText,
  trackStyle,
  wholePercentText,
};
