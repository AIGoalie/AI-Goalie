#!/bin/bash

# Cleanup script for AI-Goalie repository
# Deletes files older than February 2026 to free up GitHub storage
# 
# Usage: 
#   ./cleanup_old_files.sh          # Dry run (shows what would be deleted)
#   ./cleanup_old_files.sh --delete # Actually delete the files

REPO_DIR="/home/aigoalie-monetized/site/AI-Goalie"
CUTOFF_YEAR=2026
CUTOFF_MONTH=1  # February

DRY_RUN=true
if [[ "$1" == "--delete" ]]; then
    DRY_RUN=false
fi

cd "$REPO_DIR" || { echo "Cannot access $REPO_DIR"; exit 1; }

echo "============================================"
echo "AI-Goalie Repository Cleanup Script"
echo "============================================"
echo "Cutoff date: $CUTOFF_YEAR-$(printf '%02d' $CUTOFF_MONTH)-01"
echo "Mode: $([ "$DRY_RUN" = true ] && echo 'DRY RUN (no files will be deleted)' || echo 'DELETE MODE')"
echo ""

files_to_delete=()
total_size=0

# Function to check if date is before cutoff
is_before_cutoff() {
    local year=$1
    local month=$2
    
    if [[ $year -lt $CUTOFF_YEAR ]]; then
        return 0  # true - before cutoff
    elif [[ $year -eq $CUTOFF_YEAR && $month -lt $CUTOFF_MONTH ]]; then
        return 0  # true - before cutoff
    fi
    return 1  # false - on or after cutoff
}

# Process HTML files with DD.MM.YYYY format
echo "Scanning HTML files (DD.MM.YYYY format)..."
for file in *.html *.html:Zone.Identifier 2>/dev/null; do
    [[ -f "$file" ]] || continue
    
    # Extract date from filename (handles various suffixes like -de, -fr, _m, etc.)
    if [[ "$file" =~ ^([0-9]{2})\.([0-9]{2})\.([0-9]{4}) ]]; then
        day="${BASH_REMATCH[1]}"
        month="${BASH_REMATCH[2]}"
        year="${BASH_REMATCH[3]}"
        
        # Remove leading zeros for comparison
        month=$((10#$month))
        year=$((10#$year))
        
        if is_before_cutoff $year $month; then
            files_to_delete+=("$file")
            size=$(stat -c%s "$file" 2>/dev/null || echo 0)
            total_size=$((total_size + size))
        fi
    fi
done

# Process JSON files with YYYY-MM-DD format  
echo "Scanning JSON files (YYYY-MM-DD format)..."
for file in *.json 2>/dev/null; do
    [[ -f "$file" ]] || continue
    
    # Extract date from filename (universal_dataset_YYYY-MM-DD.json or _acc.json)
    if [[ "$file" =~ ([0-9]{4})-([0-9]{2})-([0-9]{2}) ]]; then
        year="${BASH_REMATCH[1]}"
        month="${BASH_REMATCH[2]}"
        day="${BASH_REMATCH[3]}"
        
        # Remove leading zeros for comparison
        month=$((10#$month))
        year=$((10#$year))
        
        if is_before_cutoff $year $month; then
            files_to_delete+=("$file")
            size=$(stat -c%s "$file" 2>/dev/null || echo 0)
            total_size=$((total_size + size))
        fi
    fi
done

echo ""
echo "============================================"
echo "Results"
echo "============================================"
echo "Files to delete: ${#files_to_delete[@]}"
echo "Total size to free: $(numfmt --to=iec $total_size 2>/dev/null || echo "$total_size bytes")"
echo ""

if [[ ${#files_to_delete[@]} -eq 0 ]]; then
    echo "No files found matching criteria."
    exit 0
fi

# Show sample of files to be deleted
echo "Sample of files to delete (first 20):"
for i in "${!files_to_delete[@]}"; do
    [[ $i -ge 20 ]] && { echo "  ... and $((${#files_to_delete[@]} - 20)) more"; break; }
    echo "  ${files_to_delete[$i]}"
done
echo ""

if [[ "$DRY_RUN" = true ]]; then
    echo "============================================"
    echo "This was a DRY RUN. No files were deleted."
    echo "Run with --delete to actually remove files:"
    echo "  ./cleanup_old_files.sh --delete"
    echo "============================================"
else
    echo "Deleting files..."
    deleted=0
    for file in "${files_to_delete[@]}"; do
        if rm -f "$file"; then
            ((deleted++))
        else
            echo "  Failed to delete: $file"
        fi
    done
    
    echo ""
    echo "============================================"
    echo "Deleted $deleted files"
    echo "============================================"
    echo ""
    echo "Next steps:"
    echo "1. Review changes: git status"
    echo "2. Stage deletions: git add -A"
    echo "3. Commit: git commit -m 'Cleanup: remove old files before Feb 2026'"
    echo "4. Push: git push"
fi