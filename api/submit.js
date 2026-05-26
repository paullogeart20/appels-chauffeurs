const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZePDKjBd1ALG9vhGPgvtfZe2uio7S5uqbyKfSYdJHLMkIqUuBGUQSeP4cMYB-Xfjn/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = JSON.stringify(req.body);

    let response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get('location');
      response = await fetch(location, { method: 'GET' });
    }

    const text = await response.text();
    console.log('[submit] Apps Script status:', response.status, '| body:', text.slice(0, 500));

    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      return res.status(500).json({
        status: 'ERROR',
        message: 'Apps Script returned non-JSON (HTTP ' + response.status + ')',
        raw: text.slice(0, 300),
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ status: 'ERROR', message: err.message });
  }
}
