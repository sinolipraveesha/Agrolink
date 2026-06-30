const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgres://postgres.lsksjcuwmqezvmikjjkm:Agrolink@123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected');

  const reply = "We're truly sorry about your experience. Please raise a support ticket describing the specific issue with the product so our team can look into it and get it resolved for you as soon as possible.";

  await client.query(`UPDATE reviews SET seller_reply = $1 WHERE rating <= 2 AND comment IS NOT NULL`, [reply]);
  console.log('Updated all negative reviews with apology + ticket suggestion');

  await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
