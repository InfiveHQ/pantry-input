// SAFE DATA EXPORT SCRIPT
// This script only READS data - it never modifies anything

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function exportTableData(tableName) {
  try {
    console.log(`📊 Exporting data from ${tableName}...`);
    
    // SAFE - Only SELECT, never modify
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`❌ Error exporting ${tableName}:`, error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log(`ℹ️ No data found in ${tableName}`);
      return;
    }
    
    // Convert to CSV format
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that need quotes
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    // Save to file
    const filename = `${tableName}_export_${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(filename, csvContent);
    
    console.log(`✅ Exported ${data.length} records from ${tableName} to ${filename}`);
    console.log(`📁 File saved as: ${filename}`);
    
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error);
  }
}

async function exportAllData() {
  console.log('🛡️ SAFE DATA EXPORT - READ ONLY');
  console.log('This script will only READ your data, never modify it.\n');
  
  // List of tables to export
  const tables = ['pantry_items', 'households', 'household_members', 'profiles', 'invitations'];
  
  for (const table of tables) {
    await exportTableData(table);
    console.log(''); // Empty line for readability
  }
  
  console.log('🎉 Export complete!');
  console.log('📝 You can now open the CSV files in Excel');
}

// Run the export
exportAllData().catch(console.error);
