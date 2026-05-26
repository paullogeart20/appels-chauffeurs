const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZePDKjBd1ALG9vhGPgvtfZe2uio7S5uqbyKfSYdJHLMkIqUuBGUQSeP4cMYB-Xfjn/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const sheet = req.query.sheet || 'drivers';
  const url = sheet === 'responses'
    ? APPS_SCRIPT_URL + '?sheet=responses'
    : APPS_SCRIPT_URL;

  try {
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ status: 'ERROR', message: err.message });
  }
}
