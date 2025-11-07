#!/bin/bash
# Setup git hooks for commit metadata formatting
# This should be run in each worktree to enable metadata formatting

set -e

# Handle both regular repos and worktrees
if [ -f ".git" ]; then
    # Worktree: .git is a file pointing to the worktree gitdir
    GIT_DIR=$(cat .git | sed 's/gitdir: //')
    HOOKS_DIR="$GIT_DIR/hooks"
elif [ -d ".git" ]; then
    # Regular repo
    HOOKS_DIR=".git/hooks"
else
    echo "Error: Not in a git repository"
    exit 1
fi

COMMIT_MSG_HOOK="$HOOKS_DIR/commit-msg"

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Check if commit-msg hook already exists
if [ -f "$COMMIT_MSG_HOOK" ] && ! grep -q "format-commit-msg.sh" "$COMMIT_MSG_HOOK"; then
    echo "⚠️  commit-msg hook already exists. Backing up..."
    mv "$COMMIT_MSG_HOOK" "$COMMIT_MSG_HOOK.backup"
fi

# Create commit-msg hook
cat > "$COMMIT_MSG_HOOK" << 'EOF'
#!/bin/bash
# Git commit-msg hook for metadata formatting

COMMIT_MSG_FILE=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Run the formatter script if it exists
if [ -f "$SCRIPT_DIR/scripts/format-commit-msg.sh" ]; then
    "$SCRIPT_DIR/scripts/format-commit-msg.sh" "$COMMIT_MSG_FILE" "$2" "$3"
fi

exit 0
EOF

chmod +x "$COMMIT_MSG_HOOK"

echo "✅ Git hooks installed successfully"
echo "   Commit messages will now be formatted with metadata"

