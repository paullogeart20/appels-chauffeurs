const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZePDKjBd1ALG9vhGPgvtfZe2uio7S5uqbyKfSYdJHLMkIqUuBGUQSeP4cMYB-Xfjn/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = JSON.stringify(req.body);

    // Google Apps Script returns a 302 redirect on POST requests.
    // Node fetch follows it by converting POST→GET (browser standard).
    // We intercept the redirect and re-send as POST to the final URL.
    let response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get('location');
      response = await fetch(location, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ status: 'ERROR', message: err.message });
  }
}
