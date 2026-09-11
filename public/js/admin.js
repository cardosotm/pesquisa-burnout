document.addEventListener('DOMContentLoaded', () => {
  const loginModal = document.getElementById('login-modal');
  const adminDashboard = document.getElementById('admin-dashboard');
  const loginForm = document.getElementById('admin-login-form');
  const passwordInput = document.getElementById('admin-password');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const btnLogout = document.getElementById('btn-logout');
  const btnRefresh = document.getElementById('btn-refresh');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnResetData = document.getElementById('btn-reset-data');
  const searchInput = document.getElementById('search-input');
  const tableBody = document.getElementById('table-responses-body');

  const detailModal = document.getElementById('detail-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const modalRespName = document.getElementById('modal-resp-name');
  const modalRespDate = document.getElementById('modal-resp-date');
  const modalRespContent = document.getElementById('modal-resp-content');

  // Variáveis para instâncias dos gráficos Chart.js
  let chartGender = null;
  let chartAge = null;
  let chartTransport = null;
  let chartLikert = null;
  let chartRadar = null;

  let currentData = null;

  // Recupera token salvo
  function getAuthToken() {
    return sessionStorage.getItem('burnout_admin_token');
  }

  function setAuthToken(token) {
    sessionStorage.setItem('burnout_admin_token', token);
  }

  function clearAuthToken() {
    sessionStorage.removeItem('burnout_admin_token');
  }

  // Verifica estado inicial de autenticação
  if (getAuthToken()) {
    showDashboard();
    fetchStats();
  } else {
    showLogin();
  }

  function showLogin() {
    loginModal.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
  }

  function showDashboard() {
    loginModal.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
  }

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = passwordInput.value;
    loginErrorMsg.classList.add('hidden');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAuthToken(data.token);
        passwordInput.value = '';
        showDashboard();
        fetchStats();
      } else {
        loginErrorMsg.classList.remove('hidden');
        document.getElementById('login-error-text').textContent = data.error || 'Senha incorreta.';
      }
    } catch (err) {
      loginErrorMsg.classList.remove('hidden');
      document.getElementById('login-error-text').textContent = 'Erro ao conectar ao servidor.';
    }
  });

  // Logout
  btnLogout.addEventListener('click', () => {
    clearAuthToken();
    showLogin();
  });

  // Atualizar
  btnRefresh.addEventListener('click', () => {
    btnRefresh.querySelector('i').classList.add('fa-spin');
    fetchStats().finally(() => {
      setTimeout(() => btnRefresh.querySelector('i').classList.remove('fa-spin'), 600);
    });
  });

  // Exportar CSV
  btnExportCsv.addEventListener('click', () => {
    const token = getAuthToken();
    fetch('/api/admin/export-csv', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(resp => {
      if (!resp.ok) throw new Error('Falha na exportação');
      return resp.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `pesquisa_respostas_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => {
      alert('Erro ao baixar arquivo CSV: ' + err.message);
    });
  });

  // Limpar dados
  btnResetData.addEventListener('click', async () => {
    if (confirm('Tem certeza que deseja apagar todas as respostas salvas? Esta ação não pode ser desfeita.')) {
      const token = getAuthToken();
      const res = await fetch('/api/admin/reset-data', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchStats();
      }
    }
  });

  // Buscar dados da API
  async function fetchStats() {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        clearAuthToken();
        showLogin();
        return;
      }

      const data = await res.json();
      currentData = data;
      renderKPIs(data);
      renderCharts(data);
      renderTable(data.responses);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    }
  }

  // Renderizar KPIs
  function renderKPIs(data) {
    document.getElementById('kpi-total').textContent = data.totalResponses;
    
    // Nível de Burnout
    const burnoutEl = document.getElementById('kpi-burnout-score');
    const badgeEl = document.getElementById('kpi-burnout-badge');
    burnoutEl.textContent = `${data.averageBurnoutPercentage}%`;
    badgeEl.textContent = data.burnoutRiskLevel;

    badgeEl.className = 'px-2 py-0.5 rounded text-[11px] font-bold';
    if (data.burnoutRiskLevel.includes('Alto')) {
      badgeEl.classList.add('bg-rose-100', 'text-rose-800');
    } else if (data.burnoutRiskLevel === 'Moderado') {
      badgeEl.classList.add('bg-amber-100', 'text-amber-800');
    } else {
      badgeEl.classList.add('bg-emerald-100', 'text-emerald-800');
    }

    // Idade predominante
    let topAge = '-';
    let maxAgeCount = -1;
    Object.entries(data.idadeCounts).forEach(([age, count]) => {
      if (count > maxAgeCount) {
        maxAgeCount = count;
        topAge = count > 0 ? age : '-';
      }
    });
    document.getElementById('kpi-top-age').textContent = topAge;

    // Transporte predominante
    let topTransport = '-';
    let maxTransCount = -1;
    Object.entries(data.transporteCounts).forEach(([trans, count]) => {
      if (count > maxTransCount) {
        maxTransCount = count;
        topTransport = count > 0 ? trans : '-';
      }
    });
    document.getElementById('kpi-top-transport').textContent = topTransport;
  }

  // Renderizar Gráficos Chart.js
  function renderCharts(data) {
    // 1. Gráfico Gênero (Donut)
    const ctxGender = document.getElementById('chart-gender').getContext('2d');
    if (chartGender) chartGender.destroy();

    const genderLabels = ['Masculino', 'Feminino'];
    const genderValues = [data.generoCounts['Masculino'] || 0, data.generoCounts['Feminino'] || 0];

    chartGender = new Chart(ctxGender, {
      type: 'doughnut',
      data: {
        labels: genderLabels,
        datasets: [{
          data: genderValues,
          backgroundColor: ['#0284c7', '#ec4899'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        },
        cutout: '65%'
      }
    });

    // 2. Gráfico Idade (Barra)
    const ctxAge = document.getElementById('chart-age').getContext('2d');
    if (chartAge) chartAge.destroy();

    const ageLabels = Object.keys(data.idadeCounts);
    const ageValues = Object.values(data.idadeCounts);

    chartAge = new Chart(ctxAge, {
      type: 'bar',
      data: {
        labels: ageLabels,
        datasets: [{
          label: 'Participantes',
          data: ageValues,
          backgroundColor: '#6366f1',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } },
          x: { ticks: { font: { size: 9 } } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    // 3. Gráfico Transporte (Doughnut / Polar)
    const ctxTransport = document.getElementById('chart-transport').getContext('2d');
    if (chartTransport) chartTransport.destroy();

    const transLabels = Object.keys(data.transporteCounts);
    const transValues = Object.values(data.transporteCounts);

    chartTransport = new Chart(ctxTransport, {
      type: 'doughnut',
      data: {
        labels: transLabels,
        datasets: [{
          data: transValues,
          backgroundColor: ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#f43f5e'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        },
        cutout: '55%'
      }
    });

    // 4. Matriz das 6 Afirmações da Escala (Barras Empilhadas)
    const ctxLikert = document.getElementById('chart-likert-matrix').getContext('2d');
    if (chartLikert) chartLikert.destroy();

    const questionsLabels = [
      '1. Exaustão Emocional',
      '2. Endurecimento',
      '3. Trato Adequado',
      '4. Esgotamento Final Dia',
      '5. Culpa de Pacientes',
      '6. Entendimento Empático',
      '7. Influência Positiva',
      '8. Realização Importante',
      '9. Pacientes como Objetos',
      '10. Cansaço Matinal'
    ];

    const keys = [
      'q1_exaustao',
      'q2_endurecendo',
      'q3_trato_pacientes',
      'q4_esgotado_fim_dia',
      'q5_culpam_problemas',
      'q6_entender_pacientes',
      'q7_influencia_positiva',
      'q8_coisas_importantes',
      'q9_trato_objetos',
      'q10_cansaco_manha'
    ];
    const likertLevels = ['Nunca', 'Raramente', 'Algumas Vezes', 'Frequentemente', 'Sempre'];
    const colors = ['#cbd5e1', '#93c5fd', '#fbbf24', '#f97316', '#ef4444'];

    const datasets = likertLevels.map((level, idx) => ({
      label: level,
      data: keys.map(k => (data.questionsMatrix[k] ? data.questionsMatrix[k].counts[level] : 0)),
      backgroundColor: colors[idx],
      borderRadius: 4
    }));

    chartLikert = new Chart(ctxLikert, {
      type: 'bar',
      data: {
        labels: questionsLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { stacked: true, beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } },
          y: { stacked: true, ticks: { font: { size: 10 } } }
        },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } }
        }
      }
    });

    // 5. Radar de Média Ponderada
    const ctxRadar = document.getElementById('chart-radar-burnout').getContext('2d');
    if (chartRadar) chartRadar.destroy();

    const scoreWeights = { 'Nunca': 0, 'Raramente': 1, 'Algumas Vezes': 2, 'Frequentemente': 3, 'Sempre': 4 };
    const radarValues = keys.map(k => {
      const q = data.questionsMatrix[k];
      if (!q) return 0;
      let sum = 0;
      let total = 0;
      Object.entries(q.counts).forEach(([level, count]) => {
        sum += (scoreWeights[level] || 0) * count;
        total += count;
      });
      return total > 0 ? Number((sum / total).toFixed(2)) : 0;
    });

    chartRadar = new Chart(ctxRadar, {
      type: 'radar',
      data: {
        labels: [
          'Exaustão', 'Endurecimento', 'Trato Adequado', 'Esgotamento', 'Culpa',
          'Empatia', 'Influência Positiva', 'Realização', 'Despersonalização', 'Cansaço Matinal'
        ],
        datasets: [{
          label: 'Intensidade Média (0 a 4)',
          data: radarValues,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: '#ef4444',
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#ef4444'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { display: true },
            suggestedMin: 0,
            suggestedMax: 4,
            ticks: { stepSize: 1, font: { size: 9 } }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // Renderizar Tabela
  function renderTable(responses) {
    if (!responses || responses.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-10 text-slate-400">
            <i class="fa-regular fa-folder-open text-3xl mb-2"></i>
            <p>Nenhuma resposta registrada até o momento.</p>
          </td>
        </tr>
      `;
      return;
    }

    const searchTerm = searchInput.value.toLowerCase().trim();
    const filtered = responses.filter(r => 
      r.nome.toLowerCase().includes(searchTerm) ||
      r.profissao.toLowerCase().includes(searchTerm)
    );

    tableBody.innerHTML = filtered.map(r => {
      const date = new Date(r.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      
      let badgeColor = 'bg-slate-100 text-slate-700';
      if (r.q1_exaustao === 'Sempre' || r.q1_exaustao === 'Frequentemente') {
        badgeColor = 'bg-rose-100 text-rose-700 font-bold';
      } else if (r.q1_exaustao === 'Algumas Vezes') {
        badgeColor = 'bg-amber-100 text-amber-700';
      } else {
        badgeColor = 'bg-emerald-100 text-emerald-700';
      }

      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="py-3 px-4 text-slate-500">${date}</td>
          <td class="py-3 px-4 font-bold text-slate-900">${r.nome}</td>
          <td class="py-3 px-4">${r.genero}</td>
          <td class="py-3 px-4">${r.idade}</td>
          <td class="py-3 px-4 text-slate-600">${r.profissao}</td>
          <td class="py-3 px-4">${r.transporte}</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[11px] ${badgeColor}">
              ${r.q1_exaustao}
            </span>
          </td>
          <td class="py-3 px-4 text-center">
            <div class="flex items-center justify-center space-x-2">
              <button onclick="window.viewDetails('${r.id}')" class="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition" title="Ver Detalhes">
                <i class="fa-solid fa-eye text-xs"></i>
              </button>
              <button onclick="window.deleteResponse('${r.id}')" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Excluir Resposta">
                <i class="fa-regular fa-trash-can text-xs"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Filtragem de busca
  searchInput.addEventListener('input', () => {
    if (currentData) renderTable(currentData.responses);
  });

  // Modal de Detalhes
  window.viewDetails = function(id) {
    if (!currentData) return;
    const r = currentData.responses.find(item => item.id === id);
    if (!r) return;

    modalRespName.textContent = r.nome;
    modalRespDate.textContent = `${new Date(r.createdAt).toLocaleString('pt-BR')} • ${r.profissao} • ${r.idade}`;

    modalRespContent.innerHTML = `
      <div class="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
        <div>
          <span class="text-[10px] uppercase font-bold text-slate-400">Gênero</span>
          <p class="font-semibold text-slate-800">${r.genero}</p>
        </div>
        <div>
          <span class="text-[10px] uppercase font-bold text-slate-400">Meio de Transporte</span>
          <p class="font-semibold text-slate-800">${r.transporte}</p>
        </div>
      </div>

      <div class="space-y-3 pt-2">
        <p class="font-bold text-slate-900 text-sm">Respostas da Escala de Esgotamento:</p>

        <div class="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100">
          <span class="text-slate-700">1. Exaustão emocional pelo trabalho:</span>
          <span class="font-bold px-2 py-0.5 rounded bg-white border text-slate-800">${r.q1_exaustao}</span>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100">
          <span class="text-slate-700">2. Trabalho endurecendo emocionalmente:</span>
          <span class="font-bold px-2 py-0.5 rounded bg-white border text-slate-800">${r.q2_endurecendo}</span>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100">
          <span class="text-slate-700">3. Trato de forma adequada os pacientes:</span>
          <span class="font-bold px-2 py-0.5 rounded bg-white border text-slate-800">${r.q3_trato_pacientes}</span>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100">
          <span class="text-slate-700">4. Esgotado ao final de um dia de trabalho:</span>
          <span class="font-bold px-2 py-0.5 rounded bg-white border text-slate-800">${r.q4_esgotado_fim_dia}</span>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100">
          <span class="text-slate-700">5. Pacientes culpam por problemas:</span>
          <span class="font-bold px-2 py-0.5 rounded bg-white border text-slate-800">${r.q5_culpam_problemas}</span>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100">
          <span class="text-slate-700">6. Entendimento fácil dos sentimentos dos pacientes:</span>
          <span class="font-bold px-2 py-0.5 rounded bg-white border text-slate-800">${r.q6_entender_pacientes}</span>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100">
          <span class="text-slate-700">7. Influência positiva na vida de pessoas:</span>
          <span class="font-bold px-2 py-0.5 rounded bg-white border text-slate-800">${r.q7_influencia_positiva || '-'}</span>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100">
          <span class="text-slate-700">8. Realização de coisas importantes:</span>
          <span class="font-bold px-2 py-0.5 rounded bg-white border text-slate-800">${r.q8_coisas_importantes || '-'}</span>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100">
          <span class="text-slate-700">9. Trato pacientes como se fossem objetos:</span>
          <span class="font-bold px-2 py-0.5 rounded bg-white border text-slate-800">${r.q9_trato_objetos || '-'}</span>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100">
          <span class="text-slate-700">10. Cansaço ao acordar para encarar o trabalho:</span>
          <span class="font-bold px-2 py-0.5 rounded bg-white border text-slate-800">${r.q10_cansaco_manha || '-'}</span>
        </div>
      </div>
    `;

    detailModal.classList.remove('hidden');
  };

  btnCloseModal.addEventListener('click', () => {
    detailModal.classList.add('hidden');
  });

  // Excluir resposta específica
  window.deleteResponse = async function(id) {
    if (confirm('Deseja excluir esta resposta?')) {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/responses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchStats();
      }
    }
  };
});
