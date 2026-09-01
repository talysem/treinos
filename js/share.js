// Gera um card 3:4 (1080x1440) com o resumo de uma sessão, pronto pra compartilhar.

function corVar(nome, fallback) {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return valor || fallback;
}

function truncarTexto(ctx, texto, maxWidth) {
  if (ctx.measureText(texto).width <= maxWidth) return texto;
  let cortado = texto;
  while (cortado.length > 1 && ctx.measureText(cortado + '…').width > maxWidth) {
    cortado = cortado.slice(0, -1);
  }
  return cortado + '…';
}

async function gerarImagemSessao(sessao, prsDaSessao) {
  await document.fonts.ready;

  const W = 1080;
  const H = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const corBg = corVar('--bg', '#131313');
  const corCard = corVar('--card', '#232323');
  const corPrimaria = corVar('--primary', '#ff4c00');
  const corBorda = corVar('--border', '#2a2e38');
  const branco = '#ffffff';
  const cinza = '#9a9ea8';

  const padX = 80;
  const topMargin = 100;
  const footerTop = H - 130;

  // ---- primeiro passo: calcular altura total do conteúdo pra centralizar ----
  const maxExercicios = 6;
  const exerciciosMostrados = sessao.exercicios.slice(0, maxExercicios);
  const restantes = sessao.exercicios.length - exerciciosMostrados.length;

  const alturaCabecalho = 70 + 50 + 70 + 60 + 70; // eyebrow -> data -> ano/hora -> treino -> divisor
  const alturaExercicios = exerciciosMostrados.length * 104 + (restantes > 0 ? 50 : 0);
  const gapAntesPill = 60;
  const pillH = 90;
  const alturaConteudo = alturaCabecalho + alturaExercicios + gapAntesPill + pillH;

  const espacoDisponivel = footerTop - topMargin;
  let y = topMargin + Math.max(0, (espacoDisponivel - alturaConteudo) / 2);

  // fundo
  ctx.fillStyle = corBg;
  ctx.fillRect(0, 0, W, H);

  // eyebrow
  ctx.fillStyle = cinza;
  ctx.font = '700 28px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TREINO REGISTRADO', padX, y);
  y += 70;

  // data grande
  const d = new Date(sessao.data);
  const dataGrande = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase();
  const anoHora = `${d.getFullYear()} · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  ctx.fillStyle = branco;
  ctx.font = '800 72px Inter, sans-serif';
  ctx.fillText(dataGrande, padX, y);
  y += 50;

  ctx.fillStyle = cinza;
  ctx.font = '500 32px Inter, sans-serif';
  ctx.fillText(anoHora, padX, y);
  y += 70;

  // treino + duração
  ctx.fillStyle = corPrimaria;
  ctx.font = '800 52px Inter, sans-serif';
  ctx.fillText(sessao.treinoNomeSnapshot, padX, y);

  if (sessao.duracaoMinutos) {
    const larguraTreino = ctx.measureText(sessao.treinoNomeSnapshot).width;
    ctx.fillStyle = cinza;
    ctx.font = '600 36px Inter, sans-serif';
    ctx.fillText(`  ·  ${sessao.duracaoMinutos} min`, padX + larguraTreino, y);
  }
  y += 60;

  // divisor
  ctx.strokeStyle = corBorda;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(W - padX, y);
  ctx.stroke();
  y += 70;

  // exercícios (até 6, com contador se houver mais)
  exerciciosMostrados.forEach(ex => {
    const temPR = prsDaSessao && prsDaSessao.has(ex.nome);

    ctx.fillStyle = branco;
    ctx.font = '700 40px Inter, sans-serif';
    const nomeMaxWidth = W - padX * 2 - (temPR ? 160 : 0);
    ctx.fillText(truncarTexto(ctx, ex.nome, nomeMaxWidth), padX, y);

    if (temPR) {
      ctx.fillStyle = corPrimaria;
      ctx.font = '700 30px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('🏆 PR', W - padX, y);
      ctx.textAlign = 'left';
    }

    y += 44;
    ctx.fillStyle = cinza;
    ctx.font = '500 30px Inter, sans-serif';
    ctx.fillText(`${ex.pesosUsados.join('/')}kg`, padX, y);
    y += 60;
  });

  if (restantes > 0) {
    ctx.fillStyle = cinza;
    ctx.font = '500 30px Inter, sans-serif';
    ctx.fillText(`+ ${restantes} exercício${restantes > 1 ? 's' : ''}`, padX, y);
    y += 50;
  }

  // volume total — pílula em destaque, logo após os exercícios
  const volume = calcularVolumeSessao(sessao);
  const textoVolume = `VOLUME TOTAL: ${volume.toLocaleString('pt-BR')}kg`;
  ctx.font = '800 36px Inter, sans-serif';
  const larguraTexto = ctx.measureText(textoVolume).width;
  const pillW = larguraTexto + 80;
  const pillY = y + gapAntesPill;

  ctx.fillStyle = corCard;
  ctx.strokeStyle = corPrimaria;
  ctx.lineWidth = 3;
  const raio = pillH / 2;
  ctx.beginPath();
  ctx.moveTo(padX + raio, pillY);
  ctx.arcTo(padX + pillW, pillY, padX + pillW, pillY + pillH, raio);
  ctx.arcTo(padX + pillW, pillY + pillH, padX, pillY + pillH, raio);
  ctx.arcTo(padX, pillY + pillH, padX, pillY, raio);
  ctx.arcTo(padX, pillY, padX + pillW, pillY, raio);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = branco;
  ctx.textAlign = 'left';
  ctx.fillText(textoVolume, padX + 40, pillY + pillH / 2 + 13);

  // rodapé
  ctx.strokeStyle = corBorda;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padX, H - 130);
  ctx.lineTo(W - padX, H - 130);
  ctx.stroke();

  ctx.fillStyle = cinza;
  ctx.font = '600 28px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('treinos.talys.com.br', W / 2, H - 80);

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

async function compartilharSessao(sessao, prsDaSessao) {
  const blob = await gerarImagemSessao(sessao, prsDaSessao);
  const nomeArquivo = `treino-${sessao.data.slice(0, 10)}.png`;
  const arquivo = new File([blob], nomeArquivo, { type: 'image/png' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({
        files: [arquivo],
        title: 'Meu treino',
        text: `${sessao.treinoNomeSnapshot} — ${new Date(sessao.data).toLocaleDateString('pt-BR')}`
      });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return; // usuário cancelou o compartilhamento
      console.warn('Falha ao compartilhar, caindo para download.', err);
    }
  }

  // fallback: baixar a imagem (desktop, ou navegadores sem suporte a Web Share)
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}
