/**
 * The notebooks that the paper credits as its data sources, keyed by a short id.
 * Figures and links refer to a source by id, so each label and address is written once.
 */

import { NOTEBOOK_URL, REPOSITORY_URL } from "@/lib/links";

/** A credited source, with the text shown for it and the page it opens. */
interface Source {
  readonly label: string;
  readonly url: string;
}

/**
 * Builds the GitHub link to one of the weekly notebooks.
 * @param file - The notebook's file name without the `.ipynb` extension.
 * @returns The address of the notebook on the main branch.
 */
const notebook = (file: string): string =>
  `${REPOSITORY_URL}/blob/main/work/notebooks/${file}.ipynb`;

/** Every source the paper can credit, where the ids are the only valid values for `SourceId`. */
const SOURCES = {
  "action-playbook": { label: "w07 action playbook", url: notebook("w07_action_playbook") },
  capstone: { label: "capstone.ipynb", url: NOTEBOOK_URL },
  "signal-audit": { label: "w04 signal audit", url: notebook("w04_signal_audit") },
  "validation-audit": { label: "w06 validation audit", url: notebook("w06_validation_audit") },
} as const satisfies Record<string, Source>;

/** The ids of the sources, so a misspelled id is a type error. */
type SourceId = keyof typeof SOURCES;

export type { Source, SourceId };
export default SOURCES;
