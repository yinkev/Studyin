# Schemas Reference (Zod)

Canonical schemas live in `scripts/lib/schema.mjs` and are re‑exported from `lib/core/schemas.ts` for app usage.

## Item

```
{
  schema_version: string,            // semver
  id: string,
  stem: string,
  choices: { A,B,C,D,E: string },
  key: 'A'|'B'|'C'|'D'|'E',
  rationale_correct: string,
  rationale_distractors: { A..E: string },
  los: string[],                     // ≥1 LO ids
  difficulty: 'easy'|'medium'|'hard',
  bloom: 'remember'|'understand'|'apply'|'analyze'|'evaluate',
  evidence: EvidenceRef,
  tags?: string[],
  status: 'draft'|'review'|'published',
  rubric_score?: number (0..3),
  created_at?: ISO8601,
  updated_at?: ISO8601,
  source_sha256?: string,
  evidence_sha256?: string,
  author_ids?: string[],
  reviewer_ids?: string[]
}
```

## EvidenceRef

```
{
  file: string,
  page: number,
  figure?: string,
  bbox?: [x0,y0,x1,y1],
  cropPath?: string,
  citation?: string,
  source_url?: string,
  dpi?: number,
  rotation?: 0|90|180|270
}
```

## Blueprint

```
{ schema_version: string, id: string, weights: Record<string, number> }
```

## AttemptEvent (telemetry)

```
{
  schema_version: string,
  app_version: string,
  session_id: string,
  user_id: string,
  item_id: string,
  lo_ids: string[],
  ts_start: number,
  ts_submit: number,
  duration_ms: number,
  mode: 'learn'|'exam'|'drill'|'spotter',
  choice: 'A'|'B'|'C'|'D'|'E',
  correct: boolean,
  confidence?: 1|2|3,
  opened_evidence: boolean,
  flagged?: boolean,
  rationale_opened?: boolean,
  keyboard_only?: boolean,
  device_class?: 'mobile'|'tablet'|'desktop',
  net_state?: 'online'|'offline',
  paused_ms?: number,
  hint_used?: boolean,
  engine?: EngineMetadata
}
```

## EngineMetadata (signals)

```
{
  selector?: { info?, blueprint_multiplier?, exposure_multiplier?, fatigue_scalar?, theta_hat?, se?, mastery_probability?, reason? },
  scheduler?: { sample?, score?, blueprint_multiplier?, urgency?, reason? },
  retention?: { minutes?, fraction?, max_days_overdue?, reason? },
  notes?: string
}
```

Refer to `scripts/lib/schema.mjs` for authoritative definitions.

