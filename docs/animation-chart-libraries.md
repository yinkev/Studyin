# Animation & Chart Libraries Guide

## Animation Libraries

### 1. **Anime.js** ⭐ Recommended for UI
**What it does:** Lightweight JavaScript animation library for smooth UI animations
**Best for:** Button effects, card transitions, progress animations, entrance effects
**Size:** ~9KB (tiny!)

**Example Use Cases:**
- Animate answer selection (scale, slide)
- Progress bar filling animation
- Card entrance effects
- Streak counter increment
- XP gain animations

**Installation:**
```bash
npm install animejs
```

**Example:**
```tsx
import anime from 'animejs';

// Animate answer selection
anime({
  targets: '.answer-card',
  scale: [0.95, 1],
  duration: 300,
  easing: 'easeOutElastic(1, .5)'
});

// XP counter increment
anime({
  targets: { value: 0 },
  value: 2450,
  round: 1,
  duration: 1500,
  easing: 'easeOutExpo',
  update: (anim) => {
    document.querySelector('.xp').textContent = Math.round(anim.animations[0].currentValue);
  }
});
```

---

## Chart/Visualization Libraries

### 2. **ECharts (Apache)** ⭐⭐⭐ Best Overall
**What it does:** Powerful, interactive charts with amazing defaults
**Best for:** Performance analytics, mastery over time, topic breakdown, confusion matrix
**Size:** ~350KB (can tree-shake)
**Performance:** Excellent for large datasets

**Why Choose ECharts:**
- Beautiful out of the box
- Highly interactive (zoom, pan, tooltips)
- Great mobile support
- Massive chart variety
- Amazing documentation

**Installation:**
```bash
npm install echarts
```

**Example Use Cases:**
- **Line Chart:** Mastery over time, XP progression
- **Radar Chart:** Topic strengths (multi-dimensional)
- **Heatmap:** Study activity calendar
- **Sankey:** Learning path flow
- **Funnel:** Question difficulty progression
- **Bar Chart:** Questions by topic

**Example:**
```tsx
import * as echarts from 'echarts';

const chart = echarts.init(document.getElementById('chart'));
chart.setOption({
  title: { text: 'Mastery Over Time' },
  xAxis: { type: 'category', data: ['Week 1', 'Week 2', 'Week 3'] },
  yAxis: { type: 'value' },
  series: [{
    data: [45, 67, 82],
    type: 'line',
    smooth: true,
    areaStyle: {}
  }]
});
```

---

### 3. **D3.js** ⚠️ Powerful but Complex
**What it does:** Low-level data visualization library (full control)
**Best for:** Custom visualizations, force-directed graphs, complex networks
**Size:** ~250KB
**Learning Curve:** Steep

**When to Use D3:**
- Custom visualizations ECharts can't do
- Knowledge graph visualization
- Interactive concept maps
- Custom confusion matrix with animations

**When NOT to Use:**
- Standard charts (use ECharts instead)
- Simple bar/line charts
- Quick prototyping

**Installation:**
```bash
npm install d3
```

**Example Use Cases:**
- **Force-Directed Graph:** Topic relationships
- **Chord Diagram:** Question dependencies
- **Tree Map:** Topic hierarchy
- **Custom Interactive:** Drag-and-drop study planner

---

### 4. **Unovis** 🆕 Modern Alternative
**What it does:** Modern React-first visualization library
**Best for:** React components, TypeScript, modular charts
**Size:** ~150KB (modular)
**Learning Curve:** Easy

**Why Choose Unovis:**
- React components (not imperative)
- TypeScript first-class support
- Beautiful defaults
- Modular (import only what you need)
- Great for dashboards

**Installation:**
```bash
npm install @unovis/ts @unovis/react
```

**Example:**
```tsx
import { VisXYContainer, VisLine, VisAxis } from '@unovis/react';

<VisXYContainer data={data}>
  <VisLine x={d => d.week} y={d => d.mastery} />
  <VisAxis type="x" />
  <VisAxis type="y" />
</VisXYContainer>
```

**Example Use Cases:**
- Performance dashboard
- Real-time study metrics
- Multi-series comparisons
- Sparklines in cards

---

### 5. **Chart.js** (Simple Alternative)
**What it does:** Simple, easy charts with Canvas
**Best for:** Quick setup, basic needs
**Size:** ~170KB
**Learning Curve:** Easiest

**When to Use:**
- Just need basic bar/line/pie charts
- Want something quick
- Don't need advanced interactivity

**Installation:**
```bash
npm install chart.js react-chartjs-2
```

---

## Recommended Stack for Studyin

### Primary Choices:
1. **Anime.js** - All UI animations (buttons, cards, transitions)
2. **ECharts** - All analytics charts (dashboard, performance)

### When to Add D3:
- Custom knowledge graph visualization
- Complex interactive diagrams
- Topic relationship mapping

### When to Add Unovis:
- Prefer React components over imperative API
- Need TypeScript-first library
- Building component library

---

## Specific Recommendations for Studyin

### Dashboard Analytics:
```
ECharts:
- Mastery over time (line chart with gradient area)
- Questions per topic (horizontal bar)
- Study calendar heatmap
- Performance radar (multi-topic strength)
```

### Study Page Animations:
```
Anime.js:
- Answer card selection bounce
- Confidence stars pop-in
- Submit button pulse
- XP gain counter
- Streak flame flicker
- Confetti on correct answer
```

### Advanced Visualizations:
```
D3.js (if needed):
- Topic relationship force graph
- Custom confusion matrix with drill-down
- Interactive study path tree
```

---

## Installation Priority

**Phase 1 (Now):**
```bash
npm install animejs
```
Use for: Answer animations, card effects, transitions

**Phase 2 (Dashboard):**
```bash
npm install echarts
```
Use for: All charts in analytics/dashboard

**Phase 3 (Advanced):**
```bash
npm install d3
```
Use for: Custom visualizations only if needed

---

## Quick Comparison

| Library | Best For | Difficulty | Size | Interactive |
|---------|----------|------------|------|-------------|
| **Anime.js** | UI Animations | ⭐ Easy | 9KB | ⭐⭐⭐ |
| **ECharts** | Charts/Analytics | ⭐⭐ Medium | 350KB | ⭐⭐⭐ |
| **D3.js** | Custom Viz | ⭐⭐⭐ Hard | 250KB | ⭐⭐⭐ |
| **Unovis** | React Charts | ⭐⭐ Medium | 150KB | ⭐⭐⭐ |
| **Chart.js** | Basic Charts | ⭐ Easy | 170KB | ⭐⭐ |

---

## Next Steps

1. Install **Anime.js** first - add answer selection animations
2. Install **ECharts** when building dashboard charts
3. Consider **Unovis** if you prefer React components
4. Only add **D3** if you need truly custom visualizations

**My Recommendation: Anime.js + ECharts covers 95% of needs.**
