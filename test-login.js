fetch('http://localhost:8081/api/auth/sign-in/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
}).then(res => res.text()).then(console.log).catch(console.error);
