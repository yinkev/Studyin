# API Routes Reference

All routes under `app/api/`.

## Study

### POST /api/study/submit
Submit an item response and get next item.

Body:
```
{
  "lessonId": "string",
  "itemId": "string",
  "response": "A" | "B" | "C" | "D",
  "timeSpent": 1234
}
```

Response:
```
{
  "correct": true,
  "theta": 0.42,
  "SE": 0.15,
  "mastery": 0.87,
  "nextItem": { "id": "...", "stem": "...", "options": [...] },
  "whyThisNext": "Optimizes ΔSE/min with blueprint compliance"
}
```

## Upload (Dev Only)

### POST /api/queue/enqueue
Enqueue a PDF for processing. Requires `NEXT_PUBLIC_DEV_UPLOAD=1`.

Body: FormData with `file` field

Response:
```
{
  "jobId": "uuid",
  "status": "queued"
}
```

### GET /api/queue/status/:jobId
Poll job status.

Response:
```
{
  "status": "processing" | "completed" | "failed",
  "lessonId": "uuid",
  "error": "string?"
}
```

## Lessons

### GET /api/lessons/:lessonId
Fetch lesson JSON.

Response:
```
{
  "id": "uuid",
  "title": "Cardiac Physiology",
  "items": [...],
  "metadata": { "bank": "...", "tags": [...] }
}
```

## Analytics (Internal)

Not exposed via HTTP. Use `scripts/analyze.mjs` CLI.

