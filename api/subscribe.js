import https from 'https';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, firstName } = req.body;
  const pubId = process.env.BEEHIIV_PUB_ID;
  const apiKey = process.env.BEEHIIV_API_KEY;

  if (!email || !pubId || !apiKey) {
    return res.status(400).json({ error: 'Missing email or API credentials' });
  }

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

  const apiReq = https.request(options, (apiRes) => {
    let body = '';
    apiRes.on('data', (chunk) => body += chunk);
    apiRes.on('end', () => {
      if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
        res.status(200).json({ success: true });
      } else {
        if (apiRes.statusCode === 409) {
          res.status(200).json({ success: true, message: 'Already subscribed' });
        } else {
          res.status(apiRes.statusCode).json({ error: body });
        }
      }
    });
  });

  apiReq.on('error', (error) => {
    res.status(500).json({ error: error.message });
  });

  apiReq.write(data);
  apiReq.end();
}
