# Runbook: Your 45-Minute Part

Everything in here runs on **your own computer**, because the cloud sandbox
where Claude works can't reach outside websites. Do these once, bring the
results back to a Claude Code session, and the pipeline takes over from there.

You'll need: a computer with Python 3.10+ installed, and about 45 minutes.

---

## Part A — Create the database (~15 min, one time)

1. Go to https://supabase.com and sign up (free tier is fine).
2. Click **New project**. Name it `dementia-care-directory`. Pick any region
   (Canada Central if offered). Set a database password and **save it
   somewhere safe** — you'll need it later.
3. Wait ~2 minutes for the project to finish provisioning.
4. In the left sidebar, click **SQL Editor** → **New query**.
5. Open `schema.sql` from this folder, copy ALL of it, paste it into the
   query box, and click **Run**.
6. You should see "Success. No rows returned." Click **Table Editor** in the
   sidebar — you should now see tables like `facilities`,
   `facility_dementia_features`, `home_tools_products`.

✅ Done when: the tables show up in the Table Editor.

## Part B — Get the code onto your computer (~5 min)

1. Open a terminal (Mac: Terminal app; Windows: PowerShell).
2. Run:

   ```
   git clone https://github.com/izzyanactor-rgb/fresh-and-clear.git
   cd fresh-and-clear
   git checkout claude/dementia-care-directory-schema-nfpv47
   cd directory-data-architecture/scripts
   ```

✅ Done when: `ls` (Mac) or `dir` (Windows) shows `scrape_seed.py` and
`seed_facilities.csv`.

## Part C — Run the scrape (~20 min, mostly waiting)

1. In the same terminal:

   ```
   pip install -r requirements.txt
   crawl4ai-setup
   ```

   (`crawl4ai-setup` downloads a browser the crawler uses — it's normal for
   this to take a few minutes.)

2. Run the scraper:

   ```
   python scrape_seed.py
   ```

3. Watch the output. You want mostly `[success]` lines. A couple of
   `[failed]` lines are fine — some facility sites block bots; we'll handle
   those case by case.

✅ Done when: a new `raw/` folder exists containing one `.json` file per
facility (e.g. `sagecare.json`).

## Part D — Grab the registry files while you're at it (~5 min)

These two downloads are blocked from the sandbox but open fine on a normal
browser. They let us verify every facility's license before launch.

1. https://data.ontario.ca/dataset/long-term-care-home-ltch-locations —
   download the CSV resource.
2. https://www.rhra.ca/en/retirement-home-database/ — search each of our 12
   facilities and note their licence status (or just confirm they appear).

## Part E — Bring it back

Get the results back into the repo so Claude can work on them. Easiest path,
from the `scripts` folder:

```
git add raw/
git commit -m "Add raw scrape output for 12 seed facilities"
git push
```

(If any registry CSVs from Part D are on your computer, drop them into a
`registry-data/` folder inside `directory-data-architecture/` and include
them in the same commit.)

Then start a Claude Code session on this repo and say:
**"The raw scrape output is pushed — run the extraction."**

## If something goes wrong

- `pip: command not found` → try `pip3` and `python3` instead.
- `crawl4ai-setup` fails → run `python -m playwright install chromium`.
- A site returns `[failed]` → skip it; tell Claude which ones failed.
- Anything else → paste the exact error message into Claude. Do not spend
  more than 10 minutes stuck on any step.
