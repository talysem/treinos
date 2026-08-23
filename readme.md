# App de Treinos

App web para registrar e acompanhar treinos de academia. JavaScript puro (sem frameworks, sem build step), dados salvos no `localStorage` do navegador — sem backend, sem banco de dados.

## Estrutura

```
treinos-app/
├── index.html          # Estrutura das 4 telas (Histórico, Treinos, Registrar, Configurações)
├── css/
│   └── style.css        # Todo o visual do app
├── js/
│   ├── storage.js       # Acesso ao localStorage, migração de esquema, export/import de backup
│   ├── chart.js          # Gráfico de progressão de carga (canvas puro, sem lib)
│   ├── analytics.js      # Cálculos: volume, recordes (PR), frequência, distribuições, duração média
│   └── app.js             # Navegação entre telas e toda a renderização
└── ROADMAP.md            # Próximos passos planejados
```

Sem dependências externas, exceto a fonte (Google Fonts, via `@import` no CSS). Roda abrindo o `index.html` direto no navegador — não precisa de servidor.

## Telas

- **Histórico** — calendário do mês com dias treinados destacados, estatísticas (sequência de dias, % do mês, duração média), distribuição de treinos por tipo e por dia da semana, gráfico de progressão de carga por exercício (últimos 5 registros, só exercícios com 2+ registros aparecem no filtro), e a lista de sessões registradas (editável e removível).
- **Treinos** — até quantos treinos você quiser (inicialmente 3, mas dá pra adicionar/remover). Cada um é editável: nome dos exercícios, equipamento, séries, reps e peso padrão por série. Tem um "modo foco" que abre o treino em tela cheia com Wake Lock (impede a tela de bloquear durante o treino).
- **Registrar** — escolhe o treino, marca quais exercícios foram realizados, ajusta séries/reps/peso por série (vem pré-preenchido com o padrão do treino), define data/hora e duração, e salva como uma sessão no histórico.
- **Configurações** — cor primária do app, customizável e persistida.

## Modelo de dados

Duas chaves no `localStorage`:

- `treinos_config` — os treinos cadastrados (templates: nome, exercícios, pesos padrão).
- `historico_sessoes` — as sessões registradas. Cada sessão é um **snapshot independente** (nome do treino, exercícios, pesos usados no momento) — editar ou apagar um treino depois não afeta o histórico já salvo.

Uma terceira chave, `cor_primaria`, guarda a preferência de cor.

Todo o app trabalha com pesos **por série** (arrays), não um valor único por exercício — suporta cargas diferentes em cada série (ex: dropset).

## Backup

Sem banco de dados, os dados ficam presos ao navegador/aparelho. A tela de Histórico tem botões de **Exportar** (baixa um `.json` com tudo) e **Importar** (restaura a partir desse arquivo) — é o mecanismo de backup manual do app.

## Compatibilidade

- **Wake Lock API** (não deixa a tela bloquear no modo foco): suportada em Chrome/Edge e Safari 16.4+. Em navegadores sem suporte, o app funciona normalmente, só sem essa garantia.
- **Pickers nativos de data/hora**: no iOS, todo navegador usa o motor WebKit por baixo (exigência da Apple), que ignora estilização de `<input type="datetime-local">` e usa a UI nativa do sistema. `color-scheme: dark` no CSS ajusta o tema desse picker pra combinar com o app.

## Próximos passos

Ver `ROADMAP.md`.