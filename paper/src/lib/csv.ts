/**
 * Builds CSV text for the copy buttons in the chart dialogs.
 * The quoting follows [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180).
 */

/** The character that wraps a cell that needs quoting, and that is doubled inside it. */
const QUOTE = '"';

/**
 * Prepares one cell for a CSV line.
 * @param cell - The cell text.
 * @returns The cell unchanged when it is plain, or wrapped in quotes with inner quotes doubled when it holds a quote, a comma, or a line break.
 */
const csvCell = (cell: string): string => {
  // A cell with a quote, comma, or newline would break the row, so it is quoted.
  if (/[",\n]/u.test(cell)) {
    return `${QUOTE}${cell.replaceAll(QUOTE, `${QUOTE}${QUOTE}`)}${QUOTE}`;
  }
  // A plain cell needs no quoting.
  return cell;
};

/**
 * Joins a header and rows into CSV text.
 * @param columns - The header cells.
 * @param rows - The body rows, each a list of cells.
 * @returns The lines joined by newlines, with no trailing newline.
 */
const toCsv = (columns: readonly string[], rows: readonly (readonly string[])[]): string =>
  [columns, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(",")).join("\n");

export default toCsv;
