const fs = require('fs');
const auth = JSON.parse(fs.readFileSync(process.env.APPDATA + '/com.vercel.cli/Data/auth.json', 'utf8'));
const teamId = 'team_7Y2KZFS6QJLNWXzzcewXmktl';

async function main() {
  const projRes = await fetch(`https://api.vercel.com/v9/projects?teamId=${teamId}`, {
    headers: { Authorization: `Bearer ${auth.token}` }
  });
  const projData = await projRes.json();
  for (const p of projData.projects || []) {
    console.log('Project:', p.name, p.id);
    const domRes = await fetch(`https://api.vercel.com/v9/projects/${p.id}/domains?teamId=${teamId}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    const domData = await domRes.json();
    console.log('  Domains:', domData.domains?.map(d => d.name));
    
    // Also check aliases
    const aliasRes = await fetch(`https://api.vercel.com/v2/deployments?projectId=${p.id}&teamId=${teamId}&limit=3`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    const aliasData = await aliasRes.json();
    for (const d of aliasData.deployments || []) {
      console.log('  Deployment:', d.url, d.state, 'target:', d.target);
    }
  }
}

main().catch(console.error);
