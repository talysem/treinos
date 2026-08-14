// ---------- Navegação entre telas ----------
function htmlPesosInputs(pesosArray, className) {
  return pesosArray.map((p, i) => `
    <div class="peso-serie-item">
      <label>Série ${i + 1}</label>
      <input type="number" min="0" step="0.5" value="${p}" class="${className}" data-idx="${i}">
    </div>
  `).join('');
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('screen-' + btn.dataset.screen).classList.add('active');
    if (btn.dataset.screen === 'historico') renderHistorico();
    if (btn.dataset.screen === 'treinos') renderTreinos();
    if (btn.dataset.screen === 'registrar') renderRegistrar();
  });
});

// ================= TREINOS =================
let treinoEditandoId = null;
let treinoDraft = null;

function clonar(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function renderTreinos() {
  const config = getConfig();
  const container = document.getElementById('lista-treinos');
  container.innerHTML = '';

  config.treinos.forEach(treino => {
    const card = (treino.id === treinoEditandoId)
      ? criarCardTreinoEdit(config, treinoDraft)
      : criarCardTreinoView(treino);
    container.appendChild(card);
  });
}

function criarCardTreinoView(treino) {
  const card = document.createElement('div');
  card.className = 'card';

  const resumoExercicios = treino.exercicios.length === 0
    ? '<p class="hint">Nenhum exercício cadastrado.</p>'
    : treino.exercicios.map(ex => `
        <div class="exercicio-resumo">
          <div class="nome-ex">${escapeAttr(ex.nome) || '(sem nome)'}</div>
          <div class="hint">
            ${ex.equipamento ? escapeAttr(ex.equipamento) + ' · ' : ''}${ex.series}x${ex.reps} · ${ajustarArrayPesos(ex.pesosPadrao, ex.series).join('/')}kg
          </div>
        </div>
      `).join('');

  card.innerHTML = `
    <div class="row-between">
      <h2>${escapeAttr(treino.nome)}</h2>
      <button class="btn-secondary btn-editar-treino">editar</button>
    </div>
    ${resumoExercicios}
  `;

  card.querySelector('.btn-editar-treino').addEventListener('click', () => {
    treinoEditandoId = treino.id;
    treinoDraft = clonar(treino);
    renderTreinos();
  });

  return card;
}

function criarCardTreinoEdit(config, draft) {
  const card = document.createElement('div');
  card.className = 'card';

  const titulo = document.createElement('h2');
  titulo.textContent = draft.nome + ' (editando)';
  card.appendChild(titulo);

  const exList = document.createElement('div');
  card.appendChild(exList);

  function renderExList() {
    exList.innerHTML = '';
    draft.exercicios.forEach((ex, idx) => {
      exList.appendChild(criarLinhaExercicioEdit(draft, ex, idx, renderExList));
    });
  }
  renderExList();

  const btnAdd = document.createElement('button');
  btnAdd.className = 'btn-add';
  btnAdd.textContent = '+ adicionar exercício';
  btnAdd.addEventListener('click', () => {
    draft.exercicios.push({
      id: uid('ex'), nome: '', series: 3, reps: 10, pesosPadrao: [0, 0, 0], equipamento: ''
    });
    renderExList();
  });
  card.appendChild(btnAdd);

  const acoes = document.createElement('div');
  acoes.className = 'sessao-actions';
  acoes.innerHTML = `
    <button class="btn-primary btn-salvar-treino">salvar</button>
    <button class="btn-secondary btn-cancelar-treino">cancelar</button>
  `;
  card.appendChild(acoes);

  acoes.querySelector('.btn-salvar-treino').addEventListener('click', () => {
    const idx = config.treinos.findIndex(t => t.id === draft.id);
    config.treinos[idx] = clonar(draft);
    saveConfig(config);
    treinoEditandoId = null;
    treinoDraft = null;
    renderTreinos();
  });

  acoes.querySelector('.btn-cancelar-treino').addEventListener('click', () => {
    treinoEditandoId = null;
    treinoDraft = null;
    renderTreinos();
  });

  return card;
}

function criarLinhaExercicioEdit(draft, ex, idx, onRemover) {
  const row = document.createElement('div');
  row.className = 'exercicio-row';

  row.innerHTML = `
    <div class="row-between">
      <input type="text" placeholder="Nome do exercício" value="${escapeAttr(ex.nome)}" class="in-nome">
      <button class="btn-danger" style="margin-left:8px">remover</button>
    </div>
    <label>Equipamento</label>
    <input type="text" placeholder="Ex: Máquina 12" value="${escapeAttr(ex.equipamento)}" class="in-equip">
    <div class="grid-3">
      <div>
        <label>Séries</label>
        <input type="number" min="1" value="${ex.series}" class="in-series">
      </div>
      <div>
        <label>Reps</label>
        <input type="number" min="1" value="${ex.reps}" class="in-reps">
      </div>
      <div></div>
    </div>
    <label>Peso padrão por série (kg)</label>
    <div class="pesos-serie-row"></div>
  `;

  const pesosContainer = row.querySelector('.pesos-serie-row');

  function renderPesosPadrao() {
    ex.pesosPadrao = ajustarArrayPesos(ex.pesosPadrao, ex.series);
    pesosContainer.innerHTML = htmlPesosInputs(ex.pesosPadrao, 'in-peso-serie');
    pesosContainer.querySelectorAll('.in-peso-serie').forEach(input => {
      input.addEventListener('input', e => {
        const i = Number(e.target.dataset.idx);
        ex.pesosPadrao[i] = Number(e.target.value);
      });
    });
  }
  renderPesosPadrao();

  row.querySelector('.in-nome').addEventListener('input', e => {
    ex.nome = e.target.value;
  });
  row.querySelector('.in-equip').addEventListener('input', e => {
    ex.equipamento = e.target.value;
  });
  row.querySelector('.in-series').addEventListener('input', e => {
    ex.series = Math.max(1, Number(e.target.value) || 1);
    renderPesosPadrao();
  });
  row.querySelector('.in-reps').addEventListener('input', e => {
    ex.reps = Number(e.target.value);
  });
  row.querySelector('.btn-danger').addEventListener('click', () => {
    draft.exercicios.splice(idx, 1);
    onRemover();
  });

  return row;
}

// ================= REGISTRAR =================
function renderRegistrar() {
  const config = getConfig();
  const select = document.getElementById('select-treino-registrar');
  select.innerHTML = config.treinos.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');
  select.onchange = () => renderFormExerciciosRegistrar(config, select.value);
  renderFormExerciciosRegistrar(config, select.value);

  const checkData = document.getElementById('check-data-especifica');
  const inputData = document.getElementById('input-data-especifica');
  checkData.checked = false;
  inputData.classList.add('hidden');
  inputData.value = '';
  checkData.onchange = () => {
    inputData.classList.toggle('hidden', !checkData.checked);
    if (checkData.checked && !inputData.value) {
      inputData.value = toDatetimeLocalValue(new Date().toISOString());
    }
  };

  document.getElementById('input-duracao').value = '';

  document.getElementById('btn-salvar-sessao').onclick = () => salvarSessao(config, select.value);
}

let registrarFormState = [];

function renderFormExerciciosRegistrar(config, treinoId) {
  const treino = config.treinos.find(t => t.id === treinoId);
  const container = document.getElementById('form-exercicios-registrar');
  container.innerHTML = '';
  document.getElementById('msg-sessao-salva').classList.add('hidden');

  if (!treino || treino.exercicios.length === 0) {
    registrarFormState = [];
    container.innerHTML = '<p class="hint">Esse treino ainda não tem exercícios cadastrados.</p>';
    return;
  }

  registrarFormState = treino.exercicios.map(ex => ({
    nome: ex.nome,
    equipamento: ex.equipamento,
    series: ex.series,
    reps: ex.reps,
    pesosUsados: ajustarArrayPesos(ex.pesosPadrao, ex.series),
    realizado: true
  }));

  registrarFormState.forEach((estado, exIdx) => {
    const row = document.createElement('div');
    row.className = 'exercicio-row';
    row.dataset.exIdx = exIdx;
    row.innerHTML = `
      <div class="row-between">
        <div class="nome-ex">${escapeAttr(estado.nome) || '(sem nome)'}</div>
        <select class="reg-realizado">
          <option value="sim">Realizado</option>
          <option value="nao">Não realizado</option>
        </select>
      </div>
      <div class="equip-hint">${estado.equipamento ? 'Equipamento: ' + escapeAttr(estado.equipamento) : ''}</div>
      <div class="campos-realizado">
        <div class="grid-3">
          <div>
            <label>Séries</label>
            <input type="number" min="1" value="${estado.series}" class="reg-series">
          </div>
          <div>
            <label>Reps</label>
            <input type="number" min="1" value="${estado.reps}" class="reg-reps">
          </div>
          <div></div>
        </div>
        <label>Peso usado por série (kg)</label>
        <div class="pesos-serie-row"></div>
      </div>
    `;

    const camposRealizado = row.querySelector('.campos-realizado');
    const pesosContainer = row.querySelector('.pesos-serie-row');

    function renderPesosUsados() {
      pesosContainer.innerHTML = htmlPesosInputs(estado.pesosUsados, 'reg-peso-serie');
      pesosContainer.querySelectorAll('.reg-peso-serie').forEach(input => {
        input.addEventListener('input', e => {
          estado.pesosUsados[Number(e.target.dataset.idx)] = Number(e.target.value);
        });
      });
    }
    renderPesosUsados();

    row.querySelector('.reg-realizado').addEventListener('change', e => {
      estado.realizado = e.target.value === 'sim';
      camposRealizado.classList.toggle('hidden', !estado.realizado);
      row.classList.toggle('exercicio-nao-realizado', !estado.realizado);
    });

    row.querySelector('.reg-series').addEventListener('input', e => {
      estado.series = Math.max(1, Number(e.target.value) || 1);
      estado.pesosUsados = ajustarArrayPesos(estado.pesosUsados, estado.series);
      renderPesosUsados();
    });
    row.querySelector('.reg-reps').addEventListener('input', e => {
      estado.reps = Number(e.target.value);
    });

    container.appendChild(row);
  });
}

function salvarSessao(config, treinoId) {
  const treino = config.treinos.find(t => t.id === treinoId);
  if (!treino || treino.exercicios.length === 0 || registrarFormState.length === 0) return;

  const exerciciosSessao = registrarFormState
    .filter(estado => estado.realizado)
    .map(estado => ({
      nome: estado.nome,
      equipamento: estado.equipamento,
      series: estado.series,
      reps: estado.reps,
      pesosUsados: estado.pesosUsados
    }));

  if (exerciciosSessao.length === 0) {
    alert('Marque ao menos um exercício como realizado antes de salvar.');
    return;
  }

  const checkData = document.getElementById('check-data-especifica');
  const inputData = document.getElementById('input-data-especifica');
  const dataSessao = (checkData.checked && inputData.value)
    ? new Date(inputData.value).toISOString()
    : new Date().toISOString();

  const duracaoMinutos = Number(document.getElementById('input-duracao').value) || 0;

  const sessao = {
    id: uid('sess'),
    data: dataSessao,
    duracaoMinutos: duracaoMinutos,
    treinoId: treino.id,
    treinoNomeSnapshot: treino.nome,
    observacao: document.getElementById('observacao-sessao').value.trim(),
    exercicios: exerciciosSessao
  };

  addSessao(sessao);

  document.getElementById('observacao-sessao').value = '';
  document.getElementById('input-duracao').value = '';
  checkData.checked = false;
  inputData.classList.add('hidden');
  inputData.value = '';
  document.getElementById('msg-sessao-salva').classList.remove('hidden');
}

// ================= HISTÓRICO =================
function renderHistorico() {
  const sessoes = getHistorico();
  renderCalendario(sessoes);
  renderFiltroExercicio(sessoes);
  renderListaSessoes(sessoes);
}

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function renderCalendario(sessoes) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  document.getElementById('calendario-mes').textContent = NOMES_MESES[mes];

  const diasComTreino = new Set(
    sessoes
      .map(s => new Date(s.data))
      .filter(d => d.getFullYear() === ano && d.getMonth() === mes)
      .map(d => d.getDate())
  );

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  const container = document.getElementById('calendario-grid');
  container.innerHTML = '';

  for (let i = 0; i < primeiroDiaSemana; i++) {
    const vazio = document.createElement('div');
    vazio.className = 'calendario-dia vazio';
    container.appendChild(vazio);
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const el = document.createElement('div');
    el.className = 'calendario-dia' + (diasComTreino.has(dia) ? ' com-treino' : '');
    el.textContent = dia;
    container.appendChild(el);
  }
}

function renderFiltroExercicio(sessoes) {
  const nomesUnicos = [...new Set(
    sessoes.flatMap(s => s.exercicios.map(e => e.nome)).filter(Boolean)
  )];

  const select = document.getElementById('filtro-exercicio');
  const atual = select.value;
  select.innerHTML = nomesUnicos.map(n => `<option value="${escapeAttr(n)}">${n}</option>`).join('');
  if (nomesUnicos.includes(atual)) select.value = atual;

  select.onchange = () => atualizarGrafico(sessoes, select.value);
  if (nomesUnicos.length > 0) atualizarGrafico(sessoes, select.value);
}

let ultimoGraficoSessoes = null;
let ultimoGraficoExercicio = null;

function atualizarGrafico(sessoes, nomeExercicio) {
  ultimoGraficoSessoes = sessoes;
  ultimoGraficoExercicio = nomeExercicio;

  const canvas = document.getElementById('grafico');
  const vazio = document.getElementById('grafico-vazio');

  const pontos = sessoes
    .filter(s => s.exercicios.some(e => e.nome === nomeExercicio))
    .map(s => {
      const ex = s.exercicios.find(e => e.nome === nomeExercicio);
      return { data: s.data, peso: Math.max(...ex.pesosUsados) };
    })
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(-5);

  const desenhado = desenharGrafico(canvas, pontos);
  canvas.classList.toggle('hidden', !desenhado);
  vazio.classList.toggle('hidden', desenhado);
}

window.addEventListener('resize', () => {
  if (ultimoGraficoSessoes) atualizarGrafico(ultimoGraficoSessoes, ultimoGraficoExercicio);
});

function renderListaSessoes(sessoes) {
  const container = document.getElementById('lista-sessoes');
  container.innerHTML = '';

  if (sessoes.length === 0) {
    container.innerHTML = '<p class="hint">Nenhuma sessão registrada ainda.</p>';
    return;
  }

  const ordenadas = [...sessoes].sort((a, b) => new Date(b.data) - new Date(a.data));

  ordenadas.forEach(s => {
    container.appendChild(criarItemSessaoView(sessoes, s));
  });
}

function criarItemSessaoView(sessoes, s) {
  const div = document.createElement('div');
  div.className = 'sessao-item';
  const dataFmt = new Date(s.data).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const resumo = s.exercicios
    .map(e => `<div class="exercicio-resumo-linha">${escapeAttr(e.nome)}: ${e.pesosUsados.join('/')}kg</div>`)
    .join('');
  const duracaoTxt = s.duracaoMinutos ? ` · ${s.duracaoMinutos} min` : '';
  div.innerHTML = `
    <div class="data">${dataFmt} — ${escapeAttr(s.treinoNomeSnapshot)}${duracaoTxt}</div>
    <div class="hint">${resumo}</div>
    ${s.observacao ? `<div class="obs">"${escapeAttr(s.observacao)}"</div>` : ''}
    <div class="sessao-actions">
      <button class="btn-secondary btn-editar-sessao">editar</button>
      <button class="btn-danger btn-apagar-sessao">apagar</button>
    </div>
  `;

  div.querySelector('.btn-apagar-sessao').addEventListener('click', () => {
    if (!confirm('Apagar essa sessão do histórico? Não tem como desfazer.')) return;
    const idx = sessoes.findIndex(x => x.id === s.id);
    sessoes.splice(idx, 1);
    saveHistorico(sessoes);
    renderHistorico();
  });

  div.querySelector('.btn-editar-sessao').addEventListener('click', () => {
    div.replaceWith(criarItemSessaoEdit(sessoes, s));
  });

  return div;
}

function criarItemSessaoEdit(sessoes, s) {
  const div = document.createElement('div');
  div.className = 'sessao-item';

  const editState = s.exercicios.map(e => ({
    nome: e.nome,
    series: e.series,
    reps: e.reps,
    pesosUsados: ajustarArrayPesos(e.pesosUsados, e.series)
  }));

  div.innerHTML = `
    <div class="data">${escapeAttr(s.treinoNomeSnapshot)} (editando)</div>
    <label>Data e horário</label>
    <input type="datetime-local" class="edit-data" value="${toDatetimeLocalValue(s.data)}">
    <label>Duração (minutos)</label>
    <input type="number" min="0" class="edit-duracao" value="${s.duracaoMinutos || 0}">
    <div class="edit-exercicios"></div>
    <label>Observação</label>
    <textarea rows="2" class="edit-observacao">${escapeAttr(s.observacao)}</textarea>
    <div class="sessao-actions">
      <button class="btn-primary btn-salvar-edicao">salvar</button>
      <button class="btn-secondary btn-cancelar-edicao">cancelar</button>
    </div>
  `;

  const exContainer = div.querySelector('.edit-exercicios');

  editState.forEach((estado, idx) => {
    const row = document.createElement('div');
    row.className = 'exercicio-row';
    row.innerHTML = `
      <div class="nome-ex">${escapeAttr(estado.nome) || '(sem nome)'}</div>
      <div class="grid-3">
        <div>
          <label>Séries</label>
          <input type="number" min="1" value="${estado.series}" class="edit-series">
        </div>
        <div>
          <label>Reps</label>
          <input type="number" min="1" value="${estado.reps}" class="edit-reps">
        </div>
        <div></div>
      </div>
      <label>Peso usado por série (kg)</label>
      <div class="pesos-serie-row"></div>
    `;

    const pesosContainer = row.querySelector('.pesos-serie-row');

    function renderPesos() {
      pesosContainer.innerHTML = htmlPesosInputs(estado.pesosUsados, 'edit-peso-serie');
      pesosContainer.querySelectorAll('.edit-peso-serie').forEach(input => {
        input.addEventListener('input', e => {
          estado.pesosUsados[Number(e.target.dataset.idx)] = Number(e.target.value);
        });
      });
    }
    renderPesos();

    row.querySelector('.edit-series').addEventListener('input', e => {
      estado.series = Math.max(1, Number(e.target.value) || 1);
      estado.pesosUsados = ajustarArrayPesos(estado.pesosUsados, estado.series);
      renderPesos();
    });
    row.querySelector('.edit-reps').addEventListener('input', e => {
      estado.reps = Number(e.target.value);
    });

    exContainer.appendChild(row);
  });

  div.querySelector('.btn-cancelar-edicao').addEventListener('click', () => {
    div.replaceWith(criarItemSessaoView(sessoes, s));
  });

  div.querySelector('.btn-salvar-edicao').addEventListener('click', () => {
    editState.forEach((estado, idx) => {
      s.exercicios[idx].series = estado.series;
      s.exercicios[idx].reps = estado.reps;
      s.exercicios[idx].pesosUsados = estado.pesosUsados;
    });
    const dataInput = div.querySelector('.edit-data').value;
    if (dataInput) s.data = new Date(dataInput).toISOString();
    s.duracaoMinutos = Number(div.querySelector('.edit-duracao').value) || 0;
    s.observacao = div.querySelector('.edit-observacao').value.trim();
    saveHistorico(sessoes);
    renderHistorico();
  });

  return div;
}

// ================= EXPORT / IMPORT =================
document.getElementById('btn-export').addEventListener('click', exportarDados);

document.getElementById('input-import').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  importarDados(file, (ok) => {
    if (ok) {
      alert('Dados importados com sucesso!');
      renderHistorico();
    } else {
      alert('Arquivo inválido. Verifique o backup.');
    }
    e.target.value = '';
  });
});

// ---------- util ----------
function toDatetimeLocalValue(isoString) {
  const d = new Date(isoString);
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ---------- inicialização ----------
renderHistorico();