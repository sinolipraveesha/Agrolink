const { Client } = require('pg');

const apiKey = 'AIzaSyBv-Xkrp449xsueC-dOj7-WK_kGgXcLZ1Y';

async function generateReply(comment, rating) {
  let sentimentPrompt;
  if (rating <= 2) {
    sentimentPrompt = `The following is a NEGATIVE buyer review (rated ${rating}/5). Analyze the statement and generate a short, sincere apology from the seller. Express that we are truly sorry for their experience. Then kindly ask them to please raise a support ticket mentioning the specific problem they faced with the product, so our team can look into it and resolve it as soon as possible. Keep it under 3 sentences. Do NOT use generic professional language. Be genuinely apologetic.\n\nReview: "${comment}"`;
  } else if (rating >= 4) {
    sentimentPrompt = `The following is a POSITIVE buyer review (rated ${rating}/5). Analyze the statement and generate a short, warm thank-you reply from the seller. Express genuine gratitude for their kind words and support. Keep it under 2-3 sentences. Be heartfelt, not generic.\n\nReview: "${comment}"`;
  } else {
    sentimentPrompt = `The following is a NEUTRAL buyer review (rated ${rating}/5). Analyze the statement and generate a short, balanced reply from the seller. Thank them for their honest feedback and mention that the team will work to improve. If there's any concern mentioned, suggest raising a support ticket mentioning the specific problem with the product. Keep it under 3 sentences.\n\nReview: "${comment}"`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: sentimentPrompt }] }],
      generationConfig: { maxOutputTokens: 200, temperature: 0.7 }
    })
  });

  if (!response.ok) throw new Error(`Gemini API Error: ${response.statusText}`);

  const data = await response.json();
  if (data.candidates && data.candidates.length > 0 && data.candidates[0].content.parts.length > 0) {
    return data.candidates[0].content.parts[0].text;
  }
  return null;
}

async function run() {
  const client = new Client({
    connectionString: 'postgres://postgres.lsksjcuwmqezvmikjjkm:Agrolink@123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Only re-generate for negative/neutral reviews (rating <= 3)
    const res = await client.query(`SELECT id, comment, rating FROM reviews WHERE comment IS NOT NULL AND comment != '' AND rating <= 3`);
    const reviews = res.rows;
    
    console.log(`Found ${reviews.length} negative/neutral reviews to update.\n`);

    for (const review of reviews) {
      console.log(`Review ID: ${review.id} | Rating: ${review.rating}/5`);
      console.log(`Comment: "${review.comment}"`);
      try {
        const reply = await generateReply(review.comment, review.rating);
        if (reply) {
          await client.query(`UPDATE reviews SET seller_reply = $1 WHERE id = $2`, [reply, review.id]);
          console.log(`New Reply: "${reply}"`);
          console.log(`Done!\n`);
        }
      } catch (err) {
        console.error(`Error:`, err.message);
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    console.log('All done!');
  } catch (err) {
    console.error('Database connection error', err);
  } finally {
    await client.end();
  }
}

run();
