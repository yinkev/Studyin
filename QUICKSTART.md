# 🚀 Studyin Quick Start Guide

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🎮 YOUR PLATFORM IS LIVE AND READY! 🎮                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Status:  ✅ All tests passing (50/50 unit + 9/9 E2E)                       ║
║  Content: ✅ Medical anatomy (upper/lower limb) ready                        ║
║  Server:  ✅ Running at http://localhost:3005                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## ⚡ 30-Second Start

```bash
# Already running! Just open:
open http://localhost:3005

# If you need to restart:
npm run dev
```

## 🎯 Available Routes

### 1. 🏠 Home (`/`)
- Landing page with clinical clarity design
- Professional healthcare gradient
- Direct CTAs to start studying

### 2. 📚 Study (`/study`)
**This is where the magic happens!**

- Adaptive question selection using Thompson Sampling
- Evidence-based medical MCQs (upper/lower limb anatomy)
- Instant feedback with detailed rationales
- Real-time mastery tracking

**Your first session will:**
- Select questions to maximize learning efficiency
- Update your θ (ability) estimates using Rasch IRT
- Track mastery probability for each Learning Objective
- Save progress automatically to `data/state/local-dev.json`

### 3. 📊 Dashboard (`/dashboard`)
- View your ability estimates (θ̂) per Learning Objective
- See mastery levels (Novice → Competent → Expert → Master)
- Track SE (standard error) - lower is better!
- Session history and streaks

### 4. 📈 Summary (`/summary`)
- Analytics on your performance
- Blueprint compliance metrics
- XP and achievement tracking
- Progress visualization

### 5. 📤 Upload (`/upload`)
**Note:** Currently requires `NEXT_PUBLIC_DEV_UPLOAD=1` in `.env.local`

- Drag & drop PDF/PPT/DOCX/Markdown
- AI-powered OCR (Gemini) → MCQ generation (Codex)
- Job queue with real-time progress
- Adds new content to your study banks

## 📁 Your Content

### Available Banks:
- **upper-limb-oms1**: 24 questions on radial/median/ulnar nerves, brachial plexus, etc.
- **lower-limb-oms1**: Lower extremity anatomy questions

### Question Quality:
```json
{
  "stem": "Clinical scenario...",
  "choices": { "A": "...", "B": "...", ... },
  "key": "C",
  "rationale_correct": "Why this is right",
  "rationale_distractors": { "A": "Why wrong", ... },
  "evidence": {
    "file": "PDF source",
    "page": 1,
    "citation": "Selski D. Lecture Notes..."
  },
  "los": ["UL.Nerves.Radial"],
  "bloom": "understand"
}
```

## 🎮 How the Adaptive Engine Works

### Your Learning Journey:

```
Session Start
    │
    ▼
┌────────────────────────────────┐
│ 1. Thompson Sampling Selection │
│    (Multi-armed bandit)        │
│    Optimizes ΔSE/min           │
└──────────┬─────────────────────┘
           ▼
┌────────────────────────────────┐
│ 2. You Answer Question         │
│    See evidence-based feedback │
└──────────┬─────────────────────┘
           ▼
┌────────────────────────────────┐
│ 3. Rasch IRT Update (EAP)      │
│    θ̂ ← your ability            │
│    SE ← uncertainty            │
└──────────┬─────────────────────┘
           ▼
┌────────────────────────────────┐
│ 4. Mastery Check               │
│    If θ̂ ≥ 0.0 & SE ≤ 0.20      │
│    & mastery_prob ≥ 0.85       │
│    → Move to RETENTION lane    │
└──────────┬─────────────────────┘
           ▼
      Next Question
```

### Lanes:
- **TRAINING**: New material, high uncertainty → Focus on reducing SE
- **RETENTION**: Mastered material → Spaced repetition (FSRS algorithm)

### Blueprint Compliance:
- Ensures ±5% content balance across Learning Objectives
- Multipliers boost under-represented topics
- Hard constraint: never >5% drift

## 🛠️ Useful Commands

```bash
# Run all tests
npm test                    # Unit tests (50 tests)
npm run test:e2e           # E2E tests (9 tests)

# Validate content against blueprint
SCOPE_DIRS=content/banks/upper-limb-oms1 npm run validate:items

# Check types
npx tsc --noEmit

# Analyze content coverage
npm run analyze
```

## 📊 Your Data Files

```
data/
├── state/
│   └── local-dev.json          # Your progress (θ̂, SE, attempts)
├── events.ndjson               # Telemetry (every attempt logged)
└── queue/
    └── jobs.json               # Upload job queue (if using /upload)
```

**Progress is automatically saved** after every answer!

## 🐛 If Something Breaks

### Server won't start?
```bash
# Kill existing process
lsof -ti:3005 | xargs kill -9

# Restart
npm run dev
```

### Content not loading?
```bash
# Check content exists
ls content/banks/upper-limb-oms1/*.json | wc -l

# Should show 24+ files
```

### State corrupted?
```bash
# Reset to fresh state (you'll lose progress!)
echo '{"learnerId":"local-dev","updatedAt":"'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'","los":{},"items":{},"retention":{}}' > data/state/local-dev.json
```

### Need help?
- Check console for errors (browser DevTools)
- Check server logs (terminal running `npm run dev`)
- All tests passing? Run `npm test && npm run test:e2e`

## 🎯 Tips for Best Experience

1. **Start with /study**: Jump right into answering questions
2. **Read rationales**: Evidence-based learning is key
3. **Check dashboard**: Watch your θ̂ increase as you learn
4. **Trust the algorithm**: It selects questions to maximize learning efficiency
5. **Study regularly**: Adaptive spacing works best with consistent sessions

## 🏆 Achievements to Unlock

```
First Blood       Answer your first question           +25 XP
Quick Learner     Complete 10 questions in one session +50 XP
Mastery Achieved  Master your first LO (θ̂≥0.0, SE≤0.20) +100 XP
Streak Master     7-day study streak                    +200 XP
Perfect Session   100% accuracy on 5+ questions         +150 XP
```

## 🔮 What's Next (While You Study)

We're improving the platform in parallel:

**This Week:**
- Fix 2 layer boundary violations (background work, won't affect you)
- Improve type coverage 87% → 95% (better IDE experience)
- Re-enable E2E snapshot tests (more robust testing)

**You don't need to wait** - start using it NOW and report any bugs you find!

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        🎮 READY TO LEVEL UP? 🎮                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  1. Open http://localhost:3005                                               ║
║  2. Click "Start Studying"                                                   ║
║  3. Answer questions and master medical anatomy!                             ║
║                                                                              ║
║  💎 Your first session starts at 0 XP - let's change that!                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Last Updated**: 2025-10-08
**Platform Status**: ✅ Production-ready for personal use
**Test Status**: ✅ All tests passing (50 unit + 9 E2E)
