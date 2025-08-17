# Database Safety Guide - PROTECT YOUR DATA

## ⚠️ CRITICAL: Never Lose Data Again

### **What Happened Before:**
- Data was accidentally deleted during development
- This should NEVER happen again

### **Safety Rules:**

#### **1. NEVER Run These Commands:**
```sql
-- DANGEROUS - NEVER RUN THESE
DROP TABLE pantry_items;
DROP TABLE households;
DROP TABLE profiles;
DELETE FROM pantry_items;
TRUNCATE TABLE households;
```

#### **2. ALWAYS Safe Commands:**
```sql
-- SAFE - Only add new things
CREATE TABLE rooms (...);
ALTER TABLE pantry_items ADD COLUMN room_id UUID;
INSERT INTO rooms (...);
```

#### **3. Before Any Database Changes:**
1. **Create backup first**
2. **Show you the SQL to review**
3. **Get your approval**
4. **Test on development data**

## Backup Strategy

### **Automatic Backup (Recommended)**
```bash
# Create backup before any changes
pg_dump "your-supabase-connection" > backup_$(date +%Y%m%d_%H%M%S).sql
```

### **Manual Backup Steps:**
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run: `SELECT * FROM pantry_items;` (to see your data)
4. Export data if needed

### **Restore Plan:**
```bash
# If something goes wrong
psql "your-supabase-connection" < backup_20241201_120000.sql
```

## Development Safety

### **Feature Flag Protection:**
- New features are OFF by default
- Your existing data is never touched
- Kitchen app keeps working

### **Database Changes:**
- Only ADD new tables/columns
- Never modify existing data
- Always backup first

### **Testing Strategy:**
1. Test on development branch
2. Verify kitchen app still works
3. Only merge when confident

## Emergency Recovery

### **If Data Gets Lost:**
1. **Don't panic**
2. **Stop all development**
3. **Restore from backup**
4. **Return to master branch**

### **Emergency Commands:**
```bash
# Return to safe kitchen version
git checkout master
git reset --hard origin/master

# Restore database
psql "your-supabase-connection" < latest_backup.sql
```

## Your Data is Protected

### **Current Safety Measures:**
- ✅ Feature flags prevent breaking changes
- ✅ Development branch isolates experiments
- ✅ Git safety net (master branch untouched)
- ✅ No destructive database commands

### **What We'll Do:**
1. **Only add new features**
2. **Never touch existing data**
3. **Always backup first**
4. **Get your approval for any database changes**

## Remember:
**Your kitchen app data is sacred!** 🛡️
**Never delete, only add!** ➕
**Always backup first!** 💾
