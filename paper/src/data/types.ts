/**
 * The shapes of the JSON files in `src/data/`, which `scripts/extract-data.ts` writes from the capstone notebook.
 * Every field named `...Pct` holds a percentage as a plain number such as `88`, not a share between 0 and 1.
 */

/** The low and high ends of an interval, such as a 95% bootstrap interval. */
interface Interval {
  readonly high: number;
  readonly low: number;
}

/** One Google position in the click-through curve (`ctr-by-position.json`). */
interface CtrRow {
  /** The normal click-through rate at this position, in percent. */
  readonly ctrPct: number;
  /** The share of pages at this position that the flat rule flags, in percent. */
  readonly flaggedPct: number;
  readonly pages: number;
  /** The pages at this position with at least 500 impressions. */
  readonly pagesWith500Plus: number;
  /** The Google position, starting at 1. */
  readonly position: number;
}

/** One stage of the data funnel (`funnel.json`). */
interface FunnelStage {
  /** The stage's identity, which the funnel chart uses to look up its description. */
  readonly key: "list" | "pages" | "records" | "shortfalls";
  readonly label: string;
  /** The number of items that reach this stage. */
  readonly value: number;
}

/** One month pair in the persistence evidence (`persistence.json`). */
interface PersistenceRow {
  /** The pages that were not short in the first month of the pair. */
  readonly notShort: number;
  /** The share of those pages that fell short in the next month, in percent. */
  readonly notShortThenShortPct: number;
  /** The month pair label as written in the notebook, such as `2026-05 → 2026-06`. */
  readonly pair: string;
  /** The ratio between the two next-month shares, which is how much likelier a short page is to be short again. */
  readonly ratio: number;
  /** Whether this pair is the sealed one. */
  readonly sealed: boolean;
  /** The share of short pages that were short again in the next month, in percent. */
  readonly shortAgainPct: number;
  /** The pages that were short in the first month of the pair. */
  readonly shortInM: number;
}

/** One scorer's mean results over the two test pairs (`scorers.json`). */
interface ScorerRow {
  readonly averagePrecision: number;
  /** Whether the scorer beats Rule B, or `null` when the notebook gives no yes or no. */
  readonly beatsRule: boolean | null;
  /** The share of missed clicks the scorer's top 50 captures, in percent. */
  readonly captureAt50Pct: number;
  /** Whether the scorer was carried forward, or `null` when the notebook gives no yes or no. */
  readonly carriedForward: boolean | null;
  readonly gapToRule: number;
  readonly precisionAt20: number;
  readonly precisionAt50: number;
  /** Precision in the top 50 for pages with 1,000 to 9,999 impressions. */
  readonly precisionAt50Mid: number;
  readonly scorer: string;
}

/** One scorer's results on the sealed month (`sealed-month.json`). */
interface SealedRow {
  readonly averagePrecision: number;
  /** The share of all scored pages that had a real shortfall, in percent. */
  readonly baseRatePct: number;
  readonly captureAt50Pct: number;
  readonly precisionAt20: number;
  readonly precisionAt50: number;
  /** Precision in the top 50 for pages with 1,000 to 9,999 impressions. */
  readonly precisionAt50Mid: number;
  readonly rocAuc: number;
  readonly scorer: string;
}

/** One test set in the client-level bootstrap of the model against Rule B (`bootstrap.json`). */
interface BootstrapRow {
  /** The 95% interval of the capture gap, in percentage points. */
  readonly captureCi: Interval;
  /** The model's top-50 capture minus Rule B's, in percentage points. */
  readonly captureGapPts: number;
  /** The share of bootstrap resamples in which the model came out ahead, in percent. */
  readonly modelAheadPct: number;
  /** The 95% interval of the precision gap. */
  readonly precisionCi: Interval;
  /** The model's top-50 precision minus Rule B's. */
  readonly precisionGap: number;
  /** Whether this test set is the sealed one. */
  readonly sealed: boolean;
  /** The test set's month pair label as written in the notebook. */
  readonly testSet: string;
}

/** One page-size band in the queue reach table (`reach.json`). */
interface ReachRow {
  /** The impressions band in June, such as `1,000 to 9,999`. */
  readonly band: string;
  /** The share of scored pages in this band that made the queue, in percent. */
  readonly inQueuePct: number;
  /** The pages from this band that made the review list. */
  readonly inReviewList: number;
  readonly scoredPages: number;
}

/** One list size in the queue trade-off (`queue-tradeoff.json`). */
interface QueueRow {
  /** Whether this is the list size the paper chose. */
  readonly chosen: boolean;
  readonly clients: number;
  /** The share of all picks that had a real shortfall again, in percent. */
  readonly hitAllPct: number;
  /** The share of picks that FlyRank had left alone and that had a real shortfall again, in percent. */
  readonly hitUntouchedPct: number;
  /** The list size label as written in the notebook. */
  readonly list: string;
  /** The share of June's missed clicks that the list captures, in percent. */
  readonly missedClicksSharePct: number;
  /** The picks that FlyRank had already optimized. */
  readonly optimizedByFlyRank: number;
  readonly pages: number;
  /** The picks that vanished from search. */
  readonly vanished: number;
}

/** One confidence label compared against the June outcome (`confidence.json`). */
interface ConfidenceRow {
  /** The model's average predicted probability for pages with this label, in percent. */
  readonly avgProbabilityPct: number;
  readonly confidence: "High" | "Low" | "Medium";
  readonly pages: number;
  /** The share of all pages with this label that had a real shortfall again, in percent. */
  readonly repeatAllPct: number;
  /** The same share counted only over pages that FlyRank left alone, in percent. */
  readonly repeatUntouchedPct: number;
  /** The pages with this label that FlyRank left alone. */
  readonly untouchedPages: number;
}

export type {
  BootstrapRow,
  ConfidenceRow,
  CtrRow,
  FunnelStage,
  Interval,
  PersistenceRow,
  QueueRow,
  ReachRow,
  ScorerRow,
  SealedRow,
};
