# Advanced Analytics Integration Guide

Quick guide to integrate the new Phase 1 analytics into your app.

---

## Option 1: Add as New Navigation Tab (Recommended)

### Step 1: Update NavBar Types
**File:** `/frontend/src/components/NavBar.tsx`

```typescript
// Change line 6
export type View = 'dashboard' | 'upload' | 'chat' | 'analytics' | 'advanced-analytics';
```

### Step 2: Add Button to NavBar
**File:** `/frontend/src/components/NavBar.tsx`

```typescript
// Add after the 'analytics' button (around line 58)
<Button
  variant={currentView === 'advanced-analytics' ? 'default' : 'ghost'}
  onClick={() => onNavigate('advanced-analytics')}
  className="gap-2 text-sm"
>
  <BarChart3 className="size-4" aria-hidden="true" />
  <span className="hidden sm:inline">Advanced</span>
  <span className="sm:hidden">Adv</span>
</Button>
```

### Step 3: Add Lazy Import in App.tsx
**File:** `/frontend/src/App.tsx`

```typescript
// Add after line 9 (with other lazy imports)
const AdvancedAnalyticsView = lazy(() =>
  import('@/pages/AdvancedAnalyticsView').then(m => ({
    default: m.AdvancedAnalyticsView
  }))
);
```

### Step 4: Add Route in App.tsx
**File:** `/frontend/src/App.tsx`

```typescript
// Add after line 46 (in the Suspense block)
{currentView === 'advanced-analytics' && (
  <AdvancedAnalyticsView onNavigate={setCurrentView} />
)}
```

---

## Option 2: Link from Analytics Page

### Add Button to AnalyticsView
**File:** `/frontend/src/pages/AnalyticsView.tsx`

```typescript
// Add to Quick Actions section (around line 220)
<Button
  size="lg"
  variant="secondary"
  onClick={() => onNavigate('advanced-analytics')}
  className="shadow-soft-button"
>
  🔬 Advanced Analytics
</Button>
```

Then follow **Option 1: Steps 1, 3, and 4** above.

---

## Option 3: Modal/Dialog (No Navigation)

### Create Dialog Wrapper
**File:** Create `/frontend/src/components/analytics/AdvancedAnalyticsDialog.tsx`

```typescript
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QuestionMasteryRadar } from '@/components/analytics/QuestionMasteryRadar';
import { PerformanceWindowHeatmap } from '@/components/analytics/PerformanceWindowHeatmap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getQuestionMastery, getPerformanceWindows } from '@/lib/api/analytics';
import { useEffect } from 'react';

export function AdvancedAnalyticsDialog() {
  const [open, setOpen] = useState(false);
  const [masteryData, setMasteryData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    if (open) {
      getQuestionMastery().then(setMasteryData);
      getPerformanceWindows().then(setPerformanceData);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="secondary">
          🔬 Advanced Analytics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Analytics</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="mastery">
          <TabsList>
            <TabsTrigger value="mastery">Mastery</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="mastery">
            {masteryData && <QuestionMasteryRadar data={masteryData} />}
          </TabsContent>
          <TabsContent value="performance">
            {performanceData && <PerformanceWindowHeatmap data={performanceData} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Complete Example: Full Integration

Here's a complete diff for Option 1:

### NavBar.tsx
```diff
- export type View = 'dashboard' | 'upload' | 'chat' | 'analytics';
+ export type View = 'dashboard' | 'upload' | 'chat' | 'analytics' | 'advanced-analytics';

            <Button
              variant={currentView === 'analytics' ? 'default' : 'ghost'}
              onClick={() => onNavigate('analytics')}
              className="gap-2 text-sm"
            >
              <BarChart3 className="size-4" aria-hidden="true" />
              Analytics
            </Button>
+           <Button
+             variant={currentView === 'advanced-analytics' ? 'default' : 'ghost'}
+             onClick={() => onNavigate('advanced-analytics')}
+             className="gap-2 text-sm"
+           >
+             <BarChart3 className="size-4" aria-hidden="true" />
+             <span className="hidden sm:inline">Advanced</span>
+             <span className="sm:hidden">Adv</span>
+           </Button>
```

### App.tsx
```diff
  const UploadView = lazy(() => import('@/pages/UploadView').then(m => ({ default: m.UploadView })));
  const ChatView = lazy(() => import('@/pages/ChatView').then(m => ({ default: m.ChatView })));
  const AnalyticsView = lazy(() => import('@/pages/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
+ const AdvancedAnalyticsView = lazy(() => import('@/pages/AdvancedAnalyticsView').then(m => ({ default: m.AdvancedAnalyticsView })));

  // ...

          {currentView === 'dashboard' && <EnhancedDashboard onNavigate={setCurrentView} stats={gamificationStats} />}
          {currentView === 'analytics' && <AnalyticsView onNavigate={setCurrentView} />}
+         {currentView === 'advanced-analytics' && <AdvancedAnalyticsView onNavigate={setCurrentView} />}
          {currentView === 'upload' && <UploadView onNavigate={setCurrentView} />}
          {currentView === 'chat' && <ChatView {...chatSession} onNavigate={setCurrentView} />}
```

---

## Testing the Integration

### 1. Development Server
```bash
npm run dev
```

### 2. Navigate to Advanced Analytics
- Click the "Advanced" button in the navbar
- Or visit via button added to Analytics page

### 3. Verify Components Render
- **Mastery Tab:** Should show radar chart with 8 topic axes
- **Performance Tab:** Should show 7×24 heatmap

### 4. Test Error States
- Disconnect backend → See error messages
- Click retry → Should refetch data

### 5. Test Empty States
- Use account with no analytics data
- Should show encouraging empty state

---

## Backend Requirements

Ensure these Phase 1 endpoints are live:

```bash
# Question Mastery
curl http://localhost:8000/api/analytics/mastery/question-types \
  -H "Authorization: Bearer $TOKEN"

# Performance Windows
curl http://localhost:8000/api/analytics/performance/windows \
  -H "Authorization: Bearer $TOKEN"
```

Expected responses documented in `PHASE1_ANALYTICS_IMPLEMENTATION.md`.

---

## Troubleshooting

### Issue: "Cannot find module '@/pages/AdvancedAnalyticsView'"
**Solution:** Restart dev server (`npm run dev`)

### Issue: Charts not showing data
**Solution:** Open browser console, check for API errors

### Issue: TypeScript errors
**Solution:** Run `npm run build` to verify no type errors

### Issue: 404 on analytics endpoints
**Solution:** Backend Phase 1 not deployed yet

---

## Quick Start (TL;DR)

```bash
# 1. Copy the 3 code blocks from "Complete Example" above
# 2. Apply diffs to NavBar.tsx and App.tsx
# 3. Restart dev server
npm run dev
# 4. Navigate to "Advanced" tab in navbar
```

Done! 🎉

---

**Need help?** Check `PHASE1_ANALYTICS_IMPLEMENTATION.md` for full details.
