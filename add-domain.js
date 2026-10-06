const token = 'cfoat_wI1vN6DOyRGvrrumN46jIhmEvSWd63A13wULAD3Wx_0.o9zd-uB7x5N_E16JvpfI69OP4W0-XXgUm4LsXQ7GIq8';
const accountId = 'fc53b6fd613df944a3a46606cfbf21d0';
const projectName = 'orderking-customers';
const domain = 'www.orderkingpay.com';

fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: domain })
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
