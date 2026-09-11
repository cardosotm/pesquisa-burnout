# Pesquisa de Saúde & Esgotamento Profissional (Burnout)

Aplicação web completa desenvolvida sob medida para substituir o Google Forms tradicional por uma experiência visual moderna, interativa e profissional, com separação total entre o formulário público e o painel de administração com gráficos.

---

## 🌟 Funcionalidades

### 1. Área Pública (Para os Participantes)
* **Link:** `http://localhost:3000/`
* **Design Moderno:** Interface visual elegante focada em saúde e bem-estar, com gradientes suaves, ícones intuitivos e cards táteis.
* **Formulário em 2 Etapas (Wizard):**
  * **Etapa 1:** Dados Pessoais & Perfil (Nome, Gênero, Faixa Etária, Profissão/Função, Meio de Transporte).
  * **Etapa 2:** Escala Likert de Avaliação Emocional & Relação com Pacientes (6 afirmações pontuadas de *Nunca* a *Sempre*).
* **Barra de Progresso Dinâmica:** Mostra visualmente o avanço do preenchimento.
* **Privacidade Total:** Os respondentes **não têm acesso** aos gráficos nem aos dados de outros participantes. Ao finalizar, visualizam apenas a tela de confirmação e agradecimento.

### 2. Painel do Administrador (Área Restrita com Gráficos)
* **Link:** `http://localhost:3000/admin`
* **Proteção por Senha:** O acesso só é liberado mediante autenticação.
  * **Senha padrão:** `admin123` (pode ser alterada a qualquer momento).
* **Métricas Principais (KPIs):**
  * Total de Participantes
  * Índice Médio de Esgotamento (Score de Burnout em % com classificação de risco: Baixo, Moderado ou Alto/Crítico)
  * Faixa Etária mais frequente
  * Meio de transporte mais utilizado
* **Gráficos Interativos (Chart.js):**
  * **Distribuição por Gênero:** Gráfico de Rosca (Donut)
  * **Faixas Etárias:** Gráfico de Colunas
  * **Meio de Transporte:** Gráfico Circular
  * **Matriz das 6 Afirmações da Escala:** Gráfico de Barras Empilhadas mostrando a proporção de *Nunca*, *Raramente*, *Algumas Vezes*, *Frequentemente* e *Sempre* para cada situação.
  * **Radar de Intensidade Média:** Mapeia visualmente quais fatores mais pesam na rotina dos profissionais.
* **Tabela de Respostas Individuais:**
  * Busca e filtro em tempo real por nome ou profissão
  * Modal para ver todas as respostas de um participante em detalhes
  * Botão para excluir respostas individuais ou limpar dados de teste
* **Exportação para Excel (CSV):**
  * Download com 1 clique de um arquivo CSV formatado com codificação UTF-8 com BOM (abre perfeitamente acentuado no Microsoft Excel).

---

## 🚀 Como Executar o Projeto

1. Abra o terminal na pasta do projeto:
   ```bash
   cd C:\Users\mauri\.gemini\antigravity\scratch\pesquisa-burnout-app
   ```

2. Instale as dependências (caso não tenham sido instaladas):
   ```bash
   npm install
   ```

3. Inicie o servidor:
   ```bash
   npm start
   ```

4. Acesse no seu navegador:
   * **Formulário para os participantes:** [http://localhost:3000](http://localhost:3000)
   * **Painel do Administrador com Gráficos:** [http://localhost:3000/admin](http://localhost:3000/admin) (Senha: `admin123`)

---

## 🔒 Como Alterar a Senha do Administrador

Você pode alterar a senha de duas formas:
1. Definindo a variável de ambiente antes de iniciar:
   ```bash
   $env:ADMIN_PASSWORD="sua_nova_senha"
   npm start
   ```
2. Ou alterando diretamente no arquivo `server.js` na linha:
   ```javascript
   const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sua_nova_senha';
   ```

---

## 📁 Estrutura de Arquivos

```
pesquisa-burnout-app/
├── server.js              # Servidor Express com rotas da API e autenticação
├── package.json           # Dependências do Node.js
├── data/
│   └── responses.json     # Banco de dados local com as respostas salvas
└── public/
    ├── index.html         # Formulário dos participantes
    ├── admin.html         # Painel administrativo com os gráficos
    ├── css/
    │   └── style.css      # Estilos customizados e animações
    └── js/
        ├── form.js        # Validação e envio do questionário
        └── admin.js       # Gráficos Chart.js, autenticação e relatórios
```
