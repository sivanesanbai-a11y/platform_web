const fs = require('fs');
const auth = JSON.parse(fs.readFileSync(process.env.APPDATA + '/com.vercel.cli/Data/auth.json', 'utf8'));

async function main() {
  const userRes = await fetch('https://api.vercel.com/v2/user', {
    headers: { Authorization: `Bearer ${auth.token}` }
  });
  const userData = await userRes.json();
  console.log('User:', userData.user?.username, userData.user?.email);

  const teamsRes = await fetch('https://api.vercel.com/v2/teams', {
    headers: { Authorization: `Bearer ${auth.token}` }
  });
  const teamsData = await teamsRes.json();
  console.log('Teams:', teamsData.teams?.map(t => ({ id: t.id, slug: t.slug, name: t.name })));
}

main().catch(console.error);
