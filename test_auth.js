async function test() {
  try {
    const loginRes = await fetch('http://192.168.100.8:5000/api/auth/doctor/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sara@motioncare.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);
    
    if (loginData.success && loginData.data.token) {
      const statsRes = await fetch('http://192.168.100.8:5000/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${loginData.data.token}` }
      });
      const statsData = await statsRes.json();
      console.log('Stats Response (Code: ' + statsRes.status + '):', statsData);
    }
  } catch (err) {
    console.error('Test Error:', err);
  }
}
test();
