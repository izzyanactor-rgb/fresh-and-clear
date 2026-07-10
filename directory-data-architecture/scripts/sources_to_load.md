# Authoritative datasets still to load

These are the Step 1 registry sources from DATA_ACQUISITION_PLAN.md. They were
identified and confirmed to exist, but could not be downloaded from the
sandboxed dev environment (its network policy blocks these hosts). Download
them from a normal machine, or add these domains to the environment's network
allowlist, then load them before launch to verify license status for every
seed facility.

## 1. Ontario open data — Long-Term Care

- **LTC Home Locations**: https://data.ontario.ca/dataset/long-term-care-home-ltch-locations
  (CSV; addresses + geo for every licensed LTC home)
- **LTC Home Licence Information**: https://data.ontario.ca/dataset/long-term-care-home-licence-information
  (licence type/term, operator, Administrator, Director of Care)
- **LTC Management Information System**: https://data.ontario.ca/dataset/long-term-care-management-information-system
  (owner/operators, bed counts, capital projects)

Feeds: `facilities` (facility_type = long_term_care, license fields,
capacity_total_beds), `regions`.

## 2. RHRA Retirement Home Public Register

- https://www.rhra.ca/en/retirement-home-database/
  (all 750+ licensed Ontario retirement homes: licence status, inspection
  history, services offered)

Feeds: `facilities` (facility_type = retirement_home, license_number,
license_status), and corroborates `facility_dementia_features` claims
(the register lists "dementia care" as a declared service).

## 3. Third-party consolidated datasets (convenience, verify against #1/#2)

- Paul Allen's consolidated Ontario retirement homes dataset:
  https://paulallen.ca/consolidated-dataset-of-retirement-homes-in-ontario/
- Paul Allen's consolidated Ontario LTC homes dataset:
  https://paulallen.ca/consolidated-dataset-of-ltc-homes-in-ontario/

## 4. Regional healthline directories (free-text listings to scrape later)

- Toronto Central: https://www.torontocentralhealthline.ca/listservices.aspx?id=10683
- Mississauga Halton: https://www.mississaugahaltonhealthline.ca/listservices.aspx?id=10683
- Peel Region municipal LTC centres: https://peelregion.ca/health/seniors/peel-long-term-care/our-long-term-care-centres
