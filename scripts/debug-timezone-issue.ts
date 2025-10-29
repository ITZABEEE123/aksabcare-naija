// Debug the timezone conversion issue

// Simulate what happens when a user books 6 PM Nigerian time

console.log("=== DEBUGGING TIMEZONE ISSUE ===")

// 1. What the user sees and selects (6 PM Nigerian time)
const userSelectedTimeNigerian = "6:00 PM"
const userSelectedDate = "2025-10-07"

console.log(`User wants to book: ${userSelectedDate} at ${userSelectedTimeNigerian} Nigerian time`)

// 2. Simulate slot generation (what gets sent to frontend)
const [time, ampm] = userSelectedTimeNigerian.split(' ')
const [hour, minute] = time.split(':').map(Number)
const hour24 = ampm === 'PM' && hour !== 12 ? hour + 12 : (ampm === 'AM' && hour === 12 ? 0 : hour)

// Create the Nigerian time
const nigerianDateTime = new Date(2025, 9, 7, hour24, minute || 0, 0, 0) // Month is 0-indexed
console.log("Nigerian time object:", nigerianDateTime)
console.log("Nigerian time string:", nigerianDateTime.toString())

// Convert to UTC (subtract 1 hour since Nigeria is UTC+1)
const utcDateTime = new Date(nigerianDateTime.getTime() - (1 * 60 * 60 * 1000))
console.log("UTC time for storage:", utcDateTime.toISOString())

// 3. What gets stored in database
console.log("Database stores:", utcDateTime.toISOString())

// 4. What should be displayed back to users
const displayTime = utcDateTime.toLocaleString('en-US', {
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
})
console.log("Should display as:", displayTime)

// 5. Alternative display method
const displayTime2 = new Date(utcDateTime.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }))
console.log("Alternative display:", displayTime2.toString())

export {}