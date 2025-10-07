# Follow The Money - Multi-Agent Mini-Game Design

Inspired by Mario Party's "Follow The Money" mini-game, orchestrated using Codex multi-agent workflow.

## 🎮 Game Concept

**Original Mario Party Game**: Players must follow a bag of money through a series of shell shuffles to identify which shell contains the money at the end.

**Our Learning Twist**: AI agents collaborate to create an educational memory/tracking game where students follow learning concepts through transformations.

## 🤖 Multi-Agent Architecture

### Agent Roles

#### 1. **Game Master** (Orchestrator)
- **Role**: Coordinates all agents and enforces gating logic
- **Responsibilities**:
  - Initialize game state
  - Validate agent outputs
  - Enforce sequential handoffs
  - Track game progression
  - Determine win/loss conditions

#### 2. **Sprite Artist** (Designer)
- **Role**: Generate chibi character sprites using nanobanana
- **Responsibilities**:
  - Create player characters (4 different chibis)
  - Design money bag sprites
  - Generate shell/container sprites
  - Export sprite sheets
- **Deliverable**: `sprites/chibi-characters.png`, `sprites/game-elements.png`

#### 3. **Game Designer** (Planner)
- **Role**: Define game mechanics and difficulty curves
- **Responsibilities**:
  - Define shuffle patterns
  - Set difficulty levels (Easy: 3 shuffles, Medium: 5, Hard: 8)
  - Create round structures
  - Design scoring system
- **Deliverable**: `GAME_MECHANICS.md`

#### 4. **Animation Engineer** (Frontend)
- **Role**: Implement shuffle animations and transitions
- **Responsibilities**:
  - Build smooth shuffle animations (Anime.js)
  - Handle sprite rendering
  - Implement selection interface
  - Add sound effects triggers
- **Deliverable**: React components in `components/games/follow-the-money/`

#### 5. **State Manager** (Backend)
- **Role**: Manage game state and logic
- **Responsibilities**:
  - Track which container has the "money"
  - Process shuffle sequences
  - Validate player selections
  - Calculate scores
  - Persist game results
- **Deliverable**: `lib/games/follow-the-money-engine.ts`

#### 6. **Quality Tester** (Validator)
- **Role**: Test game fairness and UX
- **Responsibilities**:
  - Verify shuffle randomness
  - Test all difficulty levels
  - Validate scoring accuracy
  - Check accessibility
  - Performance testing
- **Deliverable**: `TEST_REPORT.md`, Playwright tests

## 🎯 Game Mechanics

### Core Flow

1. **Setup Phase**
   - Show 3-5 containers (shells/cups/boxes)
   - Display "money bag" starting in center container
   - Player sees starting position clearly

2. **Shuffle Phase**
   - Containers shuffle positions N times (based on difficulty)
   - Smooth animations using Anime.js
   - Each shuffle swaps 2 adjacent containers
   - Speed increases with difficulty

3. **Selection Phase**
   - Shuffling stops
   - Player clicks/taps a container
   - Reveal animation shows if correct

4. **Reward Phase**
   - Correct: +XP, particle effects, success animation
   - Incorrect: Show correct container, learn moment
   - Progress to next round or end game

### Difficulty Levels

| Level | Containers | Shuffles | Speed | XP Reward |
|-------|-----------|----------|-------|-----------|
| Easy  | 3 | 3 | 1.0s/shuffle | 50 XP |
| Medium | 4 | 5 | 0.7s/shuffle | 100 XP |
| Hard | 5 | 8 | 0.5s/shuffle | 200 XP |
| Expert | 5 | 12 | 0.3s/shuffle | 500 XP |

### Learning Integration

**Educational Twist**: Instead of just tracking money, track learning concepts!

- **Container Labels**: Different learning objectives
- **Money Bag**: Current topic being studied
- **Shuffle = Concept Transformation**: Show how concepts relate
- **Goal**: Track how concepts transform through learning

Example:
```
Initial: [Anatomy] [Physiology] [Pathology]
         Money in "Anatomy"

After shuffle: Track how anatomical knowledge
               transforms through physiological understanding
```

## 🎨 Visual Design

### Chibi Characters (via nanobanana)

**4 Character Archetypes**:
1. **Medic Mario** - Red hat, stethoscope
2. **Scholar Luigi** - Green, glasses, notebook
3. **Professor Peach** - Pink, graduation cap
4. **Scientist Toad** - Lab coat, goggles

**Style**: Cute chibi proportions (2:1 head:body ratio)

### Game Elements

- **Containers**: 3D rendered shells/cups with glow effects
- **Money Bag**: Golden coin bag with sparkle
- **Background**: Gradient purple/blue medical theme
- **UI**: Clean, modern cards with glassmorphism

## 📁 File Structure

```
components/games/follow-the-money/
├── FollowTheMoneyGame.tsx          # Main game component
├── GameBoard.tsx                    # Container display
├── ContainerShell.tsx               # Individual shell
├── ShuffleAnimation.tsx             # Animation controller
├── SelectionInterface.tsx           # Click handling
├── ResultsDisplay.tsx               # Win/loss screen
└── ChibiCharacter.tsx              # Player avatar

lib/games/
├── follow-the-money-engine.ts      # Core game logic
├── shuffle-algorithm.ts            # Shuffle patterns
└── scoring-system.ts               # XP calculation

public/sprites/follow-the-money/
├── chibi-medic.png
├── chibi-scholar.png
├── chibi-professor.png
├── chibi-scientist.png
├── shell-closed.png
├── shell-open.png
├── money-bag.png
└── particles/

docs/follow-the-money/
├── GAME_MECHANICS.md              # Full rules
├── SPRITE_SPEC.md                 # Art requirements
├── AGENT_TASKS.md                 # Agent coordination
└── TEST_REPORT.md                 # QA results
```

## 🔄 Agent Orchestration Workflow

### Phase 1: Planning (Game Master → Game Designer)
```
Game Master creates: AGENT_TASKS.md
↓
Game Designer writes: GAME_MECHANICS.md
↓
Game Master validates mechanics
```

### Phase 2: Asset Creation (Game Master → Sprite Artist)
```
Game Master approves mechanics
↓
Sprite Artist generates: chibi sprites + game elements
↓
Game Master validates sprite quality
```

### Phase 3: Implementation (Parallel)
```
Game Master approves assets
↓
├─→ Animation Engineer: builds UI components
└─→ State Manager: implements game engine
↓
Game Master validates both outputs
```

### Phase 4: Testing (Game Master → Quality Tester)
```
Game Master integrates components
↓
Quality Tester: runs test suite
↓
Game Master validates test results
```

### Phase 5: Deployment
```
All gates passed
↓
Game Master: deploys to dashboard
```

## 🎓 Learning Outcomes

**Skills Practiced**:
- Visual tracking and attention
- Working memory
- Pattern recognition
- Decision making under pressure
- Spatial reasoning

**XP Integration**:
- Each correct guess: Base XP × difficulty multiplier
- Perfect round bonus: 2x XP
- Streak bonuses: +10% per consecutive correct

**Achievement Unlocks**:
- "Money Master" - 10 perfect rounds
- "Shell Shocked" - Complete Expert mode
- "Quick Tracker" - Beat Hard in under 30s
- "Perfect Vision" - 20 correct guesses in a row

## 🛠️ Technical Requirements

**Dependencies**:
- Anime.js (already installed) - Shuffle animations
- Framer Motion - Reveal animations
- Howler.js (optional) - Sound effects
- Canvas API - Sprite rendering

**Performance Targets**:
- 60 FPS animations
- < 100ms click response
- < 2MB total sprite size
- Mobile responsive

## 🚀 Implementation Plan

1. **Day 1**: Setup multi-agent config, sprite generation
2. **Day 2**: Core game engine + basic UI
3. **Day 3**: Animations + polish
4. **Day 4**: Testing + integration with dashboard
5. **Day 5**: Launch + monitor engagement

---

**Status**: Ready for agent orchestration
**Next**: Configure Codex agents and start Phase 1
