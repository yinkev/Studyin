# Content Authoring Guide

Create high‑quality MCQs and lessons that pass the validator and support adaptive learning.

## Authoring Checklist

- MCQ format: A–E choices
- Per‑choice rationales: one for correct, one per distractor
- Map to ≥1 Learning Objective (LO)
- Set difficulty (`easy|medium|hard`) and Bloom level
- Attach evidence `{file,page,(bbox|cropPath),citation}`
- Status: `draft` → `review` → `published`

## Folder Conventions

- Items live under `content/banks/<bank>/<item-id>.json`
- Evidence crops under `content/evidence/<bank>/<item-id>/<asset>`
- Prefer `cropPath` (AVIF/WebP + PNG fallback). Track with Git LFS when large.

## Item Schema (summary)

See full Zod schemas: docs/reference/schemas.md

Required fields:
- `id`, `stem`, `choices.{A..E}`, `key`
- `rationale_correct`, `rationale_distractors.{A..E}`
- `los: string[]`, `difficulty`, `bloom`
- `evidence: { file, page, bbox? | cropPath?, citation? }`
- `status: draft|review|published`

## Evidence Requirements

- Crop loads <250 ms on a mid‑range laptop
- One‑click open to source PDF
- Include `citation` and/or `source_url`
- Record natural width/height to avoid CLS

## Validate Locally

```
npm run validate:items
```

The validator enforces:
- ABCDE complete, per‑choice rationales present
- LOs present; difficulty and Bloom set
- Evidence references resolvable; crop path or bbox provided
- `schema_version` aligned

Tip: During early authoring you may relax crops with `REQUIRE_EVIDENCE_CROP=0 npm run validate:items`, but re‑enable before publishing.

## Publishing Criteria

- Validator clean
- Rubric ≥2.7 (published items)
- Evidence fidelity confirmed (<250 ms load)
- Blueprint alignment satisfied

## Analytics & Feedback

- Run analytics to inspect item stats: `npm run analyze`
- Review confusion edges and point‑biserial per item; iterate on distractors as needed.

