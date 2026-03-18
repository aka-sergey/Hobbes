# Документация Hobbes

Вся человекочитаемая документация Hobbes теперь собрана внутри одной папки `docs/`.

Главная точка входа:

- [For_AI/README.md](./For_AI/README.md)
- [overview/Hobbes_AI_Context_Pack.md](./overview/Hobbes_AI_Context_Pack.md)
- [overview/Hobbes_Canonical_Set.md](./overview/Hobbes_Canonical_Set.md)
- [overview/Hobbes_System_Map.md](./overview/Hobbes_System_Map.md)
- [overview/Hobbes_Current_State.md](./overview/Hobbes_Current_State.md)
- [overview/Hobbes_Gaps_And_Next_Steps.md](./overview/Hobbes_Gaps_And_Next_Steps.md)
- [overview/Hobbes_Documentation_Map.md](./overview/Hobbes_Documentation_Map.md)
- [overview/Hobbes_Guide_RU.md](./overview/Hobbes_Guide_RU.md)

## Структура

- [For_AI/](./For_AI/)
  Машинно-ориентированные YAML/JSON exports с плотной текущей картиной системы для аварийного восстановления контекста и автопарсинга.

- [overview/](./overview/)  
  Общая карта системы, AI context pack, канонический комплект, текущее состояние, пробелы, учебник и карта документации.

- [architecture/](./architecture/)  
  Архитектура OpenClaw, dashboard, search/router и общие проектные планы.

- [current-state/](./current-state/)  
  Датированные документы о текущем состоянии отдельных слоев.

- [telegram/](./telegram/)  
  Telegram policy kit, behavior profiles, test mode и related docs.

- [dashboard/](./dashboard/)  
  Практические документы по dashboard, live ingest, runtime sync и Control Center.

- [rollout/](./rollout/)  
  Документы по фазам развертывания и развития системы.

- [history/](./history/)  
  Исторические checkpoint-документы и changelog.

## Главное правило

Человекочитаемая документация живет в `docs/`.

Но есть два сознательных исключения:

- `config/agents/**.md`  
  Это не "просто документация", а runtime-контракты агентов, которые нужны OpenClaw по конкретным путям.

- `skills/*/SKILL.md`  
  Это исполняемые skill-манифесты, а не свободные справочные тексты.

Иными словами:

- `docs/` - это дом документации для людей;
- `config/agents/**` и `skills/*` - это рабочие исходники поведения системы.
