const prisma = require('../db');
const { processNovaQuery } = require('../services/nova.service');

// ── POST /api/nova ────────────────────────────────────────────────────────────
const askNova = async (req, res, next) => {
  const query = String(req.body.query || '').trim();
  const userId = req.body.userId ?? null;

  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }
  if (query.length > 500) {
    return res.status(400).json({ error: 'Query is too long (max 500 characters).' });
  }

  try {
    const result = await processNovaQuery(query);
    const responseText = `${result.en}\n\n---\n\n${result.te}`;

    // Log query non-critically
    prisma.aiQuery
      .create({ data: { query, response: responseText, userId } })
      .catch((err) => console.error('[nova] Failed to log query:', err.message));

    res.json({ response: responseText, en: result.en, te: result.te, products: result.products || [] });
  } catch (err) {
    next(err);
  }
};

module.exports = { askNova };
