const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgres://postgres.lsksjcuwmqezvmikjjkm:Agrolink@123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  const res = await client.query(`SELECT id, rating, comment, seller_reply FROM reviews WHERE rating <= 3 AND comment IS NOT NULL`);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
