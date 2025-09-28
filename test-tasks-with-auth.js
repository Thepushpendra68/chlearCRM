const fs = require('fs');

// First, let's get the token from the browser's localStorage if it exists
// This mimics what the frontend would send

async function testTasksAPIWithAuth() {
  try {
    console.log('🧪 Testing tasks API with authentication...');

    // Test with curl to see exact response
    const { exec } = require('child_process');

    // Let's just test if we can reach the API endpoints without auth first
    exec('curl -s -X GET http://localhost:5000/api/tasks', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error testing tasks API:', error);
        return;
      }

      console.log('📋 Tasks API response (without auth):');
      console.log(stdout);

      if (stderr) {
        console.log('⚠️ Stderr:', stderr);
      }
    });

    // Test stats endpoint
    exec('curl -s -X GET http://localhost:5000/api/tasks/stats', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error testing tasks stats API:', error);
        return;
      }

      console.log('📊 Tasks stats API response (without auth):');
      console.log(stdout);

      if (stderr) {
        console.log('⚠️ Stderr:', stderr);
      }
    });

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testTasksAPIWithAuth();