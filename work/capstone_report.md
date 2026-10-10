# Capstone Report — Lane 4: CTR / Engagement Opportunity Scoring

- **Author:** Neil Ivan Orencia
- **Lane:** Lane 4 — CTR / engagement opportunity scoring ("Which pages keep losing the clicks they should be getting?")
- **Repo:** <https://github.com/neilivanorencia/flyrank-ml-internship>
- **Paper:** <https://neilivanorencia.github.io/flyrank-ml-internship/> (the same URL is in `submission/paper_url.txt`)
- **Date:** 2026-10-10

> This report is the written record behind the deployed paper. The paper source is in `paper/`, the evidence is in the saved outputs of the notebooks in `work/notebooks/`, and `work/notebooks/capstone.ipynb` re-reads those outputs and checks every number it quotes. Sections 0 to 9 follow the template in `capstone_report_template.md`. All language here is observed, measured, directional, or decision-support, and nothing is a causal claim.

## 0. Abstract

Content teams need to know which existing pages are losing clicks they should be getting, and whether that loss will last long enough to be worth fixing. Using FlyRank's warehouse of 78.8 million daily Search Console records across about 50 client sites, each page's clicks were compared with what its exact position and its own site predict, and a page counted as a real shortfall only when it earned at most half of that and a negative binomial test ruled out bad luck. Real shortfalls proved persistent: a page with one this month was 3.8 to 4.8 times as likely to have one next month, including on a sealed month no analysis had touched. A transparent rule (rank by missed clicks) and a logistic regression model found those pages about equally well at the top of the list, 46 to 47 real shortfalls in 50 picks on the sealed month against a base rate of 2.2%, while the model ranked the rest of the list far better and the rule pointed at bigger click pools. The result is a monthly review list, ordered by the rule and labelled with the model's confidence, that a content editor can use as decision support.

## 1. Problem framing

**Decision supported.** Every month a content editor at FlyRank has thousands of live pages and time to review a few dozen. The question is where to look first.

**Unit of analysis.** One page in one calendar-month pair: features from month M, outcome from month M+1.

**Output.** A review list of 50 pages a month (at most 10 from any one client), ordered by missed clicks, each with one suggested first action and a confidence label from the model.

**Action a person takes.** Open the page, check the live results page for its main keyword and whether it is still indexed, then do the one suggested action: check indexing, wait, review the whole site, check the results page, improve the content, or rewrite the title and description.

**Cost of a wrong call.** A page that missed clicks only by luck recovers on its own, so reviewing it wastes an editor's time, and a page that is leaving search will not be helped by a rewrite. That is why the label needs a luck test, and why the playbook puts "check indexing" and "wait" before "rewrite".

**Why data helps.** The common rule (at least 500 impressions, position in the top 20, click-through below 0.5%) flags 74% to 88% of all visible pages, because the normal click-through rate here sits between 0.24% and 0.42% at every position from 1 to 20. Judging a page needs its own position and its own site as the yardstick, which only the data can supply.

## 2. Data safety

**Data used.** FlyRank's internship warehouse, release `v20260703`, read with DuckDB straight from Hugging Face (`FlyRank/internship-warehouse`, gated), with the token held in `HF_TOKEN` and never written into a cell. Four tables were used: daily page performance (78,835,655 rows), page content (519,606 pages), clients (104), and a 90-day query table that was used only for diagnosis and never as a feature. Every identifier is a pseudonymous hash.

**What was excluded, and why.**

- Days with an impossible position: 163,189 March page-days showed position 0 and 101,548 showed a position between 0 and 1, which made pages look top-ranked and inflated their expected clicks.
- Clients whose history starts after the first day of month M, so every client is measured over a whole month.
- Pages optimized by FlyRank during the pair, because someone already acted on them and the next month cannot judge them.
- Every content-table field that could postdate month M: word counts and edit dates come from a July 2026 snapshot, and optimization dates and eligibility flags record FlyRank's own later decisions. Only keyword-research fields, fixed before a page is written, are features.

**Leakage risks and checks.** The label is built from month M+1 clicks, so nothing from M+1 may reach a feature. Scrambling every month M+1 column, the target, and every product field leaves all 25 features unchanged. No feature crosses the 0.90 separation alarm once page size is held fixed, a planted leak lifts the score sharply (so the harness does catch leaks), and no test page appears in its model's training rows. Client identifiers are used for grouping splits and for the bootstrap only, never as a feature.

**Nothing client-identifying.** No client name, URL, or search query appears anywhere in `work/`, `paper/`, or this report. Dataset CSVs stay out of git: `work/**/*.csv` is ignored, and only the small metrics JSON receipts and charts are committed.

## 3. Baseline

**Rule B.** Missed clicks in month M (expected minus actual), counted only for pages already short by the target's rule in month M. It was chosen from three candidate rules by a criterion fixed in advance and then frozen.

**Why it is a fair comparison.** It is a transparent, one-line ranking that an editor could run by hand, it uses only month-M information, and it is scored on the same pages, split, and metric (Precision@50 and Capture@50) as the model.

**Its numbers.** On the development pairs, Precision@50 was 0.800 and its top 50 held 5.60% of next month's missed clicks. On the sealed month (base rate 2.2%), Precision@50 was 0.92 and its top 50 held 19.2% of June's missed clicks. Base rates by pair are 7.4%, 6.4%, 4.1%, and 2.2%, so a random 50 would find between about 1 and 4 real shortfalls.

## 4. Model / analysis

**Expected clicks.** For each page and month: impressions × the pooled click-through rate of its position bin (each position from 1 to 10, then 11 to 20, 21 to 50, and beyond) × its client's factor (the site's clicks ÷ its expected clicks, +1 on both sides).

**Target.** A real shortfall in month M+1: clicks at most half of expected, and a negative binomial test saying luck explains the gap less than 5% of the time. Clicks vary far more than a Poisson count allows, so the spread factor α was estimated by the method of moments on pages whose position barely moved, once per development pair (0.050, 0.032, 0.039), and the median, 0.039, was locked.

**Model.** Logistic regression on 25 features: month-M traffic (impressions, clicks, click-through, position, its daily spread, days with impressions, expected clicks), rule B's two month-M signals, and keyword research (search volume, competition, cost per click, intent, content type, keyword length). A depth-3 tree, a random forest, and gradient boosting were trained the same way for comparison. Left out on purpose: every field that postdates month M, the 90-day query table, and any identifier.

## 5. Evaluation

**Split.** Walk-forward and grouped by client: each test pair is scored by models trained only on earlier pairs and only on other clients, so every test page comes from a month and a site the model never saw. Three development pairs (February→March, March→April, April→May 2026) built and tuned everything, and the May→June pair stayed sealed until one final test.

**Decision rule, fixed in advance.** The model beats rule B only if its mean Precision@50 is more than 0.02 higher, or within 0.02 and higher on Capture@50.

| Set                           | Scorer              | Precision@50 | Capture@50 | Notes                        |
| ----------------------------- | ------------------- | -----------: | ---------: | ---------------------------- |
| Development pairs (mean)      | Logistic regression |        0.890 |      3.59% | model led on precision       |
| Development pairs (mean)      | Rule B              |        0.800 |      5.60% | rule held more missed clicks |
| Sealed month (base rate 2.2%) | Logistic regression |         0.94 |      12.4% | ROC-AUC 0.915                |
| Sealed month (base rate 2.2%) | Rule B              |         0.92 |      19.2% | ROC-AUC 0.711                |

**Result by the rule fixed in advance: the model did not beat rule B.** The sealed gap of 0.02 sits inside the margin, so Capture@50 decided, and rule B's top 50 held clearly more of June's missed clicks.

**Uncertainty.** From 1,000 client-level bootstrap resamples, the model's lead on Precision@50 was +0.06, +0.12, and +0.02 across the three test sets, and every 95% interval crosses zero. Rule B's lead on missed clicks is clear in all three.

**Error analysis.** Most of the model's misses were pages that lost their search visibility the next month, which no click-based score can foresee. A real shortfall also needs enough traffic to rule out luck, so the queue reaches about a quarter of pages with 10,000 or more impressions but only 0.1% of the smallest.

## 6. Interpretation

**What was found.**

- Real shortfalls persist. Among pages with 1,000 to 9,999 impressions, a page with a real shortfall in one month had one again the next month 28% to 51% of the time, against 6% to 13% for pages without one: 3.8 to 4.8 times as often, on the sealed month too.
- The flat 0.5% rule is not a usable yardstick: it flags most pages, including those clicking exactly as expected.
- The site matters as much as the position: at the same position, some sites were clicked about 4 times as often as others, and clicks are far more variable than a Poisson count allows.
- A transparent rule and a logistic regression model are level at the top of the list. The rule finds the bigger click pools, and the model orders the rest of the list far better.

**Surprises and negative results.** The model did not beat the simple rule by the pre-fixed criterion, and that is reported as the result. The position effect was also not monotone in this portfolio: first place was clicked less often than second and third.

## 7. Recommendation

**The playbook.** Once a month, rank every page with a real shortfall by its missed clicks (rule B), take the first 50 with at most 10 from any one client, label each with the model's confidence, and give each one action, chosen in this order:

1. Check indexing and rankings first when impressions halved since the previous month.
2. Wait and re-check next month when the daily position spread is 5 places or more (these pages repeated least often, 19%).
3. Review site-wide when the whole site clicks at under half of what its positions predict.
4. Check the results page first for buying-intent keywords, where ads and shopping results may take the clicks.
5. Improve the content when GA4 shows most visitors leaving without engaging.
6. Rewrite the title and description otherwise.

**Evidence.** On the May→June back-test, 16 of the 17 review-list pages FlyRank did not touch (94%) were real shortfalls again in June. The confidence label orders outcomes correctly (62%, 33%, and 16% repeated for high, medium, and low), though its numbers run 10 to 15 points high.

**How an editor uses it tomorrow.** Open the July review list built from June 2026 data, check the live results page, indexing, and recent changes for each page, then act on the one suggested action. Nothing is published, de-indexed, or promised automatically.

**Confidence and limits.**

- No measured gain: the work shows where clicks are missing and that the gap tends to last, not how many clicks a fix recovers. Measuring that needs an experiment that fixes a random half of a month's list.
- Association, not cause: everything is observed in one portfolio over five months.
- Each Precision@50 rests on 50 pages, so the intervals are wide.
- One sealed month cannot show behaviour across seasons, and the position mix has already drifted since February, past the monitoring trigger.
- Gradient boosting's stopping rule and rule B's two features were added after reading earlier development runs; the comparison rule and the sealed test were fixed in advance.

## 8. Reproducibility

**Where each step lives.** `work/notebooks/w01` to `w07` hold every step, each run top to bottom with its outputs saved. `work/notebooks/capstone.ipynb` re-reads those saved outputs and checks every number it quotes. Committed receipts are in `work/outputs/` (`playbook_summary.json` and the three charts) and in `paper/src/data/` (the JSON the paper draws from, including `sealed-month.json`). The cell that builds the sealed frame is in `w06_validation_audit.ipynb`, and the metrics it produced are the saved output of that notebook and `paper/src/data/sealed-month.json`.

**Re-running.**

1. Open each weekly notebook in Colab (or locally), set `HF_TOKEN` as an environment variable or a Colab Secret (approval for the gated warehouse is instant), and run it top to bottom. Heavy month scans are cached under `work/outputs/w03_cache/`.
2. Run `work/notebooks/capstone.ipynb` to re-check every quoted number against the saved outputs.
3. Rebuild the paper from `paper/`: `pnpm install`, `pnpm data` (extracts the numbers from the capstone notebook's saved outputs and fails if any headline number differs from the known value), then `pnpm build` (type check, build, and the build-time guards).

**Seeds and environment.** Seed 42 everywhere. The modelling runs used scikit-learn 1.6.1, pandas 2.2.3, and numpy 2.1.3 on Colab. The paper uses Node 22.12 or newer and the lockfile `paper/pnpm-lock.yaml`.

## 9. Acknowledgments & data credit

Built on the FlyRank ML Internship dataset, provided by [FlyRank](https://flyrank.ai) through the FlyRank ML Internship warehouse (release `v20260703`), pseudonymized before release. Thanks to FlyRank for the warehouse, the lane brief, and the internship that made this work possible.
