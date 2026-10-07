/**
 * Reads the capstone notebook and parses its rendered markdown tables and text into plain values.
 * The notebook is the source of truth, so every parser here throws on unexpected input instead of guessing.
 */

import { readFileSync } from "node:fs";

import type { Interval } from "@/data/types";

/** A table row or header as trimmed cell strings. */
type Row = readonly string[];

/** A parsed markdown table with its header and body rows. */
interface Table {
  readonly header: Row;
  readonly rows: readonly Row[];
}

/** Everything the extraction needs from the notebook: its prose and its titled tables. */
interface NotebookContent {
  /** The source of every markdown cell, joined by newlines. */
  readonly markdownText: string;
  /** The tables found in cell outputs, keyed by their bold title line. */
  readonly tables: ReadonlyMap<string, Table>;
}

/** Matches a line that is entirely bold text and captures that text as the table `title`. */
const TITLE_LINE = /^\*\*(?<title>.+)\*\*$/u;

/**
 * Narrows an unknown value to a plain object.
 * @param value - The value to test.
 * @returns `true` when `value` is a non-null object that is not an array.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Reads notebook text, which is stored either as one string or as an array of line strings.
 * @param value - The raw `source` or output text field.
 * @returns The text as one string, or an empty string when the field has another shape.
 */
const textOf = (value: unknown): string => {
  // A single string is already the full text.
  if (typeof value === "string") {
    return value;
  }
  // Arrays hold line fragments that already include their newlines, so they join with no separator.
  if (Array.isArray(value)) {
    return value.filter((part): part is string => typeof part === "string").join("");
  }
  return "";
};

/**
 * Reads a value that should be an array.
 * @param value - The raw field to read.
 * @returns The array, or an empty array when the field is missing or has another shape.
 */
const listOf = (value: unknown): readonly unknown[] => {
  if (Array.isArray(value)) {
    return value as readonly unknown[];
  }
  return [];
};

/**
 * Reads the text of a markdown cell.
 * @param cell - A raw notebook cell.
 * @returns The cell's source text, or an empty string for any other kind of cell.
 */
const markdownSource = (cell: unknown): string => {
  if (isRecord(cell) && cell.cell_type === "markdown") {
    return textOf(cell.source);
  }
  return "";
};

/**
 * Reads the outputs of a cell.
 * @param cell - A raw notebook cell.
 * @returns The cell's outputs, or an empty array when it has none.
 */
const cellOutputs = (cell: unknown): readonly unknown[] => {
  if (isRecord(cell)) {
    return listOf(cell.outputs);
  }
  return [];
};

/**
 * Reads the rendered markdown from a cell output.
 * @param output - A raw cell output.
 * @returns The output's `text/markdown` text, or an empty string when it has none.
 */
const outputMarkdown = (output: unknown): string => {
  if (isRecord(output) && isRecord(output.data)) {
    return textOf(output.data["text/markdown"]);
  }
  return "";
};

/**
 * Splits one markdown table line into its trimmed cells.
 * @param line - A table line that starts and ends with a pipe.
 * @returns The cell texts, without the empty pieces outside the outer pipes.
 */
const cellsOf = (line: string): Row =>
  line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());

/**
 * Parses an output's markdown into a titled table.
 * @param markdown - The markdown text of one cell output.
 * @returns The title with its table, or `undefined` when the text is not a titled table.
 */
const tableFromMarkdown = (markdown: string): readonly [string, Table] | undefined => {
  const lines = markdown.split("\n");
  // A titled table starts with a bold line.
  const title = TITLE_LINE.exec(lines[0]?.trim() ?? "")?.groups?.title;
  // Only pipe lines belong to the table, and the second one is the divider row, so it is skipped.
  const [headerLine, , ...rowLines] = lines.filter((line) => line.startsWith("|"));
  // Output without a title or a header is ordinary output, not a table to extract.
  if (title === undefined || headerLine === undefined) {
    return undefined;
  }
  return [title, { header: cellsOf(headerLine), rows: rowLines.map((line) => cellsOf(line)) }];
};

/**
 * Reads the notebook file and collects its markdown prose and titled tables.
 * @param path - The path to the `.ipynb` file.
 * @returns The joined markdown text and the tables keyed by title.
 * @throws {@link Error} When the file is not a JSON object.
 */
const readNotebook = (path: string): NotebookContent => {
  const notebook: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!isRecord(notebook)) {
    throw new Error(`${path} is not a notebook.`);
  }
  const cells = listOf(notebook.cells);
  const tables = new Map<string, Table>();
  // Tables come from rendered outputs, so a repeated title keeps the last one.
  for (const output of cells.flatMap((cell) => cellOutputs(cell))) {
    const parsed = tableFromMarkdown(outputMarkdown(output));
    if (parsed !== undefined) {
      tables.set(parsed[0], parsed[1]);
    }
  }
  // Prose figures come from markdown cells, so those are joined into one searchable string.
  return { markdownText: cells.map((cell) => markdownSource(cell)).join("\n"), tables };
};

/**
 * Returns a table that must exist.
 * @param table - The lookup result for a title.
 * @param title - The title that was looked up, used in the error message.
 * @returns The table.
 * @throws {@link Error} When `table` is `undefined`, which means the notebook no longer has it.
 */
const requireTable = (table: Table | undefined, title: string): Table => {
  if (table === undefined) {
    throw new Error(`Table not found in the capstone: "${title}"`);
  }
  return table;
};

/**
 * Creates a function that reads a row's cell by column name.
 * @param table - The table whose header maps column names to positions.
 * @returns A function that takes a row and a column name and returns that cell's text, and throws when the column or cell is missing.
 */
const columnReader =
  (table: Table) =>
  (row: Row, name: string): string => {
    const index = table.header.indexOf(name);
    const value = row[index];
    // A renamed column or a short row means the notebook layout changed, so it fails loudly.
    if (index === -1 || value === undefined) {
      throw new Error(
        `Column "${name}" missing from a table with columns: ${table.header.join(", ")}`
      );
    }
    return value;
  };

/**
 * Parses a table cell into a number.
 * @param text - The cell text, which may have thousands separators and a trailing `%` or `x`.
 * @returns The numeric value.
 * @throws {@link TypeError} When the cleaned text is empty or not a number.
 */
const numberOf = (text: string): number => {
  // Removes thousands separators and one trailing unit so the rest parses as a plain number.
  const cleaned = text.replaceAll(",", "").replace(/[%x]$/u, "").trim();
  const value = Number(cleaned);
  // An empty string would parse as `0`, so it is rejected explicitly.
  if (cleaned === "" || Number.isNaN(value)) {
    throw new TypeError(`Expected a number, found "${text}"`);
  }
  return value;
};

/**
 * Parses an interval written as two numbers joined by ` to `.
 * @param text - The cell text, such as `1.2 to 3.4`.
 * @returns The low and high ends of the interval.
 * @throws {@link TypeError} When either end is missing or not a number.
 */
const intervalOf = (text: string): Interval => {
  const [low = "", high = ""] = text.split(" to ");
  return { high: numberOf(high), low: numberOf(low) };
};

/**
 * Parses a yes or no verdict cell.
 * @param text - The cell text.
 * @returns `true` for `yes`, `false` for `no`, and `null` for anything else.
 */
const yesNoOf = (text: string): boolean | null => {
  if (text === "yes") {
    return true;
  }
  if (text === "no") {
    return false;
  }
  // Other text means the verdict does not apply, so it stays unknown.
  return null;
};

/**
 * Removes a marker from the end of a label when it is there.
 * @param text - The label to clean.
 * @param suffix - The marker to remove.
 * @returns The label without the trailing `suffix`, or the label unchanged.
 */
const withoutSuffix = (text: string, suffix: string): string => {
  if (text.endsWith(suffix)) {
    return text.slice(0, -suffix.length);
  }
  return text;
};

/**
 * Finds a figure in free text with a pattern and parses it.
 * @param text - The text to search.
 * @param pattern - A pattern with a named group `value` around the figure.
 * @param what - A short name for the figure, used in the error message.
 * @returns The figure as a number.
 * @throws {@link Error} When the pattern does not match `text`.
 */
const capture = (text: string, pattern: Readonly<RegExp>, what: string): number => {
  const value = pattern.exec(text)?.groups?.value;
  // No match means the notebook wording changed, so it fails instead of reporting a stale figure.
  if (value === undefined) {
    throw new Error(`Could not find ${what} in the capstone text.`);
  }
  return numberOf(value);
};

export type { NotebookContent, Row, Table };
export {
  capture,
  columnReader,
  intervalOf,
  numberOf,
  readNotebook,
  requireTable,
  withoutSuffix,
  yesNoOf,
};
