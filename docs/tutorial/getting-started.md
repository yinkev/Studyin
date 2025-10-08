# Getting Started with Studyin

**Time:** 15 minutes  
**Goal:** Install Studyin, upload your first document, complete a study session

## Prerequisites

- Node.js 20.14 or higher
- A PDF document (lecture notes, textbook chapter)

## Step 1: Installation

```
git clone <repo-url>
cd studyin
npm install
```

## Step 2: Start the Development Server

```
npm run dev
```

Visit http://localhost:3005

## Step 3: Enable Upload (Dev Mode)

Create `.env.local`:
```
NEXT_PUBLIC_DEV_UPLOAD=1
```

Restart the server.

## Step 4: Upload Your First Document

1. Click **Upload** in the navigation
2. Select a PDF file
3. Wait for processing (1-2 min)
4. Confirm the generated lesson

## Step 5: Start Studying

1. Navigate to **Study**
2. The AI Coach suggests the optimal next item
3. Answer questions
4. See real-time ability (θ) updates

## Next Steps

- Content Authoring Guide — ../guides/content-authoring.md
- Architecture Overview — ../architecture/overview.md
- Deployment Guide — ../guides/deployment.md

## Troubleshooting

**Port 3005 in use?**
```
lsof -ti:3005 | xargs kill
npm run dev
```

**Build fails?**
```
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

