# Template Quality Audit — 2026-08-08

## Purpose

This document records the first quantitative quality baseline for the 318 active Stampelo template records after legacy state compatibility was fixed.

The goal is not to defend the raw record count. The goal is to determine how many templates are genuinely useful, visually distinct and production-quality.

## Production baseline

Read-only checks against `stampelo-db` on 2026-08-08 confirm:

- **318** active template records.
- **14** active database categories.
- **6** structural layout families when normalized geometry and element structure are compared without text content.
- **0** templates currently fail the basic visible-text test after read-time normalization.

### Structural layout families

| Family size | Shape | Interpretation |
|---:|---|---|
| 156 | round | dominant two-ring round family |
| 112 | rectangular | dominant three-line rectangular family |
| 31 | rectangular | secondary two-line rectangular family |
| 10 | oval | common oval family |
| 5 | round | secondary round family |
| 4 | triangular | triangular family |

This means **268 of 318 records (84.3%)** belong to just two structural layouts.

## Provisional automated A/B/C queue

Using the conservative Phase-2 audit rules currently proposed in `server/auditTemplates.ts`:

- **A candidate: 8**
- **B candidate: 310**
- **C candidate: 0**

These are **not final quality grades**. The automated classifier deliberately sends any template in a structural family of 8 or more records to B for human distinctness review. The result therefore demonstrates catalogue homogeneity; it does not mean 310 templates are automatically bad.

### Meaning of the provisional classes

- **A candidate** — structurally valid, readable, not part of a large repeated layout family, and not placeholder-heavy.
- **B candidate** — structurally valid, but belongs to a large repeated layout family and/or contains placeholder-heavy content. Requires rendered visual review and likely differentiation/redesign.
- **C candidate** — missing stamp state or no visible text. Candidate for removal unless intentionally blank.

## Category source-of-truth finding

The editor previously used a historical hard-coded category list that did not match the production database. Examples included `Corporate` vs `Business`, `Legal / Notary` vs `Legal`, and `Finance / Banking` vs `Finance`.

The Phase-2 implementation changes the Template Library to obtain filter categories from the existing `template.categories` API, derived from active database rows. No production data migration is required for this correction.

## Review sequence

The human visual audit should proceed in batches, starting with the largest families:

1. 156-template round family.
2. 112-template rectangular family.
3. 31-template rectangular family.
4. 10-template oval family.
5. 5-template secondary round family.
6. 4-template triangular family.

For each template, the reviewer should decide:

- Does the template name match the rendered design?
- Is all text readable at thumbnail size and at actual stamp size?
- Is the template meaningfully different from neighbouring templates?
- Does it provide a real user use-case rather than only a renamed generic layout?
- Should it remain active as-is (A), be redesigned/consolidated (B), or be removed/deactivated (C)?

## Product-count rule

Until the human audit is complete, **318 is a database record count, not a verified unique-template count**. Any customer-facing template count should ultimately be based on active A-quality templates (plus explicitly approved B templates after remediation), not raw rows.

## Data safety

This audit is read-only. No production template rows are modified, deleted or deactivated by Phase 2 without a separate reviewed remediation step.
