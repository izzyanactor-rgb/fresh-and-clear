"""
Phase 1 data acquisition: crawl a seed list of GTA memory care / retirement
home websites and save raw markdown output for the LLM cleaning pass
described in DATA_ACQUISITION_PLAN.md.

This script does NOT invent facility data. `seed_facilities.csv` must first
be populated from an authoritative source (RHRA registry, Ontario LTC public
reporting, or manual research) — see DATA_ACQUISITION_PLAN.md Step 1.

Usage:
    pip install -r requirements.txt
    python scrape_seed.py --input seed_facilities.csv --output raw/
"""

import argparse
import asyncio
import json
import re
from pathlib import Path

import pandas as pd
from crawl4ai import AsyncWebCrawler


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


async def crawl_facility(crawler: AsyncWebCrawler, row: dict, output_dir: Path) -> dict:
    result = {
        "name": row["name"],
        "facility_type": row.get("facility_type"),
        "city": row.get("city"),
        "website": row["website"],
        "status": "pending",
    }

    try:
        crawl_result = await crawler.arun(url=row["website"])
        result["status"] = "success" if crawl_result.success else "failed"
        result["raw_markdown"] = crawl_result.markdown
        result["links"] = getattr(crawl_result, "links", None)
    except Exception as exc:  # noqa: BLE001 - log and continue crawling the rest of the batch
        result["status"] = "failed"
        result["error"] = str(exc)

    out_path = output_dir / f"{slugify(row['name'])}.json"
    out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False))
    return result


async def main(input_csv: Path, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(input_csv, comment="#")

    if df.empty:
        raise SystemExit(
            f"{input_csv} has no facility rows yet. Populate it from the RHRA "
            "registry or Ontario LTC public reporting first (see "
            "DATA_ACQUISITION_PLAN.md Step 1)."
        )

    async with AsyncWebCrawler() as crawler:
        for _, row in df.iterrows():
            outcome = await crawl_facility(crawler, row.to_dict(), output_dir)
            print(f"[{outcome['status']}] {outcome['name']} -> {outcome['website']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("seed_facilities.csv"))
    parser.add_argument("--output", type=Path, default=Path("raw"))
    args = parser.parse_args()

    asyncio.run(main(args.input, args.output))
