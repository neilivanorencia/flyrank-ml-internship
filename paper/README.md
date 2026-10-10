<div align="center">
  <br />
  <img src="public/og.png" alt="Click Shortfall Banner" />
  <br /><br />
  <div>
    <img
      alt="Astro"
      src="https://img.shields.io/badge/Astro-%23BC52EE?style=flat&logo=astro&logoColor=white"
    />
    <img
      alt="D3.js"
      src="https://img.shields.io/badge/D3.js-%23F9A03C?style=flat&logo=d3&logoColor=white"
    />
    <img
      alt="DuckDB"
      src="https://img.shields.io/badge/DuckDB-%23C0B400?style=flat&logo=duckdb&logoColor=white"
    />
    <img
      alt="Google Colab"
      src="https://img.shields.io/badge/Google%20Colab-%23F9AB00?style=flat&logo=googlecolab&logoColor=white"
    />
    <img
      alt="Hugging Face"
      src="https://img.shields.io/badge/Hugging%20Face-%23CDA918?style=flat&logo=huggingface&logoColor=white"
    />
    <img
      alt="Jupyter"
      src="https://img.shields.io/badge/Jupyter-%23F37626?style=flat&logo=jupyter&logoColor=white"
    />
    <img
      alt="Motion"
      src="https://img.shields.io/badge/Motion-%230055FF?style=flat&logo=framer&logoColor=white"
    />
    <img
      alt="NumPy"
      src="https://img.shields.io/badge/NumPy-%23013243?style=flat&logo=numpy&logoColor=white"
    />
    <img
      alt="Oxlint"
      src="https://img.shields.io/badge/Oxlint-%2300F7F1?style=flat&logo=oxc&logoColor=white"
    />
    <img
      alt="Pandas"
      src="https://img.shields.io/badge/Pandas-%23150458?style=flat&logo=pandas&logoColor=white"
    />
    <img
      alt="pnpm"
      src="https://img.shields.io/badge/pnpm-%23F69220?style=flat&logo=pnpm&logoColor=white"
    />
    <img
      alt="Prettier"
      src="https://img.shields.io/badge/Prettier-%23D59F35?style=flat&logo=prettier&logoColor=white"
    />
    <img
      alt="Python"
      src="https://img.shields.io/badge/Python-%233776AB?style=flat&logo=python&logoColor=white"
    />
    <img
      alt="scikit-learn"
      src="https://img.shields.io/badge/scikit--learn-%23F7931E?style=flat&logo=scikitlearn&logoColor=white"
    />
    <img
      alt="Stylelint"
      src="https://img.shields.io/badge/Stylelint-%23263238?style=flat&logo=stylelint&logoColor=white"
    />
    <img
      alt="TypeScript"
      src="https://img.shields.io/badge/TypeScript-%233178C6?style=flat&logo=typescript&logoColor=white"
    />
  </div>
</div>
<br />

**Click Shortfall** is the capstone paper of the FlyRank ML Internship, published as an interactive static site. It asks which pages keep losing the clicks they should be getting: pages that rank well on Google yet earn far fewer clicks than their exact position and their own site predict. Using 78.8 million daily Search Console records across about 50 client sites, it finds those pages, tests whether each gap is more than bad luck, and checks whether the shortfall lasts into the next month.

The result is a monthly review list of 50 pages, ordered by a transparent rule and labelled with the confidence of a logistic regression model. The site presents the whole study as one readable page, with the exact numbers behind every chart, and every chart number is read from the saved outputs of the capstone notebook. A [full report as a PDF](public/click-shortfall-capstone.pdf) is also included.

## 🗂️ Table of Contents

- [🗂️ Table of Contents](#️-table-of-contents)
- [🔎 Key Findings](#-key-findings)
- [🔄 Reproducibility](#-reproducibility)
- [🚀 Getting Started](#-getting-started)
  - [📋 Prerequisites](#-prerequisites)
  - [📥 Clone Repository](#-clone-repository)
  - [📦 Installation](#-installation)
  - [🖥️ Running the Application](#️-running-the-application)
  - [🧪 Development Tools](#-development-tools)
- [🔐 Quality & Security](#-quality--security)
- [💻 Technology Stack](#-technology-stack)
- [📂 Project Structure](#-project-structure)
- [🙏 Acknowledgments & Data Credit](#-acknowledgments--data-credit)
- [📄 License](#-license)

## 🔎 Key Findings

- **The Flat Rule Misleads**: A common rule flags any page in the top 20 with a click rate below 0.5%. On this portfolio the normal click rate sits between 0.24% and 0.42% at every position, so the rule flags 74% to 88% of pages at every position, including pages that click exactly as expected.
- **A Real Shortfall Is Stricter**: A page counts as a real shortfall only when, in the same month, it earns at most half of the clicks its exact position and its own site predict, and a negative binomial test rules out bad luck.
- **Shortfalls Persist**: A page with a real shortfall this month was 3.8 to 4.8 times as likely to have one next month, including on a sealed month that no analysis had touched.
- **A Rule and a Model Tie at the Top**: On the sealed month, May to June 2026, a transparent rule and a logistic regression model found about the same pages. Out of 50 picks each, both found 46 to 47 real shortfalls against a base rate of 2.2%, where random picks would find about one.
- **A List One Editor Can Finish**: The 78.8 million daily rows reduce to 519,606 pages, 2,978 real shortfalls in the sealed month, and a review list of 50 pages a month with at most 10 per client and one first action each.

| Scorer (sealed month, 137,275 pages) | Real shortfalls in 50 picks | Precision at 50 | Share of missed clicks in the top 50 | ROC-AUC |
| :----------------------------------- | :-------------------------: | :-------------: | :----------------------------------: | :-----: |
| Rule B (the baseline)                |             46              |      0.92       |                19.2%                 |  0.711  |
| Logistic regression model            |             47              |      0.94       |                12.4%                 |  0.915  |
| Random picks                         |           about 1           |        —        |                  —                   |    —    |

> [!NOTE]
> By the rule fixed before the test, the model did not beat rule B. Its top-50 precision was 0.94 against 0.92, a gap inside the 0.02 margin fixed in advance, so the second criterion decided: how much of next month's missed clicks the top 50 holds. There the rule led, 19.2% against 12.4%, while the model ordered the rest of the list far better.

## 🔄 Reproducibility

Every chart number on the site is read from the saved outputs of the project's notebooks, each run top to bottom on Google Colab. The capstone notebook re-reads the weekly notebooks and checks every figure it quotes.

| Notebook                                                                               |  Lesson  | What it covers                                                             |
| :------------------------------------------------------------------------------------- | :------: | :------------------------------------------------------------------------- |
| [`w01_research_question.ipynb`](../work/notebooks/w01_research_question.ipynb)         |  ML-02   | Research question and provisional lane.                                    |
| [`w02_ml_task_framing.ipynb`](../work/notebooks/w02_ml_task_framing.ipynb)             |  ML-03   | Framing the lane as a machine learning task.                               |
| [`w03_data_contract.ipynb`](../work/notebooks/w03_data_contract.ipynb)                 |  ML-04   | The search intelligence data contract.                                     |
| [`w03_feature_leakage_check.ipynb`](../work/notebooks/w03_feature_leakage_check.ipynb) |  ML-05   | The feature vector, and the leakage and privacy check.                     |
| [`w04_signal_audit.ipynb`](../work/notebooks/w04_signal_audit.ipynb)                   |  ML-06   | Signal audit: do the flags hold?                                           |
| [`w04_baseline_score.ipynb`](../work/notebooks/w04_baseline_score.ipynb)               |  ML-07   | Baseline action score and top-20 review.                                   |
| [`w05_model.ipynb`](../work/notebooks/w05_model.ipynb)                                 |  ML-08   | The capstone modeling lane.                                                |
| [`w06_validation_audit.ipynb`](../work/notebooks/w06_validation_audit.ipynb)           |  ML-09   | Validation and research claim audit.                                       |
| [`w07_action_playbook.ipynb`](../work/notebooks/w07_action_playbook.ipynb)             |  ML-10   | The content action playbook.                                               |
| [`capstone.ipynb`](../work/notebooks/capstone.ipynb)                                   | Capstone | Re-reads the saved outputs above and checks every number the paper quotes. |

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/neilivanorencia/flyrank-ml-internship/blob/main/work/notebooks/capstone.ipynb)

- **From Notebook to Page**: `pnpm data` reads only the saved output tables of `capstone.ipynb`, which are aggregates already published in the capstone, and rebuilds the files in `src/data/`. It writes nothing until every table parses and its self-check passes, so a half-read notebook can never leave the site with half-updated numbers.
- **Aggregates Only**: The data files hold counts, rates and short labels such as test months and scorer names. They contain no page identifier, client identifier, domain, URL or search query.
- **Fixed by Design**: Random seed `42` everywhere, with scikit-learn 1.6.1, pandas 2.2.3 and NumPy 2.1.3.
- **Access**: Reading a notebook needs no token. Running one against the warehouse needs `HF_TOKEN`, supplied as an environment variable or a Colab Secret and never written into a cell.

> [!NOTE]
> No dataset is committed to this repository. The warehouse is pseudonymized by FlyRank before release, and the rules for using it are in [`DATA_USE.md`](../DATA_USE.md).

## 🚀 Getting Started

This guide explains how to run the paper site locally, either to read it, to check its numbers, or to change it. No environment variables or accounts are needed.

### 📋 Prerequisites

Before beginning, ensure the following are installed and configured:

- **[Node.js 22.12+](https://nodejs.org/)** — The JavaScript runtime that builds the site and runs its TypeScript scripts. The project was developed on Node 24, which is recommended.
- **[pnpm 12.9+](https://pnpm.io/)** — Fast, disk space efficient package manager. Recommended for this project and required by the lockfile. Install globally via `npm install -g pnpm` or `corepack enable pnpm`.
- **[Git](https://git-scm.com/downloads)** — Distributed version control system needed to clone the repository and manage code changes.
- **[Google Colab](https://colab.research.google.com/)** (Optional) — Cloud notebook environment. Required only to rerun the notebooks, not to run the site.

### 📥 Clone Repository

Clone the repository to the local machine and move into the site's folder:

```bash
git clone https://github.com/neilivanorencia/flyrank-ml-internship.git
cd flyrank-ml-internship/paper
```

### 📦 Installation

Install the exact dependency versions from the lockfile:

```bash
pnpm install
```

### 🖥️ Running the Application

- Start the development server at `http://localhost:4321/flyrank-ml-internship/`:

  ```bash
  pnpm dev
  ```

- Build the site, then serve the built `dist/` folder exactly as it will be published:

  ```bash
  pnpm build
  pnpm preview
  ```

### 🧪 Development Tools

> [!WARNING]
> Run `pnpm install` first. `pnpm build` fails on purpose when one of the build-time guards described in [Quality & Security](#-quality--security) trips, so a failed build is information, not a broken setup.

- Lint with Oxlint (type-aware) for TypeScript and Astro, and stylelint for CSS:

  ```bash
  pnpm lint
  ```

- Format every file with Prettier, or only check formatting:

  ```bash
  pnpm format
  pnpm format:check
  ```

- Type-check the whole project:

  ```bash
  pnpm check
  ```

- Rebuild `src/data/*.json` from the capstone notebook's saved output tables:

  ```bash
  pnpm data
  ```

- Git hooks (Husky and lint-staged) run Oxlint, stylelint and Prettier on staged files before each commit. They install automatically once the project is a git repository, so run `pnpm install` again after `git init` or cloning.

## 🔐 Quality & Security

- **Strict Static Checks**: TypeScript runs in its strictest configuration, Oxlint runs type-aware, stylelint enforces a single class-naming pattern and property order, and Prettier formats every file. All of it also runs on staged files before every commit.
- **Build-Time Guards**: After the type check and the build, `scripts/check-build.ts` fails the build unless the FlyRank data credit is present, the PDF, the share image and both icons exist, `og.png` is exactly 1200 × 630, every local link resolves, and no placeholder or LinkedIn post link has slipped in.
- **Privacy by Construction**: No client name, domain, URL, search query or identifier appears anywhere in the built page. The same guard rejects links to unknown sites, hash-like identifiers, email addresses, local file paths, secret-looking tokens, HTML comments and stray domain names in the text. The PDF is not scanned by the build, so it should be checked again after every re-export.
- **Content Security Policy**: The page carries a policy that allows scripts and styles only by their SHA-256 hash, loads nothing from other sites, and forbids forms, frames, plugins and workers. The one exception is inline style attributes, which the charts use to size their marks. The theme script stays inline so the page never flashes the wrong theme, and its hash is computed from the same file the layout inlines.
- **Readable Without JavaScript**: Hidden starting states for animations exist only once JavaScript has run, so a reader without it, or with reduced motion turned on, sees every section and every number.
- **Accessible Charts and Motion**: Every chart has a "Show the numbers" dialog with the exact values and a copy-as-CSV button, charts are reachable by keyboard, a skip link jumps past the navigation, reduced motion switches off animation and smooth scrolling, and the page follows light and dark themes.
- **Search and Sharing**: A canonical URL, Open Graph and Twitter cards with a 1200 × 630 share image, `ScholarlyArticle` structured data that credits the data as the work's source, a `robots.txt` and a `sitemap.xml`.

## 💻 Technology Stack

> [!NOTE]
> The list of tech stack here represents just the core tools used in the project. This list isn't exhaustive and the full lists can be found in the [`package.json`](package.json) file and the [`requirements.txt`](../requirements.txt) file.

- **[Astro](https://astro.build)** - A web framework for content-driven websites that renders pages to static HTML at build time, to ship almost no JavaScript by default and keep pages fast to load and simple to host.
- **[D3.js](https://d3js.org)** - A JavaScript library of modules for data visualization and numeric scales. Its scale, array and format modules size every chart mark at build time.
- **[DuckDB](https://duckdb.org)** - An in-process analytical SQL database for fast queries over large local datasets. It reads the warehouse straight from Hugging Face in the notebooks.
- **[Google Colab](https://colab.research.google.com/)** - A cloud-based Jupyter notebook environment that provides free GPU access for machine learning. It ran each weekly notebook, top to bottom.
- **[Hugging Face](https://huggingface.co)** - A platform for hosting machine learning models and datasets with version control and access tokens. It hosts the FlyRank warehouse that the notebooks read.
- **[Jupyter](https://jupyter.org/)** - An open-source interactive computing platform for creating and sharing notebooks. It holds the weekly analysis and the capstone notebook whose saved outputs feed this site.
- **[Motion](https://motion.dev)** - A JavaScript animation library for the web with a small footprint and hardware-accelerated animations. It drives the entrance reveals, chart draw-ins and scroll-linked effects.
- **[NumPy](https://numpy.org/)** - The backbone library for numerical computing in Python, which offers fast multi-dimensional array objects and a large array of mathematical functions to manipulate them.
- **[Oxlint](https://oxc.rs/docs/guide/usage/linter)** - A fast JavaScript and TypeScript linter written in Rust with type-aware rules, to enforce a strict code standard and catch bugs before they are committed.
- **[Pandas](https://pandas.pydata.org/)** - A Python library for effective data manipulation and analysis that provides data structures that are particularly well-fitted for tabular data.
- **[pnpm](https://pnpm.io)** - A disk space efficient package manager that uses a content-addressable store to share dependencies across projects, to reduce installation times and disk space use with strict dependency control.
- **[Prettier](https://prettier.io)** - An opinionated code formatter that supports many languages, to keep every file consistently formatted and take style debates out of code review.
- **[Python](https://www.python.org)** - A high-level, general-purpose programming language known for readable code and a rich data science ecosystem. It runs the weekly notebooks and the validation analysis.
- **[scikit-learn](https://scikit-learn.org)** - A machine learning library for Python with simple and efficient tools for classification, regression and model evaluation. It trains the logistic regression model that labels the review list.
- **[Stylelint](https://stylelint.io)** - A CSS linter that enforces conventions and catches errors, to keep the stylesheets consistent and every class name in a single naming pattern.
- **[TypeScript](https://www.typescriptlang.org)** - A strongly typed programming language that builds on JavaScript by the addition of static types, to catch errors early at compile time, improve code editor tools, and enhance codebase maintainability.

## 📂 Project Structure

<details>
  <summary>See project structure here</summary>

```plaintext
└── 📁.husky
    ├── pre-commit
└── 📁public
    ├── apple-touch-icon.png
    ├── click-shortfall-capstone.pdf
    ├── favicon.svg
    ├── og.png
    ├── robots.txt
    ├── sitemap.xml
└── 📁scripts
    └── 📁lib
        ├── builders.ts
        ├── notebook.ts
    ├── check-build.ts
    ├── extract-data.ts
└── 📁src
    └── 📁assets
        ├── logo.svg
    └── 📁charts
        ├── ctr-curve.astro
        ├── fifty-picks.astro
        ├── funnel.astro
        ├── model-vs-rule.astro
        ├── persistence.astro
        ├── queue-tradeoff.astro
        ├── scales.ts
        ├── serp-hero.astro
        ├── yardstick.astro
    └── 📁components
        ├── card.astro
        ├── chart-dialog.astro
        ├── chart-tooltip.astro
        ├── dialog-trigger.astro
        ├── fact-strip.astro
        ├── figure.astro
        ├── link-card.astro
        ├── logo.astro
        ├── navigation.astro
        ├── numbers-table.astro
        ├── pill.astro
        ├── section-header.astro
        ├── site-footer.astro
        ├── source-link.astro
        ├── structured-data.astro
        ├── theme-toggle.astro
        ├── toc-button.astro
        ├── under-the-hood.astro
    └── 📁data
        ├── bootstrap.json
        ├── confidence.json
        ├── ctr-by-position.json
        ├── funnel.json
        ├── persistence.json
        ├── queue-tradeoff.json
        ├── reach.json
        ├── scorers.json
        ├── sealed-month.json
        ├── types.ts
    └── 📁illustrations
        ├── geometry.json
        ├── luck-board.astro
        ├── queue-tiles.astro
        ├── rank-radar.astro
    └── 📁layouts
        ├── base.astro
    └── 📁lib
        ├── attribute.ts
        ├── csv.ts
        ├── links.ts
        ├── sources.ts
    └── 📁pages
        ├── index.astro
    └── 📁scripts
        ├── dialog.ts
        ├── loops.ts
        ├── rail.ts
        ├── reduced-motion.ts
        ├── reveal.ts
        ├── scrub.ts
        ├── smooth-scroll.ts
        ├── theme-init.js
        ├── theme.ts
        ├── toc.ts
        ├── tooltips.ts
    └── 📁sections
        ├── abstract.astro
        ├── close.astro
        ├── data.astro
        ├── hero.astro
        ├── limitations.astro
        ├── method.astro
        ├── playbook.astro
        ├── question.astro
        ├── results-band.astro
        ├── results.astro
    └── 📁styles
        ├── backdrop.css
        ├── base.css
        ├── lenis.css
        ├── tokens.css
├── .gitignore
├── .oxlintrc.json
├── .prettierignore
├── .prettierrc.json
├── astro.config.mjs
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── README.md
├── stylelint.config.js
└── tsconfig.json
```

</details>

## 🙏 Acknowledgments & Data Credit

- Data provided by [FlyRank](https://flyrank.ai) through the FlyRank ML Internship warehouse, release `v20260703`, pseudonymized before release. No client name, URL, or search query appears anywhere in this work.
- Thanks to FlyRank for the warehouse, the lane brief, and the internship that made this work possible.
- **Geist** and **Geist Mono** are self-hosted through Fontsource under the SIL Open Font License 1.1, and the icons come from [Phosphor Icons](https://phosphoricons.com).

## 📄 License

Distributed under the [MIT License](https://opensource.org/license/mit). See [`LICENSE`](../LICENSE) for more information.
