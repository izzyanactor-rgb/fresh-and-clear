# Step 3 LLM extraction prompt

Use this after `scrape_seed.py` has produced raw markdown in `raw/*.json`.
Feed each file's `raw_markdown` into an LLM with the prompt below to produce
structured rows for `facility_dementia_features` and `facility_pricing`.
Reject/flag any response that isn't valid JSON matching this shape.

---

```
You are extracting structured facts about a dementia/memory care facility
from raw website text. Only extract what is explicitly stated or strongly
implied — do not guess or invent details.

For every field, if the source text doesn't mention it, output null rather
than guessing. For every non-null field, include a one-sentence quote or
paraphrase from the source text that justifies it, plus a confidence level.

Return ONLY valid JSON in this exact shape:

{
  "secure_unit": <true|false|null>,
  "secure_outdoor_wandering_path": <true|false|null>,
  "wander_management_system": <true|false|null>,
  "wander_management_details": <string|null>,
  "staff_dementia_training_program": <string|null>,
  "behavioral_support_team": <true|false|null>,
  "medication_management_onsite": <true|false|null>,
  "sensory_room": <true|false|null>,
  "structured_daily_programming": <true|false|null>,
  "pet_therapy": <true|false|null>,
  "family_support_groups": <true|false|null>,
  "language_services": <string[]|null>,
  "cultural_religious_accommodations": <string[]|null>,
  "pricing_is_transparent": <true|false>,
  "base_rate_monthly": <number|null>,
  "memory_care_rate_monthly": <number|null>,
  "respite_rate_daily": <number|null>,
  "pricing_notes": <string|null>,
  "evidence": {
    "<field_name>": { "quote": "<string>", "confidence": "high|medium|low" }
  }
}

Source text:
"""
<raw_markdown goes here>
"""
```
