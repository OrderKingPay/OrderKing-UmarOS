const token = 'cfoat_wI1vN6DOyRGvrrumN46jIhmEvSWd63A13wULAD3Wx_0.o9zd-uB7x5N_E16JvpfI69OP4W0-XXgUm4LsXQ7GIq8';
const zoneId = '04869706822a9fc43d0cb9e65b116622'; // Extracted from previous response

fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data.result.map(r => ({name: r.name, type: r.type, content: r.content})), null, 2)))
.catch(err => console.error(err));
