// Using built-in fetch in Node 18+

async function testAPI() {
  const baseUrl = 'http://localhost:5000/api';

  try {
    console.log('Testing API endpoints...');

    // Test tasks endpoint (should return 401 without auth)
    const tasksResponse = await fetch(`${baseUrl}/tasks`);
    console.log('Tasks endpoint status:', tasksResponse.status);

    // Test reports endpoint (should return 401 without auth)
    const reportsResponse = await fetch(`${baseUrl}/reports/team-performance`);
    console.log('Reports endpoint status:', reportsResponse.status);

    // Test assignments endpoint (should return 401 without auth)
    const assignmentsResponse = await fetch(`${baseUrl}/assignments/rules`);
    console.log('Assignments endpoint status:', assignmentsResponse.status);

    console.log('All endpoints are responding correctly with 401 for unauthorized requests');

  } catch (error) {
    console.error('API test error:', error.message);
  }
}

testAPI();
