const users = [
  { email: 'suganya@nunesinstruments.com', password: 'suganya@2026', createdAt: '2026-10-23T06:00:00.000Z' },
  { email: 'suganya', password: 'suganya@2026', createdAt: '2026-10-23T06:00:00.000Z' },
  { email: 'rekha@nunesinstruments.com', password: 'rekha@2026', createdAt: '2026-10-23T06:00:00.000Z' },
  { email: 'rekha', password: 'rekha@2026', createdAt: '2026-10-23T06:00:00.000Z' },
  { email: 'sabitha@nunesinstruments.com', password: 'sabitha@2026', createdAt: '2026-10-23T06:00:00.000Z' },
  { email: 'sabitha', password: 'sabitha@2026', createdAt: '2026-10-23T06:00:00.000Z' },
  { email: 'azhalakupriya@nunesinstruments.com', password: 'priya@2026', createdAt: '2026-10-23T06:00:00.000Z' },
  { email: 'azhalakupriya', password: 'priya@2026', createdAt: '2026-10-23T06:00:00.000Z' },
  { email: 'priya', password: 'priya@2026', createdAt: '2026-10-23T06:00:00.000Z' },
  { email: 'aravindh@nunesinstruments.com', password: 'aravindh@2026', createdAt: '2026-10-23T06:00:00.000Z' },
  { email: 'aravindh', password: 'aravindh@2026', createdAt: '2026-10-23T06:00:00.000Z' },
  { email: 'md@nunesinstruments.com', password: 'md@nunes2026', createdAt: '2026-10-23T06:00:00.000Z' },
  { email: 'md', password: 'md@nunes2026', createdAt: '2026-10-23T06:00:00.000Z' },
  { email: 'admin@nunes.com', password: 'admin123', createdAt: '2026-10-23T06:00:00.000Z' },
  { email: 'admin', password: 'admin123', createdAt: '2026-10-23T06:00:00.000Z' }
];

async function main() {
  const url = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1678a1cc966e7';
  
  // Test 3: Users array
  let res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'nunes_master_store_v1',
      data: {
        users: users,
        last_updated: new Date().toISOString()
      }
    })
  });
  console.log('Users PUT status:', res.status, (await res.text()).slice(0, 100));

  // Test 4: Compressed json string
  const storeData = JSON.stringify({
    service_jobs: [],
    purchasing_orders: [],
    quotations: [],
    users: users,
    last_updated: new Date().toISOString()
  });

  res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'nunes_master_store_v1',
      data: {
        payload_json: storeData,
        last_updated: new Date().toISOString()
      }
    })
  });
  console.log('Payload JSON string PUT status:', res.status, (await res.text()).slice(0, 100));
}

main().catch(console.error);
