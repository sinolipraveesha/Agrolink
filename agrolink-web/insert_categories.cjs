const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgres://postgres.lsksjcuwmqezvmikjjkm:Agrolink@123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected');

  const res = await client.query(`
    INSERT INTO categories (name, type) VALUES 
      ('Fertilizers', 'FARMERS_SHOP'),
      ('Seeds', 'FARMERS_SHOP'),
      ('Pesticides', 'FARMERS_SHOP'),
      ('Tools & Equipment', 'FARMERS_SHOP'),
      ('Organic Products', 'FARMERS_SHOP'),
      ('Animal Feed', 'FARMERS_SHOP'),
      ('Irrigation', 'FARMERS_SHOP'),
      ('Packaging', 'FARMERS_SHOP')
    RETURNING id, name, type
  `);

  console.log('Inserted categories:');
  res.rows.forEach(r => console.log(`  [${r.id}] ${r.name} (${r.type})`));

  await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
