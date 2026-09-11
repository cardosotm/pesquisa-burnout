const { supabase, verifyAdmin, setCors } = require('../_db');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  let responses = [];
  if (supabase) {
    const { data } = await supabase.from('respostas').select('*').order('createdAt', { ascending: false });
    if (data) responses = data;
  }

  const headers = [
    "ID", "Data de Envio", "Nome", "Gênero", "Idade", "Profissão / Função", "Meio de Transporte",
    "1. Exaustão Emocional", "2. Endurecimento Emocional", "3. Trato Adequado dos Pacientes",
    "4. Esgotado ao Fim do Dia", "5. Pacientes Culpam por Problemas", "6. Compreensão dos Pacientes",
    "7. Influência Positiva em Vidas", "8. Realização de Coisas Importantes", "9. Trato Pacientes como Objetos",
    "10. Cansaço ao Acordar de Manhã"
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
  };

  const rows = responses.map(r => [
    escapeCSV(r.id),
    escapeCSV(new Date(r.createdAt).toLocaleString('pt-BR')),
    escapeCSV(r.nome),
    escapeCSV(r.genero),
    escapeCSV(r.idade),
    escapeCSV(r.profissao),
    escapeCSV(r.transporte),
    escapeCSV(r.q1_exaustao),
    escapeCSV(r.q2_endurecendo),
    escapeCSV(r.q3_trato_pacientes),
    escapeCSV(r.q4_esgotado_fim_dia),
    escapeCSV(r.q5_culpam_problemas),
    escapeCSV(r.q6_entender_pacientes),
    escapeCSV(r.q7_influencia_positiva),
    escapeCSV(r.q8_coisas_importantes),
    escapeCSV(r.q9_trato_objetos),
    escapeCSV(r.q10_cansaco_manha)
  ].join(';'));

  const csvContent = '\uFEFF' + headers.map(h => `"${h}"`).join(';') + '\n' + rows.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="pesquisa_respostas_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csvContent);
};
