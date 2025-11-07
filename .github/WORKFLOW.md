# GitHub Workflow Documentation

This repository uses automated GitHub Actions workflows to streamline the development process from issue creation to production deployment.

## 🚀 Workflow Overview

```
User Request → Issue Created → Branch Created → PR Created → Preview Deployment → Merge → Production
```

## 📋 Available Workflows

### 1. **Create Issue** (`.github/workflows/create-issue.yml`)
Manually create GitHub issues via workflow dispatch.

**Usage:**
- Go to Actions → Create Issue → Run workflow
- Fill in title, description, and optional labels
- Issue is created automatically

### 2. **Complete Workflow** (`.github/workflows/complete-workflow.yml`)
**Main workflow** - Creates issue, branch, and PR in one go.

**Usage:**
- Go to Actions → Complete Workflow → Run workflow
- Enter task description
- Workflow will:
  1. Create an issue
  2. Create a branch (`issue-{number}`)
  3. Create a PR linked to the issue
  4. Set up for preview deployment

### 3. **PR Preview Deployment** (`.github/workflows/pr-preview.yml`)
Automatically runs on PR creation/updates.

**What it does:**
- Verifies build succeeds
- Adds PR comment with deployment info
- Vercel automatically creates preview URL

### 4. **Production Deployment** (`.github/workflows/production-deploy.yml`)
Automatically runs when code is merged to `main`.

**What it does:**
- Builds the project
- Verifies build success
- Creates deployment status
- Vercel automatically deploys to production

### 5. **Auto Create PR from Issue** (`.github/workflows/auto-pr.yml`)
Creates a PR automatically when an issue is labeled or manually triggered.

**Usage:**
- Label an issue with `ready-for-pr` OR
- Go to Actions → Auto Create PR from Issue → Run workflow
- Enter issue number

## 🛠️ Using the Script

You can also use the Node.js script for local/CLI usage:

```bash
# Create an issue
node scripts/create-task.js "Fix button" "The Layers button is not working"

# Create a PR from an existing issue
node scripts/create-task.js --issue 123 --create-pr

# With custom labels
node scripts/create-task.js "Add feature" "Description" --labels "enhancement,feature"
```

**Setup:**
```bash
export GITHUB_TOKEN=your_github_token_here
```

Get a token at: https://github.com/settings/tokens (needs `repo` scope)

## 📝 Typical Workflow

### Option 1: Using GitHub Actions UI (Recommended)

1. **Create Task:**
   - Go to Actions → Complete Workflow → Run workflow
   - Enter your task description
   - Click "Run workflow"

2. **Work on Changes:**
   ```bash
   git fetch origin
   git checkout issue-{number}  # Branch created by workflow
   # Make your changes
   git add .
   git commit -m "Fix: Description"
   git push origin issue-{number}
   ```

3. **Review Preview:**
   - Vercel automatically creates preview URL
   - Check PR comments or Vercel dashboard

4. **Merge to Production:**
   - Review PR
   - Merge when ready
   - Production deployment happens automatically

### Option 2: Using Script

```bash
# 1. Create issue
node scripts/create-task.js "Fix button" "The Layers button is not working"

# 2. Create PR (after issue is created)
node scripts/create-task.js --issue 123 --create-pr

# 3. Work on branch
git checkout issue-123
# Make changes...
git push origin issue-123

# 4. Merge PR → Auto production deploy
```

## 🔧 Vercel Configuration

Vercel is configured to automatically:
- **Preview deployments:** Created for every PR
- **Production deployments:** Triggered on merge to `main`

**Setup in Vercel Dashboard:**
1. Go to Project Settings → Git
2. Ensure GitHub integration is connected
3. Production branch: `main`
4. Preview deployments: Enabled

## 🔐 Required Secrets

No additional secrets needed! The workflows use:
- `GITHUB_TOKEN` (automatically provided by GitHub Actions)
- Vercel integration (configured in Vercel dashboard)

## 📊 Workflow Status

Check workflow status at:
- Actions tab: https://github.com/Shivam-Bhardwaj/too.foo/actions
- PR checks: Visible on each PR
- Deployment status: Vercel dashboard

## 🐛 Troubleshooting

**Issue: Workflow not running**
- Check Actions tab for errors
- Ensure workflows are enabled in repository settings

**Issue: PR not creating preview**
- Verify Vercel GitHub integration is connected
- Check Vercel project settings

**Issue: Production not deploying**
- Ensure PR is merged to `main` branch
- Check Vercel deployment logs

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)

