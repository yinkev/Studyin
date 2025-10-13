#!/bin/bash

# StudyIn Performance Optimization Script
# For personal use optimization

echo "🚀 Applying StudyIn Performance Optimizations..."

# Backup current files
echo "📦 Creating backups..."
cp src/App.tsx src/App.backup.tsx 2>/dev/null || true
cp vite.config.ts vite.config.backup.ts 2>/dev/null || true

# Check if optimized files exist
if [ ! -f "src/App.optimized.tsx" ]; then
    echo "❌ src/App.optimized.tsx not found"
    exit 1
fi

if [ ! -f "vite.config.optimized.ts" ]; then
    echo "❌ vite.config.optimized.ts not found"
    exit 1
fi

# Apply optimizations
echo "⚡ Applying optimized App component..."
cp src/App.optimized.tsx src/App.tsx

echo "⚡ Applying optimized Vite config..."
cp vite.config.optimized.ts vite.config.ts

echo "📊 Building to check bundle sizes..."
npm run build 2>&1 | grep -E "(dist|kB|assets)" | head -10

echo "✅ Optimizations applied!"
echo ""
echo "Next steps:"
echo "1. Restart dev server: npm run dev"
echo "2. Test the app - should feel snappier"
echo "3. Check DevTools Network tab for lazy loading"
echo ""
echo "To revert:"
echo "  cp src/App.backup.tsx src/App.tsx"
echo "  cp vite.config.backup.ts vite.config.ts"