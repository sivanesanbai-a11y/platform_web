const fs = require('fs');
const auth = JSON.parse(fs.readFileSync(process.env.APPDATA + '/com.vercel.cli/Data/auth.json', 'utf8'));
const teamId = 'team_7Y2KZFS6QJLNWXzzcewXmktl';
const projectId = 'prj_5wnDXuxhzTFtOQM2GF5cxuocYOna';

async function testAddDomain() {
  const res = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains?teamId=${teamId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'platformweb-five.vercel.app' })
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
}

testAddDomain().catch(console.error);
