const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 2, role: 'admin' }, 'super_secret_key_motioncare', { expiresIn: '1h' });

fetch('http://localhost:5000/api/admin/patients', {
  headers: { Authorization: `Bearer ${token}` }
}).then(res => res.json()).then(console.log).catch(console.error);
