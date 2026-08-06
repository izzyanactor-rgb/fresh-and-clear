# Directory Data Architecture (Phase 1)

Data-first foundation for the GTA/Ontario dementia care directory: memory
care facilities, home safety tools, and support resources, filterable by the
"dealbreaker" features general senior-living directories ignore.

- `schema.sql` — Supabase/Postgres schema (facilities, dementia-specific
  amenities, pricing transparency, home tools catalog, support services,
  educational resources, and a source/verification audit trail).
- `DATA_ACQUISITION_PLAN.md` — step-by-step plan: start from Ontario
  regulator/open data, crawl facility sites with Crawl4AI, clean and enrich
  with an LLM, verify with confidence scores, sample-QA before launch.
- `scripts/seed_facilities.csv` — template seed list (populate from the RHRA
  registry / Ontario LTC public reporting before crawling).
- `scripts/scrape_seed.py` — Crawl4AI script that turns the seed list into
  raw markdown dumps per facility.
- `scripts/extraction_prompt.md` — the exact LLM prompt used to turn raw
  crawl output into structured rows matching `schema.sql`.

No UI work happens until this data moat is in place.
