function desenharGrafico(canvas, pontos) {
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
  if (displayWidth === 0 || displayHeight === 0) return false;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, displayWidth, displayHeight);

  if (pontos.length < 2) return false;

  const corPrimaria = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary').trim() || '#ff4c00';

  const w = displayWidth;
  const h = displayHeight;

  const padLeft = 62;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 34;

  const valores = pontos.map(p => p.peso);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const range = max - min || 1;

  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;
  const stepX = pontos.length > 1 ? plotW / (pontos.length - 1) : 0;

  const coords = pontos.map((p, i) => {
    const x = padLeft + i * stepX;
    const y = padTop + plotH - ((p.peso - min) / range) * plotH;
    return { x, y, peso: p.peso, data: p.data };
  });

  // linha
  ctx.strokeStyle = corPrimaria;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  coords.forEach((c, i) => {
    if (i === 0) ctx.moveTo(c.x, c.y);
    else ctx.lineTo(c.x, c.y);
  });
  ctx.stroke();

  // pontos
  ctx.fillStyle = corPrimaria;
  coords.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // labels de valor min/max (topo/base, alinhado à esquerda com respiro do eixo)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px -apple-system, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(max + 'kg', 0, padTop + 4);
  ctx.fillText(min + 'kg', 0, padTop + plotH + 4);

  // labels de data abaixo de cada ponto
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px -apple-system, system-ui, sans-serif';
  ctx.textAlign = 'center';
  coords.forEach(c => {
    const d = new Date(c.data);
    const label = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
    ctx.fillText(label, c.x, h - 8);
  });

  return true;
}