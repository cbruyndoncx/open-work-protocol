#!/bin/bash

# Auto-update DEVLOG.md when agent stops
# This script extracts recent git changes and updates DEVLOG

DEVLOG="DEVLOG.md"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Get recent git changes
RECENT_CHANGES=$(git log --oneline -10 2>/dev/null | head -5)
MODIFIED_FILES=$(git diff --name-only HEAD~1 2>/dev/null | head -10)

# Check if there are actual changes
if [ -z "$RECENT_CHANGES" ]; then
  exit 0
fi

# Create session entry
SESSION_ENTRY="
## $TIMESTAMP - Auto-captured Session

**Status**: In Progress

### Recent Changes
\`\`\`
$RECENT_CHANGES
\`\`\`

### Files Modified
\`\`\`
$MODIFIED_FILES
\`\`\`

---
"

# Append to DEVLOG (after the summary section)
if [ -f "$DEVLOG" ]; then
  # Insert after the first "---" separator
  sed -i "/^---$/a\\$SESSION_ENTRY" "$DEVLOG"
  echo "✅ DEVLOG.md updated automatically"
else
  echo "⚠️  DEVLOG.md not found"
fi
