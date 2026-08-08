# Template Curation Batch 1

Date: 2026-08-08

## Purpose

This is the first concrete remediation batch after the template quality audit showed that 318 active records collapse into only six structural layout families.

Batch 1 deliberately targets a small, high-visibility subset of the `Approval` category so the new design language can be visually reviewed before any database rows are changed.

## Scope

Eight existing template slugs are curated in code:

- `status-approved-1`
- `status-rejected-1`
- `status-verified-1`
- `status-completed-1`
- `status-pending-1`
- `status-quality-1`
- `status-under-review`
- `status-expired-1`

The branch uses a temporary read-time override in the Template Library so Vercel Preview can show the proposed designs against the real catalogue without modifying Neon.

## Design objective

The old approval family used essentially the same two-ring round seal for nearly every status. Batch 1 intentionally introduces multiple genuine layout archetypes:

- round authorization badge
- framed rectangular status stamp
- single-frame rectangular status stamp
- oval verification seal
- triangular pending/review marker

The goal is not random variety. Shape, hierarchy, colour and wording should reinforce the meaning of each status while remaining editable through the normal Stampelo editor.

## Safety

- No production database rows are changed by this branch.
- Existing slugs, names, categories and search metadata remain unchanged.
- Clicking a curated preview loads the same curated state into the editor.
- All curated states use the canonical editor schema (`center-text`, `text-on-path`, `lineBreak`, explicit `heightMm`).
- Automated tests require all eight states to render successfully and require real structural diversity.

## Review gate

Do not apply these states to Neon until the Vercel Preview has been visually checked for:

1. readable text at thumbnail size;
2. no clipping or element/frame collisions;
3. correct aspect ratios for rectangular and oval stamps;
4. clear visual distinction between statuses;
5. acceptable appearance after clicking a template into the editor.

After approval, add a dry-run/apply database curation command and persist only the reviewed states. Then remove the temporary read-time override or retain it only as a canonical source-of-truth layer if explicitly documented.
