const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DATA_FILE = path.join(__dirname, 'data', 'responses.json');

// Configuração do Supabase (se fornecidas as variáveis de ambiente)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('✅ Conectado com sucesso ao Supabase na nuvem!');
} else {
  console.log('ℹ️ Variáveis do Supabase não detectadas. Usando armazenamento local em data/responses.json.');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicializa arquivo de dados local para desenvolvimento offline
function initializeData() {
  if (!fs.existsSync(DATA_FILE)) {
    const seedData = [];
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
  }
}
initializeData();

// Ler respostas (Supabase ou Local)
async function getResponses() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('respostas')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) {
        console.error('Erro ao consultar Supabase:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Erro de conexão com Supabase:', err);
      return [];
    }
  } else {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      return [];
    }
  }
}

// Salvar nova resposta (Supabase ou Local)
async function saveResponse(newResp) {
  if (supabase) {
    const { data, error } = await supabase
      .from('respostas')
      .insert([newResp]);
    if (error) {
      throw new Error(error.message);
    }
    return newResp;
  } else {
    const current = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8') || '[]');
    current.unshift(newResp);
    fs.writeFileSync(DATA_FILE, JSON.stringify(current, null, 2), 'utf-8');
    return newResp;
  }
}

// Remover resposta (Supabase ou Local)
async function deleteResponseById(id) {
  if (supabase) {
    const { error } = await supabase
      .from('respostas')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    let current = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8') || '[]');
    current = current.filter(r => r.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(current, null, 2), 'utf-8');
  }
}

// Resetar todas as respostas (Supabase ou Local)
async function resetAllResponses() {
  if (supabase) {
    const { error } = await supabase
      .from('respostas')
      .delete()
      .neq('id', 'placeholder_keep_all');
    if (error) throw new Error(error.message);
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Middleware de autenticação Admin
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Acesso não autorizado. Faça login.' });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (token !== Buffer.from(ADMIN_PASSWORD).toString('base64')) {
    return res.status(403).json({ error: 'Credenciais inválidas.' });
  }
  next();
}

// 1. Rota de envio do formulário (Pública)
app.post('/api/submit', async (req, res) => {
  const {
    nome,
    genero,
    idade,
    profissao,
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
  } = req.body;

  if (!nome || !genero || !idade || !profissao || !transporte ||
      !q1_exaustao || !q2_endurecendo || !q3_trato_pacientes ||
      !q4_esgotado_fim_dia || !q5_culpam_problemas || !q6_entender_pacientes ||
      !q7_influencia_positiva || !q8_coisas_importantes || !q9_trato_objetos || !q10_cansaco_manha) {
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
    await saveResponse(newResponse);
    return res.status(201).json({
      success: true,
      message: 'Resposta gravada com sucesso! Obrigado pela sua participação.',
      id: newResponse.id
    });
  } catch (err) {
    console.error('Erro ao gravar resposta:', err);
    return res.status(500).json({ error: 'Erro ao salvar dados no banco de dados.' });
  }
});

// 2. Rota de login do Administrador
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = Buffer.from(ADMIN_PASSWORD).toString('base64');
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, error: 'Senha incorreta.' });
});

// 3. Rota de estatísticas e gráficos para o Administrador
app.get('/api/admin/stats', requireAdminAuth, async (req, res) => {
  const responses = await getResponses();

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

  res.json({
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
});

// 4. Rota para deletar resposta específica
app.delete('/api/admin/responses/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await deleteResponseById(id);
    res.json({ success: true, message: 'Resposta removida com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover resposta.' });
  }
});

// 5. Rota para limpar / resetar dados
app.post('/api/admin/reset-data', requireAdminAuth, async (req, res) => {
  try {
    await resetAllResponses();
    res.json({ success: true, message: 'Todas as respostas foram removidas.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao resetar respostas.' });
  }
});

// 6. Rota para Exportar CSV compatível com Excel (UTF-8 com BOM)
app.get('/api/admin/export-csv', requireAdminAuth, async (req, res) => {
  const responses = await getResponses();
  
  const headers = [
    "ID",
    "Data de Envio",
    "Nome",
    "Gênero",
    "Idade",
    "Profissão / Função",
    "Meio de Transporte",
    "1. Exaustão Emocional",
    "2. Endurecimento Emocional",
    "3. Trato Adequado dos Pacientes",
    "4. Esgotado ao Fim do Dia",
    "5. Pacientes Culpam por Problemas",
    "6. Compreensão dos Pacientes",
    "7. Influência Positiva em Vidas",
    "8. Realização de Coisas Importantes",
    "9. Trato Pacientes como Objetos",
    "10. Cansaço ao Acordar de Manhã"
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
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
});

// Rotas de Páginas
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
