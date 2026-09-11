const { supabase, verifyAdmin, setCors } = require('../../_db');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  const { id } = req.query;
  if (supabase && id) {
    await supabase.from('respostas').delete().eq('id', id);
  }
  res.json({ success: true, message: 'Resposta removida com sucesso.' });
};
