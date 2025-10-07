# Next Enhancement Plan: HeroUI + Anime.js

Comprehensive list of components and animations we can add to elevate the UX.

---

## 🎨 HeroUI Components We Can Add

### Currently Using (12 components):
✅ Card, CardBody, Button, Chip, Avatar, Badge, Modal, Tooltip, Progress, CircularProgress, Dropdown, Divider, Accordion

### Available to Add:

#### 1. **Skeleton** - Loading States
**Use Case**: Show loading placeholders while fetching questions
```tsx
<Skeleton className="rounded-lg">
  <div className="h-24 rounded-lg bg-default-300"></div>
</Skeleton>
```
**Where**:
- Question card while loading next question
- User stats in header
- "Why This Question" card

**Impact**: Professional loading experience (no blank screens)

---

#### 2. **Tabs** - Organize Content Views
**Use Case**: Switch between different study modes or views
```tsx
<Tabs aria-label="Study modes">
  <Tab key="practice" title="Practice">Practice Mode</Tab>
  <Tab key="test" title="Test">Test Mode</Tab>
  <Tab key="review" title="Review">Review Mode</Tab>
</Tabs>
```
**Where**:
- Study mode switcher (Practice/Test/Review)
- Analytics views (Performance/Progress/Insights)
- Dashboard sections

**Impact**: Cleaner navigation without leaving page

---

#### 3. **Select / Autocomplete** - Dropdown Selections
**Use Case**: Filter questions by topic, difficulty, or subject
```tsx
<Select
  label="Filter by Topic"
  placeholder="Select a topic"
>
  <SelectItem key="cardio">Cardiovascular</SelectItem>
  <SelectItem key="neuro">Neurology</SelectItem>
  <SelectItem key="pharm">Pharmacology</SelectItem>
</Select>
```
**Where**:
- Topic filter
- Difficulty selector
- Subject selector
- Sort options

**Impact**: Better content organization and discoverability

---

#### 4. **Input** - Search & Text Entry
**Use Case**: Search questions, notes, or topics
```tsx
<Input
  type="search"
  placeholder="Search questions..."
  startContent={<SearchIcon />}
/>
```
**Where**:
- Global search
- Question bank search
- Notes search

**Impact**: Fast content discovery

---

#### 5. **Switch** - Toggle Settings
**Use Case**: Toggle study preferences
```tsx
<Switch defaultSelected>Show explanations</Switch>
<Switch>Enable keyboard shortcuts</Switch>
<Switch>Auto-advance questions</Switch>
```
**Where**:
- Study settings
- Preferences panel
- Quick toggles in header dropdown

**Impact**: Easy preference management (better than custom toggle)

---

#### 6. **Slider** - Adjust Values
**Use Case**: Confidence rating, difficulty preference
```tsx
<Slider
  label="Confidence Level"
  step={1}
  maxValue={5}
  minValue={1}
  defaultValue={3}
  marks={[
    { value: 1, label: "Guess" },
    { value: 3, label: "Uncertain" },
    { value: 5, label: "Certain" }
  ]}
/>
```
**Where**:
- Replace star-based confidence with slider
- Difficulty preference slider
- Time limit adjuster

**Impact**: More precise input with visual feedback

---

#### 7. **Radio Group** - Single Choice Selection
**Use Case**: Study mode selection, answer format
```tsx
<RadioGroup label="Study Mode">
  <Radio value="timed">Timed Mode</Radio>
  <Radio value="tutor">Tutor Mode</Radio>
  <Radio value="exam">Exam Simulation</Radio>
</RadioGroup>
```
**Where**:
- Study mode selector
- Settings preferences
- Quiz type selection

**Impact**: Clear single-choice options

---

#### 8. **Checkbox / Checkbox Group** - Multi-Select
**Use Case**: Select multiple topics to study
```tsx
<CheckboxGroup label="Topics to Study">
  <Checkbox value="cardio">Cardiovascular</Checkbox>
  <Checkbox value="resp">Respiratory</Checkbox>
  <Checkbox value="neuro">Neurology</Checkbox>
</CheckboxGroup>
```
**Where**:
- Multi-topic selection
- Filter preferences
- Study preferences

**Impact**: Flexible multi-selection

---

#### 9. **Breadcrumbs** - Navigation Trail
**Use Case**: Show current location in study flow
```tsx
<Breadcrumbs>
  <BreadcrumbItem>Home</BreadcrumbItem>
  <BreadcrumbItem>Study</BreadcrumbItem>
  <BreadcrumbItem>Cardiovascular</BreadcrumbItem>
</Breadcrumbs>
```
**Where**:
- Top of study page
- Above question card
- Dashboard navigation

**Impact**: Better orientation and quick navigation

---

#### 10. **Pagination** - Navigate Pages
**Use Case**: Browse question sets or results
```tsx
<Pagination
  total={10}
  initialPage={1}
  showControls
/>
```
**Where**:
- Question bank browser
- Analytics history
- Search results

**Impact**: Easy navigation through large sets

---

#### 11. **Table** - Data Display
**Use Case**: Show detailed analytics, question history
```tsx
<Table aria-label="Study history">
  <TableHeader>
    <Column>Date</Column>
    <Column>Questions</Column>
    <Column>Score</Column>
  </TableHeader>
  <TableBody>
    {/* rows */}
  </TableBody>
</Table>
```
**Where**:
- Study history
- Performance breakdown
- Question bank list

**Impact**: Professional data presentation

---

#### 12. **Popover** - Contextual Info
**Use Case**: Quick definition lookup, hints
```tsx
<Popover placement="top">
  <PopoverTrigger>
    <Button size="sm" variant="light">?</Button>
  </PopoverTrigger>
  <PopoverContent>
    <div className="px-1 py-2">
      <div className="text-small font-bold">Hint</div>
      <div className="text-tiny">Remember ACE inhibitors...</div>
    </div>
  </PopoverContent>
</Popover>
```
**Where**:
- Medical term definitions
- Quick hints (not full evidence)
- Icon explanations

**Impact**: Contextual help without leaving page

---

#### 13. **Navbar** - Navigation Bar
**Use Case**: Replace custom header with HeroUI Navbar
```tsx
<Navbar>
  <NavbarBrand>Studyin</NavbarBrand>
  <NavbarContent>
    <NavbarItem><Link>Study</Link></NavbarItem>
    <NavbarItem><Link>Upload</Link></NavbarItem>
    <NavbarItem><Link>Analytics</Link></NavbarItem>
  </NavbarContent>
  <NavbarContent justify="end">
    <NavbarItem>{/* User dropdown */}</NavbarItem>
  </NavbarContent>
</Navbar>
```
**Where**:
- Replace custom AppHeader
- Responsive mobile menu built-in

**Impact**: Professional navbar with built-in mobile support

---

#### 14. **Snippet** - Code Display
**Use Case**: Show keyboard shortcuts, formulas
```tsx
<Snippet symbol="" hideSymbol>
  Cmd + K
</Snippet>
```
**Where**:
- Keyboard shortcuts overlay
- Mathematical formulas
- Study tips

**Impact**: Clean inline code/shortcut display

---

#### 15. **Spacer** - Layout Helper
**Use Case**: Add flexible spacing between elements
```tsx
<div className="flex">
  <div>Left content</div>
  <Spacer />
  <div>Right content</div>
</div>
```
**Where**:
- Header spacing
- Card layouts
- Responsive designs

**Impact**: Cleaner flex layouts

---

#### 16. **Link** - Styled Links
**Use Case**: Navigation links with consistent styling
```tsx
<Link href="/dashboard" color="primary">
  View Dashboard →
</Link>
```
**Where**:
- Navigation
- Cross-references
- External resources

**Impact**: Consistent link styling

---

#### 17. **Image** - Optimized Images
**Use Case**: Display medical diagrams, charts
```tsx
<Image
  src="/anatomy-diagram.png"
  alt="Heart anatomy"
  width={400}
  height={300}
/>
```
**Where**:
- Question images
- Evidence panel diagrams
- Educational content

**Impact**: Proper image handling with lazy loading

---

#### 18. **Listbox** - Scrollable Lists
**Use Case**: Topic list, question queue
```tsx
<Listbox aria-label="Topics">
  <ListboxItem key="1">Cardiovascular</ListboxItem>
  <ListboxItem key="2">Neurology</ListboxItem>
  <ListboxItem key="3">Pharmacology</ListboxItem>
</Listbox>
```
**Where**:
- Topic browser
- Question queue
- Study playlist

**Impact**: Organized scrollable lists

---

#### 19. **User** - User Profile Component
**Use Case**: Enhanced user display with details
```tsx
<User
  name="John Doe"
  description="Level 7 · 2,450 XP"
  avatarProps={{
    src: "/avatar.jpg"
  }}
/>
```
**Where**:
- Dropdown menu header
- Profile page
- Leaderboard

**Impact**: Richer user representation

---

#### 20. **ScrollShadow** - Scroll Indicators
**Use Case**: Show scroll shadows on long content
```tsx
<ScrollShadow className="max-h-[400px]">
  {/* Long content */}
</ScrollShadow>
```
**Where**:
- Modal bodies
- Long question lists
- Evidence panel

**Impact**: Visual cue for scrollable content

---

## 🎭 Anime.js Animations We Can Add

### Currently Using (3 animations):
✅ Progress bar width transition, Answer choice scale, Feedback panel reveal

### Available to Add:

#### 1. **Stagger Animations** ⭐ (High Impact)
**Use Case**: Animate answer choices appearing one by one
```tsx
anime({
  targets: '.answer-choice',
  translateY: [40, 0],
  opacity: [0, 1],
  delay: anime.stagger(100), // 100ms between each
  duration: 600,
  easing: 'easeOutExpo'
});
```
**Where**:
- Answer choices appearing when question loads
- Accordion items expanding
- List items in dropdown

**Impact**: Feels polished and sequential, not jarring

---

#### 2. **Timeline Sequences** ⭐ (High Impact)
**Use Case**: Choreograph multi-step animations
```tsx
const timeline = anime.timeline({
  easing: 'easeOutExpo',
  duration: 750
});

timeline
  .add({ targets: '.question', opacity: [0, 1] })
  .add({ targets: '.answers', translateY: [20, 0] }, '-=400')
  .add({ targets: '.submit-btn', scale: [0, 1] }, '-=200');
```
**Where**:
- Question transition sequence
- Feedback reveal choreography
- Modal open/close sequences

**Impact**: Smooth, professional multi-element animations

---

#### 3. **Keyframe Animations**
**Use Case**: Complex motion paths
```tsx
anime({
  targets: '.confetti',
  keyframes: [
    { translateY: -200, opacity: 1 },
    { translateY: 0, opacity: 0.8 },
    { translateY: 100, opacity: 0 }
  ],
  duration: 2000,
  easing: 'easeInQuad'
});
```
**Where**:
- Celebration effects on correct answers
- XP gain particles
- Achievement unlocks

**Impact**: Rich, game-like celebrations

---

#### 4. **SVG Path Morphing**
**Use Case**: Morph icons on state change
```tsx
anime({
  targets: '#check-icon path',
  d: [
    { value: 'M...' }, // X shape
    { value: 'M...' }  // Checkmark shape
  ],
  duration: 800,
  easing: 'easeInOutQuad'
});
```
**Where**:
- Correct/incorrect icon transitions
- Loading spinner to checkmark
- Menu icon to X icon

**Impact**: Smooth icon transitions

---

#### 5. **Spring Physics** ⭐ (High Impact)
**Use Case**: Natural bounce on interactions
```tsx
anime({
  targets: '.level-badge',
  scale: [1, 1.2, 1],
  duration: 600,
  easing: 'spring(1, 80, 10, 0)'
});
```
**Where**:
- Badge animations on level up
- Button press feedback
- Card interactions

**Impact**: Feels tactile and responsive

---

#### 6. **Color Transitions**
**Use Case**: Smooth theme changes
```tsx
anime({
  targets: 'body',
  backgroundColor: ['#F8FAFC', '#0F172A'],
  duration: 500,
  easing: 'easeInOutQuad'
});
```
**Where**:
- Dark mode toggle
- Correct/incorrect answer background
- Focus state transitions

**Impact**: Smooth color changes, not jarring

---

#### 7. **Text Animation** (Split Text)
**Use Case**: Animate text character by character
```tsx
// First split text into spans
const textWrapper = document.querySelector('.question-text');
textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");

anime({
  targets: '.letter',
  opacity: [0, 1],
  translateY: [20, 0],
  delay: anime.stagger(20),
  duration: 400
});
```
**Where**:
- Question text reveal
- Achievement text
- Level up messages

**Impact**: Dramatic text reveals

---

#### 8. **Rotation & Flip Animations**
**Use Case**: Card flip effects
```tsx
anime({
  targets: '.flash-card',
  rotateY: '180deg',
  duration: 600,
  easing: 'easeInOutQuad'
});
```
**Where**:
- Flashcard mode
- Evidence panel reveal
- Answer reveal

**Impact**: 3D depth and interactivity

---

#### 9. **Scroll-Triggered Animations**
**Use Case**: Animate elements as they scroll into view
```tsx
anime({
  targets: '.stat-card',
  translateY: [100, 0],
  opacity: [0, 1],
  duration: 800,
  easing: 'easeOutExpo',
  autoplay: false // Trigger on scroll
});
```
**Where**:
- Dashboard cards appearing
- Analytics charts loading
- Long lesson content

**Impact**: Dynamic, engaging scrolling experience

---

#### 10. **Progress Counter Animation**
**Use Case**: Animate numbers counting up
```tsx
const obj = { value: 0 };
anime({
  targets: obj,
  value: 2450, // Target XP
  round: 1,
  duration: 1500,
  easing: 'easeOutExpo',
  update: () => {
    document.querySelector('.xp-value').innerHTML = obj.value;
  }
});
```
**Where**:
- XP gains
- Stat counters
- Score reveals

**Impact**: Satisfying number increments

---

#### 11. **Elastic Easing** ⭐ (High Impact)
**Use Case**: Bouncy, playful animations
```tsx
anime({
  targets: '.achievement-badge',
  scale: [0, 1],
  duration: 1200,
  easing: 'easeOutElastic(1, .6)'
});
```
**Where**:
- Achievement popups
- New level badges
- Reward animations

**Impact**: Fun, game-like feel

---

#### 12. **Opacity Fade Sequences**
**Use Case**: Cross-fade between elements
```tsx
anime
  .timeline()
  .add({ targets: '.old-question', opacity: 0, duration: 300 })
  .add({ targets: '.new-question', opacity: [0, 1], duration: 300 });
```
**Where**:
- Question transitions
- Modal switches
- Panel replacements

**Impact**: Smooth content swapping

---

## 🎯 Recommended Additions (Priority Order)

### High Priority (Immediate Impact):

1. **Skeleton** - Professional loading states
2. **Stagger Animations** - Answer choices appearing
3. **Timeline Animations** - Question transition choreography
4. **Spring Physics** - Button/badge interactions
5. **Tabs** - Study mode switcher
6. **Navbar** - Replace custom header with HeroUI Navbar

### Medium Priority (Nice to Have):

7. **Select** - Topic/difficulty filters
8. **Switch** - Settings toggles
9. **Slider** - Confidence rating
10. **Keyframe Animations** - Celebration effects
11. **Popover** - Quick hints/definitions
12. **Color Transitions** - Smooth dark mode

### Low Priority (Future Enhancements):

13. **Table** - Analytics data
14. **Pagination** - Question bank
15. **Input** - Search functionality
16. **SVG Morphing** - Icon transitions
17. **Scroll Triggers** - Dashboard animations
18. **Text Animation** - Dramatic reveals

---

## 💡 Implementation Strategy

### Phase 1: Core UX (Next Session)
- Add Skeleton loading states
- Implement stagger animations for answer choices
- Add timeline animation for question transitions
- Replace header with HeroUI Navbar

### Phase 2: Interactivity
- Add Tabs for study modes
- Implement Slider for confidence
- Add Switch components for settings
- Spring physics on buttons

### Phase 3: Polish
- Celebration animations with keyframes
- Color transition for dark mode
- Popover for hints
- ScrollShadow for long content

### Phase 4: Advanced
- Table for analytics
- Search with Input
- SVG morphing
- Scroll-triggered animations

---

## 📦 Bundle Size Impact

**HeroUI Components**: ~2-3KB per component (tree-shakeable)
**Anime.js**: 9KB total (already included)

Adding all recommended components: ~30KB gzipped
Total impact: Minimal for massive UX improvement

---

## 🚀 Next Steps

1. Choose which components/animations to add first
2. Implement in `/nova` as proof of concept
3. Extract to `/components/ui/` for reusability
4. Integrate into production `/study` page
5. Document usage patterns

**Ready to start?** Pick a component or animation to implement!
