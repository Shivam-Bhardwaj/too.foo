# 🤖 Cursor Agent Instructions (Worktree Edition)

## For Cursor AI Assistant

When the user asks you to create a new task or make a change, follow these steps:

### Step 1: Create Issue, Branch, Worktree, and PR

Run this command:
```bash
npm run task "USER'S TASK DESCRIPTION HERE"
```

**Example:**
If user says: "Fix the Layers button - it's not working"

Run:
```bash
npm run task "Fix the Layers button - it's not working"
```

### Step 2: After Agent Runs

The agent will:
- ✅ Create GitHub issue
- ✅ Create branch (`issue-{number}`)
- ✅ **Create worktree** at `~/.cursor/worktrees/too.foo/issue-{number}`
- ✅ Create PR
- ✅ Output the worktree path

**The worktree is a separate directory where you'll work.**

### Step 3: Work in the Worktree

**Important:** Change to the worktree directory before making changes!

```bash
cd ~/.cursor/worktrees/too.foo/issue-{number}
```

Then make your changes. Edit files as needed.

### Step 4: Commit and Push from Worktree

After making changes:
```bash
# Make sure you're in the worktree directory
cd ~/.cursor/worktrees/too.foo/issue-{number}

git add .
git commit -m "Fix: [description of what was fixed]"
git push origin issue-{number}
```

### Step 5: Inform User

Tell the user:
- ✅ Changes are committed and pushed
- ✅ PR is ready for review
- ✅ Vercel will automatically create a preview deployment
- ✅ Preview URL will be available in PR comments or Vercel dashboard
- ✅ They can test in the preview
- ✅ When ready, merge PR to deploy to production

## Example Conversation Flow

**User:** "Fix the Layers button - it's not working"

**You:**
1. Run: `npm run task "Fix the Layers button - it's not working"`
2. Wait for output showing issue/branch/worktree/PR created
3. **Change to worktree:** `cd ~/.cursor/worktrees/too.foo/issue-123`
4. Make the changes to fix the button
5. Run: `git add . && git commit -m "Fix: Layers button click handler" && git push origin issue-123`
6. Tell user: "✅ Fixed! Changes pushed. Vercel will create preview automatically. Check PR for preview URL."

## Multiple Agents Working Simultaneously

**Important:** Each agent gets its own worktree!

**Agent 1 (You - Cursor):**
- Task: "Fix Layers button"
- Worktree: `~/.cursor/worktrees/too.foo/issue-123`

**Agent 2 (ChatGPT):**
- Task: "Update documentation"
- Worktree: `~/.cursor/worktrees/too.foo/issue-124`

**Agent 3 (Grok):**
- Task: "Add feature"
- Worktree: `~/.cursor/worktrees/too.foo/issue-125`

**All can work at the same time!** No conflicts!

## Important Notes

- ✅ **Always work in the worktree directory** - Don't work in the main repo
- ✅ **Each task gets its own worktree** - Isolated from other tasks
- ✅ **Multiple agents can work simultaneously** - Each in its own worktree
- ✅ **Worktree path is shown in output** - Use that path to `cd` into it
- ✅ **Commit and push from worktree** - Git commands work normally in worktree

## Worktree Path Format

Worktrees are created at:
```
~/.cursor/worktrees/too.foo/issue-{number}
```

The script outputs this path - use it to `cd` into the worktree.

## Troubleshooting

**If GITHUB_TOKEN not set:**
- Tell user to set: `export GITHUB_TOKEN=their_token`
- Get token at: https://github.com/settings/tokens

**If worktree already exists:**
- Script will use existing worktree
- Or remove: `node scripts/worktree.js remove issue-{number}`

**If you're not in worktree directory:**
- Check current directory: `pwd`
- Change to worktree: `cd ~/.cursor/worktrees/too.foo/issue-{number}`

## Commands Reference

```bash
# Create task (creates worktree)
npm run task "Description"

# List all worktrees
npm run worktrees

# Remove worktree
node scripts/worktree.js remove issue-{number}

# Cleanup merged worktrees
node scripts/worktree.js cleanup
```

---

**Remember:** Always work in the worktree directory, not the main repo! 🌳
