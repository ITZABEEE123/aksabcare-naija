// Test file to verify timezone handling is working correctly
// Run this in the browser console to test appointment time display

// Test appointment time from database (UTC)
const testAppointmentUTC = new Date('2025-10-07T15:00:00.000Z') // 3 PM UTC

console.log('=== TIMEZONE TEST ===')
console.log('Original UTC time:', testAppointmentUTC.toISOString())

// Method 1: Using toLocaleString with Africa/Lagos timezone (CORRECT)
const nigerianTime1 = testAppointmentUTC.toLocaleString('en-US', { 
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
})
console.log('Nigerian time (Method 1):', nigerianTime1)

// Method 2: Using toLocaleDateString and toLocaleTimeString separately
const nigerianDate = testAppointmentUTC.toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' })
const nigerianTime = testAppointmentUTC.toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour12: true })
console.log('Nigerian time (Method 2):', `${nigerianDate} at ${nigerianTime}`)

// Test what user selected vs what gets stored
const userSelectedTime = '4:00 PM' // User picks 4 PM Nigerian time
const userSelectedDate = '2025-10-07'

// This is what should happen: Convert user selection to UTC for storage
const [time, ampm] = userSelectedTime.split(' ')
const [hour, minute] = time.split(':').map(Number)
const hour24 = ampm === 'PM' && hour !== 12 ? hour + 12 : (ampm === 'AM' && hour === 12 ? 0 : hour)

// Create date in Nigerian timezone
const selectedDateTime = new Date(`${userSelectedDate}T${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`)

// Convert to UTC (Nigeria is UTC+1, so subtract 1 hour)
const utcDateTime = new Date(selectedDateTime.getTime() - (1 * 60 * 60 * 1000))

console.log('User selected:', `${userSelectedDate} at ${userSelectedTime}`)
console.log('Stored as UTC:', utcDateTime.toISOString())
console.log('Should display as:', utcDateTime.toLocaleString('en-US', { 
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
}))

export { }