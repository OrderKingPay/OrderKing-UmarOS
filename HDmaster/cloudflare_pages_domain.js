

const TOKEN = 'dummy_token';
const ACCOUNT_ID = 'fc53b6fd613df944a3a46606cfbf21d0';

async function request(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`https://api.cloudflare.com/client/v4${endpoint}`, options);
  const data = await res.json();
  if (!res.ok || !data.success) {
    console.error(`Error on ${method} ${endpoint}:`, data);
    return null;
  }
  return data;
}

async function run() {
  console.log('Fetching projects...');
  const projectsData = await request(`/accounts/${ACCOUNT_ID}/pages/projects`);
  if (!projectsData || !projectsData.success) {
    console.error('Failed to list projects.');
    return;
  }
  
  if (projectsData.result.length === 0) {
    console.log('No Pages projects found.');
    return;
  }
  
  const project = projectsData.result[0];
  const projectName = project.name;
  console.log(`Using project: ${projectName}`);
  
  const domains = ['orderkingpay.com', 'www.orderkingpay.com'];
  
  for (const domain of domains) {
    console.log(`Adding domain ${domain}...`);
    const res = await request(`/accounts/${ACCOUNT_ID}/pages/projects/${projectName}/domains`, 'POST', { name: domain });
    if (res && res.success) {
      console.log(`Successfully added ${domain}`);
    } else {
      console.error(`Failed to add ${domain}`);
    }
  }
}

run();
