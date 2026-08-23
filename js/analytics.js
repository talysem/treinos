// ---------- Volume ----------
function calcularVolumeSessao(sessao) {
    return sessao.exercicios.reduce((total, ex) => {
        const volumeExercicio = ex.pesosUsados.reduce((soma, peso) => soma + peso * ex.reps, 0);
        return total + volumeExercicio;
    }, 0);
}

// ---------- Recordes pessoais ----------
// Retorna:
//  recordes: { [nomeExercicio]: { peso, data, sessaoId } }  <- recorde atual (mais recente)
//  prPorSessao: { [sessaoId]: Set(nomeExercicio) }          <- em quais sessões cada exercício bateu recorde
function calcularRecordes(sessoes) {
    const ordenadas = [...sessoes].sort((a, b) => new Date(a.data) - new Date(b.data));
    const recordes = {};
    const prPorSessao = {};

    ordenadas.forEach(s => {
        const marcados = new Set();
        s.exercicios.forEach(ex => {
            if (!ex.pesosUsados || ex.pesosUsados.length === 0) return;
            const maxSessao = Math.max(...ex.pesosUsados);
            const atual = recordes[ex.nome];
            if (!atual || maxSessao > atual.peso) {
                recordes[ex.nome] = { peso: maxSessao, data: s.data, sessaoId: s.id };
                marcados.add(ex.nome);
            }
        });
        if (marcados.size > 0) prPorSessao[s.id] = marcados;
    });

    return { recordes, prPorSessao };
}

// ---------- Frequência ----------
function calcularFrequencia(sessoes) {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const diaAtual = hoje.getDate();

    const diasUnicosMes = new Set(
        sessoes
            .map(s => new Date(s.data))
            .filter(d => d.getFullYear() === ano && d.getMonth() === mes)
            .map(d => d.getDate())
    );

    const percentualMes = diaAtual > 0 ? Math.round((diasUnicosMes.size / diaAtual) * 100) : 0;

    const umDia = 24 * 60 * 60 * 1000;
    const diasUnicosGlobal = [...new Set(
        sessoes.map(s => {
            const d = new Date(s.data);
            return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        })
    )].sort((a, b) => a - b);

    let maiorStreak = 0;
    let streakCorrente = 0;
    let anterior = null;

    diasUnicosGlobal.forEach(dia => {
        streakCorrente = (anterior !== null && dia - anterior === umDia) ? streakCorrente + 1 : 1;
        if (streakCorrente > maiorStreak) maiorStreak = streakCorrente;
        anterior = dia;
    });

    let streakAtual = 0;
    if (diasUnicosGlobal.length > 0) {
        const hojeMeiaNoite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
        const ontemMeiaNoite = hojeMeiaNoite - umDia;
        const ultimoDia = diasUnicosGlobal[diasUnicosGlobal.length - 1];
        if (ultimoDia === hojeMeiaNoite || ultimoDia === ontemMeiaNoite) {
            streakAtual = 1;
            for (let i = diasUnicosGlobal.length - 1; i > 0; i--) {
                if (diasUnicosGlobal[i] - diasUnicosGlobal[i - 1] === umDia) streakAtual++;
                else break;
            }
        }
    }

    return { percentualMes, diasTreinadosMes: diasUnicosMes.size, diaAtual, streakAtual, maiorStreak };
}

// ---------- Distribuições ----------
function calcularDistribuicaoTreino(sessoes) {
    const contagem = {};
    sessoes.forEach(s => {
        contagem[s.treinoNomeSnapshot] = (contagem[s.treinoNomeSnapshot] || 0) + 1;
    });
    return contagem;
}

const NOMES_DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function calcularDistribuicaoDiaSemana(sessoes) {
    const contagem = [0, 0, 0, 0, 0, 0, 0];
    sessoes.forEach(s => {
        contagem[new Date(s.data).getDay()]++;
    });
    return contagem;
}

// ---------- Duração média ----------
function calcularDuracaoMedia(sessoes) {
    const validas = sessoes.filter(s => s.duracaoMinutos > 0);
    if (validas.length === 0) return 0;
    const soma = validas.reduce((t, s) => t + s.duracaoMinutos, 0);
    return Math.round(soma / validas.length);
}

// ---------- Tempo relativo ----------
function calcularTempoDesde(dataIso) {
    const agora = new Date();
    const data = new Date(dataIso);
    const hojeMeiaNoite = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
    const dataMeiaNoite = new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime();
    const diffDias = Math.round((hojeMeiaNoite - dataMeiaNoite) / (24 * 60 * 60 * 1000));

    if (diffDias === 0) return 'hoje';
    if (diffDias === 1) return 'ontem';
    if (diffDias > 1) return `há ${diffDias} dias`;
    return 'em breve';
}

// ---------- Último treino por tipo (treinoId) ----------
function calcularUltimoTreinoPorTipo(sessoes) {
    const ultimo = {};
    sessoes.forEach(s => {
        if (!ultimo[s.treinoId] || new Date(s.data) > new Date(ultimo[s.treinoId])) {
            ultimo[s.treinoId] = s.data;
        }
    });
    return ultimo;
}