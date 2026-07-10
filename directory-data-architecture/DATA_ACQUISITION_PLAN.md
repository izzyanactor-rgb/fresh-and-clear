# Data Acquisition Game Plan — GTA Dementia Care Directory

Goal: build the data moat before the UI. Every fact in the directory must be
traceable to a source and carry a confidence score, so families can trust the
"dealbreaker" filters (secure wandering paths, wander alert systems, staff
training, transparent pricing) more than they'd trust a general seniors'
housing site.

## Step 1 — Start from authoritative bulk sources, not scraping

Ontario has usable open/regulator data that gives us a clean base list before
we touch a single facility website:

- **Retirement Homes Regulatory Authority (RHRA) public registry** — every
  licensed retirement home in Ontario, with license status, address, and
  inspection history. This is our best source for `license_number`,
  `license_status`, and a starting `facility_type = retirement_home`.
- **Ontario Ministry of Health — Long-Term Care Home Public Reporting** (via
  the Ontario Data Catalogue) — licensed LTC homes, bed counts, and inspection
  reports. Feeds `facility_type = long_term_care`, `capacity_total_beds`.
- **Behavioural Supports Ontario (BSO)** program listings — helps flag
  `behavioral_support_team = true` where a facility is a known BSO site.
- **City of Toronto / regional municipal open data** for licensed retirement
  homes and adult day programs where available.

Loading these first means our facility list, license numbers, and legal
addresses are already correct on day one — scraping is only needed to fill in
the *dementia-specific* fields these registries don't track.

## Step 2 — Crawl facility websites for the fields registries don't have

For each facility with a known website, use Crawl4AI to pull the raw
markdown/text of:
- the memory care / secure unit page (if one exists)
- the pricing / "cost of care" page
- the "our team" / staff training page
- the amenities page

Store the raw crawl output in `scrape_jobs.raw_payload` before any cleaning —
never overwrite raw data, only derive from it.

## Step 3 — LLM cleaning pass

- Normalize addresses (Canada Post format) and postal codes.
- Deduplicate chain operators (e.g., the same "Chartwell" or "Sienna" location
  showing up once from the RHRA registry and once from a scrape).
- Extract structured fields from unstructured page text using an LLM with a
  strict JSON schema matching `facility_dementia_features` /
  `facility_pricing` — reject any output that doesn't validate against the
  schema.

## Step 4 — LLM enrichment & verification pass

- For each extracted claim (e.g., "we have a secure wandering path"), assign a
  `confidence_score`:
  - High: corroborated by both the regulator registry/inspection report and
    the facility's own site.
  - Medium: stated only on the facility's own marketing site.
  - Low: inferred by the LLM from indirect language ("secure environment")
    rather than an explicit statement.
- Explicitly mark `pricing_is_transparent = false` when a site only offers
  "contact us for pricing" — that absence is itself a dealbreaker signal
  families filter on.
- Write every field-level decision to `verification_log` with the source it
  came from.

## Step 5 — Human QA sampling

Before launch, manually call or verify a random ~10% sample of listings
(especially `secure_unit`, `staff_dementia_training_program`, and pricing) to
measure the enrichment pipeline's real-world accuracy and catch systematic
LLM extraction errors before they reach families.

## Step 6 — Ongoing freshness

Re-crawl each facility site on a recurring schedule (e.g., monthly), diff
against the last `scrape_jobs.raw_payload`, and only re-run the LLM extraction
step on pages that changed — keeps enrichment costs low while catching
pricing/amenity changes.

## Next action

See `scripts/scrape_seed.py` for the first Crawl4AI script: it takes a seed
list of facility names + websites (starting from the RHRA/MOH registries
above) and produces raw crawl output ready for Step 3's LLM cleaning pass.
