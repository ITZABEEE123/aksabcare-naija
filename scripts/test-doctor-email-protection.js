// 🧪 TEST SCRIPT: Verify Doctor Email Protection
// =============================================
// This script tests that doctors cannot register as patients using their doctor email addresses

async function testDoctorEmailProtection() {
  console.log('🧪 Testing doctor email protection...\n')

  // Test 1: Try to register Dr. Fatima H. Bello as a patient
  console.log('Test 1: Attempting to register Dr. Fatima H. Bello as a patient...')
  
  const testRegistration = {
    firstName: 'Fatima',
    lastName: 'Test Patient',
    email: 'fatibellow@gmail.com', // This is Dr. Fatima's email
    phone: '+2348123456789',
    password: 'testpassword123',
    role: 'PATIENT'
  }

  try {
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRegistration)
    })

    const result = await response.json()
    
    if (response.status === 403 && result.code === 'DOCTOR_EMAIL_CONFLICT') {
      console.log('✅ SUCCESS: Doctor email protection is working!')
      console.log(`   Response: ${result.error}`)
    } else {
      console.log('❌ FAILED: Doctor was able to register as patient!')
      console.log(`   Status: ${response.status}`)
      console.log(`   Response:`, result)
    }
  } catch (error) {
    console.log('❌ ERROR: Failed to test registration')
    console.error(error)
  }

  console.log('\n🏁 Test completed!')
}

// Run the test
testDoctorEmailProtection()