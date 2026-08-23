# Roadmap — App de Treinos

Ações futuras planejadas, fora do escopo já implementado.

## Bugs / ajustes técnicos

### Corrigir z-index do menu e switches
O menu inferior (`.tabs`) usa `position: fixed` com `backdrop-filter`, e os switches (`.switch-input`) usam elementos sobrepostos (input + div + svg). Existe conflito de empilhamento em pelo menos um desses casos — mapear onde exatamente o z-index está furando (provavelmente overlay do modo foco, ou o menu ficando atrás de algum card) e corrigir com uma escala de z-index consistente em vez de valores soltos.

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

---

*Este arquivo é só um apontador de direção — não é uma spec fechada. Cada item aqui vira uma conversa própria quando for a hora de implementar.*