# 🚀 Quick Start: Automated Issue → PR → Production Workflow

## How It Works

When you request a change, the system will:
1. ✅ **Create an issue** automatically
2. ✅ **Create a branch** (`issue-{number}`)
3. ✅ **Create a PR** linked to the issue
4. ✅ **Preview deployment** (Vercel automatically)
5. ✅ **Production deployment** (when PR is merged)

## 🎯 Quick Usage

### Method 1: GitHub Actions UI (Easiest)

1. Go to: https://github.com/Shivam-Bhardwaj/too.foo/actions
2. Click **"Complete Workflow - Issue to Production"**
3. Click **"Run workflow"**
4. Enter your task description
5. Click **"Run workflow"** button

That's it! The workflow will:
- Create an issue
- Create a branch
- Create a PR
- Set everything up for preview deployment

### Method 2: Command Line Script

```bash
# Set your GitHub token (one time)
export GITHUB_TOKEN=your_token_here

# Create issue and PR
node scripts/create-task.js "Fix button" "The Layers button is not working"
```

## 📝 After Workflow Runs

1. **Checkout the branch:**
   ```bash
   git fetch origin
   git checkout issue-{number}  # Replace {number} with actual issue number
   ```

2. **Make your changes:**
   ```bash
   # Edit files...
   git add .
   git commit -m "Fix: Description of changes"
   git push origin issue-{number}
   ```

3. **Preview automatically created:**
   - Vercel creates preview URL automatically
   - Check PR comments or Vercel dashboard

4. **Merge when ready:**
   - Review the PR
   - Merge to `main`
   - Production deployment happens automatically!

## 🔧 Setup Checklist

- [x] GitHub Actions workflows created
- [x] Vercel configuration updated
- [x] Scripts created
- [ ] **You need to:** Connect Vercel to GitHub (if not already done)
  - Go to Vercel Dashboard → Project Settings → Git
  - Ensure GitHub integration is connected
  - Production branch: `main`
  - Preview deployments: Enabled

## 📚 Full Documentation

See `.github/WORKFLOW.md` for complete documentation.

