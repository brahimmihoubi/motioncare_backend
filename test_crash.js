const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/doctor/login', {
      email: 'john.doe@hospital.com',
      password: 'password123'
    });
    const token = loginRes.data.data.token;
    console.log('Logged in:', token.substring(0, 20));

    // init session 1
    await axios.post('http://localhost:5000/api/sessions/1/exo/init', {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(e => console.log('Init error (might already exist):', e.response?.data));

    // start session 1
    const startRes = await axios.post('http://localhost:5000/api/sessions/1/exo/start', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Started session:', startRes.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();
