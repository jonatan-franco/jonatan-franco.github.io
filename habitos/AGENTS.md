# AGENTS.md — HaQt (`habitos/`)

Instruções para agentes de IA que trabalharem no app de rastreamento de hábitos deste diretório.

## Visão geral

- `habitos/index.html` é o **HaQt**, um app **100% estático** de marcação de hábitos (Atividade Física e Sono), sem build, sem npm e sem backend.
- Dependências apenas via CDN: Tailwind CSS (com `tailwind.config` inline no `<head>`), Chart.js, Lucide Icons e Google Fonts (Inter / JetBrains Mono).
- Os scripts são **clássicos** (sem módulos, sem imports): todos compartilham o mesmo escopo global. A ordem de carregamento importa e é: `storage.js` → `math.js` → `charts.js` → `timer.js` → `profile.js` → `atv.js` → `app.js` (este último inicializa tudo no `DOMContentLoaded`).
- Toda a interface é em **pt-BR** — mantenha textos, labels e mensagens nesse idioma.
- Este diretório faz parte do site Jekyll publicado no GitHub Pages (fica em `https://jonatan-franco.github.io/habitos/`). Não altere arquivos da raiz do repositório ao trabalhar no app.

## Como rodar e verificar

- Não há testes, lint, CI ou build. A verificação é **manual, no navegador**.
- Rode um servidor estático na raiz do repositório e abra `http://localhost:8080/habitos/`:

  ```bash
  python3 -m http.server 8080
  ```

  (O `.vscode/launch.json` do repositório já aponta o Chrome para `http://localhost:8080`.)
- Abrir `habitos/index.html` direto via `file://` também funciona na maioria dos casos.
- Após qualquer mudança, confira o **console do navegador** (sem erros) e teste os fluxos que tocou: dashboard, marcar/desmarcar hábito, modais, timer, agenda e exportações.

## Arquitetura e arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Todo o markup: views (`#view-dashboard`, `#view-atv_fisica`, `#view-sono`, `#view-timer`, `#view-metrics`, `#view-calendar`), modais e ordem dos scripts. |
| `assets/js/storage.js` | `SafeStorage` (wrapper do `localStorage` com fallback em memória), `CATEGORIES`, `PALETTE`, semana atual (`weekDays`/`todayIndex`), dados default, `loadData`/`saveData` e sync com GitHub Gist. |
| `assets/js/math.js` | Funções puras de métricas: `calcHabitMetrics`, `calcSleepElasticity`, `calcSleepAggregates`, `calcWeeklyGlobalMetrics`. |
| `assets/js/charts.js` | Gráficos Chart.js da aba Métricas (total por dia e por atividade/grupo, com banda ±DP). |
| `assets/js/timer.js` | Timer (cronômetro, regressivo, pomodoro, deep work) e `finishAndLogSession`, que lança horas na atividade selecionada. |
| `assets/js/profile.js` | Perfil, avatar emoji (papel + tom de pele), cumprimento semanal e modal de primeiro uso. |
| `assets/js/atv.js` | Tela de Atividade Física: plano de treino pré-cadastrado (`WORKOUT_PLAN`: Upper A, Lower A, Upper B e Lower B), filtro pela Agenda do dia selecionado e lista de exercícios com variações; registro de exercícios com carga (kg, 2 casas) e observações em HTML montado via template string (`#atv-fisica-cards-grid`). |
| `assets/js/app.js` | Roteamento por hash, `renderAll` e todos os renderizadores/eventos, exportações CSV/ICS. Carregado por último. |
| `assets/css/style.css` | CSS específico: sidebar colapsável, checkbox custom da tabela, grade da agenda e scrollbar. |

## Modelo de dados (localStorage)

Chave principal `habit_quant_pro_v10_sync` (`STORAGE_KEY`), gravada via `SafeStorage`:

```js
{
  habits: [{
    id, name,
    category: 'atv_fisica' | 'sono',
    targetHours,          // H* — meta de horas na semana
    checks:      [7],     // boolean — presença por dia (Seg..Dom)
    dailyHours:  [7],     // number  — h_it, horas realizadas por dia
    bedtimeHours:[7],     // opcional, só categoria 'sono' — tempo de cama
    planId,               // opcional — treinos pré-cadastrados (WORKOUT_PLAN em atv.js)
    exercises: [          // opcional — catálogo do treino:
                          // { name, muscle, variations[], sets, reps, rest, load? }
    ]
  }],
  calendarEvents: [{ id, habitId, dayIndex /*0-6*/, startHour /*6-22*/, duration /*h*/ }],
  timerConfig: { stopwatchStartMin, countdownMin, pomodoroMin, deepworkMin },
  sleepJournal: { 'YYYY-MM-DD': { bed, slept, wake, getup } } // strings "HH:MM"
}
```

Outras chaves: `hq_profile_v1` (perfil), `hq_atv_logs_v1` (logs de exercício), `hq_plan_seeded_v1` (controle de semeadura do plano de treino), `hq_gist_token` / `hq_gist_id` (sync).

Regras importantes:

- Sempre use **`SafeStorage`**, nunca `localStorage` direto.
- Toda mutação deve passar por **`saveData()`** (em `storage.js`): grava, chama `renderAll()` e agenda o push para o Gist (debounce de 1s).
- A semana é **segunda → domingo da semana corrente**, calculada em `weekDays` (campos: `shortName`, `dateNum`, `iso`, `isToday`, `rawDate`). Não recalcule datas ad hoc; use essa estrutura. `todayIndex` é o índice do dia atual.
- **Não renomeie as chaves do `localStorage` nem mude o formato dos dados sem migração** — dados de usuários reais e o payload do Gist dependem disso.
- `applyDataMigrations()` (`storage.js`) roda no `loadData()` e após o pull do Gist: remove os treinos de exemplo legados (`h1`/`h2` — "Treino Upper (Força & Hipertrofia)" e "Treino Lower + Cardio Z2") e eventos órfãos da Agenda. Os defaults atuais têm apenas o hábito de Sono; os treinos vêm do `WORKOUT_PLAN`.

## Convenções de código

- Funções chamadas por atributos HTML (`onclick="..."`) precisam estar expostas em **`window.`**. Siga o padrão existente.
- Renderização é feita por **`innerHTML` com template strings** e classes Tailwind completas (o Tailwind via CDN observa o DOM). Inclua `refreshIcons()` após injetar markup com ícones Lucide (`<i data-lucide="nome"></i>`).
- Modais abrem/fecham alternando as classes `hidden`/`flex` (padrão: `classList.remove('hidden'); classList.add('flex')`).
- `renderAll()` re-renderiza tudo a cada save: mantenha as funções de render **idempotentes** (reconstruir via `innerHTML = ''` + append, como no código atual).
- Nomes técnicos (variáveis, ids de DOM) em inglês/camelCase; textos de UI em pt-BR.
- Formatação numérica: horas com 1 casa (`toFixed(1)`), desvios com 2, cargas com 2, eficiência com 0.
- Cores por categoria vêm de `CATEGORIES[key].hex` (gráficos) e das classes `cardBg`/`pillBg` (cards). Novas categorias devem seguir essa estrutura.

## Definições de métricas (`math.js`)

- `freqPct` = dias marcados / 7 × 100.
- `totalHours` = Σ `dailyHours`; `meanHours` = ÷7; `sdHours` = DP populacional (÷7).
- `hoursRatio` = `totalHours / targetHours`; `hoursPct` = ×100.
- `sensitivityDerivative` = `(100 / H*) × (0.5 + 0.5·freqRatio)` — sensibilidade do engajamento a horas.
- `elasticity` (ε) — categoria comum: `hoursRatio × exp(−0.35·|freqRatio − min(1, hoursRatio)|)`.
- `elasticity` (ε) — categoria `sono`: regressão de "horas dormidas" contra "tempo de cama" (β·médiaB/médiaS), via `calcSleepElasticity`.
- Agregados de sono (`calcSleepAggregates`): consideram apenas dias com `bedtimeHours > 0`; `efficiency` = média dormida / média de cama × 100.
- KPIs globais do dashboard vêm de `calcWeeklyGlobalMetrics()`.

## Fluxos principais

- **Marcar hábito**: `toggleHabitDay(hIdx, dIdx)` — ao marcar, preenche `dailyHours` (8h para `sono`; `targetHours/5` para o resto); ao desmarcar, zera as horas.
- **Modal de atividade**: `openHabitModal(index)` (`-1` = nova). O form é tratado no `DOMContentLoaded` de `app.js`; a seção de tempo de cama só aparece para categoria `sono` (`onHabitCategoryChange`).
- **Plano de treino (Atividade Física)**: `WORKOUT_PLAN` em `atv.js` guarda os treinos pré-cadastrados (Upper A, Lower A, Upper B e Lower B) com seus exercícios, variações equivalentes, séries/reps, descanso e carga de referência (`load`, opcional). `ensureWorkoutPlanHabits()` (chamado no boot em `app.js` e no reset) semeia cada treino **uma única vez por dispositivo** (`hq_plan_seeded_v1`); deleções do usuário são respeitadas.
- **Filtro "dependendo do dia"**: no formulário de registro da Atividade Física, o select de Atividade mostra apenas os treinos com bloco agendado na **Agenda** para o dia da data selecionada (via `calendarEvents.dayIndex`); se o dia não tiver nada agendado, mostra todas. O campo Exercício vira a lista de exercícios do treino com as variações (↳), exibe alvo/séries/descanso e sugere a carga de referência no input de Carga (editável).
- **Timer**: `selectTimerMode` reinicia o modo; `finishAndLogSession` soma as horas ao hábito/dia selecionados e pode marcar presença (`#timer-auto-check`). Sessões < 30s pedem minutos via `prompt`.
- **Agenda**: grade Seg–Dom, 06:00–22:00; clique em célula vazia cria evento, clique no bloco edita/exclui. Exportação `.ics` e link para Google Agenda.
- **Diário do sono**: `openSleepJournalModal` grava por data ISO em `sleepJournal`; tabelas renderizadas em `#view-sono` e `#view-metrics`.
- **CSV**: `exportToCSV()` — se adicionar colunas, atualize **cabeçalho e linha** no mesmo lugar.

## Sincronização (GitHub Gist)

- Token e ID ficam em `SafeStorage` (`hq_gist_token`, `hq_gist_id`); o gist é privado com o arquivo `habitquant_data.json`.
- Pull automático: no load, em `focus` e em `visibilitychange` (`autoPullFromGist`). Push automático: 1s após `saveData()` (`autoPushToGist`).
- Cuidado em alterações nesse fluxo: o pull sobrescreve dados locais. Nunca logue/exponha o token.

## Como estender (receitas rápidas)

- **Novo treino do plano**: adicione um item em `WORKOUT_PLAN` (`atv.js`) com `planId` único e a lista `exercises` (`name`, `muscle`, `variations`, `sets`, `reps`, `rest`, `load` opcional). Ele é semeado automaticamente no próximo carregamento, desde que o `planId` ainda não esteja em `hq_plan_seeded_v1`.
- **Nova view/rota**: crie `<section id="view-X" class="hidden">` no `index.html`; adicione entrada em `ROUTE_CONFIG`; inclua `'X'` no array de `applyRoute` (e um render em `renderAll`, se necessário); adicione botões de navegação com `data-route="X"` (sidebar) e `data-mobile-route="X"` (nav inferior).
- **Nova categoria**: adicione em `CATEGORIES` (label, emoji, cardBg, pillBg, hex); atualize os botões de filtro no `index.html` e o array fixo `['all', 'atv_fisica', 'sono']` em `setCategoryFilter`; revise pontos que assumem as duas categorias atuais (ex.: KPI de sono pega o primeiro hábito `category === 'sono'`).
- **Novo campo no hábito**: ajuste defaults + `loadData`/`saveData` + formulário em `openHabitModal` e submit em `app.js` + payload do Gist. Se quebrar compatibilidade, faça migração e considere nova versão da `STORAGE_KEY`.

## Armadilhas conhecidas (código atual)

- `saveAndOpenGoogleCal()` é chamada no botão "Salvar e Abrir no Google Agenda" (`index.html`) mas **não existe** — clicar gera `ReferenceError`.
- `charts.js` usa `CATEGORIES.estudos` como fallback, mas essa categoria não existe em `CATEGORIES` (gera erro se um hábito tiver categoria desconhecida).
- As tabelas de sono são renderizadas em **duas funções duplicadas** (`renderSleepJournalView` e `renderDedicatedSleepView`) — mudanças precisam ser feitas nas duas, ou refatoradas.
- `weekDays[].iso` (em `storage.js`) usa `toISOString()` (UTC): em GMT-3, após ~21h a string pode cair no dia seguinte — atenção às chaves do `sleepJournal` e ao CSV. Em `atv.js` foi adotado `getLocalISODate()`, que não tem esse problema.
- Os elementos `atv-log-*` só existem depois de `renderAtvFisicaInteractiveView()` e são recriados a cada render — não os consulte no boot nem guarde referências entre interações.
- O plano de treino é semeado uma vez por dispositivo: para forçar a re-semeadura de um treino já semeado (ex.: após apagá-lo), remova o `planId` de `hq_plan_seeded_v1` ou use "Resetar Dados".
- Nomes de hábito são interpolados direto em template strings/atributos inline: evite aspas problemáticas ao adicionar novos handlers.

## Regras para agentes

1. Mantenha o app **estático e sem dependências instaladas**: nada de npm/build/bundler; CDNs apenas.
2. Não renomeie chaves do `localStorage`; preserve compatibilidade com dados existentes e com o payload do Gist.
3. Não quebre os handlers inline do HTML: funções novas chamadas pelo markup devem ficar em `window.`.
4. Prefira **edições pequenas e cirúrgicas** no arquivo responsável; não reformate código não relacionado.
5. Ao corrigir bugs desta lista de armadilhas, valide no navegador os fluxos afetados e mantenha o comportamento visual/UX consistente com o resto do app.
