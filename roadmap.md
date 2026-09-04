# Roadmap — App de Treinos

Ações futuras planejadas, fora do escopo já implementado.

## Resolvidos

### ~~Corrigir z-index do menu e switches~~ ✅
Resolvido: `.tabs` estava sem `z-index`, ficando atrás de outros elementos empilhados. Adicionado `z-index: 1000;` na regra `.tabs`.

## Bugs / ajustes técnicos

### Verificar z-index dos switches
O item original também suspeitava de conflito de empilhamento nos switches (`.switch-input`, elementos sobrepostos: input + div + svg). O menu (`.tabs`) já foi corrigido; os switches ainda não foram confirmados como problema real — só investigar se aparecer um caso concreto.

## Novas funcionalidades

### Tipo de atividade (força, distância ou tempo)
Hoje o modelo de dados assume treino de força (séries × reps × peso) em todo lugar — `treinos_config`, `historico_sessoes`, gráfico de progressão, cálculo de volume e recordes. Adicionar suporte a exercícios de **distância** (corrida, bike — km, pace) e **tempo** (prancha, HIIT — duração, sem peso) exige:
- Um campo `tipo` no exercício (`forca` | `distancia` | `tempo`).
- Campos de registro condicionais ao tipo (hoje é peso por série; precisaria virar km/pace para distância, ou duração para tempo).
- Adaptar volume, recordes (PR) e gráfico de progressão pra cada tipo — não faz sentido "peso máximo" pra uma corrida.
- Migração dos dados existentes (todos assumidos como `forca` por padrão).

### Melhorar UI
Item aberto — levantar pontos específicos (telas, componentes, fluxos) conforme forem aparecendo no uso real do app.

### Aumentar configurações
Hoje a tela de Configurações só tem a cor primária. Candidatos a adicionar:
- Unidade de peso (kg/lb).
- Tema claro, se fizer sentido.
- Limite de registros no gráfico de progressão (hoje fixo em 5).
- Mínimo de registros pra um exercício aparecer no filtro de progressão (hoje fixo em 2).
- Confirmações (ligar/desligar o `confirm()` antes de apagar sessão/treino).

### Adicionar informações pessoais para planejamento
Dados que ainda não existem no app e que ajudariam no planejamento dos treinos:
- Peso corporal ao longo do tempo (bodyweight tracking), pra cruzar com carga levantada.
- Objetivo do treino (hipertrofia, força, resistência) — pode influenciar sugestões futuras.
- Idade/altura, se algum cálculo (ex: 1RM estimado, TDEE) fizer sentido depois.
- Onde salvar: provavelmente uma nova chave no localStorage (`dados_pessoais`), separada de `treinos_config` e `historico_sessoes`, seguindo o padrão de storage.js.

### Migrar de localStorage para servidor
Hoje os dados vivem só no navegador do usuário (localStorage), sem sincronização entre aparelhos. Migrar pra um backend com banco de dados:
- **O que já ajuda**: acesso a dado já passa por funções isoladas em `storage.js` (`getConfig`, `saveConfig`, `getHistorico`, `saveHistorico`, `getCorPrimaria`, etc) — a lógica de negócio (analytics, chart, boa parte do app.js) não depende de como o dado é persistido.
- **O que precisa ser construído**: um backend (API REST) e um banco (SQLite pra começar, sem servidor de banco separado).
- **O que precisa mudar no front**: cada função de `storage.js` passa de leitura síncrona do localStorage pra chamada assíncrona (`fetch`) — isso é a parte mais espalhada, já que o código que consome essas funções hoje é síncrono e precisa virar `async/await` em vários pontos do `app.js`.
- **Autenticação**: hoje não existe usuário — é "seu navegador = seus dados". Multiusuário real pede login/sessão; dá pra adiar isso com uma chave de acesso simples no início.
- **Abordagem sugerida** (pensando em usar isso como estudo de backend): começar com um único endpoint de sync (recebe/devolve o JSON inteiro, no mesmo formato do "Exportar" atual) antes de quebrar em endpoints por recurso (treinos, sessões) e só depois mexer em autenticação.

---

*Este arquivo é só um apontador de direção — não é uma spec fechada. Cada item aqui vira uma conversa própria quando for a hora de implementar.*