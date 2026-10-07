/**
 * Turns the parsed notebook tables into the typed rows that the paper's charts consume.
 * Each builder reads cells by column name, so a renamed or missing column fails loudly instead of shifting values.
 */

import type {
  BootstrapRow,
  ConfidenceRow,
  CtrRow,
  FunnelStage,
  PersistenceRow,
  QueueRow,
  ReachRow,
  ScorerRow,
  SealedRow,
} from "@/data/types";

import type { Table } from "./notebook.ts";
import { capture, columnReader, intervalOf, numberOf, withoutSuffix, yesNoOf } from "./notebook.ts";

/** The text that marks the sealed test pair at the end of a label cell. */
const SEALED_SUFFIX = " (sealed)";
/** The text that marks the list size the paper chose at the end of a label cell. */
const CHOSEN_SUFFIX = " (chosen)";

/**
 * Builds the click-through rows, one per result position.
 * @param table - The click-through by position table.
 * @returns One row per table row, with every number parsed from its cell text.
 */
const buildCtr = (table: Table): CtrRow[] => {
  const read = columnReader(table);
  return table.rows.map((row) => ({
    ctrPct: numberOf(read(row, "Normal click-through")),
    flaggedPct: numberOf(read(row, "Share flagged")),
    pages: numberOf(read(row, "Pages")),
    pagesWith500Plus: numberOf(read(row, "Pages with 500+ impressions")),
    position: numberOf(read(row, "Position")),
  }));
};

/**
 * Builds the rows that compare how often pages fall short again in consecutive months.
 * @param table - The persistence evidence table.
 * @returns One row per month pair, with the sealed pair flagged.
 */
const buildPersistence = (table: Table): PersistenceRow[] => {
  const read = columnReader(table);
  return table.rows.map((row) => {
    const pair = read(row, "Pair");
    return {
      notShort: numberOf(read(row, "Pages not short")),
      notShortThenShortPct: numberOf(read(row, "Short in month M+1")),
      // The sealed marker lives in the label text, so it is split into its own flag.
      pair: withoutSuffix(pair, SEALED_SUFFIX),
      ratio: numberOf(read(row, "Ratio")),
      sealed: pair.endsWith(SEALED_SUFFIX),
      shortAgainPct: numberOf(read(row, "Short again in month M+1")),
      shortInM: numberOf(read(row, "Pages short in month M")),
    };
  });
};

/**
 * Builds the rows that compare each scorer's mean results over the two test pairs.
 * @param table - The scorer means and verdict table.
 * @returns One row per scorer.
 */
const buildScorers = (table: Table): ScorerRow[] => {
  const read = columnReader(table);
  return table.rows.map((row) => ({
    averagePrecision: numberOf(read(row, "Mean average precision")),
    // Verdict columns are `null` when the cell is neither yes nor no.
    beatsRule: yesNoOf(read(row, "Beats rule B")),
    captureAt50Pct: numberOf(read(row, "Mean Capture@50")),
    carriedForward: yesNoOf(read(row, "Carried forward")),
    gapToRule: numberOf(read(row, "Gap to rule B")),
    precisionAt20: numberOf(read(row, "Mean Precision@20")),
    precisionAt50: numberOf(read(row, "Mean Precision@50")),
    precisionAt50Mid: numberOf(read(row, "Mean Precision@50, 1,000 to 9,999")),
    scorer: read(row, "Scorer"),
  }));
};

/**
 * Builds the rows that score each scorer on the sealed month.
 * @param table - The sealed pair results table.
 * @returns One row per scorer.
 */
const buildSealed = (table: Table): SealedRow[] => {
  const read = columnReader(table);
  return table.rows.map((row) => ({
    averagePrecision: numberOf(read(row, "Average precision")),
    baseRatePct: numberOf(read(row, "Base rate")),
    captureAt50Pct: numberOf(read(row, "Capture@50")),
    precisionAt20: numberOf(read(row, "Precision@20")),
    precisionAt50: numberOf(read(row, "Precision@50")),
    precisionAt50Mid: numberOf(read(row, "Precision@50, 1,000 to 9,999 impressions")),
    rocAuc: numberOf(read(row, "ROC-AUC")),
    scorer: read(row, "Scorer"),
  }));
};

/**
 * Builds the bootstrap rows with the model's gap to rule B and its 95% intervals.
 * @param table - The client-level bootstrap table.
 * @returns One row per test set, with the sealed set flagged.
 */
const buildBootstrap = (table: Table): BootstrapRow[] => {
  const read = columnReader(table);
  return table.rows.map((row) => {
    const testSet = read(row, "Test set");
    return {
      captureCi: intervalOf(read(row, "Capture 95% interval (points)")),
      captureGapPts: numberOf(read(row, "Capture@50 gap (points)")),
      modelAheadPct: numberOf(read(row, "Resamples with the model ahead")),
      precisionCi: intervalOf(read(row, "95% interval")),
      precisionGap: numberOf(read(row, "Precision@50 gap")),
      // The sealed marker lives in the label text, so it is split into its own flag.
      sealed: testSet.endsWith(SEALED_SUFFIX),
      testSet: withoutSuffix(testSet, SEALED_SUFFIX),
    };
  });
};

/**
 * Builds the rows that show how much of each page-size band the queue reaches.
 * @param table - The queue reach table.
 * @returns One row per impressions band.
 */
const buildReach = (table: Table): ReachRow[] => {
  const read = columnReader(table);
  return table.rows.map((row) => ({
    band: read(row, "Impressions in June"),
    inQueuePct: numberOf(read(row, "Share in the queue")),
    inReviewList: numberOf(read(row, "In the review list")),
    scoredPages: numberOf(read(row, "Scored pages")),
  }));
};

/**
 * Builds the rows that trade queue size against what each list captured in June.
 * @param table - The queue size table from the May back-test.
 * @returns One row per list size, with the chosen size flagged.
 */
const buildQueue = (table: Table): QueueRow[] => {
  const read = columnReader(table);
  return table.rows.map((row) => {
    const list = read(row, "List");
    return {
      // The chosen marker lives in the label text, so it is split into its own flag.
      chosen: list.endsWith(CHOSEN_SUFFIX),
      clients: numberOf(read(row, "Clients")),
      hitAllPct: numberOf(read(row, "Real shortfall again, all picks")),
      hitUntouchedPct: numberOf(read(row, "Real shortfall again, pages FlyRank left alone")),
      list: withoutSuffix(list, CHOSEN_SUFFIX),
      missedClicksSharePct: numberOf(read(row, "Share of June's missed clicks")),
      optimizedByFlyRank: numberOf(read(row, "Optimized by FlyRank")),
      pages: numberOf(read(row, "Pages")),
      vanished: numberOf(read(row, "Vanished from search")),
    };
  });
};

/**
 * Narrows a label to one of the three confidence levels.
 * @param text - The label read from a table cell.
 * @returns `true` when `text` is `High`, `Medium`, or `Low`.
 */
const isConfidence = (text: string): text is ConfidenceRow["confidence"] =>
  text === "High" || text === "Medium" || text === "Low";

/**
 * Builds the rows that compare each confidence label against the June outcome.
 * @param table - The confidence label table.
 * @returns One row per confidence label, covering the whole queue.
 * @throws {@link TypeError} When a confidence cell is not `High`, `Medium`, or `Low`.
 */
const buildConfidence = (table: Table): ConfidenceRow[] => {
  const read = columnReader(table);
  return (
    table.rows
      // Keeps only the rows that cover the whole queue.
      .filter((row) => read(row, "Scope") === "Whole queue")
      .map((row) => {
        const confidence = read(row, "Confidence");
        // An unknown label means the notebook changed, so it fails instead of guessing.
        if (!isConfidence(confidence)) {
          throw new TypeError(`Unknown confidence label "${confidence}"`);
        }
        return {
          avgProbabilityPct: numberOf(read(row, "Model's average probability")),
          confidence,
          pages: numberOf(read(row, "Pages")),
          repeatAllPct: numberOf(read(row, "Real shortfall again, all pages")),
          repeatUntouchedPct: numberOf(read(row, "Real shortfall again, pages FlyRank left alone")),
          untouchedPages: numberOf(read(row, "Pages FlyRank left alone")),
        };
      })
  );
};

/**
 * Builds the four funnel stages from figures that the notebook states in prose and table titles.
 * @param markdownText - The joined text of every markdown cell.
 * @param tableTitles - The table titles joined by newlines.
 * @returns The stages in order, from daily records down to the review list.
 * @throws {@link Error} When a stage's figure cannot be found in the text.
 */
const buildFunnel = (markdownText: string, tableTitles: string): FunnelStage[] => [
  // The figures sit in sentences and titles, not tables, so each is captured with a pattern.
  {
    key: "records",
    label: "daily page records",
    value: capture(markdownText, /(?<value>[\d,]+) rows, one per page per day/u, "the records"),
  },
  {
    key: "pages",
    label: "pages in the content table",
    value: capture(markdownText, /\((?<value>[\d,]+) pages, keyword research/u, "the pages"),
  },
  {
    key: "shortfalls",
    label: "real shortfalls in the sealed month",
    value: capture(tableTitles, /pages, (?<value>[\d,]+) real shortfalls/u, "the shortfalls"),
  },
  {
    key: "list",
    label: "pages on the review list",
    value: capture(tableTitles, /\(June 2026 data, (?<value>\d+) pages/u, "the list size"),
  },
];

export {
  buildBootstrap,
  buildConfidence,
  buildCtr,
  buildFunnel,
  buildPersistence,
  buildQueue,
  buildReach,
  buildScorers,
  buildSealed,
};
