// Test date formatting functions
const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    return date.toLocaleDateString('en-GB'); // DD-MM-YYYY format
  } catch {
    return dateString;
  }
};

const formatDateForStorage = (displayDate) => {
  if (!displayDate) return '';
  try {
    // Handle DD-MM-YYYY format
    let parts = displayDate.split('-');
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    
    // Handle DD/MM/YYYY format
    parts = displayDate.split('/');
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    
    // If it's already in YYYY-MM-DD format (from date picker), return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(displayDate)) {
      return displayDate;
    }
    
    return displayDate;
  } catch {
    return displayDate;
  }
};

// Test cases
console.log('=== Testing Date Formatting Functions ===\n');

// Test 1: YYYY-MM-DD to DD-MM-YYYY
console.log('Test 1: YYYY-MM-DD to DD-MM-YYYY');
const test1 = formatDateForDisplay('2024-12-25');
console.log('Input: 2024-12-25');
console.log('Output:', test1);
console.log('Expected: 25/12/2024 (or similar)\n');

// Test 2: DD-MM-YYYY to YYYY-MM-DD
console.log('Test 2: DD-MM-YYYY to YYYY-MM-DD');
const test2 = formatDateForStorage('25-12-2024');
console.log('Input: 25-12-2024');
console.log('Output:', test2);
console.log('Expected: 2024-12-25\n');

// Test 3: DD/MM/YYYY to YYYY-MM-DD
console.log('Test 3: DD/MM/YYYY to YYYY-MM-DD');
const test3 = formatDateForStorage('25/12/2024');
console.log('Input: 25/12/2024');
console.log('Output:', test3);
console.log('Expected: 2024-12-25\n');

// Test 4: Already YYYY-MM-DD format
console.log('Test 4: Already YYYY-MM-DD format');
const test4 = formatDateForStorage('2024-12-25');
console.log('Input: 2024-12-25');
console.log('Output:', test4);
console.log('Expected: 2024-12-25\n');

// Test 5: Empty string
console.log('Test 5: Empty string');
const test5 = formatDateForStorage('');
console.log('Input: ""');
console.log('Output:', test5);
console.log('Expected: ""\n');

// Test 6: Invalid format
console.log('Test 6: Invalid format');
const test6 = formatDateForStorage('invalid-date');
console.log('Input: invalid-date');
console.log('Output:', test6);
console.log('Expected: invalid-date\n');

console.log('=== End of Tests ==='); 