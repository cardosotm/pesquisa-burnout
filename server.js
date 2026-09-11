const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DATA_FILE = path.join(__dirname, 'data', 'responses.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicializa arquivo de dados com dados de exemplo realistas se estiver vazio
function initializeData() {
  if (!fs.existsSync(DATA_FILE)) {
    const seedData = [
      {
        id: "demo-1",
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        nome: "Dra. Juliana Mendes",
        genero: "Feminino",
        idade: "30 a 34 anos",
        profissao: "Enfermeira UTI",
        transporte: "Carro",
        q1_exaustao: "Frequentemente",
        q2_endurecendo: "Algumas Vezes",
        q3_trato_pacientes: "Sempre",
        q4_esgotado_fim_dia: "Frequentemente",
        q5_culpam_problemas: "Raramente",
        q6_entender_pacientes: "Frequentemente"
      },
      {
        id: "demo-2",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        nome: "Dr. Carlos Eduardo",
        genero: "Masculino",
        idade: "35 a 39 anos",
        profissao: "Médico Plantonista",
        transporte: "Carro",
        q1_exaustao: "Sempre",
        q2_endurecendo: "Frequentemente",
        q3_trato_pacientes: "Frequentemente",
        q4_esgotado_fim_dia: "Sempre",
        q5_culpam_problemas: "Algumas Vezes",
        q6_entender_pacientes: "Algumas Vezes"
      },
      {
        id: "demo-3",
        createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        nome: "Mariana Oliveira",
        genero: "Feminino",
        idade: "25 a 29 anos",
        profissao: "Fisioterapeuta Hospitalar",
        transporte: "Ônibus",
        q1_exaustao: "Algumas Vezes",
        q2_endurecendo: "Raramente",
        q3_trato_pacientes: "Sempre",
        q4_esgotado_fim_dia: "Algumas Vezes",
        q5_culpam_problemas: "Raramente",
        q6_entender_pacientes: "Sempre"
      },
      {
        id: "demo-4",
        createdAt: new Date(Date.now() - 86400000 * 0.8).toISOString(),
        nome: "Lucas Ferreira",
        genero: "Masculino",
        idade: "18 a 24 anos",
        profissao: "Técnico em Enfermagem",
        transporte: "Moto",
        q1_exaustao: "Frequentemente",
        q2_endurecendo: "Algumas Vezes",
        q3_trato_pacientes: "Frequentemente",
        q4_esgotado_fim_dia: "Frequentemente",
        q5_culpam_problemas: "Algumas Vezes",
        q6_entender_pacientes: "Frequentemente"
      },
      {
        id: "demo-5",
        createdAt: new Date(Date.now() - 86400000 * 0.2).toISOString(),
        nome: "Beatriz Santos",
        genero: "Feminino",
        idade: "40+ anos",
        profissao: "Psicóloga Clínica",
        transporte: "Bicicleta",
        q1_exaustao: "Raramente",
        q2_endurecendo: "Nunca",
        q3_trato_pacientes: "Sempre",
        q4_esgotado_fim_dia: "Raramente",
        q5_culpam_problemas: "Nunca",
        q6_entender_pacientes: "Sempre"
      }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
  }
}

initializeData();

function readResponses() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeResponses(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
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
app.post('/api/submit', (req, res) => {
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
    q6_entender_pacientes
  } = req.body;

  if (!nome || !genero || !idade || !profissao || !transporte ||
      !q1_exaustao || !q2_endurecendo || !q3_trato_pacientes ||
      !q4_esgotado_fim_dia || !q5_culpam_problemas || !q6_entender_pacientes) {
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
    q6_entender_pacientes
  };

  const current = readResponses();
  current.unshift(newResponse);
  writeResponses(current);

  return res.status(201).json({
    success: true,
    message: 'Resposta gravada com sucesso! Obrigado pela sua participação.',
    id: newResponse.id
  });
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
app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
  const responses = readResponses();

  // Escala Likert de referência
  const likertOptions = ['Nunca', 'Raramente', 'Algumas Vezes', 'Frequentemente', 'Sempre'];
  const likertScores = { 'Nunca': 0, 'Raramente': 1, 'Algumas Vezes': 2, 'Frequentemente': 3, 'Sempre': 4 };

  // Totais por Gênero
  const generoCounts = { 'Masculino': 0, 'Feminino': 0, 'Outro': 0 };
  
  // Totais por Faixa Etária
  const idadeCounts = {
    '18 a 24 anos': 0,
    '25 a 29 anos': 0,
    '30 a 34 anos': 0,
    '35 a 39 anos': 0,
    '40+ anos': 0
  };

  // Totais por Transporte
  const transporteCounts = {
    'Carro': 0,
    'Moto': 0,
    'Ônibus': 0,
    'Bicicleta': 0,
    'A pé': 0
  };

  // Matrizes das 6 perguntas de Burnout
  const questionsMeta = [
    { key: 'q1_exaustao', label: '1. Exaustão emocional pelo trabalho', type: 'burnout' },
    { key: 'q2_endurecendo', label: '2. Trabalho endurecendo emocionalmente', type: 'burnout' },
    { key: 'q3_trato_pacientes', label: '3. Trato de forma adequada os pacientes', type: 'positive' },
    { key: 'q4_esgotado_fim_dia', label: '4. Esgotado ao final do dia', type: 'burnout' },
    { key: 'q5_culpam_problemas', label: '5. Pacientes me culpam pelos problemas', type: 'burnout' },
    { key: 'q6_entender_pacientes', label: '6. Entendo facilmente o que sentem os pacientes', type: 'positive' }
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

  responses.forEach(r => {
    // Gênero
    if (generoCounts[r.genero] !== undefined) {
      generoCounts[r.genero]++;
    } else {
      generoCounts['Outro'] = (generoCounts['Outro'] || 0) + 1;
    }

    // Idade
    if (idadeCounts[r.idade] !== undefined) {
      idadeCounts[r.idade]++;
    } else {
      idadeCounts[r.idade] = 1;
    }

    // Transporte
    if (transporteCounts[r.transporte] !== undefined) {
      transporteCounts[r.transporte]++;
    } else {
      transporteCounts[r.transporte] = 1;
    }

    // Perguntas
    let respondentBurnoutScore = 0;
    questionsMeta.forEach(q => {
      const val = r[q.key];
      if (questionsMatrix[q.key] && questionsMatrix[q.key].counts[val] !== undefined) {
        questionsMatrix[q.key].counts[val]++;
      }
      const score = likertScores[val] ?? 0;
      if (q.type === 'burnout') {
        respondentBurnoutScore += score; // 0 a 4
      } else {
        respondentBurnoutScore += (4 - score); // escala inversa para burnout
      }
    });

    // Score percentual (máx 24 pontos -> 6 * 4)
    totalBurnoutScore += (respondentBurnoutScore / 24) * 100;
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
app.delete('/api/admin/responses/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  let current = readResponses();
  const initialLength = current.length;
  current = current.filter(r => r.id !== id);
  if (current.length === initialLength) {
    return res.status(404).json({ error: 'Resposta não encontrada.' });
  }
  writeResponses(current);
  res.json({ success: true, message: 'Resposta removida com sucesso.' });
});

// 5. Rota para limpar / resetar dados de teste
app.post('/api/admin/reset-data', requireAdminAuth, (req, res) => {
  writeResponses([]);
  res.json({ success: true, message: 'Todas as respostas foram removidas.' });
});

// 6. Rota para Exportar CSV compatível com Excel (UTF-8 com BOM)
app.get('/api/admin/export-csv', requireAdminAuth, (req, res) => {
  const responses = readResponses();
  
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
    "6. Compreensão dos Pacientes"
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
    escapeCSV(r.q6_entender_pacientes)
  ].join(';'));

  // \uFEFF adiciona o Byte Order Mark (BOM) para o Excel abrir direto com acentuação correta em português
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

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Servidor da Pesquisa rodando com sucesso!`);
  console.log(`📝 Formulário Público: http://localhost:${PORT}/`);
  console.log(`📊 Painel do Administrador: http://localhost:${PORT}/admin`);
  console.log(`🔑 Senha padrão do Administrador: ${ADMIN_PASSWORD}`);
  console.log(`====================================================`);
});
