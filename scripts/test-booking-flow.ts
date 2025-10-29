// Test exactly what happens during appointment booking

// Test Case: User books 6:00 PM Nigerian time on Oct 7, 2025

const testDate = new Date(2025, 9, 7); // October 7, 2025 (month is 0-indexed)
const nigerianHour = 18; // 6 PM
const nigerianMinute = 0;

console.log("=== APPOINTMENT BOOKING TEST ===");

// 1. User's intention: 6:00 PM Nigerian time
console.log("1. User wants to book: 6:00 PM Nigerian time on Oct 7, 2025");

// 2. Create Nigerian time
const nigerianTime = new Date(2025, 9, 7, nigerianHour, nigerianMinute, 0, 0);
console.log("2. Nigerian time object:", nigerianTime.toString());
console.log("   ISO string:", nigerianTime.toISOString());

// 3. Convert to UTC for storage (Nigeria is UTC+1, so subtract 1 hour)
const utcTime = new Date(nigerianTime.getTime() - (1 * 60 * 60 * 1000));
console.log("3. UTC time for storage:", utcTime.toISOString());

// 4. What gets stored in database
console.log("4. Database stores:", utcTime.toISOString());

// 5. When displaying back, convert UTC to Nigerian time
const displayedTime = utcTime.toLocaleString('en-US', {
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
});
console.log("5. Should display as:", displayedTime);

// 6. Alternative display method
const displayedTime2 = new Date(utcTime.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
console.log("6. Alternative display method:", displayedTime2.toString());

// 7. Test the actual conversion methods
console.log("\n=== ACTUAL CONVERSION TEST ===");
const testUTC = new Date('2025-10-07T17:00:00.000Z'); // 5 PM UTC (should be 6 PM in Nigeria)
console.log("7. Test UTC time:", testUTC.toISOString());
console.log("   Should display as 6 PM Nigerian:", testUTC.toLocaleString('en-US', { 
  timeZone: 'Africa/Lagos', 
  hour12: true,
  hour: 'numeric',
  minute: '2-digit'
}));

const testUTC2 = new Date('2025-10-07T18:00:00.000Z'); // 6 PM UTC (should be 7 PM in Nigeria)
console.log("8. Test UTC time 2:", testUTC2.toISOString());
console.log("   Should display as 7 PM Nigerian:", testUTC2.toLocaleString('en-US', { 
  timeZone: 'Africa/Lagos', 
  hour12: true,
  hour: 'numeric',
  minute: '2-digit'
}));

export {}