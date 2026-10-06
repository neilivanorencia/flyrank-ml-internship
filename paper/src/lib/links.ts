/**
 * The site's outside links and the helper that builds links to its own files.
 * Every outside address here must also be on the allow list in `scripts/check-build.ts`, or the build fails.
 */

/** The address of the project repository on GitHub. */
const REPOSITORY_URL = "https://github.com/neilivanorencia/flyrank-ml-internship";
/** The path of the capstone notebook inside the repository. */
const NOTEBOOK_PATH = "work/notebooks/capstone.ipynb";
/** The file name of the PDF report, which sits at the site root. */
const PDF_PATH = "click-shortfall-capstone.pdf";

/** The FlyRank website, which provided the data. */
const FLYRANK_URL = "https://flyrank.ai";
/** The author's GitHub profile. */
const GITHUB_PROFILE_URL = "https://github.com/neilivanorencia";
/** The author's LinkedIn profile. */
const LINKEDIN_URL = "https://linkedin.com/in/neilivanorencia";
/** The folder of notebooks in the repository. */
const NOTEBOOKS_URL = `${REPOSITORY_URL}/tree/main/work/notebooks`;
/** The capstone notebook on GitHub. */
const NOTEBOOK_URL = `${REPOSITORY_URL}/blob/main/${NOTEBOOK_PATH}`;
/** The capstone notebook opened in Google Colab. */
const COLAB_URL = `https://colab.research.google.com/github/neilivanorencia/flyrank-ml-internship/blob/main/${NOTEBOOK_PATH}`;

/**
 * Builds a link to one of the site's own files, such as an icon or the PDF.
 * @param path - The file path relative to the site root, with or without a leading slash.
 * @returns The path under the site's base path, so the link also works when the site is served from a subfolder.
 */
const withBase = (path: string): string => {
  // The base path may or may not end with a slash, so it is trimmed before the path is joined on.
  const base = import.meta.env.BASE_URL.replace(/\/$/u, "");
  return `${base}/${path.replace(/^\//u, "")}`;
};

/** The link to the PDF report under the site's base path. */
const PDF_URL = withBase(PDF_PATH);

export {
  COLAB_URL,
  FLYRANK_URL,
  GITHUB_PROFILE_URL,
  LINKEDIN_URL,
  NOTEBOOK_URL,
  NOTEBOOKS_URL,
  PDF_URL,
  REPOSITORY_URL,
  withBase,
};
