const KEY_CONFIG = 'treinos_config';
const KEY_HISTORICO = 'historico_sessoes';
const KEY_COR_PRIMARIA = 'cor_primaria';

function getCorPrimaria() {
  return localStorage.getItem(KEY_COR_PRIMARIA);
}

function saveCorPrimaria(cor) {
  localStorage.setItem(KEY_COR_PRIMARIA, cor);
}

function limparCorPrimaria() {
  localStorage.removeItem(KEY_COR_PRIMARIA);
}

const KEY_META_SEMANAL = 'meta_semanal';

function getMetaSemanal() {
  const valor = Number(localStorage.getItem(KEY_META_SEMANAL));
  return valor > 0 ? valor : 3;
}

function saveMetaSemanal(valor) {
  localStorage.setItem(KEY_META_SEMANAL, String(valor));
}

const KEY_CONFIRMACOES = 'confirmacoes_ativas';

function getConfirmacoesAtivas() {
  const valor = localStorage.getItem(KEY_CONFIRMACOES);
  return valor === null ? true : valor === 'true';
}

function saveConfirmacoesAtivas(ativo) {
  localStorage.setItem(KEY_CONFIRMACOES, String(ativo));
}

// Antes de uma ação destrutiva (apagar sessão/treino): pede confirmação só se a preferência estiver ligada.
function confirmarSeAtivo(mensagem) {
  return getConfirmacoesAtivas() ? confirm(mensagem) : true;
}

const KEY_GRAFICO_MAX_PONTOS = 'grafico_max_pontos';
const KEY_GRAFICO_MIN_REGISTROS = 'grafico_min_registros';

function getGraficoMaxPontos() {
  const valor = Number(localStorage.getItem(KEY_GRAFICO_MAX_PONTOS));
  return valor > 0 ? valor : 5;
}

function saveGraficoMaxPontos(valor) {
  localStorage.setItem(KEY_GRAFICO_MAX_PONTOS, String(valor));
}

function getGraficoMinRegistros() {
  const valor = Number(localStorage.getItem(KEY_GRAFICO_MIN_REGISTROS));
  return valor >= 2 ? valor : 2;
}

function saveGraficoMinRegistros(valor) {
  localStorage.setItem(KEY_GRAFICO_MIN_REGISTROS, String(valor));
}

const KEY_SHARE_ASPECTO = 'share_aspecto';

function getShareAspecto() {
  const valor = localStorage.getItem(KEY_SHARE_ASPECTO);
  return valor === '9x16' ? '9x16' : '3x4';
}

function saveShareAspecto(valor) {
  localStorage.setItem(KEY_SHARE_ASPECTO, valor);
}

function uid(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Redimensiona um array de pesos para o tamanho desejado.
// Preenche posições novas repetindo o último valor (ou 0 se vazio).
function ajustarArrayPesos(arr, tamanho) {
  const base = Array.isArray(arr) ? arr.slice(0, tamanho) : [];
  while (base.length < tamanho) {
    base.push(base.length > 0 ? base[base.length - 1] : 0);
  }
  return base;
}

// Retorna sempre um array de pesos, convertendo o formato antigo (peso único) se necessário.
function getPesosArray(obj, campoNovo, campoAntigo, tamanho) {
  if (Array.isArray(obj[campoNovo])) return ajustarArrayPesos(obj[campoNovo], tamanho);
  if (typeof obj[campoAntigo] === 'number') return ajustarArrayPesos([obj[campoAntigo]], tamanho);
  return ajustarArrayPesos([], tamanho);
}

// Migra config antiga (pesoPadrao único) para o novo formato (pesosPadrao por série).
function migrarConfig(config) {
  let alterado = false;
  config.treinos.forEach(treino => {
    treino.exercicios.forEach(ex => {
      if (!Array.isArray(ex.pesosPadrao)) {
        ex.pesosPadrao = getPesosArray(ex, 'pesosPadrao', 'pesoPadrao', ex.series || 1);
        delete ex.pesoPadrao;
        alterado = true;
      } else if (ex.pesosPadrao.length !== ex.series) {
        ex.pesosPadrao = ajustarArrayPesos(ex.pesosPadrao, ex.series || 1);
        alterado = true;
      }
    });
  });
  return alterado;
}

// Migra histórico antigo (pesoUsado único) para o novo formato (pesosUsados por série).
function migrarHistorico(sessoes) {
  let alterado = false;
  sessoes.forEach(s => {
    s.exercicios.forEach(ex => {
      if (!Array.isArray(ex.pesosUsados)) {
        ex.pesosUsados = getPesosArray(ex, 'pesosUsados', 'pesoUsado', ex.series || 1);
        delete ex.pesoUsado;
        alterado = true;
      }
    });
  });
  return alterado;
}

function seedConfig() {
  return {
    treinos: [
      { id: 'treino_a', nome: 'Treino A', exercicios: [] },
      { id: 'treino_b', nome: 'Treino B', exercicios: [] },
      { id: 'treino_c', nome: 'Treino C', exercicios: [] }
    ]
  };
}

function getConfig() {
  const raw = localStorage.getItem(KEY_CONFIG);
  if (!raw) {
    const seed = seedConfig();
    saveConfig(seed);
    return seed;
  }
  try {
    const config = JSON.parse(raw);
    if (migrarConfig(config)) saveConfig(config);
    return config;
  } catch (e) {
    console.error('Config corrompida, recriando.', e);
    const seed = seedConfig();
    saveConfig(seed);
    return seed;
  }
}

function saveConfig(config) {
  localStorage.setItem(KEY_CONFIG, JSON.stringify(config));
}

function getHistorico() {
  const raw = localStorage.getItem(KEY_HISTORICO);
  if (!raw) return [];
  try {
    const sessoes = JSON.parse(raw);
    if (migrarHistorico(sessoes)) saveHistorico(sessoes);
    return sessoes;
  } catch (e) {
    console.error('Histórico corrompido, ignorando.', e);
    return [];
  }
}

function saveHistorico(sessoes) {
  localStorage.setItem(KEY_HISTORICO, JSON.stringify(sessoes));
}

function addSessao(sessao) {
  const sessoes = getHistorico();
  sessoes.unshift(sessao);
  saveHistorico(sessoes);
}

function exportarDados() {
  const data = {
    treinos_config: getConfig(),
    historico_sessoes: getHistorico(),
    cor_primaria: getCorPrimaria(),
    meta_semanal: getMetaSemanal(),
    confirmacoes_ativas: getConfirmacoesAtivas(),
    grafico_max_pontos: getGraficoMaxPontos(),
    grafico_min_registros: getGraficoMinRegistros(),
    share_aspecto: getShareAspecto(),
    exportadoEm: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `treinos-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importarDados(file, onDone) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.treinos_config) saveConfig(data.treinos_config);
      if (data.historico_sessoes) saveHistorico(data.historico_sessoes);
      if (data.cor_primaria) saveCorPrimaria(data.cor_primaria);
      if (data.meta_semanal) saveMetaSemanal(data.meta_semanal);
      if (data.confirmacoes_ativas !== undefined) saveConfirmacoesAtivas(data.confirmacoes_ativas);
      if (data.grafico_max_pontos) saveGraficoMaxPontos(data.grafico_max_pontos);
      if (data.grafico_min_registros) saveGraficoMinRegistros(data.grafico_min_registros);
      if (data.share_aspecto) saveShareAspecto(data.share_aspecto);
      onDone(true);
    } catch (err) {
      console.error('Falha ao importar', err);
      onDone(false);
    }
  };
  reader.readAsText(file);
}