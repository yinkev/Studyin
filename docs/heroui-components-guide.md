# HeroUI Components for Studyin

## High Priority - Should Use

### 1. **Modal**
- **Use for:** Answer explanations, study settings, confirmation dialogs
- **Example:** Show detailed explanation after submitting answer
```tsx
<Modal isOpen={showExplanation}>
  <ModalContent>
    <ModalHeader>Why B is correct</ModalHeader>
    <ModalBody>ACE inhibitors work by...</ModalBody>
  </ModalContent>
</Modal>
```

### 2. **Tooltip**
- **Use for:** Stat explanations, icon hints, badge info
- **Example:** Explain what "θ̂=0.67" means in "Why This Next"
```tsx
<Tooltip content="Your estimated ability level">
  <span>θ̂=0.67</span>
</Tooltip>
```

### 3. **Dropdown**
- **Use for:** User menu, topic filter, settings menu
- **Example:** User profile dropdown in header
```tsx
<Dropdown>
  <DropdownTrigger><Avatar /></DropdownTrigger>
  <DropdownMenu>
    <DropdownItem>Profile</DropdownItem>
    <DropdownItem>Settings</DropdownItem>
  </DropdownMenu>
</Dropdown>
```

### 4. **Switch**
- **Use for:** Dark mode toggle, notification settings, auto-advance
- **Example:** Settings panel
```tsx
<Switch checked={darkMode} onChange={setDarkMode}>
  Dark Mode
</Switch>
```

### 5. **Tabs**
- **Use for:** Study modes, analytics views, dashboard sections
- **Example:** Switch between "Study", "Review", "Practice Test"
```tsx
<Tabs>
  <Tab key="study" title="Study" />
  <Tab key="review" title="Review" />
  <Tab key="test" title="Practice Test" />
</Tabs>
```

### 6. **Skeleton**
- **Use for:** Loading states while fetching questions
- **Example:** Loading placeholder before question loads
```tsx
<Card>
  <Skeleton className="h-8 w-3/4 mb-4" />
  <Skeleton className="h-12 w-full mb-2" />
  <Skeleton className="h-12 w-full" />
</Card>
```

### 7. **Badge**
- **Use for:** Notifications, streak counter, achievement badges
- **Example:** Notification badge on avatar
```tsx
<Badge content="3" color="danger">
  <Avatar />
</Badge>
```

### 8. **Accordion**
- **Use for:** FAQ, study notes, collapsible explanations
- **Example:** Expandable answer explanations
```tsx
<Accordion>
  <AccordionItem title="Why is this the correct answer?">
    Detailed explanation...
  </AccordionItem>
</Accordion>
```

## Medium Priority - Nice to Have

### 9. **Popover**
- **Use for:** Quick info popups, inline definitions
- **Example:** Medical term definitions
```tsx
<Popover>
  <PopoverTrigger>ACE Inhibitor</PopoverTrigger>
  <PopoverContent>
    Angiotensin-Converting Enzyme Inhibitor...
  </PopoverContent>
</Popover>
```

### 10. **Listbox**
- **Use for:** Topic selection, question bank browsing
- **Example:** Select which topics to study
```tsx
<Listbox
  selectionMode="multiple"
  selectedKeys={selectedTopics}
>
  <ListboxItem key="ace">ACE Inhibitors</ListboxItem>
  <ListboxItem key="beta">Beta Blockers</ListboxItem>
</Listbox>
```

### 11. **Select**
- **Use for:** Dropdown selections, filtering
- **Example:** Filter by difficulty
```tsx
<Select label="Difficulty">
  <SelectItem key="easy">Easy</SelectItem>
  <SelectItem key="medium">Medium</SelectItem>
  <SelectItem key="hard">Hard</SelectItem>
</Select>
```

### 12. **Radio Group**
- **Use for:** Study mode selection, settings
- **Example:** Choose study algorithm
```tsx
<RadioGroup value={algorithm}>
  <Radio value="irt">Adaptive (IRT)</Radio>
  <Radio value="random">Random</Radio>
  <Radio value="spaced">Spaced Repetition</Radio>
</RadioGroup>
```

### 13. **Slider**
- **Use for:** Confidence rating (alternative to stars), time limits
- **Example:** Set daily goal
```tsx
<Slider
  label="Daily Question Goal"
  minValue={10}
  maxValue={100}
  value={dailyGoal}
/>
```

### 14. **Breadcrumbs**
- **Use for:** Navigation trail (Dashboard > Study > Topic)
- **Example:** Show current location
```tsx
<Breadcrumbs>
  <BreadcrumbItem>Dashboard</BreadcrumbItem>
  <BreadcrumbItem>Study</BreadcrumbItem>
  <BreadcrumbItem>Pharmacology</BreadcrumbItem>
</Breadcrumbs>
```

### 15. **Table**
- **Use for:** Performance history, question bank management
- **Example:** Review past sessions
```tsx
<Table>
  <TableHeader>
    <TableColumn>Date</TableColumn>
    <TableColumn>Questions</TableColumn>
    <TableColumn>Accuracy</TableColumn>
  </TableHeader>
  <TableBody>...</TableBody>
</Table>
```

## Low Priority - Consider Later

### 16. **Pagination**
- **Use for:** Browse question banks, review history
- **Example:** Navigate through large question sets

### 17. **Input / Textarea**
- **Use for:** Free-response questions, note-taking
- **Example:** Written answer questions

### 18. **Checkbox Group**
- **Use for:** Multi-select filters, preferences
- **Example:** Select multiple topics

### 19. **Spinner**
- **Use for:** Loading indicators
- **Example:** While submitting answer

### 20. **Divider**
- **Use for:** Visual separation
- **Example:** Between question sections

## Recommended Implementation Order

1. **Modal** - Add answer explanations immediately after submit
2. **Tooltip** - Add to stats badges for clarity
3. **Switch** - Add dark mode toggle to header
4. **Dropdown** - Add user menu in header
5. **Badge** - Add notification/streak badges
6. **Skeleton** - Add loading states
7. **Tabs** - Add multiple study modes
8. **Accordion** - Add expandable content sections

## Components Currently Using
- ✅ Card
- ✅ Button
- ✅ Chip
- ✅ Avatar
- ✅ Progress

## Quick Wins for Next Session
1. Add **Modal** for answer explanations
2. Add **Tooltip** to "Why This Next" stats
3. Add **Switch** for dark mode toggle in header
4. Add **Dropdown** for user menu
