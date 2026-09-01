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

// ---------- Tela de Configurações ----------
let telaAnteriorConfig = 'screen-historico';

document.querySelectorAll('.btn-config').forEach(btn => {
  btn.addEventListener('click', () => {
    const telaAtual = btn.closest('.screen');
    if (telaAtual) telaAnteriorConfig = telaAtual.id;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-config').classList.add('active');
  });
});

document.getElementById('btn-voltar-config').addEventListener('click', () => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(telaAnteriorConfig).classList.add('active');
});

function aplicarCorPrimaria(cor) {
  document.documentElement.style.setProperty('--primary', cor);
}

(function inicializarCorPrimaria() {
  const inputCor = document.getElementById('input-cor-primaria');
  const btnResetar = document.getElementById('btn-resetar-cor');
  const corPadrao = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  const corSalva = getCorPrimaria();

  inputCor.value = corSalva || corPadrao;
  if (corSalva) aplicarCorPrimaria(corSalva);

  inputCor.addEventListener('input', () => {
    aplicarCorPrimaria(inputCor.value);
  });
  inputCor.addEventListener('change', () => {
    saveCorPrimaria(inputCor.value);
  });

  btnResetar?.addEventListener('click', () => {
    document.documentElement.style.removeProperty('--primary');
    limparCorPrimaria();
    inputCor.value = corPadrao;
  });
})();

(function inicializarMetaSemanal() {
  const inputMeta = document.getElementById('input-meta-semanal');
  if (!inputMeta) return;

  inputMeta.value = getMetaSemanal();

  inputMeta.addEventListener('change', () => {
    const valor = Math.max(1, Number(inputMeta.value) || 1);
    inputMeta.value = valor;
    saveMetaSemanal(valor);
  });
})();

// ================= TREINOS =================
let treinoEditandoId = null;
let treinoDraft = null;

function clonar(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function renderTreinos() {
  const config = getConfig();
  const sessoes = getHistorico();
  const { recordes } = calcularRecordes(sessoes);
  const ultimoPorTipo = calcularUltimoTreinoPorTipo(sessoes);
  const container = document.getElementById('lista-treinos');
  container.innerHTML = '';

  config.treinos.forEach(treino => {
    const card = (treino.id === treinoEditandoId)
      ? criarCardTreinoEdit(config, treinoDraft)
      : criarCardTreinoView(treino, recordes, ultimoPorTipo);
    container.appendChild(card);
  });

  const btnAddTreino = document.createElement('button');
  btnAddTreino.className = 'btn-add';
  btnAddTreino.textContent = '+ adicionar treino';
  btnAddTreino.addEventListener('click', () => {
    const letra = String.fromCharCode(65 + config.treinos.length);
    config.treinos.push({ id: uid('treino'), nome: 'Treino ' + letra, exercicios: [] });
    saveConfig(config);
    renderTreinos();
  });
  container.appendChild(btnAddTreino);
}

function criarCardTreinoView(treino, recordes, ultimoPorTipo) {
  const card = document.createElement('div');
  card.className = 'card';

  const resumoExercicios = treino.exercicios.length === 0
    ? '<p class="hint">Nenhum exercício cadastrado.</p>'
    : treino.exercicios.map(ex => {
        const recorde = recordes && recordes[ex.nome];
        return `
        <div class="exercicio-resumo">
          <div class="nome-ex">${escapeAttr(ex.nome) || '(sem nome)'}</div>
          <div class="hint">
            ${ex.equipamento ? escapeAttr(ex.equipamento) + ' · ' : ''}${ex.series}x${ex.reps} · ${ajustarArrayPesos(ex.pesosPadrao, ex.series).join('/')}kg${recorde ? ` · PR: ${recorde.peso}kg` : ''}
          </div>
        </div>
      `;
      }).join('');

  const ultimaData = ultimoPorTipo && ultimoPorTipo[treino.id];
  const ultimoTxt = ultimaData ? `Último treino: ${calcularTempoDesde(ultimaData)}` : 'Ainda não realizado';

  card.innerHTML = `
    <div class="row-between">
      <h2>${escapeAttr(treino.nome)}</h2>
      <div class="treino-acoes">
        <button class="btn-secondary btn-modo-foco" aria-label="modo foco">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>
        </button>
        <button class="btn-secondary btn-editar-treino">Editar</button>
        <button class="btn-danger btn-excluir-treino">Excluir</button>
      </div>
    </div>
    <div class="hint">${ultimoTxt}</div>
    ${resumoExercicios}
  `;

  card.querySelector('.btn-modo-foco').addEventListener('click', () => {
    abrirModoFoco(treino);
  });

  card.querySelector('.btn-excluir-treino').addEventListener('click', () => {
    if (!confirm(`Excluir "${treino.nome}"? Isso remove o treino, mas o histórico de sessões já registradas continua intacto.`)) return;
    const config = getConfig();
    const idx = config.treinos.findIndex(t => t.id === treino.id);
    config.treinos.splice(idx, 1);
    saveConfig(config);
    renderTreinos();
  });

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
    <button class="btn-primary btn-salvar-treino">Salvar</button>
    <button class="btn-secondary btn-cancelar-treino">Cancelar</button>
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
const VALOR_AVULSO = '__avulso__';

function renderRegistrar() {
  const config = getConfig();
  const select = document.getElementById('select-treino-registrar');
  select.innerHTML = config.treinos.map(t => `<option value="${t.id}">${t.nome}</option>`).join('')
    + `<option value="${VALOR_AVULSO}">Treino avulso (não salvo)</option>`;

  select.onchange = () => alternarModoRegistro(config, select.value);
  alternarModoRegistro(config, select.value);

  const checkAgora = document.getElementById('check-data-hoje');
  const grupoData = document.getElementById('grupo-data-especifica');
  const inputData = document.getElementById('input-data-especifica');

  checkAgora.checked = true;
  grupoData.classList.add('hidden');
  inputData.value = '';

  checkAgora.onchange = () => {
    grupoData.classList.toggle('hidden', checkAgora.checked);
    if (!checkAgora.checked && !inputData.value) {
      inputData.value = toDatetimeLocalValue(new Date().toISOString());
    }
  };

  document.getElementById('input-duracao').value = '';
  document.getElementById('input-nome-avulso').value = '';

  document.getElementById('btn-salvar-sessao').onclick = () => salvarSessao(config, select.value);
}

function alternarModoRegistro(config, valorSelecionado) {
  const grupoNormal = document.getElementById('grupo-treino-normal');
  const grupoAvulso = document.getElementById('grupo-avulso');
  const ehAvulso = valorSelecionado === VALOR_AVULSO;

  grupoNormal.classList.toggle('hidden', ehAvulso);
  grupoAvulso.classList.toggle('hidden', !ehAvulso);

  if (ehAvulso) {
    renderFormAvulso();
  } else {
    renderFormExerciciosRegistrar(config, valorSelecionado);
  }
}

// ---------- Treino avulso ----------
let avulsoExercicios = [];

function renderFormAvulso() {
  avulsoExercicios = [];
  const container = document.getElementById('form-exercicios-avulso');
  container.innerHTML = '';

  document.getElementById('btn-add-exercicio-avulso').onclick = () => {
    avulsoExercicios.push({ nome: '', equipamento: '', series: 3, reps: 10, pesosUsados: [0, 0, 0] });
    renderListaAvulso();
  };

  renderListaAvulso();
}

function renderListaAvulso() {
  const container = document.getElementById('form-exercicios-avulso');
  container.innerHTML = '';

  if (avulsoExercicios.length === 0) {
    container.innerHTML = '<p class="hint">Nenhum exercício adicionado ainda.</p>';
    return;
  }

  avulsoExercicios.forEach((estado, idx) => {
    container.appendChild(criarLinhaExercicioAvulso(estado, idx));
  });
}

function criarLinhaExercicioAvulso(estado, idx) {
  const row = document.createElement('div');
  row.className = 'exercicio-row';

  row.innerHTML = `
    <div class="row-between">
      <input type="text" placeholder="Nome do exercício" value="${escapeAttr(estado.nome)}" class="av-nome">
      <button type="button" class="btn-danger" style="margin-left:8px">Remover</button>
    </div>
    <label>Equipamento (opcional):</label>
    <input type="text" placeholder="Ex: Máquina 12" value="${escapeAttr(estado.equipamento)}" class="av-equip">
    <div class="grid-2">
      <div>
        <label>Séries</label>
        <input type="number" min="1" value="${estado.series}" class="av-series">
      </div>
      <div>
        <label>Reps</label>
        <input type="number" min="1" value="${estado.reps}" class="av-reps">
      </div>
    </div>
    <label>Pesos usados:</label>
    <div class="pesos-serie-row"></div>
  `;

  const pesosContainer = row.querySelector('.pesos-serie-row');

  function renderPesos() {
    pesosContainer.innerHTML = htmlPesosInputs(estado.pesosUsados, 'av-peso-serie');
    pesosContainer.querySelectorAll('.av-peso-serie').forEach(input => {
      input.addEventListener('input', e => {
        estado.pesosUsados[Number(e.target.dataset.idx)] = Number(e.target.value);
      });
    });
  }
  renderPesos();

  row.querySelector('.av-nome').addEventListener('input', e => { estado.nome = e.target.value; });
  row.querySelector('.av-equip').addEventListener('input', e => { estado.equipamento = e.target.value; });
  row.querySelector('.av-series').addEventListener('input', e => {
    estado.series = Math.max(1, Number(e.target.value) || 1);
    estado.pesosUsados = ajustarArrayPesos(estado.pesosUsados, estado.series);
    renderPesos();
  });
  row.querySelector('.av-reps').addEventListener('input', e => { estado.reps = Number(e.target.value); });
  row.querySelector('.btn-danger').addEventListener('click', () => {
    avulsoExercicios.splice(idx, 1);
    renderListaAvulso();
  });

  return row;
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
        <div class="nome-ex-grande">${escapeAttr(estado.nome) || '(sem nome)'}</div>
        <div class="realizado-toggle-wrap">
          <label for="realizado-${exIdx}" class="hint snd-font">Realizado?</label>
          <label class="switch-input" for="realizado-${exIdx}">
            <input type="checkbox" id="realizado-${exIdx}" class="reg-realizado" checked>
            <div>
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.59094 0.76737L3.32367 6.03464L0 2.71097L0.76737 1.9436L3.32367 4.4999L7.82357 0L8.59094 0.76737Z" fill="white" />
              </svg>
            </div>
          </label>
        </div>
      </div>
      <div class="equip-hint">${estado.equipamento ? 'Equipamento: ' + escapeAttr(estado.equipamento) : ''}</div>
      <div class="campos-realizado full-width">
        <div class="grid-2">
          <div>
            <label>Séries</label>
            <input type="number" min="1" value="${estado.series}" class="reg-series">
          </div>
          <div>
            <label>Reps</label>
            <input type="number" min="1" value="${estado.reps}" class="reg-reps">
          </div>
        </div>
        <label>Pesos usados:</label>
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
      estado.realizado = e.target.checked;
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
  let exerciciosSessao;
  let treinoIdSessao;
  let treinoNomeSessao;

  if (treinoId === VALOR_AVULSO) {
    exerciciosSessao = avulsoExercicios
      .filter(estado => estado.nome.trim() !== '')
      .map(estado => ({
        nome: estado.nome,
        equipamento: estado.equipamento,
        series: estado.series,
        reps: estado.reps,
        pesosUsados: estado.pesosUsados
      }));

    if (exerciciosSessao.length === 0) {
      alert('Adicione ao menos um exercício com nome antes de salvar.');
      return;
    }

    treinoIdSessao = null;
    treinoNomeSessao = document.getElementById('input-nome-avulso').value.trim() || 'Treino avulso';
  } else {
    const treino = config.treinos.find(t => t.id === treinoId);
    if (!treino || treino.exercicios.length === 0 || registrarFormState.length === 0) return;

    exerciciosSessao = registrarFormState
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

    treinoIdSessao = treino.id;
    treinoNomeSessao = treino.nome;
  }

  const checkAgora = document.getElementById('check-data-hoje');
  const inputData = document.getElementById('input-data-especifica');
  const dataSessao = (!checkAgora.checked && inputData.value)
    ? new Date(inputData.value).toISOString()
    : new Date().toISOString();

  const duracaoMinutos = Number(document.getElementById('input-duracao').value) || 0;

  const sessao = {
    id: uid('sess'),
    data: dataSessao,
    duracaoMinutos: duracaoMinutos,
    treinoId: treinoIdSessao,
    treinoNomeSnapshot: treinoNomeSessao,
    observacao: document.getElementById('observacao-sessao').value.trim(),
    exercicios: exerciciosSessao
  };

  addSessao(sessao);

  document.getElementById('observacao-sessao').value = '';
  document.getElementById('input-duracao').value = '';
  document.getElementById('input-nome-avulso').value = '';
  checkAgora.checked = true;
  document.getElementById('grupo-data-especifica').classList.add('hidden');
  inputData.value = '';
  document.getElementById('msg-sessao-salva').classList.remove('hidden');

  if (treinoId === VALOR_AVULSO) renderFormAvulso();
}

// ================= HISTÓRICO =================
function renderHistorico() {
  const sessoes = getHistorico();
  const blocoAnalises = document.getElementById('historico-analises');

  blocoAnalises.classList.toggle('hidden', sessoes.length === 0);

  if (sessoes.length > 0) {
    renderCalendario(sessoes);
    renderEstatisticas(sessoes);
    renderDistribuicao(sessoes);
    renderFiltroExercicio(sessoes);
  }

  renderListaSessoes(sessoes);
}

function renderEstatisticas(sessoes) {
  const container = document.getElementById('estatisticas-lista');

  if (sessoes.length === 0) {
    container.innerHTML = '<p class="hint">Sem sessões registradas ainda.</p>';
    return;
  }

  const freq = calcularFrequencia(sessoes);
  const duracaoMedia = calcularDuracaoMedia(sessoes);
  const ultima = [...sessoes].sort((a, b) => new Date(b.data) - new Date(a.data))[0];
  const tempoDesde = calcularTempoDesde(ultima.data);
  const semanal = calcularSequenciaSemanal(sessoes, getMetaSemanal());

  const stats = [
    { label: 'Último treino', valor: tempoDesde },
    { label: 'Meta semanal', valor: `${semanal.semanaAtualCount}/${semanal.meta} esta semana${semanal.semanaAtualCumprida ? ' ✅' : ''}` },
    { label: 'Semanas seguidas na meta', valor: semanal.sequenciaAtual > 0 ? `${semanal.sequenciaAtual}` : '—' },
    { label: 'Recorde de semanas seguidas', valor: `${semanal.maiorSequencia}` },
    { label: 'Sequência atual (dias)', valor: freq.streakAtual > 0 ? `${freq.streakAtual} dias` : '—' },
    { label: 'Maior sequência (dias)', valor: `${freq.maiorStreak} dias` },
    { label: `Dias treinados em ${NOMES_MESES[new Date().getMonth()]}`, valor: `${freq.diasTreinadosMes} (${freq.percentualMes}%)` },
    { label: 'Duração média', valor: duracaoMedia > 0 ? `${duracaoMedia} min` : '—' }
  ];

  container.innerHTML = stats.map(s => `
    <div class="stat-linha">
      <span class="stat-label">${s.label}</span>
      <span class="stat-valor">${s.valor}</span>
    </div>
  `).join('');
}

function renderDistribuicao(sessoes) {
  const grupoTreino = document.getElementById('distribuicao-treino');
  const grupoDiaSemana = document.getElementById('distribuicao-dia-semana');

  if (sessoes.length === 0) {
    grupoTreino.innerHTML = '';
    grupoDiaSemana.innerHTML = '<p class="hint">Sem sessões registradas ainda.</p>';
    return;
  }

  const porTreino = calcularDistribuicaoTreino(sessoes);
  const maxTreino = Math.max(...Object.values(porTreino));
  grupoTreino.innerHTML = '<div class="dist-titulo hint">Por treino</div>' +
    Object.entries(porTreino).map(([nome, qtd]) => `
      <div class="dist-barra-linha">
        <span class="dist-nome">${escapeAttr(nome)}</span>
        <div class="dist-barra-fundo"><div class="dist-barra-preenchida" style="width:${(qtd / maxTreino) * 100}%"></div></div>
        <span class="dist-qtd">${qtd}x</span>
      </div>
    `).join('');

  const porDiaSemana = calcularDistribuicaoDiaSemana(sessoes);
  const maxDia = Math.max(...porDiaSemana, 1);
  grupoDiaSemana.innerHTML = '<div class="dist-titulo hint">Por dia da semana</div>' +
    NOMES_DIAS_SEMANA.map((nome, i) => `
      <div class="dist-barra-linha">
        <span class="dist-nome">${nome}</span>
        <div class="dist-barra-fundo"><div class="dist-barra-preenchida" style="width:${(porDiaSemana[i] / maxDia) * 100}%"></div></div>
        <span class="dist-qtd">${porDiaSemana[i]}x</span>
      </div>
    `).join('');
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
  const contagemPorExercicio = {};
  sessoes.forEach(s => {
    s.exercicios.forEach(e => {
      if (!e.nome) return;
      contagemPorExercicio[e.nome] = (contagemPorExercicio[e.nome] || 0) + 1;
    });
  });

  const nomesComDadosSuficientes = Object.keys(contagemPorExercicio)
    .filter(nome => contagemPorExercicio[nome] >= 2)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const card = document.getElementById('card-progressao');
  const select = document.getElementById('filtro-exercicio');

  if (nomesComDadosSuficientes.length === 0) {
    card.classList.add('hidden');
    return;
  }
  card.classList.remove('hidden');

  const atual = select.value;
  select.innerHTML = nomesComDadosSuficientes.map(n => `<option value="${escapeAttr(n)}">${n}</option>`).join('');
  if (nomesComDadosSuficientes.includes(atual)) select.value = atual;

  select.onchange = () => atualizarGrafico(sessoes, select.value);
  atualizarGrafico(sessoes, select.value);
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

  const temDadosSuficientes = pontos.length >= 2;
  canvas.classList.toggle('hidden', !temDadosSuficientes);
  vazio.classList.toggle('hidden', temDadosSuficientes);

  if (temDadosSuficientes) {
    desenharGrafico(canvas, pontos);
  }
}

window.addEventListener('resize', () => {
  if (ultimoGraficoSessoes) atualizarGrafico(ultimoGraficoSessoes, ultimoGraficoExercicio);
});

function renderListaSessoes(sessoes) {
  const container = document.getElementById('lista-sessoes');
  container.innerHTML = '';

  if (sessoes.length === 0) {
    container.innerHTML = `
      <div class="estado-vazio">
        <p class="hint">Nenhuma sessão registrada ainda. Assim que você registrar seu primeiro treino, o calendário, as estatísticas e os gráficos de progressão aparecem aqui automaticamente.</p>
        <p class="hint">Já tem um backup? Use "Importar" acima pra restaurar seu histórico.</p>
        <button class="btn-primary btn-ir-registrar">Registrar primeiro treino</button>
      </div>
    `;
    container.querySelector('.btn-ir-registrar').addEventListener('click', () => {
      document.querySelector('.tab-btn[data-screen="registrar"]').click();
    });
    return;
  }

  const ordenadas = [...sessoes].sort((a, b) => new Date(b.data) - new Date(a.data));
  const { prPorSessao } = calcularRecordes(sessoes);

  ordenadas.forEach(s => {
    container.appendChild(criarItemSessaoView(sessoes, s, prPorSessao));
  });
}

function criarItemSessaoView(sessoes, s, prPorSessao) {
  const div = document.createElement('div');
  div.className = 'sessao-item';
  const d = new Date(s.data);
  const dataFmt = d.toLocaleDateString('pt-BR');
  const horaFmt = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const prsDaSessao = (prPorSessao && prPorSessao[s.id]) || new Set();
  const resumo = s.exercicios
    .map(e => {
      const badge = prsDaSessao.has(e.nome) ? '<span class="badge-pr">🏆 PR</span>' : '';
      return `<div class="exercicio-resumo-linha">${escapeAttr(e.nome)}: ${e.pesosUsados.join('/')}kg ${badge}</div>`;
    })
    .join('');
  const duracaoTxt = s.duracaoMinutos ? `${s.duracaoMinutos} min` : '';
  const volume = calcularVolumeSessao(s);
  div.innerHTML = `
    <div class="sessao-topo">
      <div class="sessao-data-hora">
        <div class="sessao-data-grande">${dataFmt}</div>
        <div class="sessao-hora">${horaFmt}</div>
      </div>
      <div class="sessao-treino-tempo">
        <div class="sessao-treino-nome">${escapeAttr(s.treinoNomeSnapshot)}</div>
        ${duracaoTxt ? `<div class="sessao-duracao">${duracaoTxt}</div>` : ''}
      </div>
    </div>
    <div class="sessao-volume hint">Volume: ${volume.toLocaleString('pt-BR')}kg</div>
    <div class="sessao-exercicios">${resumo}</div>
    ${s.observacao ? `<div class="obs">"${escapeAttr(s.observacao)}"</div>` : ''}
    <div class="sessao-icones">
      <button class="btn-icone btn-icone-compartilhar btn-compartilhar-sessao" aria-label="compartilhar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
      </button>
      <button class="btn-icone btn-icone-editar btn-editar-sessao" aria-label="editar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      </button>
      <button class="btn-icone btn-icone-apagar btn-apagar-sessao" aria-label="apagar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
      </button>
    </div>
  `;

  const btnCompartilhar = div.querySelector('.btn-compartilhar-sessao');
  btnCompartilhar.addEventListener('click', async () => {
    btnCompartilhar.disabled = true;
    try {
      await compartilharSessao(s, prsDaSessao);
    } catch (err) {
      console.error('Falha ao gerar/compartilhar imagem da sessão', err);
      alert('Não foi possível gerar a imagem da sessão.');
    } finally {
      btnCompartilhar.disabled = false;
    }
  });

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
      <button class="btn-primary btn-salvar-edicao">Salvar</button>
      <button class="btn-secondary btn-cancelar-edicao">Cancelar</button>
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
    const { prPorSessao } = calcularRecordes(sessoes);
    div.replaceWith(criarItemSessaoView(sessoes, s, prPorSessao));
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

// ---------- Modo foco ----------
let wakeLock = null;

async function solicitarWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    }
  } catch (err) {
    console.warn('Wake Lock indisponível:', err);
  }
}

function liberarWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

document.addEventListener('visibilitychange', () => {
  const overlay = document.getElementById('modo-foco-overlay');
  if (document.visibilityState === 'visible' && overlay && !overlay.classList.contains('hidden')) {
    solicitarWakeLock();
  }
});

function abrirModoFoco(treino) {
  document.getElementById('modo-foco-titulo').textContent = treino.nome;

  const { recordes } = calcularRecordes(getHistorico());

  const lista = document.getElementById('modo-foco-lista');
  lista.innerHTML = treino.exercicios.length === 0
    ? '<p class="hint">Nenhum exercício cadastrado.</p>'
    : treino.exercicios.map(ex => {
        const recorde = recordes[ex.nome];
        return `
        <div class="modo-foco-exercicio">
          <div class="modo-foco-nome">${escapeAttr(ex.nome) || '(sem nome)'}</div>
          ${ex.equipamento ? `<div class="modo-foco-detalhe">Equipamento: ${escapeAttr(ex.equipamento)}</div>` : ''}
          <div class="modo-foco-detalhe">${ex.series}x${ex.reps}</div>
          <div class="modo-foco-pesos">${ajustarArrayPesos(ex.pesosPadrao, ex.series).join(' / ')}kg</div>
          ${recorde ? `<div class="modo-foco-pr">🏆 PR: ${recorde.peso}kg</div>` : ''}
        </div>
      `;
      }).join('');

  document.getElementById('modo-foco-overlay').classList.remove('hidden');
  solicitarWakeLock();
}

function fecharModoFoco() {
  document.getElementById('modo-foco-overlay').classList.add('hidden');
  liberarWakeLock();
}

document.getElementById('btn-sair-modo-foco').addEventListener('click', fecharModoFoco);

// ---------- inicialização ----------
renderHistorico();
