# Flutterwave Configuration Debug

## Issue
Flutterwave API is returning a 502 error during payment initialization.

## Quick Fixes

### 1. Check Environment Variables
Make sure these are set in your `.env.local`:
```
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Test Flutterwave Connection
Visit: http://localhost:3000/api/debug/flutterwave

### 3. Fallback for Development
If Flutterwave is down, the booking modal will automatically use the test appointment creation.

### 4. Common Issues
- **502 Error**: Flutterwave servers are temporarily down
- **403 Error**: API keys are invalid or expired
- **Missing Keys**: Environment variables not loaded

### 5. Environment Variable Sources
The app checks for base URL in this order:
1. `NEXT_PUBLIC_BASE_URL`
2. `NEXTAUTH_URL` 
3. `http://localhost:3000` (fallback)

### 6. Test Without Payment
If you need to test appointments without Flutterwave:
```bash
curl -X POST http://localhost:3000/api/debug/test-appointment \
  -H "Content-Type: application/json" \
  -d '{"doctorId":"doctor_id","scheduledAt":"2025-10-07T17:00:00.000Z","notes":"Test appointment"}'
```

## Current Status
- Added better error handling for 502 responses
- Created fallback test appointment endpoint
- Enhanced debugging with environment variable checks
- Modal now automatically uses fallback when Flutterwave is unavailable