# Cursor Agent - Automated Workflow

This document explains how to use the Cursor Agent to automatically create issues, branches, and PRs.

## 🎯 Quick Start

When you want to make a change, just run:

```bash
node scripts/cursor-agent.js "Your task description here"
```

**Example:**
```bash
node scripts/cursor-agent.js "Fix the Layers button - it's not working"
```

## 🤖 What Happens Automatically

1. ✅ **Issue Created** - GitHub issue is created with your description
2. ✅ **Branch Created** - New branch `issue-{number}` is created
3. ✅ **PR Created** - Pull request is created and linked to the issue
4. ✅ **Branch Checked Out** - You're automatically on the new branch
5. ✅ **Ready to Work** - Make your changes, commit, and push

## 📝 Complete Workflow

### Step 1: Start the Agent

```bash
node scripts/cursor-agent.js "Fix the Layers button - it's not working"
```

**Output:**
```
🚀 Starting automated workflow...
📝 Task: Fix the Layers button - it's not working

📋 Step 1: Creating issue...
✅ Issue created: #123
🔗 https://github.com/Shivam-Bhardwaj/too.foo/issues/123

🌿 Step 2: Creating branch...
✅ Branch created: issue-123

🔀 Step 3: Creating PR...
✅ PR created: #456
🔗 https://github.com/Shivam-Bhardwaj/too.foo/pull/456

✅ Workflow Complete!
🌿 Branch: issue-123
🔀 PR: #456
💡 You are now on branch: issue-123
```

### Step 2: Make Your Changes

Now you're on the branch. Make your changes using Cursor:

```bash
# Edit files in Cursor
# The agent has already checked out the branch for you
```

### Step 3: Commit and Push

```bash
git add .
git commit -m "Fix: Layers button not working"
git push origin issue-123
```

### Step 4: Test in Preview

- Vercel automatically creates a preview deployment
- Check the PR comments or Vercel dashboard for the preview URL
- Test your changes in the preview

### Step 5: Merge to Production

- Review the PR
- Merge when ready
- Production deployment happens automatically!

## 🔧 Setup

### 1. Set GitHub Token

```bash
export GITHUB_TOKEN=your_github_token_here
```

Get a token at: https://github.com/settings/tokens
- Needs `repo` scope (full control of private repositories)

### 2. Ensure Git is Configured

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## 💡 Using with Cursor AI

### Method 1: Direct Command

Just tell Cursor:
> "Run the cursor agent with: Fix the Layers button - it's not working"

### Method 2: Manual Run

1. Open terminal in Cursor
2. Run: `node scripts/cursor-agent.js "Your description"`
3. Work on the changes
4. Commit and push
5. Test in preview

### Method 3: Cursor Chat Integration

You can ask Cursor:
> "Create a new task: Fix the Layers button - it's not working"

And Cursor can run the script for you automatically.

## 📄 Workflow Info File

After running the agent, a `.cursor-workflow.json` file is created with:

```json
{
  "issueNumber": 123,
  "issueUrl": "https://github.com/...",
  "branchName": "issue-123",
  "prNumber": 456,
  "prUrl": "https://github.com/...",
  "description": "Fix the Layers button..."
}
```

This file helps Cursor understand the current workflow context.

## 🚀 Complete Example

```bash
# 1. Start agent
node scripts/cursor-agent.js "Fix Layers button not working"

# 2. Make changes (in Cursor)
# Edit app/components/LayerControl.tsx

# 3. Commit and push
git add .
git commit -m "Fix: Layers button click handler"
git push origin issue-123

# 4. Check PR for preview URL
# 5. Test in preview
# 6. Merge PR → Production!
```

## 🐛 Troubleshooting

**Error: GITHUB_TOKEN not set**
```bash
export GITHUB_TOKEN=your_token
```

**Error: Branch already exists**
- The agent will handle this automatically
- Or manually delete: `git branch -D issue-123`

**Error: Not on main branch**
- The agent checks out main first, then creates branch
- Make sure you have a clean working directory

## 📚 Related Files

- `.github/workflows/complete-workflow.yml` - GitHub Actions workflow
- `scripts/create-task.js` - Alternative script for issue/PR creation
- `.github/WORKFLOW.md` - Complete workflow documentation

