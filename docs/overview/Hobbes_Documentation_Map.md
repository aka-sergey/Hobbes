# Карта документации Hobbes

Этот документ объясняет, какие документы в репозитории являются основными, какие являются rollout-историей, а какие нужно читать как справочные или checkpoint-файлы.

Статус этого документа:

- `active`

## Легенда статусов

- `active`  
  Текущий рабочий документ. Его стоит поддерживать как актуальную точку входа или как действующую reference-документацию.

- `checkpoint`  
  Датированный снимок текущего состояния слоя системы. Полезен, но всегда привязан ко времени.

- `historical`  
  Исторический rollout-артефакт, завершенный installation-note, changelog или superseded snapshot. Полезен для следа изменений, но не должен считаться первым источником истины.

## 1. Канонические документы верхнего уровня

Это документы, с которых нужно начинать знакомство с проектом.

### Основные

- [README.md](../README.md)  
  Главная точка входа в документацию. `active`

- [../For_AI/README.md](../For_AI/README.md)  
  Машинный вход в плотный YAML/JSON context pack для ИИ и автоматик. `active`

- [Hobbes_Canonical_Set.md](./Hobbes_Canonical_Set.md)  
  Канонический комплект из 10 главных документов. `active`

- [Hobbes_AI_Context_Pack.md](./Hobbes_AI_Context_Pack.md)  
  Плотная context-capsule для ИИ и аварийного восстановления контекста. `active`

- [Hobbes_System_Map.md](./Hobbes_System_Map.md)  
  Карта всей системы. `active`

- [Hobbes_Current_State.md](./Hobbes_Current_State.md)  
  Сводка по тому, что реально работает сейчас. `active`

- [Hobbes_Gaps_And_Next_Steps.md](./Hobbes_Gaps_And_Next_Steps.md)  
  Главные пробелы и следующий порядок развития. `active`

- [Hobbes_Guide_RU.md](./Hobbes_Guide_RU.md)  
  Большой русскоязычный учебник по проекту. `active`

## 2. Архитектурные документы

Их нужно читать, когда вы хотите понять устройство отдельных подсистем.

### Общая архитектура

- [BLUEPRINT-REVIEW-AND-ROADMAP.md](../architecture/BLUEPRINT-REVIEW-AND-ROADMAP.md) `active`

### Dashboard и Control Center

- [Dashboard_MVP_Architecture.md](../architecture/Dashboard_MVP_Architecture.md) `active`
- [Dashboard_Control_Center_Architecture.md](../architecture/Dashboard_Control_Center_Architecture.md) `active`
- [Dashboard_Control_Center_Guide_RU.md](../dashboard/Dashboard_Control_Center_Guide_RU.md) `active`
- [Dashboard_LiveIngest_Installation.md](../dashboard/Dashboard_LiveIngest_Installation.md) `active`
- [Dashboard_Runtime_Sync_Installation.md](../dashboard/Dashboard_Runtime_Sync_Installation.md) `active`

### Search

- [Search_Router_Implementation.md](../architecture/Search_Router_Implementation.md) `active`
- [Search_Router_Taxonomy.md](../architecture/Search_Router_Taxonomy.md) `active`
- [Tavily_Integration_Plan.md](../architecture/Tavily_Integration_Plan.md) `historical`

### Telegram

- [Telegram_Group_Policy_Kit.md](../telegram/Telegram_Group_Policy_Kit.md) `active`
- [Telegram_Behavior_Profiles.md](../telegram/Telegram_Behavior_Profiles.md) `active`
- [Telegram_Test_Mode.md](../telegram/Telegram_Test_Mode.md) `active`

## 3. Документы текущего состояния

Это не "вечные" документы, а зафиксированные checkpoint-снимки на конкретную дату.

С ними нужно работать осторожно: они полезны, но всегда привязаны к моменту времени.

### Current-state / checkpoint

- [Hobbes_Current_State.md](./Hobbes_Current_State.md) `active`
- [Telegram_Current_State_2026-03-18.md](../current-state/Telegram_Current_State_2026-03-18.md) `checkpoint`
- [Search_Current_State_2026-03-18.md](../current-state/Search_Current_State_2026-03-18.md) `checkpoint`

### Исторический паспорт

- [PROJECT-PASSPORT.md](../history/PROJECT-PASSPORT.md) `historical`

Важно:
`PROJECT-PASSPORT.md` - это исторический snapshot более раннего состояния, а не окончательная правда о Hobbes на сегодня.

## 4. Rollout-документы по фазам

Это документы развития системы по шагам.
Они нужны, чтобы видеть, как проект строился и в каком порядке вводились новые слои.

### Phase 1

- [Phase_01_BaseInstallation.md](../rollout/Phase_01_BaseInstallation.md) `active`

### Phase 2

- [Phase_02_AgentRolloutPlan.md](../rollout/Phase_02_AgentRolloutPlan.md) `historical`
- [Phase_02_AgentRouting.md](../rollout/Phase_02_AgentRouting.md) `active`
- [Phase_02_Chief_Contract.md](../rollout/Phase_02_Chief_Contract.md) `historical`
- [Phase_02_Chief_Installation.md](../rollout/Phase_02_Chief_Installation.md) `historical`
- [Phase_02_Comms_Contract.md](../rollout/Phase_02_Comms_Contract.md) `historical`
- [Phase_02_Comms_Installation.md](../rollout/Phase_02_Comms_Installation.md) `historical`
- [Phase_02_Guard_Contract.md](../rollout/Phase_02_Guard_Contract.md) `historical`
- [Phase_02_Guard_Installation.md](../rollout/Phase_02_Guard_Installation.md) `historical`
- [Phase_02_Closeout.md](../rollout/Phase_02_Closeout.md) `historical`

### Phase 3

- [Phase_03_WorkhorseRolloutPlan.md](../rollout/Phase_03_WorkhorseRolloutPlan.md) `historical`
- [Phase_03_Research_Contract.md](../rollout/Phase_03_Research_Contract.md) `historical`
- [Phase_03_Research_Installation.md](../rollout/Phase_03_Research_Installation.md) `historical`
- [Phase_03_Memory_Contract.md](../rollout/Phase_03_Memory_Contract.md) `historical`
- [Phase_03_Memory_Installation.md](../rollout/Phase_03_Memory_Installation.md) `historical`
- [Phase_03_Booking_Contract.md](../rollout/Phase_03_Booking_Contract.md) `historical`
- [Phase_03_Booking_Installation.md](../rollout/Phase_03_Booking_Installation.md) `historical`
- [Phase_03_Closeout.md](../rollout/Phase_03_Closeout.md) `historical`

### Phase 4

- [Phase_04_Skills_Rollout_Plan.md](../rollout/Phase_04_Skills_Rollout_Plan.md) `active`
- [Phase_04_Wave_4A_Installation.md](../rollout/Phase_04_Wave_4A_Installation.md) `historical`
- [Phase_04_Wave_4B_Installation.md](../rollout/Phase_04_Wave_4B_Installation.md) `historical`

## 5. Справочные документы и журнал изменений

- [CHANGELOG.md](../history/CHANGELOG.md) `historical`
- [Skills_And_MCP_Plan.md](../architecture/Skills_And_MCP_Plan.md) `historical`
- [Telegram_Bot_Test_Questionnaire.md](../telegram/Telegram_Bot_Test_Questionnaire.md) `active`

## 5A. Сводный реестр по статусам

### `active`

- `docs/README.md`
- `docs/For_AI/README.md`
- `docs/For_AI/Hobbes_Full_Context.yaml`
- `docs/For_AI/Hobbes_Full_Context.json`
- `docs/overview/Hobbes_Canonical_Set.md`
- `docs/overview/Hobbes_AI_Context_Pack.md`
- `docs/overview/Hobbes_System_Map.md`
- `docs/overview/Hobbes_Current_State.md`
- `docs/overview/Hobbes_Gaps_And_Next_Steps.md`
- `docs/overview/Hobbes_Documentation_Map.md`
- `docs/overview/Hobbes_Guide_RU.md`
- `docs/architecture/BLUEPRINT-REVIEW-AND-ROADMAP.md`
- `docs/architecture/Dashboard_Control_Center_Architecture.md`
- `docs/architecture/Dashboard_MVP_Architecture.md`
- `docs/architecture/Search_Router_Implementation.md`
- `docs/architecture/Search_Router_Taxonomy.md`
- `docs/dashboard/Dashboard_Control_Center_Guide_RU.md`
- `docs/dashboard/Dashboard_LiveIngest_Installation.md`
- `docs/dashboard/Dashboard_Runtime_Sync_Installation.md`
- `docs/telegram/Telegram_Behavior_Profiles.md`
- `docs/telegram/Telegram_Group_Policy_Kit.md`
- `docs/telegram/Telegram_Test_Mode.md`
- `docs/telegram/Telegram_Bot_Test_Questionnaire.md`
- `docs/rollout/Phase_01_BaseInstallation.md`
- `docs/rollout/Phase_02_AgentRouting.md`
- `docs/rollout/Phase_04_Skills_Rollout_Plan.md`

### `checkpoint`

- `docs/current-state/Telegram_Current_State_2026-03-18.md`
- `docs/current-state/Search_Current_State_2026-03-18.md`

### `historical`

- `docs/history/PROJECT-PASSPORT.md`
- `docs/history/CHANGELOG.md`
- `docs/architecture/Tavily_Integration_Plan.md`
- `docs/architecture/Skills_And_MCP_Plan.md`
- `docs/rollout/Phase_02_AgentRolloutPlan.md`
- `docs/rollout/Phase_02_Chief_Contract.md`
- `docs/rollout/Phase_02_Chief_Installation.md`
- `docs/rollout/Phase_02_Comms_Contract.md`
- `docs/rollout/Phase_02_Comms_Installation.md`
- `docs/rollout/Phase_02_Guard_Contract.md`
- `docs/rollout/Phase_02_Guard_Installation.md`
- `docs/rollout/Phase_02_Closeout.md`
- `docs/rollout/Phase_03_WorkhorseRolloutPlan.md`
- `docs/rollout/Phase_03_Research_Contract.md`
- `docs/rollout/Phase_03_Research_Installation.md`
- `docs/rollout/Phase_03_Memory_Contract.md`
- `docs/rollout/Phase_03_Memory_Installation.md`
- `docs/rollout/Phase_03_Booking_Contract.md`
- `docs/rollout/Phase_03_Booking_Installation.md`
- `docs/rollout/Phase_03_Closeout.md`
- `docs/rollout/Phase_04_Wave_4A_Installation.md`
- `docs/rollout/Phase_04_Wave_4B_Installation.md`

## 6. Что не считается "обычной документацией"

Следующие файлы похожи на документацию по форме, но по сути являются runtime/source файлами:

- `config/agents/**.md`
- `skills/*/SKILL.md`

Их нельзя просто переносить в `docs/`, потому что:

- они участвуют в живой работе OpenClaw;
- они ожидаются скриптами и runtime-контуром по конкретным путям;
- это часть исполняемой логики Hobbes.

Поэтому правило такое:

- для людей документация живет в `docs/`;
- для рантайма поведенческие контракты живут в `config/agents/` и `skills/`.

Отдельное исключение нового типа:

- `docs/For_AI/*`

Это не narrative-документация для чтения человеком, а плотные машинные exports текущего состояния системы.

## 7. Что делать с новыми документами

### Новый документ относится к архитектуре или описанию системы

Путь:

- класть в подходящую подпапку внутри `docs/`

### Новый документ - это поведенческий контракт агента

Путь:

- класть в `config/agents/.../workspace/`

### Новый документ - это описание навыка для исполнения агентом

Путь:

- класть в `skills/<skill>/SKILL.md`

## 8. Практический вывод

Документация Hobbes больше не должна быть "рассыпана" по случайным README.

Каноническая человеческая документация:

- находится в `docs/`;
- читается через [README.md](../README.md);
- делится на архитектуру, current-state, rollout-историю и справку.
