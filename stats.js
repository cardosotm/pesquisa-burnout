const { supabase, verifyAdmin, setCors } = require('../_db');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  try {
    let responses = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('respostas')
        .select('*')
        .order('createdAt', { ascending: false });
      if (!error && data) responses = data;
    }

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
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dados.' });
  }
};
