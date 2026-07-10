"""
One-pass crawl + LLM extraction (recovered from claude.ai chat, 2026-07-10).

This is the alternative pipeline to scrape_seed.py + extraction_prompt.md:
instead of saving raw markdown first and extracting later, it uses
Crawl4AI's LLMExtractionStrategy to crawl and extract structured
dealbreaker data in a single pass.

Requires: pip install crawl4ai pydantic openai
and OPENAI_API_KEY set in the environment.

Note: `.schema()` on the Pydantic model is the v1-style API; under
Pydantic v2 it still works but emits a deprecation warning — swap to
`DementiaResourceSchema.model_json_schema()` if it becomes an error.
"""

import os
import asyncio
import json
from typing import List, Optional
from pydantic import BaseModel, Field
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
from crawl4ai.extraction_strategy import LLMExtractionStrategy

# 1. Define the specific "dealbreaker" data points we want to extract
class DementiaResourceSchema(BaseModel):
    resource_name: str = Field(..., description="Name of the facility, tool, or service provider.")
    resource_type: str = Field(..., description="Category: e.g., 'Memory Care Facility', 'Home Safety Tool', 'Respite Care', 'Support Group'.")
    location_or_service_area: Optional[str] = Field(None, description="Physical address or geographic areas served in Ontario/GTA.")

    # Dementia-specific dealbreakers
    has_dedicated_memory_care: Optional[bool] = Field(None, description="Does this facility have a locked or dedicated dementia/memory care wing?")
    staff_specialized_training: Optional[bool] = Field(None, description="Is it explicitly stated that staff have specialized dementia or responsive behaviors training?")
    safety_features: List[str] = Field(default=[], description="List any safety features mentioned (e.g., anti-wandering alarms, secure courtyards, keypad locks).")

    pricing_transparency: Optional[str] = Field(None, description="Any specific pricing, fee structures, or funding options (e.g., government subsidized) mentioned.")
    contact_phone: Optional[str] = Field(None, description="Phone number for inquiries.")
    confidence_score: float = Field(..., description="Your confidence score from 0.0 to 1.0 that this resource actually fits a dementia/memory care niche.")

# 2. Main asynchronous crawling and extraction function
async def main():
    # Example list of initial URLs to target (e.g., Ontario care portals or local provider sites)
    urls_to_scrape = [
        "https://example-ontario-care-provider.ca/memory-care-services",
        "https://example-toronto-senior-safety-tools.com/products"
    ]

    # Ensure your API key is set in your environment variables
    # e.g., export OPENAI_API_KEY="your-key-here"
    if not os.environ.get("OPENAI_API_KEY"):
        print("Warning: Please set your OPENAI_API_KEY environment variable.")
        return

    # Configure the LLM Extraction Strategy using Crawl4AI
    extraction_strategy = LLMExtractionStrategy(
        provider="openai/gpt-4o",  # Or your preferred LLM provider supported by Crawl4AI
        schema=DementiaResourceSchema.schema(),
        extraction_type="schema",
        instruction=(
            "Examine this page thoroughly. Extract details about senior living facilities, home safety tools, "
            "or care services. Focus strictly on identifying features crucial for dementia and Alzheimer's patients, "
            "such as security/wandering measures, trained staff, and specific pricing transparency. If a page "
            "is entirely irrelevant to senior or dementia care, return a confidence_score of 0.0."
        )
    )

    # Set up crawler run configuration
    config = CrawlerRunConfig(
        extraction_strategy=extraction_strategy,
        cache_mode=CacheMode.BYPASS  # Force a fresh crawl for up-to-date data
    )

    print(f"🚀 Starting crawl and enrichment for {len(urls_to_scrape)} target pages...")

    async with AsyncWebCrawler() as crawler:
        for url in urls_to_scrape:
            print(f"\n🔍 Scraping and parsing: {url}")
            result = await crawler.arun(url=url, config=config)

            if result.success and result.extracted_content:
                # The extracted content will be a JSON string conforming to our Pydantic schema
                data = json.loads(result.extracted_content)
                print("✅ Successfully enriched data:")
                print(json.dumps(data, indent=2))

                # TODO: Here is where you will add a function to save 'data' into your Supabase database
            else:
                print(f"❌ Failed to process page. Error: {result.error_message}")

if __name__ == "__main__":
    asyncio.run(main())
