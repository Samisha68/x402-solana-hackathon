# x402 Answers Demo Script (with Gamification)

60-second walkthrough of the RAG Knowledge Hub with Solana-themed gamification.

## Prerequisites

1. Backend server running on `http://localhost:4021`
2. Frontend running on `http://localhost:3000`
3. Browser open to the homepage

## Demo Steps

### Step 1: View the Interface (5 seconds)

- **What you see:** Clean homepage with "x402 Answers" heading
- **What you see:** Daily Quest card at the top with today's question
- **What you see:** Textarea pre-filled with "How do I fix a discriminator mismatch?"
- **What you see:** "Ask Question" button
- **What you see:** Quest Panel on the right showing XP, rank, badges, and topic progress

**Say:** "This is x402 Answers, a RAG Knowledge Hub for Solana developers with gamification. Users earn XP, unlock badges, and track progress across topics. Notice the Daily Quest card and the progress panel on the right."

### Step 2: Daily Quest (5 seconds)

- **Action:** Point to Daily Quest card
- **What you see:** Today's question displayed with topic badge
- **Action:** Click "Practice this" button
- **What you see:** Question auto-fills the textarea
- **Action:** Click "Mark done (+5 XP)" button
- **What you see:** Button changes to "Done" (disabled for today)
- **What you see:** Toast notification: "Progress updated: +5 XP"

**Say:** "Each day, users get a daily quest. They can practice it or mark it done for 5 XP. This builds a daily learning habit."

### Step 3: Ask a Question (10 seconds)

- **Action:** Click "Ask Question" (or press Cmd/Ctrl + Enter)
- **What you see:** Loading spinner with "Searching knowledge base..."
- **What you see:** Preview appears with lock icon
- **What you see:** Preview text: "A discriminator mismatch occurs when Anchor's account discriminator doesn't match the expected value."
- **What you see:** "Pay 1¢ to Unlock Full Answer" button
- **What you see:** "See examples" link below textarea

**Say:** "The server returns a 402 Payment Required response with a preview - just the first sentence. Users can also browse examples to discover questions."

### Step 4: Unlock Full Answer (15 seconds)

- **Action:** Click "Pay 1¢ to Unlock Full Answer"
- **What you see:** Loading spinner with "Processing payment..."
- **What you see:** Full answer appears with:
  - Green checkmark: "Answer Unlocked!"
  - Toast notification: "Progress updated: +10 XP (Wallet Warmer)"
  - Full markdown answer with code blocks
  - Syntax-highlighted code examples
  - Reference links
  - Transaction signature field
  - Copy button and Explorer link for signature
- **What you see:** Quest Panel updates: XP increases, topic progress bar advances

**Say:** "When the user pays, the server returns the full answer. Notice the toast notification showing +10 XP earned. The Quest Panel on the right updates automatically, showing progress for that topic. Users unlock badges as they progress - like 'PDA Master' when they unlock all PDA questions."

### Step 5: Explore Examples (10 seconds)

- **Action:** Click "See examples" link
- **What you see:** Modal opens with all questions grouped by topic
- **Action:** Type in search box (e.g., "PDA")
- **What you see:** Questions filter in real-time
- **Action:** Click any question
- **What you see:** Question auto-fills textarea, modal closes

**Say:** "Users can browse all available questions by topic. The examples modal makes it easy to discover what's in the knowledge base."

### Step 6: View Progress (10 seconds)

- **Action:** Point to Quest Panel on the right
- **What you see:** XP counter, current rank (e.g., "Wallet Warmer")
- **What you see:** Badges section (if any unlocked)
- **What you see:** Progress bars for each topic showing unlocked/total
- **Action:** Scroll through topics
- **What you see:** Progress bars with Solana gradient fill

**Say:** "The Quest Panel shows overall progress. Users can see their rank, badges earned, and per-topic progress. The Solana-themed gradient bars make progress visual and engaging."

### Step 7: Unlock Badge (10 seconds)

- **Action:** Click "Ask Another Question"
- **Action:** Use suggestions or examples to pick a PDA-related question
- **Action:** Complete the unlock flow
- **What you see:** Toast: "Progress updated: +10 XP"
- **What you see:** If enough PDAs unlocked: Toast: "Badge unlocked: PDA Master!"
- **What you see:** Badge appears in Quest Panel

**Say:** "As users unlock questions, they earn badges. For example, unlocking all PDA questions earns the 'PDA Master' badge. The gamification system tracks everything in localStorage - no backend database needed."

## Key Points to Highlight

1. **402 Pattern:** Preview before payment (HTTP 402)
2. **Real x402 Payments:** Wallet connection and on-chain transactions
3. **Gamification:** XP, ranks, badges, daily quests, topic progress
4. **Solana Theme:** Subtle purple/green accents, gradient progress bars
5. **Full Answers:** Detailed markdown with code and references
6. **Interactive:** Copy code, view transactions, browse examples
7. **Cached:** Answers and progress saved in localStorage
8. **No Backend DB:** All gamification state stored client-side

## Troubleshooting

**If preview doesn't appear:**
- Check backend is running on port 4021
- Check browser console for CORS errors
- Verify question matches knowledge base topics

**If full answer doesn't appear:**
- Check wallet is connected
- Check browser network tab for 200 response
- Verify markdown rendering (check for react-markdown errors)

**If gamification doesn't work:**
- Check localStorage is enabled in browser
- Check browser console for quest.ts errors
- Verify `/rag/catalog` and `/rag/daily` endpoints return data

**If code blocks don't highlight:**
- Verify `react-markdown` and `remark-gfm` are installed
- Check browser console for syntax highlighting errors

## Next Steps

After the demo, you can:
- Show the knowledge base code (`app/server/rag/knowledge.ts`)
- Explain how to add more Q&A entries
- Show gamification helpers (`app/web/lib/quest.ts`)
- Explain localStorage-based progress tracking
- Discuss Solana theme CSS variables (`app/web/app/globals.css`)
- Show the catalog and daily endpoints (`app/server/routes/rag.ts`)
- Discuss real x402 integration (see `README_RAG.md`)

## Gamification Features Summary

- **XP System:** +10 XP per answer unlocked, +5 XP per daily quest
- **Ranks:** Wallet Warmer (0-49), Account Whisperer (50-99), PDA Prodigy (100-199), Anchor Adept (200+)
- **Badges:** PDA Master, Rent-Ready, Daily Learner (3-day streak)
- **Daily Quest:** Deterministic daily question based on UTC date
- **Topic Progress:** Visual progress bars per topic with Solana gradient
- **Examples Browser:** Modal with searchable catalog of all questions
- **Suggestions:** Rotating 3-question suggestions from catalog

