#!/bin/bash
# Setup git hooks for commit metadata formatting
# This should be run in each worktree to enable metadata formatting

set -e

# Handle both regular repos and worktrees
if [ -f ".git" ]; then
    # Worktree: .git is a file pointing to the worktree gitdir
    # For worktrees, hooks go in the main repo's .git/hooks
    MAIN_GIT_DIR=$(git rev-parse --git-common-dir 2>/dev/null || git rev-parse --git-dir 2>/dev/null)
    HOOKS_DIR="$MAIN_GIT_DIR/hooks"
    WORKTREE_ROOT=$(git rev-parse --show-toplevel)
elif [ -d ".git" ]; then
    # Regular repo
    HOOKS_DIR=".git/hooks"
    WORKTREE_ROOT=$(pwd)
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
# Get the worktree root directory
if [ -f ".git" ]; then
    # Worktree: find the worktree root
    WORKTREE_ROOT=$(pwd)
elif [ -d ".git" ]; then
    # Regular repo
    WORKTREE_ROOT=$(pwd)
fi

cat > "$COMMIT_MSG_HOOK" << EOF
#!/bin/bash
# Git commit-msg hook for metadata formatting

COMMIT_MSG_FILE=\$1

# Try multiple paths to find the script
SCRIPT_DIRS=(
    "$WORKTREE_ROOT"
    "\$(cd "\$(dirname "\${BASH_SOURCE[0]}")/../.." && pwd)"
    "\$(git rev-parse --show-toplevel 2>/dev/null)"
)

for SCRIPT_DIR in "\${SCRIPT_DIRS[@]}"; do
    if [ -f "\$SCRIPT_DIR/scripts/format-commit-msg.sh" ]; then
        "\$SCRIPT_DIR/scripts/format-commit-msg.sh" "\$COMMIT_MSG_FILE" "\$2" "\$3"
        exit 0
    fi
done

exit 0
EOF

chmod +x "$COMMIT_MSG_HOOK"

echo "✅ Git hooks installed successfully"
echo "   Commit messages will now be formatted with metadata"

