# 🌳 Worktree-Based Workflow for Multiple Agents

This workflow uses **git worktrees** to allow multiple AI agents (Cursor, ChatGPT, Grok, etc.) to work on different changes simultaneously without conflicts.

## 🎯 How It Works

Each task gets its own **isolated worktree**:
- ✅ Separate directory for each branch
- ✅ No conflicts between agents
- ✅ Can work on multiple changes at once
- ✅ Each worktree is independent

## 🚀 Quick Start

### Create a New Task

**In Cursor (or any agent):**
```
"Create a new task: Fix the Layers button - it's not working"
```

**Or manually:**
```bash
npm run task "Fix the Layers button - it's not working"
```

**What happens:**
1. ✅ Issue created (#123)
2. ✅ Branch created (`issue-123`)
3. ✅ **Worktree created** at `~/.cursor/worktrees/too.foo/issue-123`
4. ✅ PR created (#456)
5. ✅ You can work in the worktree directory

### Work in the Worktree

```bash
# The script tells you the worktree path
cd ~/.cursor/worktrees/too.foo/issue-123

# Make your changes
# Edit files...

# Commit and push
git add .
git commit -m "Fix: Layers button"
git push origin issue-123
```

### Multiple Agents Working Simultaneously

**Agent 1 (Cursor):**
```bash
npm run task "Fix Layers button"
# Worktree: ~/.cursor/worktrees/too.foo/issue-123
```

**Agent 2 (ChatGPT):**
```bash
npm run task "Update documentation"
# Worktree: ~/.cursor/worktrees/too.foo/issue-124
```

**Agent 3 (Grok):**
```bash
npm run task "Add new feature"
# Worktree: ~/.cursor/worktrees/too.foo/issue-125
```

**All three can work at the same time!** 🎉

## 📁 Worktree Structure

```
~/.cursor/worktrees/too.foo/
├── issue-123/          # Worktree for issue #123
│   ├── .cursor-workflow.json
│   └── [your code]
├── issue-124/          # Worktree for issue #124
│   ├── .cursor-workflow.json
│   └── [your code]
└── issue-125/          # Worktree for issue #125
    ├── .cursor-workflow.json
    └── [your code]
```

## 🛠️ Worktree Management

### List All Worktrees

```bash
npm run worktrees
# or
node scripts/worktree.js list
```

### Remove a Worktree

```bash
node scripts/worktree.js remove issue-123
```

### Cleanup Merged Worktrees

```bash
node scripts/worktree.js cleanup
```

## 💡 Complete Workflow Example

### Step 1: Create Task (in Cursor)

**You:** "Create a new task: Fix Layers button"

**Cursor:**
```bash
npm run task "Fix Layers button"
```

**Output:**
```
✅ Issue created: #123
✅ Branch created: issue-123
✅ Worktree created: ~/.cursor/worktrees/too.foo/issue-123
✅ PR created: #456
```

### Step 2: Work in Worktree

**Cursor automatically:**
- Opens the worktree directory
- Makes the changes
- Commits and pushes

**Or manually:**
```bash
cd ~/.cursor/worktrees/too.foo/issue-123
# Make changes...
git add .
git commit -m "Fix: Layers button"
git push origin issue-123
```

### Step 3: Test in Preview

- Vercel automatically creates preview URL
- Check PR #456 for preview link
- Test your changes

### Step 4: Merge to Production

- Review PR
- Merge when ready
- Production deploys automatically!

## 🔄 Working with Multiple Agents

### Scenario: 3 Different Tasks

**Task 1 (Cursor - UI Fix):**
```bash
npm run task "Fix Layers button"
# Worktree: ~/.cursor/worktrees/too.foo/issue-123
```

**Task 2 (ChatGPT - Documentation):**
```bash
npm run task "Update README with new features"
# Worktree: ~/.cursor/worktrees/too.foo/issue-124
```

**Task 3 (Grok - Feature):**
```bash
npm run task "Add dark mode toggle"
# Worktree: ~/.cursor/worktrees/too.foo/issue-125
```

**All three worktrees exist simultaneously!**

Each agent can:
- Work in its own directory
- Make commits independently
- Push to its own branch
- Create its own PR
- Get its own preview deployment

## 📝 Worktree Info File

Each worktree has a `.cursor-workflow.json` file:

```json
{
  "issueNumber": 123,
  "issueUrl": "https://github.com/...",
  "branchName": "issue-123",
  "worktreePath": "~/.cursor/worktrees/too.foo/issue-123",
  "prNumber": 456,
  "prUrl": "https://github.com/...",
  "description": "Fix Layers button"
}
```

This helps agents understand the context.

## 🎯 Best Practices

1. **One worktree per task** - Don't reuse worktrees
2. **Clean up after merge** - Remove worktrees when PR is merged
3. **Use descriptive task names** - Makes it easier to find worktrees
4. **Check worktree list** - Use `npm run worktrees` to see all active worktrees

## 🐛 Troubleshooting

**Worktree already exists:**
- The script will use the existing worktree
- Or remove it: `node scripts/worktree.js remove issue-123`

**Can't find main repo:**
- Make sure you're in a worktree or the main repo
- The script auto-detects the main repo path

**Worktree directory doesn't exist:**
- Created automatically at `~/.cursor/worktrees/too.foo/`
- Or set `WORKTREE_BASE` environment variable

## 🔧 Environment Variables

```bash
# Custom worktree base directory
export WORKTREE_BASE=/path/to/worktrees

# GitHub token (required)
export GITHUB_TOKEN=your_token_here
```

## 📚 Related Commands

```bash
# Create task (creates worktree)
npm run task "Description"

# List worktrees
npm run worktrees

# Remove worktree
node scripts/worktree.js remove issue-123

# Cleanup merged
node scripts/worktree.js cleanup
```

---

**You're all set!** Now you can work on multiple changes simultaneously with different agents! 🚀

