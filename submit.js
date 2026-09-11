const { supabase, setCors } = require('./_db');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }

  const {
    nome, genero, idade, profissao, transporte,
    q1_exaustao, q2_endurecendo, q3_trato_pacientes, q4_esgotado_fim_dia,
    q5_culpam_problemas, q6_entender_pacientes, q7_influencia_positiva,
    q8_coisas_importantes, q9_trato_objetos, q10_cansaco_manha
  } = body || {};

  if (!nome || !genero || !idade || !profissao || !transporte ||
      !q1_exaustao || !q2_endurecendo || !q3_trato_pacientes || !q4_esgotado_fim_dia ||
      !q5_culpam_problemas || !q6_entender_pacientes || !q7_influencia_positiva ||
      !q8_coisas_importantes || !q9_trato_objetos || !q10_cansaco_manha) {
    return res.status(400).json({ error: 'Por favor, preencha todos os campos obrigatórios.' });
  }

  const newResponse = {
    id: "resp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
    nome: String(nome).trim(),
    genero,
    idade,
    profissao: String(profissao).trim(),
    transporte,
    q1_exaustao,
    q2_endurecendo,
    q3_trato_pacientes,
    q4_esgotado_fim_dia,
    q5_culpam_problemas,
    q6_entender_pacientes,
    q7_influencia_positiva,
    q8_coisas_importantes,
    q9_trato_objetos,
    q10_cansaco_manha
  };

  try {
    if (supabase) {
      const { error } = await supabase.from('respostas').insert([newResponse]);
      if (error) throw new Error(error.message);
    }
    return res.status(201).json({
      success: true,
      message: 'Resposta gravada com sucesso! Obrigado pela sua participação.',
      id: newResponse.id
    });
  } catch (err) {
    console.error('Erro ao salvar no Supabase:', err);
    return res.status(500).json({ error: 'Erro ao salvar dados no banco de dados.' });
  }
};
