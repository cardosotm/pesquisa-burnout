const { createClient } = require('@supabase/supabase-js');

// Credenciais diretas do Supabase para garantir conexão 100% à prova de erros de digitação
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://onvxicwohhrmqjxfzork.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udnhpY3dvaGhybXFqeGZ6b3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODk5NDcsImV4cCI6MjEwNDY2NTk0N30.yTE2alrQT0vhm78rHKZMY4YJ1MsjINnqjpYYtxmD3zM';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const supabase = createClient(SUPABASE_URL.trim(), SUPABASE_KEY.trim());

function verifyAdmin(req) {
  const authHeader = req.headers ? (req.headers.authorization || req.headers.Authorization) : null;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return decoded === ADMIN_PASSWORD;
  } catch (e) {
    return false;
  }
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse Body
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  if (!body || typeof body !== 'object') {
    body = {};
  }

  // Determine endpoint
  let endpoint = (req.query && req.query.endpoint) ? String(req.query.endpoint) : '';
  if (!endpoint && req.url) {
    const cleanUrl = req.url.split('?')[0];
    endpoint = cleanUrl.replace(/^\/api\/?/, '').replace(/^\/+/, '');
  }
  endpoint = endpoint.replace(/^\/+/, '').replace(/\/+$/, '');

  // 1. ROTA DE LOGIN ADMIN
  if (endpoint === 'admin/login') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { password } = body;
    if (password === ADMIN_PASSWORD) {
      const token = Buffer.from(ADMIN_PASSWORD).toString('base64');
      return res.status(200).json({ success: true, token });
    }
    return res.status(401).json({ success: false, error: 'Senha incorreta.' });
  }

  // 2. ROTA DE SUBMISSÃO DE RESPOSTAS
  if (endpoint === 'submit') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const {
      nome, genero, idade, profissao, transporte,
      q1_exaustao, q2_endurecendo, q3_trato_pacientes, q4_esgotado_fim_dia,
      q5_culpam_problemas, q6_entender_pacientes, q7_influencia_positiva,
      q8_coisas_importantes, q9_trato_objetos, q10_cansaco_manha
    } = body;

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
      const { error } = await supabase.from('respostas').insert([newResponse]);
      if (error) {
        console.error('Erro Supabase Insert:', error);
        throw new Error(error.message || 'Falha ao salvar no banco');
      }
      return res.status(201).json({
        success: true,
        message: 'Resposta gravada com sucesso! Obrigado pela sua participação.',
        id: newResponse.id
      });
    } catch (err) {
      console.error('Erro ao salvar no banco:', err);
      return res.status(500).json({
        error: 'Erro ao salvar dados no banco de dados.',
        details: err.message
      });
    }
  }

  // 3. ROTA DE ESTATÍSTICAS ADMIN
  if (endpoint === 'admin/stats') {
    if (!verifyAdmin(req)) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    try {
      let responses = [];
      const { data, error } = await supabase
        .from('respostas')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) console.error('Erro Supabase Select:', error);
      if (!error && data) responses = data;

      const likertScores = { 'Nunca': 0, 'Raramente': 1, 'Algumas Vezes': 2, 'Frequentemente': 3, 'Sempre': 4 };
      const generoCounts = { 'Masculino': 0, 'Feminino': 0, 'Outro': 0 };
      const idadeCounts = {
        '18 a 24 anos': 0,
        '25 a 29 anos': 0,
        '30 a 34 anos': 0,
        '35 a 39 anos': 0,
        '40+ anos': 0
      };
      const transporteCounts = {
        'Carro': 0,
        'Moto': 0,
        'Ônibus': 0,
        'Bicicleta': 0,
        'A pé': 0
      };

      const questionsMeta = [
        { key: 'q1_exaustao', label: '1. Exaustão emocional pelo trabalho', type: 'burnout' },
        { key: 'q2_endurecendo', label: '2. Trabalho endurecendo emocionalmente', type: 'burnout' },
        { key: 'q3_trato_pacientes', label: '3. Trato de forma adequada os pacientes', type: 'positive' },
        { key: 'q4_esgotado_fim_dia', label: '4. Esgotado ao final do dia', type: 'burnout' },
        { key: 'q5_culpam_problemas', label: '5. Pacientes me culpam pelos problemas', type: 'burnout' },
        { key: 'q6_entender_pacientes', label: '6. Entendo facilmente o que sentem os pacientes', type: 'positive' },
        { key: 'q7_influencia_positiva', label: '7. Influência positiva na vida de pessoas', type: 'positive' },
        { key: 'q8_coisas_importantes', label: '8. Realização de coisas importantes', type: 'positive' },
        { key: 'q9_trato_objetos', label: '9. Trato pacientes como objetos', type: 'burnout' },
        { key: 'q10_cansaco_manha', label: '10. Cansaço ao acordar de manhã', type: 'burnout' }
      ];

      const questionsMatrix = {};
      questionsMeta.forEach(q => {
        questionsMatrix[q.key] = {
          label: q.label,
          type: q.type,
          counts: { 'Nunca': 0, 'Raramente': 0, 'Algumas Vezes': 0, 'Frequentemente': 0, 'Sempre': 0 }
        };
      });

      let totalBurnoutScore = 0;
      let scoredCount = 0;
      const maxPossibleScore = questionsMeta.length * 4;

      responses.forEach(r => {
        if (generoCounts[r.genero] !== undefined) generoCounts[r.genero]++;
        else generoCounts['Outro'] = (generoCounts['Outro'] || 0) + 1;

        if (idadeCounts[r.idade] !== undefined) idadeCounts[r.idade]++;
        else idadeCounts[r.idade] = 1;

        if (transporteCounts[r.transporte] !== undefined) transporteCounts[r.transporte]++;
        else transporteCounts[r.transporte] = 1;

        let respondentBurnoutScore = 0;
        questionsMeta.forEach(q => {
          const val = r[q.key];
          if (questionsMatrix[q.key] && questionsMatrix[q.key].counts[val] !== undefined) {
            questionsMatrix[q.key].counts[val]++;
          }
          const score = likertScores[val] ?? 0;
          if (q.type === 'burnout') respondentBurnoutScore += score;
          else respondentBurnoutScore += (4 - score);
        });

        totalBurnoutScore += (respondentBurnoutScore / maxPossibleScore) * 100;
        scoredCount++;
      });

      const averageBurnoutPercentage = scoredCount > 0 ? Math.round(totalBurnoutScore / scoredCount) : 0;
      let burnoutRiskLevel = 'Baixo';
      if (averageBurnoutPercentage >= 65) burnoutRiskLevel = 'Alto / Crítico';
      else if (averageBurnoutPercentage >= 40) burnoutRiskLevel = 'Moderado';

      return res.status(200).json({
        totalResponses: responses.length,
        averageBurnoutPercentage,
        burnoutRiskLevel,
        generoCounts,
        idadeCounts,
        transporteCounts,
        questionsMatrix,
        questionsMeta,
        responses
      });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao buscar dados.', details: err.message });
    }
  }

  // 4. ROTA DE EXPORTAR CSV
  if (endpoint === 'admin/export-csv') {
    if (!verifyAdmin(req)) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    let responses = [];
    const { data } = await supabase.from('respostas').select('*').order('createdAt', { ascending: false });
    if (data) responses = data;

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
    return res.status(200).send(csvContent);
  }

  // 5. ROTA DE RESETAR DADOS
  if (endpoint === 'admin/reset-data') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!verifyAdmin(req)) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }
    await supabase.from('respostas').delete().neq('id', 'placeholder_keep_all');
    return res.status(200).json({ success: true, message: 'Todas as respostas foram removidas.' });
  }

  // 6. ROTA DE DELETAR RESPOSTA INDIVIDUAL
  if (endpoint.startsWith('admin/responses/')) {
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
    if (!verifyAdmin(req)) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }
    const id = endpoint.replace('admin/responses/', '');
    if (id) {
      await supabase.from('respostas').delete().eq('id', id);
    }
    return res.status(200).json({ success: true, message: 'Resposta removida com sucesso.' });
  }

  // 7. DEFAULT: STATUS
  return res.status(200).json({
    status: 'online',
    endpointReceived: endpoint || 'root',
    timestamp: new Date().toISOString()
  });
};
