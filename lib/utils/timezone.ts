// 🕐 TIMEZONE UTILITIES FOR NIGERIA (West Africa Time - WAT)
// Nigeria uses West Africa Time (WAT) which is UTC+1 (1 hour ahead of Greenwich Mean Time)
// This file contains functions to handle timezone conversion properly

/**
 * 🌍 Converts any date to West Africa Time (Nigeria's timezone)
 * 
 * Think of this like converting time zones on your phone when you travel:
 * - Input: Any date/time (could be from any timezone)  
 * - Output: That same moment in time, but displayed in Nigeria time (WAT)
 * 
 * Example: If it's 12:00 PM UTC, this returns 1:00 PM WAT
 */
export function toWestAfricaTime(date: Date): Date {
  // Use the browser's built-in timezone conversion to convert to Lagos (Nigeria) time
  // "Africa/Lagos" is the technical name for Nigeria's timezone
  const watDate = new Date(date.toLocaleString("en-US", {timeZone: "Africa/Lagos"}))
  return watDate
}

/**
 * 🗓️ Creates a proper datetime for Nigeria timezone from separate date and time
 * 
 * This is like setting an alarm clock in Nigeria:
 * - You pick a date (like "December 25, 2025")
 * - You pick a time (like "2:30 PM") 
 * - This function combines them into one datetime that works correctly in Nigeria
 * 
 * @param date - The calendar date (year, month, day)
 * @param timeString - The time in "HH:MM" format (like "14:30" for 2:30 PM)
 * @returns A Date object in UTC that represents the correct time in Nigeria
 */
export function createWATDateTime(date: Date, timeString: string): Date {
  // Step 1: Break apart the time string into hours and minutes
  // "14:30" becomes hours=14, minutes=30
  const [hours, minutes] = timeString.split(':').map(Number)
  
  // Step 2: Get the individual parts of the date (in local timezone)
  const year = date.getFullYear()    // Like 2025
  const month = date.getMonth()      // Like 11 (December, since months start at 0)
  const day = date.getDate()         // Like 25
  
  // Step 3: Create a date in Nigeria timezone using proper timezone handling
  // This ensures we create the date correctly in WAT (West Africa Time)
  const watDateTime = new Date()
  watDateTime.setFullYear(year, month, day)
  watDateTime.setHours(hours, minutes, 0, 0)
  
  // Step 4: Convert to proper UTC for database storage
  // Use toLocaleString to get the proper offset for WAT
  const watString = watDateTime.toLocaleString('sv-SE', { timeZone: 'Africa/Lagos' })
  const utcDate = new Date(watString + '+01:00') // WAT is UTC+1
  
  return utcDate
}

/**
 * 📅 Formats any date to look nice in Nigeria timezone
 * 
 * This is like having a digital clock that always shows Nigeria time:
 * - Input: Any date/time
 * - Output: A nice readable string like "12/25/2025, 14:30:00"
 * 
 * Perfect for showing times on websites or in emails to Nigerian users
 */
export function formatWATDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: "Africa/Lagos",    // Force it to show Nigeria time
    year: 'numeric',             // Show full year like "2025"
    month: '2-digit',            // Show month with 2 digits like "12"
    day: '2-digit',             // Show day with 2 digits like "25"
    hour: '2-digit',            // Show hour with 2 digits like "14"
    minute: '2-digit',          // Show minutes with 2 digits like "30"
    second: '2-digit',          // Show seconds with 2 digits like "00"
    hour12: false               // Use 24-hour format (14:30) not 12-hour (2:30 PM)
  })
}

/**
 * 🕐 Gets the current time right now in Nigeria
 * 
 * This is like looking at a clock on the wall in Lagos:
 * - No matter where our server is located in the world
 * - This always tells us what time it is RIGHT NOW in Nigeria
 * 
 * Useful for checking if appointments are in the past or future
 */
export function getCurrentWATTime(): Date {
  return toWestAfricaTime(new Date())
}

/**
 * ⏰ Checks if a time has already passed in Nigeria
 * 
 * This is like asking "Has this appointment time already happened?"
 * - Input: Any date/time
 * - Output: true if it's in the past, false if it's in the future
 * 
 * @param date - The date/time to check
 * @returns true if this time has already passed in Nigeria, false if it's still coming
 */
export function isPastTimeWAT(date: Date): boolean {
  const now = getCurrentWATTime()              // What time is it right now in Nigeria?
  const compareDate = toWestAfricaTime(date)   // Convert the input date to Nigeria time
  return compareDate < now                     // Is the appointment time before right now?
}

/**
 * 🔄 Converts a Nigerian (WAT) datetime to UTC for database storage
 * 
 * This function takes a date/time that was created in Nigerian timezone
 * and converts it properly to UTC for storing in the database
 * 
 * @param watDate - A date in West Africa Time (Nigeria time)
 * @returns The same moment in time as UTC
 */
export function convertWATToUTC(watDate: Date): Date {
  // Get the time components in WAT
  const year = watDate.getFullYear()
  const month = watDate.getMonth()
  const day = watDate.getDate()
  const hours = watDate.getHours()
  const minutes = watDate.getMinutes()
  const seconds = watDate.getSeconds()
  
  // Create a date string in ISO format but specify it's in Lagos timezone
  // This ensures proper conversion to UTC
  const isoString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.000`
  
  // Create a temporary date to get the timezone offset for Lagos
  const tempDate = new Date()
  const lagosTime = new Date(tempDate.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }))
  const utcTime = new Date(tempDate.toLocaleString('en-US', { timeZone: 'UTC' }))
  const offset = utcTime.getTime() - lagosTime.getTime()
  
  // Apply the offset to convert WAT to UTC
  return new Date(new Date(isoString).getTime() + offset)
}

/**
 * 🔄 Converts a UTC datetime to Nigerian (WAT) time for display
 * 
 * This function takes a UTC date from the database and converts it
 * to the correct time to display to Nigerian users
 * 
 * @param utcDate - A date in UTC (from database)
 * @returns The same moment in time as WAT for display
 */
export function convertUTCToWAT(utcDate: Date): Date {
  return new Date(utcDate.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }))
}