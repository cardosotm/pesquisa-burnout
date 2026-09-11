const { supabase, verifyAdmin, setCors } = require('../_db');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  if (supabase) {
    await supabase.from('respostas').delete().neq('id', 'placeholder_keep_all');
  }
  res.json({ success: true, message: 'Todas as respostas foram removidas.' });
};
