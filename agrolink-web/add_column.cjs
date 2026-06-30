const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgres://postgres.lsksjcuwmqezvmikjjkm:Agrolink@123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected');

  // Add shop_product_id column if it doesn't exist
  try {
    await client.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS shop_product_id UUID`);
    console.log('Added shop_product_id column to reviews table');
  } catch (e) {
    console.log('Column might already exist:', e.message);
  }

  await client.end();
  console.log('Done');
}

run().catch(e => { console.error(e); process.exit(1); });
