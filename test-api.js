// 🧪 Simple test to check the API response
// This file tests our drugs API to make sure it's working properly
import fetch from 'node-fetch';

async function testDrugsAPI() {
  try {
    // Step 1: Make a request to our drugs API on port 3000
    const response = await fetch('http://localhost:3000/api/drugs');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response keys:', Object.keys(data));
    console.log('Drugs count:', data.drugs ? data.drugs.length : 'No drugs array');
    console.log('First drug:', data.drugs && data.drugs[0] ? data.drugs[0].name : 'No first drug');
    console.log('Full response structure:', JSON.stringify(data, null, 2).slice(0, 500) + '...');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDrugsAPI();