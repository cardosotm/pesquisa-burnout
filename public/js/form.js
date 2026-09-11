document.addEventListener('DOMContentLoaded', () => {
  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');
  const btnNext = document.getElementById('btn-next-step');
  const btnPrev = document.getElementById('btn-prev-step');
  const topProgressBar = document.getElementById('top-progress-bar');
  const stepIndicatorText = document.getElementById('step-indicator-text');
  const stepDescText = document.getElementById('step-desc-text');
  const stepNumberCircle = document.getElementById('step-number-circle');
  const form = document.getElementById('survey-form');
  const formContainer = document.getElementById('form-container');
  const successScreen = document.getElementById('success-screen');
  const btnSubmit = document.getElementById('btn-submit');
  const answeredCounter = document.getElementById('answered-counter');

  // 1. Interatividade para os cartões de seleção (Gênero, Idade, Transporte)
  document.querySelectorAll('.selectable-card').forEach(card => {
    const radio = card.querySelector('input[type="radio"]');
    if (!radio) return;

    card.addEventListener('click', () => {
      radio.checked = true;
      const name = radio.name;

      // Desmarca irmãos
      document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
        const parent = r.closest('.selectable-card');
        if (parent) parent.classList.remove('active');
      });

      card.classList.add('active');
    });
  });

  // Mapeamento das 10 perguntas para seus respectivos indicadores visuais
  const questionKeys = [
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

  function updateQuestionTracker() {
    let answeredCount = 0;

    questionKeys.forEach((key, idx) => {
      const input = form.querySelector(`input[name="${key}"]`);
      const dot = document.getElementById(`dot-q${idx + 1}`);
      const card = document.querySelector(`.question-card[data-q="${key}"]`);

      if (input && input.value) {
        answeredCount++;
        if (dot) dot.classList.add('filled');
        if (card) {
          card.classList.add('answered');
          const badge = card.querySelector('.status-badge');
          if (badge) badge.classList.remove('hidden');
        }
      } else {
        if (dot) dot.classList.remove('filled');
        if (card) {
          card.classList.remove('answered');
          const badge = card.querySelector('.status-badge');
          if (badge) badge.classList.add('hidden');
        }
      }
    });

    if (answeredCounter) {
      answeredCounter.textContent = `${answeredCount} de 10`;
    }
  }

  // 2. Interatividade para os botões táteis da Escala Likert (Questões 1 a 6)
  document.querySelectorAll('.likert-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const val = btn.getAttribute('data-value');
      const hiddenInput = form.querySelector(`input[name="${name}"]`);

      if (hiddenInput) {
        hiddenInput.value = val;
      }

      // Desmarca outros botões da mesma questão
      document.querySelectorAll(`.likert-btn[data-name="${name}"]`).forEach(b => {
        b.classList.remove('active');
      });

      // Marca o botão clicado
      btn.classList.add('active');

      // Atualiza os dots e o contador
      updateQuestionTracker();
    });
  });

  // Validação da Etapa 1
  function validateStep1() {
    const nome = document.getElementById('nome').value.trim();
    const genero = form.querySelector('input[name="genero"]:checked');
    const idade = form.querySelector('input[name="idade"]:checked');
    const profissao = document.getElementById('profissao').value.trim();
    const transporte = form.querySelector('input[name="transporte"]:checked');

    if (!nome) {
      alert('Por favor, informe seu Nome Completo.');
      document.getElementById('nome').focus();
      return false;
    }
    if (!genero) {
      alert('Por favor, selecione seu Gênero.');
      return false;
    }
    if (!idade) {
      alert('Por favor, selecione sua Faixa Etária.');
      return false;
    }
    if (!profissao) {
      alert('Por favor, informe sua Profissão / Função.');
      document.getElementById('profissao').focus();
      return false;
    }
    if (!transporte) {
      alert('Por favor, selecione o meio de transporte mais utilizado.');
      return false;
    }
    return true;
  }

  // Avançar para Etapa 2
  btnNext.addEventListener('click', () => {
    if (validateStep1()) {
      step1.classList.add('hidden');
      step2.classList.remove('hidden');

      topProgressBar.style.width = '100%';
      stepIndicatorText.textContent = 'Etapa 2 de 2';
      stepDescText.textContent = 'Avaliação de Bem-estar';
      stepNumberCircle.textContent = '2/2';
      stepNumberCircle.classList.remove('text-indigo-400');
      stepNumberCircle.classList.add('text-purple-400');

      window.scrollTo({ top: formContainer.offsetTop - 30, behavior: 'smooth' });
    }
  });

  // Voltar para Etapa 1
  btnPrev.addEventListener('click', () => {
    step2.classList.add('hidden');
    step1.classList.remove('hidden');

    topProgressBar.style.width = '50%';
    stepIndicatorText.textContent = 'Etapa 1 de 2';
    stepDescText.textContent = 'Perfil Profissional';
    stepNumberCircle.textContent = '1/2';
    stepNumberCircle.classList.remove('text-purple-400');
    stepNumberCircle.classList.add('text-indigo-400');

    window.scrollTo({ top: formContainer.offsetTop - 30, behavior: 'smooth' });
  });

  // Envio do formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Checa se todas as 6 questões foram respondidas
    for (let i = 0; i < questionKeys.length; i++) {
      const key = questionKeys[i];
      const hiddenInput = form.querySelector(`input[name="${key}"]`);
      if (!hiddenInput || !hiddenInput.value) {
        alert(`Por favor, responda a pergunta ${i + 1} para concluir o formulário.`);
        const card = document.querySelector(`.question-card[data-q="${key}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('ring-2', 'ring-rose-500');
          setTimeout(() => card.classList.remove('ring-2', 'ring-rose-500'), 1500);
        }
        return;
      }
    }

    const payload = {
      nome: document.getElementById('nome').value.trim(),
      genero: form.querySelector('input[name="genero"]:checked').value,
      idade: form.querySelector('input[name="idade"]:checked').value,
      profissao: document.getElementById('profissao').value.trim(),
      transporte: form.querySelector('input[name="transporte"]:checked').value,
      q1_exaustao: form.querySelector('input[name="q1_exaustao"]').value,
      q2_endurecendo: form.querySelector('input[name="q2_endurecendo"]').value,
      q3_trato_pacientes: form.querySelector('input[name="q3_trato_pacientes"]').value,
      q4_esgotado_fim_dia: form.querySelector('input[name="q4_esgotado_fim_dia"]').value,
      q5_culpam_problemas: form.querySelector('input[name="q5_culpam_problemas"]').value,
      q6_entender_pacientes: form.querySelector('input[name="q6_entender_pacientes"]').value,
      q7_influencia_positiva: form.querySelector('input[name="q7_influencia_positiva"]').value,
      q8_coisas_importantes: form.querySelector('input[name="q8_coisas_importantes"]').value,
      q9_trato_objetos: form.querySelector('input[name="q9_trato_objetos"]').value,
      q10_cansaco_manha: form.querySelector('input[name="q10_cansaco_manha"]').value
    };

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin text-sm"></i>
      <span>Gravando respostas...</span>
    `;

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        formContainer.classList.add('hidden');
        successScreen.classList.remove('hidden');
        window.scrollTo({ top: successScreen.offsetTop - 50, behavior: 'smooth' });
      } else {
        alert('Atenção: ' + (data.error || 'Não foi possível gravar sua resposta.'));
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `
          <i class="fa-solid fa-paper-plane text-xs"></i>
          <span>Concluir & Enviar Respostas</span>
        `;
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão com o servidor.');
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `
        <i class="fa-solid fa-paper-plane text-xs"></i>
        <span>Concluir & Enviar Respostas</span>
      `;
    }
  });
});
