
# Git Rules
## 1. PROTECT MAIN
- Never make changes directly on the 'main' branch.

## 2. FEATURE BRANCHING
- Before every new task (e.g., "fix sidebar" or "add QR"), you must ask the user to run: 
  `git checkout -b feature/[task-name]`

## 3. COMMIT FREQUENTLY
- After every successful small change, tell the user to commit it with a clear message.

## 4. ROLLBACK PROTOCOL
- If the user says "I dislike these changes," the immediate priority is to help them run:
  - `git checkout main`
  - `git branch -D feature/[task-name]`
- This will completely delete the new experiment and return the project to its last stable state.

## 5. SQL SYNC RULE (PERMANENT)
- Any time code changes require a Supabase schema change (new column, new table, new RLS policy,
  new function, etc.), the Lead Developer MUST immediately tell the user at that moment.
- The exact SQL to run in the Supabase SQL Editor must be provided inline, ready to copy-paste.
- No code that depends on a new DB column/table shall be committed until the user confirms the SQL has been run.

## 6. NO GITHUB PUSH (PERMANENT)
- NEVER run `git push` under any circumstances.
- All commits are local only.
- Only push to GitHub when Subham explicitly says "push to GitHub."
