# LifeOS personal reset: implementation roadmap

Status: planned; repository inspection completed, no application changes or live database migrations.
Reviewed main commit: 348eaa3ef7c87e4f3b6e68fe9954fe39bb9c4952 (2026-10-10).
Scope: one person's private management app, mobile first. Preserve existing modules and records.

## Product outcome

Opening LifeOS should answer: What matters today? What is my next small action?
What needs a deliberate decision? How do I restart after missing days?
Support planning, action, and reflection with minimal daily administration.

## Verified foundation and gaps

| Area | Existing evidence | Gap to address |
| --- | --- | --- |
| Home | components/home/HomeCanvas.tsx; lib/home/useHomeData.ts; lib/home/briefing.ts | Rendered home is finance centric. Briefing can say nothing needs attention without checking tasks or habits. |
| Tasks | app/today/page.tsx; lib/today/useDayTasks.ts; lib/today/taskTypes.ts | Scheduled tasks and one focus task exist. Need ranked priorities, explicit next action, postponement history, and reliable error feedback. |
| Focus | components/today/FocusCard.tsx | Current card selects/checks off a focus task; it is not evidence of an elapsed-time session tracker. |
| Health and habits | lib/vitality/useVitality.ts; lib/vitality/types.ts | Sleep hours, mood, energy, habits and completions exist. Need routine targets, weekly adherence, and recovery flow. |
| Reading | components/learn/; lib/learn/ | Books, progress, highlights, goals and analytics exist. Need a small daily reading action and recall review queue. |
| Money | app/finance/; lib/finance/ | Entries, budgets, savings, debts and analytics exist. Need pre-purchase pause workflow. |
| Capture | app/inbox/page.tsx; lib/inbox/useInbox.ts | Extend capture into deliberate task/decision processing. |
| Privacy | lib/supabase.ts; supabase/migrations/ | Client Supabase access; multiple migrations disable RLS or grant unrestricted access. No owner login flow found in reviewed app paths. Live database configuration is unverified. |

Repository inspection does not establish that deployed features or migrations work.
No live personal records, hosted settings, or production permissions were accessed.

## Build order

### 0. Private, reliable foundation

- Add owner sign-in and restrict enrollment/access to the configured owner.
- Verify authorization on database tables, storage objects and AI endpoints.
- Plan ownership backfill for existing records before restrictive policies take effect.
- Replace permissive policies with owner-only policies; make private files private.
- Preserve records, provide export/backup, and show read/write failures with retry.
- Establish baseline lint/type/build checks and targeted authorization tests.
- Done when signed-out and other-account access is denied, owner access works, and existing records remain accessible to the owner.

### 1. One daily command centre

Reuse Home and Today instead of introducing another task list.
- Home shows up to three chosen priorities, one next action, today's habits, and routine anchors.
- Add short morning planning and evening review.
- Let the user choose realistic wake, wind-down and phone-away targets.
- Start with a small set of editable habits; existing habits remain intact.
- Label missing data and loading errors honestly.
- Done when planning, completing a task/habit and refreshing all show the same saved state, including across local midnight.

### 2. Start and finish work; reduce distractions

- Add a five-minute start option and configurable focus sessions linked to tasks.
- Record actual completed focus time separately from planned duration.
- Save session state across reload; support pause, cancel and finish.
- Give unfinished work explicit choices: reschedule, shrink, drop, or keep.
- Log distraction triggers and manual phone-use check-ins.
- Link to phone Focus/Screen Time setup. Do not claim the web app can block other iPhone apps or automatically read their usage.
- Done when sessions survive reload without double counting, cancellations do not count as completed work, and repeated postponements are visible.

### 3. Consistency, recovery and weekly planning

- Add weekly review: priorities completed, focus time, habits, sleep entries and spending.
- Show seven-day completion against scheduled opportunities; distinguish missing data from zero.
- Ask what got in the way and choose one adjustment for next week.
- Recovery mode is available manually and may be suggested after missed planned days.
- Recovery reduces today's load to one priority and small habit actions; it never erases history or creates fictitious completions.
- Add up to three current goals with milestones and task links to address lack of direction.
- Done when a missed week can be resumed without recreating every task and the next week's plan is saved.

### 4. Spending and decision safeguards

Reuse Finance and Inbox.
- Add a configurable waiting period for nonessential purchases, planned amount and budget impact.
- Decision journal: choice, alternatives, reasoning, downside, expected result and review date.
- Record outcome later to compare expectation with reality.
- Record GHS by default where consistent with existing currency settings; respect configured currency.
- Journal entries remain private and are excluded from AI requests unless deliberately enabled.
- Done when deferred purchases remain pending until chosen and decisions can be reviewed against their original reasoning.

### 5. Reading, learning and communication

Reuse Learn rather than building another library.
- Surface a ten-minute reading action on Home.
- After reading, ask for a brief explanation in the user's own words and one question.
- Add scheduled recall prompts with adjustable review intervals and a daily cap.
- Offer short spoken or written explanation practice; speech recording is optional.
- Done when reading and recall are logged separately and due reviews do not turn into an unlimited daily backlog.

### 6. Optional assistance and polish

- Add opt-in summaries and planning suggestions only after the basic flows work.
- Suggestions must cite the actual logged pattern, permit correction and avoid character judgments.
- Review reminder delivery on each supported platform before claiming background reliability.
- Evaluate offline support and native integrations as separate work; existing Capacitor files do not prove these work on iPhone.
- Never send money, make decisions, alter priorities or transmit journal content automatically.

## First usable release

Ship phases 0–3 as a focused release: private access, coherent Home/Today,
routine anchors, focus sessions, recovery and a weekly review.
Retain existing Finance and Learn functionality while later enhancements are queued.
Do not require all nine struggles to become nine daily forms.

## Suggested daily loop

Morning: pick one main priority, up to two supporting tasks and routine anchors.
During the day: start one small action, use focus sessions when helpful, log completion.
Evening: note unfinished work, prepare tomorrow and log relevant habits.
Weekly: review patterns, choose one adjustment, plan realistic commitments.

## Validation and rollout

Each phase gets its own reviewable branch/PR, targeted checks and acceptance walkthrough.
Document schema changes with backup, ownership migration and rollback steps.
No production migrations or deployment as part of this roadmap.
Test data denial, save failures, reload persistence, midnight/week boundaries,
timer cancellation/resume, and recovery without data loss where relevant.
No frontend test suite was found in the inspected repository; add tests for consequential logic.
No completion date is promised before baseline build and deployment access are verified.

## Next implementation slice

Phase 0: establish baseline checks and map owner authentication, tables, storage and API authorization.
Then phase 1: wire the daily priorities and habit/routine summary into the existing home screen.
