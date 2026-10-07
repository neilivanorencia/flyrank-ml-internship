/**
 * Extracts the paper's chart data from the capstone notebook into JSON files under `src/data/`.
 * Parses the notebook's rendered tables and prose, compares headline numbers against known values, and writes nothing when any check fails.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type {
  BootstrapRow,
  CtrRow,
  FunnelStage,
  PersistenceRow,
  QueueRow,
  SealedRow,
} from "@/data/types";

import {
  buildBootstrap,
  buildConfidence,
  buildCtr,
  buildFunnel,
  buildPersistence,
  buildQueue,
  buildReach,
  buildScorers,
  buildSealed,
} from "./lib/builders.ts";
import type { Table } from "./lib/notebook.ts";
import { readNotebook, requireTable } from "./lib/notebook.ts";

/** The parsed datasets that the self-check inspects before anything is written. */
interface Checked {
  readonly bootstrap: readonly BootstrapRow[];
  readonly ctr: readonly CtrRow[];
  readonly funnel: readonly FunnelStage[];
  readonly persistence: readonly PersistenceRow[];
  readonly queue: readonly QueueRow[];
  readonly sealed: readonly SealedRow[];
}

/** A self-check that pairs a failure message with a predicate that must hold for the parsed data. */
type Check = readonly [message: string, passes: (data: Checked) => boolean];

/** The capstone notebook, which is the single source of every number in the paper. */
const NOTEBOOK_PATH = join(import.meta.dirname, "..", "..", "work", "notebooks", "capstone.ipynb");
/** The folder that holds the JSON files the paper's components import. */
const DATA_DIR = join(import.meta.dirname, "..", "src", "data");
/** Spaces per indent level in the written JSON, so committed diffs stay readable. */
const JSON_INDENT = 2;

/** The bold titles that identify each table in the notebook output, which must match the notebook text exactly. */
const TITLES = {
  bootstrap:
    "Logistic regression minus rule B, client-level bootstrap (1,000 resamples, 95% intervals)",
  confidence: "Confidence label against the June outcome (May back-test)",
  ctr: "Normal click-through by position, and the flag's catch rate",
  persistence:
    "Claim 2 evidence: shortfalls in consecutive months, pages with 1,000 to 9,999 impressions",
  queue: "Queue size against what it captured in June (May back-test)",
  reach: "Who the queue reaches, by page size (June 2026)",
  scorers: "Means over the two test pairs, and the verdict",
  sealed: "The sealed pair: 137,275 pages, 2,978 real shortfalls, α = 0.039",
} as const;

/** Headline figures from the notebook that the parsed tables are compared against. */
const EXPECTED = {
  bootstrapSealedCaptureHigh: -1.3,
  bootstrapSealedGap: 0.02,
  ctrPositionTwentyFlaggedPct: 88,
  ctrPositionTwoPct: 0.42,
  ctrRows: 20,
  funnelList: 50,
  funnelPages: 519_606,
  funnelRecords: 78_835_655,
  funnelShortfalls: 2978,
  persistenceSealedRatio: 4.8,
  queueChosenMissedSharePct: 9.2,
  queueChosenUntouchedPct: 94,
  sealedModelRocAuc: 0.915,
  sealedRulePrecision: 0.92,
  secondPosition: 2,
} as const;

/** Sanity checks that catch notebook layout changes and parsing drift before any file is written. */
const CHECKS: readonly Check[] = [
  ["ctr-by-position should have 20 rows", (data) => data.ctr.length === EXPECTED.ctrRows],
  [
    "position 2 should have a 0.42% click-through rate",
    (data) =>
      data.ctr.find((row) => row.position === EXPECTED.secondPosition)?.ctrPct ===
      EXPECTED.ctrPositionTwoPct,
  ],
  // Position 20 is the last row, so the check reuses the row count as the position number.
  [
    "position 20 should have 88% flagged",
    (data) =>
      data.ctr.find((row) => row.position === EXPECTED.ctrRows)?.flaggedPct ===
      EXPECTED.ctrPositionTwentyFlaggedPct,
  ],
  [
    "the last persistence row should be the sealed pair with a 4.8 ratio",
    (data) => {
      const last = data.persistence.at(-1);
      return last?.sealed === true && last.ratio === EXPECTED.persistenceSealedRatio;
    },
  ],
  [
    "rule B precision@50 on the sealed month should be 0.92",
    (data) =>
      data.sealed.find((row) => row.scorer.startsWith("Rule B"))?.precisionAt50 ===
      EXPECTED.sealedRulePrecision,
  ],
  [
    "the primary model ROC-AUC on the sealed month should be 0.915",
    (data) =>
      data.sealed.find((row) => row.scorer.includes("unseen clients"))?.rocAuc ===
      EXPECTED.sealedModelRocAuc,
  ],
  [
    "the sealed bootstrap row should show a +0.02 gap and a capture interval ending at -1.3",
    (data) => {
      const sealed = data.bootstrap.find((row) => row.sealed);
      return (
        sealed?.precisionGap === EXPECTED.bootstrapSealedGap &&
        sealed.captureCi.high === EXPECTED.bootstrapSealedCaptureHigh
      );
    },
  ],
  [
    "the chosen list should show 94% untouched hits and 9.2% of missed clicks",
    (data) => {
      const chosen = data.queue.find((row) => row.chosen);
      return (
        chosen?.hitUntouchedPct === EXPECTED.queueChosenUntouchedPct &&
        chosen.missedClicksSharePct === EXPECTED.queueChosenMissedSharePct
      );
    },
  ],
  [
    "the funnel should read 78,835,655 → 519,606 → 2,978 → 50",
    (data) =>
      data.funnel.map((stage) => stage.value).join(",") ===
      [
        EXPECTED.funnelRecords,
        EXPECTED.funnelPages,
        EXPECTED.funnelShortfalls,
        EXPECTED.funnelList,
      ].join(","),
  ],
];

/**
 * Writes each dataset to `src/data/` as indented JSON that ends with a newline.
 * @param files - The datasets to write, keyed by output file name.
 */
const writeJsonFiles = (files: Readonly<Record<string, unknown>>): void => {
  // The folder may not exist on a fresh checkout.
  mkdirSync(DATA_DIR, { recursive: true });
  for (const [name, data] of Object.entries(files)) {
    writeFileSync(join(DATA_DIR, name), `${JSON.stringify(data, undefined, JSON_INDENT)}\n`);
  }
};

/**
 * Reads the notebook, runs the self-checks, and writes every JSON file only when all checks pass.
 * @throws {@link Error} When a table, column, or number cannot be found or parsed, or when a self-check fails.
 */
const main = (): void => {
  const { markdownText, tables } = readNotebook(NOTEBOOK_PATH);
  // Fails with a clear message when the notebook no longer contains a table.
  const table = (title: string): Table => requireTable(tables.get(title), title);
  // Only the datasets that have self-checks are built first.
  const checked: Checked = {
    bootstrap: buildBootstrap(table(TITLES.bootstrap)),
    ctr: buildCtr(table(TITLES.ctr)),
    funnel: buildFunnel(markdownText, [...tables.keys()].join("\n")),
    persistence: buildPersistence(table(TITLES.persistence)),
    queue: buildQueue(table(TITLES.queue)),
    sealed: buildSealed(table(TITLES.sealed)),
  };
  const failures = CHECKS.filter(([, passes]) => !passes(checked)).map(([message]) => message);
  // Throws before any write so a bad parse never leaves partly updated files.
  if (failures.length > 0) {
    throw new Error(`Self-check failed, nothing written:\n  - ${failures.join("\n  - ")}`);
  }
  // The remaining datasets are built here because they have no self-checks.
  writeJsonFiles({
    "bootstrap.json": checked.bootstrap,
    "confidence.json": buildConfidence(table(TITLES.confidence)),
    "ctr-by-position.json": checked.ctr,
    "funnel.json": checked.funnel,
    "persistence.json": checked.persistence,
    "queue-tradeoff.json": checked.queue,
    "reach.json": buildReach(table(TITLES.reach)),
    "scorers.json": buildScorers(table(TITLES.scorers)),
    "sealed-month.json": checked.sealed,
  });
  console.log("extract-data: self-check passed; wrote 9 files to src/data/.");
};

try {
  main();
} catch (error) {
  // Expected failures print only the message, without a stack trace.
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    // Anything thrown that is not an Error is printed as is.
    console.error(error);
  }
  process.exitCode = 1;
}
