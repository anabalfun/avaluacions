# Avaluacions

An interactive explorer that makes Catalonia’s public school-assessment results easier to understand. It covers **6th-grade primary school** and **4th-year compulsory secondary education (ESO)**, with a Catalan interface.

[Live dashboard on Cloudflare](https://avaluacions.anabalfun.workers.dev) · [Documentació en català](README.ca.md)

![Primary-school dashboard with the Pruna palette](assets/preview.png)

## The problem

The source exports contain more than two million assessment records across multiple years, inconsistent category labels, and gaps in subject coverage. A usable public dashboard needs to explain what those scores represent and make comparisons without silently changing the population being compared.

Avaluacions lets visitors select a year, combine demographic and school filters, explore score distributions, and compare results over time. The Catalonia-wide reference stays fixed within each stage and year. Written summaries are calculated from the same values as the charts.

## What it does

- Separate primary and ESO datasets, with a clear stage switch and distinct palettes.
- Filters for gender, education administration area, and public/private school category.
- Annual score distributions, historical trends, and two-year comparisons.
- Expandable component scores with valid-score counts and explicit missing-data states.
- Contextual comparisons between genders and school categories that preserve the other filters.
- CSV exports of the current view.

## Run locally

Python 3 is enough to serve the application. No dependency installation or build step is required.

```sh
python3 -m http.server 8000 --directory docs --bind 127.0.0.1
```

Open [localhost:8000](http://localhost:8000). Serve over HTTP rather than opening the HTML file directly, because the browser loads the aggregate JSON files.

## Architecture and decisions

```text
Source CSV exports → Python aggregation → aggregate JSON → browser calculations → charts and summaries
```

| Decision | Reason | Tradeoff |
|---|---|---|
| Static HTML, CSS and JavaScript modules | Low operating cost, portable hosting, minimal setup | Data updates require regenerating and deploying a snapshot |
| Aggregate before distribution | Keep the browser download small and avoid distributing pupil identifiers or birth dates | New filter dimensions require changing the ingestion step |
| Pure calculation module, separate from presentation | Test numerical behavior independently of the DOM | Presentation behavior still needs browser checks |
| One fixed reference for each stage and year | Prevent filters from silently redefining the comparison baseline | The reference includes the selected group; it is not a matched control |
| Compute summary text from data | Keep explanations consistent with the charts without a runtime AI service | Text describes changes; it cannot explain their causes |
| Use published global scores separately from components | Avoid inventing component weights | The global score cannot be reproduced by averaging the displayed components |

The application has no backend, database, authentication dependency, analytics service, or runtime AI API. The GitHub-ready copy runs independently of the original Sites host.

## Data and interpretation

Source: Generalitat de Catalunya, Dades obertes de Catalunya. Snapshot: **19 November 2026**.

| Dataset | Source records | Coverage |
|---|---:|---|
| [6è de primària](https://analisi.transparenciacatalunya.cat/Educaci-/Avaluaci-de-sis-d-educaci-prim-ria/rk5x-gny6/about_data) | 1,102,324 | 2009–2025, excluding 2020 |
| [4t d’ESO](https://analisi.transparenciacatalunya.cat/Educaci-/Avaluaci-de-quart-d-Educaci-Secund-ria-Obligat-ria/59vm-wwq7/about_data) | 929,604 | 2012–2025, including 2020 |

These are records, not a count of distinct pupils across years. Refer to the original datasets for reuse terms. This is an independent project, not an official government website.

Important boundaries:

- Missing scores are excluded rather than converted to zero. Each result reports its own valid-score count.
- Means weight each valid record equally, using its published score. They may differ from official report populations or processing rules.
- The data does not establish equivalent assessment difficulty across years or stages. Comparisons are descriptive; they do not establish causes or statistical significance.
- Cohorts differ by year. Switching stages does not follow the same pupils through school.
- Territorial labels change over time and are retained without assuming equivalence. Component and subject availability also varies.
- JSON files contain only aggregate dimensions, counts, sums and histograms. Original CSV files, pupil codes and birth dates are excluded from this repository.
- The snapshot is not refreshed automatically. Small aggregate groups are not subject to a disclosure-suppression policy; assess that separately before extending the data or filter dimensions.

Detailed coverage, normalization rules and update instructions are in [README.ca.md](README.ca.md).

## Quality checks

Requires Node.js 22+ and Python 3. The tests use their standard libraries, with no test dependencies.

```sh
node --test tests/*.test.mjs
python3 -m unittest discover -s tests -p 'test_*.py' -v
node --check docs/app.mjs
```

The suite covers both datasets: independently checked reference values, aggregation across gender partitions, weighted means, missing-data semantics, component coverage, filter isolation, signed changes, trend discontinuities, and the aggregate data schema. Hand-calculated CSV fixtures cover decimal commas, normalization, invalid values, zero scores, histogram boundaries, and exclusion of identifiers.

[GitHub Actions](.github/workflows/checks.yml) runs these checks on pushes and pull requests. The workflow has read-only repository permissions. The initial remote run passed; subsequent pushes and pull requests run the same checks.

The ingestion script was also run against both complete source exports and reproduced the bundled datasets exactly. Browser checks have been performed during development; they are not automated in this suite. Automated browser regression tests and an accessibility audit remain useful follow-ups.

## When the official datasets add a new year

For example, when 2026 results become available, download fresh CSV exports from the same official dataset links and run `scripts/build_data.py` with those files and the new export date (see below). You can update either stage independently. Review any changed column names, categories or territorial definitions; update the coverage notes and record counts in the documentation and the stage descriptions in `docs/app.mjs` and `docs/index.html`. Run the tests, check the new year in both annual and evolution views (including component scores), then commit the regenerated JSON and related changes and publish them. The year selectors and chart ranges are derived from the generated data, so they will include the new year automatically. The website does not fetch official updates by itself.

## Updating the snapshot

Keep source exports outside the repository or under the ignored `raw-data/` directory.

```sh
python3 scripts/build_data.py \
  --primary raw-data/primaria.csv \
  --eso raw-data/eso.csv \
  --export-date 2026-11-19
```

Review schema and coverage changes, regenerate the data, run the checks, and inspect representative views. Subject labels and coverage notes in the UI currently require manual review when a new export changes the available years or columns.

## Cloudflare deployment

The production dashboard is hosted on **Cloudflare Workers** at [avaluacions.anabalfun.workers.dev](https://avaluacions.anabalfun.workers.dev/). Git integration watches `main` in `anabalfun/avaluacions`; merging a PR triggers deployment of the repository snapshot. Official source-data updates still require the rebuild procedure above.

The browser application is static and portable: `docs/` can be served by Python, GitHub Pages, or any static host. The Cloudflare configuration files apply only to Cloudflare hosting. Requests now go directly to static assets; there is no Worker entrypoint, ASSETS binding, or `runWorkerFirst` wrapper.

### Deploy and validate

Requires Node.js 22+ and npm. Cloudflare build tools are development dependencies with versions recorded in `package-lock.json`.

```sh
npm ci --ignore-scripts
npm run build:cloudflare  # local asset-build validation; no upload or credentials needed
npm run deploy           # authenticated Cloudflare deployment
```

Workers Builds should keep its deploy command **`npm ci --ignore-scripts && npm run deploy`**, with the build command empty. This works with the restored assets-only configuration, so the end of the diagnostic period needs no second dashboard command change. `cf` delegates asset preparation to Wrangler using `wrangler.config.ts`, whose only build setting is the `docs/` directory. Local Python hosting and GitHub Pages do not require these tools.

### Temporary diagnostics and returning to static hosting

[PR #1](https://github.com/anabalfun/avaluacions/pull/1) adds a temporary error-logging Worker to investigate asset 4xx responses. The plan is to gather data for **3–5 days after its first successful production deployment**, review error counts and patterns daily, then deploy this static-hosting restoration. The period starts at deployment, not when a PR is opened. Neither step is scheduled or merged automatically. This section describes the intended state after the restoration is deployed; it does not assert that production has already changed.

During the diagnostic period, custom `asset_error` logs contain status, time and allowlisted public filenames; arbitrary paths are `[other]`. Automatic invocation logs and traces are disabled. Review them in **Workers & Pages → avaluacions → Observability → Logs**. Inspect evidence before the plan's retention window expires (currently 3 days on Workers Free); preserve only a non-sensitive aggregate summary outside the public repository if needed.

This restoration removes the wrapper and its tests and explicitly disables Workers Logs and traces. Every file is served directly as a static asset again, avoiding the per-request Worker execution introduced for diagnostics. The public site, filters, charts, datasets and live URL are unchanged. Existing logs remain subject to Cloudflare's retention rules; disabling logging does not delete historical records. Asset status metrics remain available, but there will be no new custom path-level error logs.

Direct static-asset requests are free and unlimited under [Cloudflare's current pricing](https://developers.cloudflare.com/workers/platform/pricing/). The temporary wrapper instead counts every request toward Workers usage: the Free plan currently allows 100,000 requests/day shared across the account, while the Paid plan starts at $5/month and has included allowances plus overage charges. Logging has separate limits. The 194 asset requests observed in the initial 24-hour investigation were far below that allowance, but are only one day's traffic, not a guarantee of future usage. The diagnostic PR does not upgrade the account's plan.

To complete the restoration: merge the diagnostics PR first; after 3–5 days of production data, review the findings, retarget/rebase the restoration PR onto `main` if necessary (especially after a squash merge), check its final diff and CI, merge it, and verify the resulting Cloudflare deployment. Confirm the homepage, both stages and data downloads work, and inspect the deployed configuration for no entrypoint/ASSETS binding/`runWorkerFirst`, with logging disabled. Do not merge the restoration into the diagnostics feature branch.

### Credentials and repository hygiene

No credentials are needed in source code. Cloudflare deployment credentials stay in the hosting provider's build environment or your local authenticated CLI; never paste them into configuration, documentation, issues, or logs. `.gitignore` excludes `.env*`, `.dev.vars*`, private keys, dependencies, local Cloudflare state, raw CSV exports, and archives. Only `docs/` is uploaded as public assets; configuration, tests, and logs are not public website files. Ignore rules do not protect files already tracked by Git: review staged files and diffs before pushing. If a secret is ever committed, revoke it immediately; deleting it from the latest revision is insufficient.

## Publish

Upload to a repository named **avaluacions**. In **Settings → Pages**, select **Deploy from a branch**, **main**, **/docs**. The application uses relative paths and supports project URLs such as `https://USERNAME.github.io/avaluacions/`.

See [GitHub’s publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). Any static host can also serve `docs/`.

## Project map

```text
docs/                   Deployable website and aggregate datasets
scripts/build_data.py   Reproducible CSV-to-JSON aggregation
tests/                  JavaScript model tests and Python ingestion tests
.github/workflows/      Automated checks
README.ca.md            Detailed Catalan setup and data documentation
```

## Development context

This is a personal project developed iteratively with AI assistance, starting from questions about public education data and refining the interface through feedback. The emphasis is on turning ambiguous questions into a focused product, validating data semantics, and keeping deployment and maintenance simple.
