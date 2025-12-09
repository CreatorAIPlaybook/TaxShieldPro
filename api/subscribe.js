import https from 'https';

export default async function handler(req, res) {
  // 1. Enable CORS (Allows your website to talk to this function)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // 2. Handle "Preflight" Check
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. Only allow POST requests (Submissions)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 4. Get Data
  const { email, firstName } = req.body;
  const pubId = process.env.BEEHIIV_PUB_ID;
  const apiKey = process.env.BEEHIIV_API_KEY;

  if (!email || !pubId || !apiKey) {
    console.error("Missing Creds: ", { email: !!email, pubId: !!pubId, apiKey: !!apiKey });
    return res.status(400).json({ error: 'Missing email or API credentials' });
  }

  // 5. Prepare Beehiiv Payload
  const data = JSON.stringify({
    email: email,
    reactivate_existing: false,
    send_welcome_email: true,
    utm_source: "Tax_Shield_Tool",
    custom_fields: firstName ? [{ name: "First Name", value: firstName }] : []
  });

  const options = {
    hostname: 'api.beehiiv.com',
    path: `/v2/publications/${pubId}/subscriptions`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': data.length
    }
  };

  // 6. Send to Beehiiv (Using Promise wrapper for cleaner async)
  return new Promise((resolve, reject) => {
    const apiReq = https.request(options, (apiRes) => {
      let body = '';
      apiRes.on('data', (chunk) => body += chunk);
      apiRes.on('end', () => {
        if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
          res.status(200).json({ success: true });
          resolve();
        } else if (apiRes.statusCode === 409) {
          // 409 means "Already Subscribed" - we treat this as a win
          res.status(200).json({ success: true, message: 'Already subscribed' });
          resolve();
        } else {
          console.error("Beehiiv Error:", body);
          res.status(apiRes.statusCode).json({ error: body });
          resolve();
        }
      });
    });

    apiReq.on('error', (error) => {
      console.error("Network Error:", error);
      res.status(500).json({ error: error.message });
      resolve();
    });

    apiReq.write(data);
    apiReq.end();
  });
}