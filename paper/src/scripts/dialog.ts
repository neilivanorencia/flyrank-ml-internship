/**
 * Opens and closes the paper's native `dialog` elements and copies a figure's data as CSV.
 * One delegated listener serves every dialog, and the dialog element itself handles focus trapping and returning focus to the button that opened it.
 */

import reducedMotion from "@/scripts/reduced-motion";

/** The milliseconds the copy button shows its result before it goes back to its resting label. */
const COPIED_RESET_MS = 1800;
/** The milliseconds the dialog waits before closing, which matches the longest outro in `components/chart-dialog.astro`, the bottom sheet. */
const CLOSE_MS = 240;
/** The label shown after a successful copy. */
const COPIED_TEXT = "Copied";
/** The label shown when the browser refuses the copy. */
const FAILED_TEXT = "Copy failed";
/** The resting label of the copy button, which must match the markup in `components/chart-dialog.astro`. */
const RESTING_TEXT = "Copy as CSV";

/**
 * Shows the result of a copy on the button and in the screen reader status line, then resets the button label.
 * @param text - The result text to show.
 */
const announce = (text: string): void => {
  const label = document.querySelector<HTMLElement>("dialog[open] [data-copy-label]");
  const status = document.querySelector<HTMLElement>("dialog[open] [data-copy-status]");
  if (label !== null) {
    label.textContent = text;
    globalThis.setTimeout(() => {
      label.textContent = RESTING_TEXT;
    }, COPIED_RESET_MS);
  }
  // The status line is read aloud, which the visible button label alone would not be.
  if (status !== null) {
    status.textContent = text;
  }
};

/**
 * Copies text to the clipboard and reports whether it worked.
 * @param csv - The CSV text to copy.
 */
const copyCsv = async (csv: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(csv);
    announce(COPIED_TEXT);
  } catch {
    // The clipboard can be blocked by permissions or an insecure page, so the failure is shown instead of ignored.
    announce(FAILED_TEXT);
  }
};

/**
 * Plays the outro and then closes the dialog, and every way of closing goes through here.
 * @param dialog - The dialog to close.
 */
const closeDialog = (dialog: HTMLDialogElement): void => {
  // A dialog that is already closed or already closing is ignored, so repeated clicks do not stack timers.
  if (!dialog.open || Object.hasOwn(dialog.dataset, "closing")) {
    return;
  }
  // People who reduce motion get an instant close with no outro.
  if (reducedMotion) {
    dialog.close();
    return;
  }
  // The attribute starts the outro in the CSS, and the dialog closes once it has had time to play.
  dialog.dataset.closing = "";
  globalThis.setTimeout(() => {
    delete dialog.dataset.closing;
    dialog.close();
  }, CLOSE_MS);
};

/** Looks up the nearest ancestor of the clicked element that matches a selector. */
type Finder = (selector: string) => HTMLElement | null;

/**
 * Opens the dialog named by the clicked button.
 * @param find - Looks up an ancestor of the click target.
 * @returns `true` when the click was on an open button, which ends the search.
 */
const openFrom = (find: Finder): boolean => {
  const id = find("[data-dialog-open]")?.dataset.dialogOpen;
  if (id === undefined) {
    return false;
  }
  document.querySelector<HTMLDialogElement>(`#${CSS.escape(id)}`)?.showModal();
  return true;
};

/**
 * Copies the CSV held by the clicked copy button.
 * @param find - Looks up an ancestor of the click target.
 * @returns `true` when the click was on a copy button, which ends the search.
 */
const copyFrom = (find: Finder): boolean => {
  const csv = find("[data-copy-csv]")?.dataset.csv;
  if (csv === undefined) {
    return false;
  }
  void copyCsv(csv);
  return true;
};

/**
 * Closes the dialog that holds the clicked close button.
 * @param find - Looks up an ancestor of the click target.
 * @returns `true` when the click was on a close button, which ends the search.
 */
const closeFrom = (find: Finder): boolean => {
  const closer = find("[data-dialog-close]");
  if (closer === null) {
    return false;
  }
  const dialog = closer.closest("dialog");
  if (dialog !== null) {
    closeDialog(dialog);
  }
  return true;
};

/** The click actions in the order they are tried. */
const ACTIONS = [openFrom, copyFrom, closeFrom] as const;

document.addEventListener("click", ({ target }: Pick<MouseEvent, "target">) => {
  if (!(target instanceof Element)) {
    return;
  }
  // The panel fills the whole dialog box, so a click that lands on the dialog itself is a click on the dimmed backdrop.
  if (target instanceof HTMLDialogElement) {
    closeDialog(target);
    return;
  }
  const find: Finder = (selector) => target.closest<HTMLElement>(selector);
  // Each action returns `true` once it has handled the click, which stops the loop.
  for (const action of ACTIONS) {
    if (action(find)) {
      return;
    }
  }
});

// Esc fires `cancel` on the dialog, which does not bubble, so it is caught on the way down and sent through the animated close.
document.addEventListener(
  "cancel",
  (event) => {
    if (event.target instanceof HTMLDialogElement) {
      event.preventDefault();
      closeDialog(event.target);
    }
  },
  true
);
