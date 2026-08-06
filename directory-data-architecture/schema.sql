-- Fresh and Clear: Dementia Care Directory
-- Phase 1 data architecture (Supabase / Postgres)
-- Scope: memory care facilities, home safety tools, and support resources
-- for the Greater Toronto Area (GTA) / Ontario proof-of-concept market.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference / lookup tables
-- ---------------------------------------------------------------------------

create table regions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,               -- e.g. "Toronto", "Mississauga", "Vaughan"
  province text not null default 'ON',
  is_gta boolean not null default true
);

create type facility_type as enum (
  'long_term_care',        -- LTC home, licensed under Ontario's Fixing Long-Term Care Act
  'retirement_home',       -- Licensed under the Retirement Homes Act, regulated by RHRA
  'memory_care_community', -- Standalone / private-pay dementia-specific community
  'adult_day_program',     -- Day programs, not residential
  'assisted_living'
);

create type licensing_body as enum ('RHRA', 'MOH_LTC', 'MUNICIPAL', 'UNLICENSED_PRIVATE', 'UNKNOWN');

create type source_type as enum (
  'government_open_data',
  'regulator_registry',
  'facility_website',
  'review_site',
  'manual_entry',
  'llm_inference'
);

-- ---------------------------------------------------------------------------
-- Provenance: every enriched fact must be traceable to a source
-- ---------------------------------------------------------------------------

create table sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,                      -- e.g. "Ontario Retirement Homes Regulatory Authority"
  source_type source_type not null,
  base_url text,
  license_notes text,                      -- terms of use / attribution requirements
  created_at timestamptz not null default now()
);

create table scrape_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete set null,
  target_url text not null,
  status text not null default 'pending',  -- pending | success | failed | skipped
  raw_payload jsonb,                       -- unprocessed crawl output (Crawl4AI result)
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Core entity: facilities
-- ---------------------------------------------------------------------------

create table facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  operator_name text,                      -- parent operator, e.g. "Chartwell", "Sienna Senior Living"
  facility_type facility_type not null,
  licensing_body licensing_body not null default 'UNKNOWN',
  license_number text,
  license_status text,                     -- e.g. "Licensed - Good Standing", "Under Review"

  address_line1 text,
  city text,
  region_id uuid references regions(id),
  postal_code text,
  latitude double precision,
  longitude double precision,

  phone text,
  website text,

  year_opened int,
  capacity_total_beds int,
  capacity_memory_care_beds int,

  accepts_ltc_subsidy boolean default false,   -- Ontario government-subsidized LTC bed
  private_pay_only boolean default false,

  data_confidence smallint default 0,      -- 0-100, rolled up from enrichment verification
  last_verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_facilities_region on facilities(region_id);
create index idx_facilities_type on facilities(facility_type);

-- ---------------------------------------------------------------------------
-- Dealbreakers: the specialized, hard-to-find fields that make this
-- directory more useful than a general seniors' housing site.
-- ---------------------------------------------------------------------------

create table facility_dementia_features (
  facility_id uuid primary key references facilities(id) on delete cascade,

  secure_unit boolean,                        -- locked / access-controlled memory care wing
  secure_outdoor_wandering_path boolean,      -- enclosed outdoor space safe for wandering
  wander_management_system boolean,           -- door alarms, WanderGuard-style tags, GPS bracelets
  wander_management_details text,

  staff_dementia_training_program text,       -- e.g. "Gentle Persuasive Approaches (GPA)", "U-First!", "Montessori for Dementia"
  staff_training_verified boolean default false,
  staff_to_resident_ratio_day text,            -- e.g. "1:8"
  staff_to_resident_ratio_night text,

  behavioral_support_team boolean,            -- on-site BSO (Behavioural Supports Ontario) resource
  medication_management_onsite boolean,
  sensory_room boolean,
  structured_daily_programming boolean,
  pet_therapy boolean,
  family_support_groups boolean,

  language_services text[],                    -- languages staff can support in
  cultural_religious_accommodations text[],

  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pricing transparency is itself a dealbreaker filter
-- ---------------------------------------------------------------------------

create table facility_pricing (
  facility_id uuid primary key references facilities(id) on delete cascade,
  currency text not null default 'CAD',
  base_rate_monthly numeric(10,2),
  memory_care_rate_monthly numeric(10,2),
  respite_rate_daily numeric(10,2),
  pricing_is_transparent boolean default false,   -- false if site only says "contact us"
  pricing_notes text,
  pricing_source_url text,
  pricing_verified_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Home safety tools & adaptations catalog
-- ---------------------------------------------------------------------------

create type home_tool_category as enum (
  'wandering_alerts',
  'gps_trackers',
  'door_window_alarms',
  'automatic_stove_shutoff',
  'medication_dispensers',
  'fall_detection',
  'orientation_clocks_calendars',
  'communication_aids',
  'home_modification_service'
);

create table home_tools_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category home_tool_category not null,
  manufacturer text,
  price_cad numeric(10,2),
  purchase_url text,
  retailer text,
  description text,
  dealbreaker_features jsonb,              -- flexible per-category spec (battery life, alert range, etc.)
  compatibility_notes text,
  data_confidence smallint default 0,
  last_verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Support services: home care agencies, day programs, respite providers
-- ---------------------------------------------------------------------------

create table support_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_type text not null,               -- home_care_agency | adult_day_program | respite_care | transportation
  region_id uuid references regions(id),
  coverage_area text,
  hourly_rate_cad numeric(10,2),
  license_or_accreditation text,
  phone text,
  website text,
  data_confidence smallint default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Educational / crisis resources (Alzheimer Society, hotlines, guides)
-- ---------------------------------------------------------------------------

create table resources_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  resource_type text not null,              -- guide | checklist | hotline | support_group | legal_financial
  organization text,                        -- e.g. "Alzheimer Society of Ontario"
  url text,
  summary text,
  region_scope text default 'GTA',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Verification / audit log: field-level provenance for every enriched fact
-- ---------------------------------------------------------------------------

create table verification_log (
  id uuid primary key default gen_random_uuid(),
  entity_table text not null,               -- 'facilities' | 'facility_dementia_features' | 'home_tools_products' | ...
  entity_id uuid not null,
  field_name text not null,
  field_value text,
  source_id uuid references sources(id),
  confidence_score smallint,                -- 0-100
  verified_by text not null default 'llm',  -- 'llm' | 'human' | 'regulator_registry'
  verified_at timestamptz not null default now()
);

create index idx_verification_entity on verification_log(entity_table, entity_id);
