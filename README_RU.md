# GitHub Friends Tracker

Сервис на React + GitHub Actions для отслеживания `followers` / `following` GitHub-аккаунта с хранением истории в JSON.

- Демо: https://github-friends.nlo.ovh/
- English docs: `README.md`

## Что делает сервис

- По расписанию (по умолчанию каждые 6 часов) собирает `followers` и `following` через GitHub API.
- Сохраняет историю снапшотов и событий в JSON (`public/data/`).
- Формирует события:
  - `follower_gained`
  - `follower_lost`
  - `you_followed`
  - `you_unfollowed`
- Формирует отчеты для чистки подписок:
  - `Not Followback` (вы подписаны, в ответ нет)
  - `Followers` (на вас подписаны, вы не подписаны)
  - `Friends` (взаимные подписки + last contribute)
  - `Unfollow candidates`:
    - Not Followback 7+ дней
    - Friends без активности 60+ дней
    - отписавшиеся удаленные аккаунты

## Актуальный UI и логика работы

- Вкладки: `Unfollow candidates`, `Not Followback`, `Followers`, `Friends`, `Recent events`.
- Сортировки по ключевым колонкам (ожидание, дата слежения, дни с последней активности).
- Ограничение вывода по вкладкам: `10/25/50/100/500`.
- Настройки страницы (иконка шестеренки):
  - количество записей по умолчанию
  - язык интерфейса (`English` по умолчанию, `Russian` опционально)
  - локальный список исключений
- База данных не нужна: данные хранятся в JSON в репозитории.

## Структура данных

- `public/data/latest.json` - последний снапшот
- `public/data/events.json` - история событий
- `public/data/follow-tracker.json` - состояние подписок по пользователям
- `public/data/reports.json` - готовый отчет для UI
- `public/data/ignore.json` - логины для игнорирования
- `public/data/activity-cache.json` - кэш last contribute
- `public/data/snapshots/*.json` - архив снапшотов

## Локальный запуск

```bash
npm install
npm run dev
```

## Локальный запуск snapshot

```bash
GH_USERNAME=<your_login> \
GITHUB_TOKEN=<github_pat> \
FOLLOW_BACK_WINDOW_DAYS=7 \
FRIEND_INACTIVE_DAYS=60 \
ACTIVITY_REFRESH_HOURS=24 \
npm run snapshot
```

## GitHub Actions

### `update-follow-data.yml`

- Триггеры:
  - cron: `17 */6 * * *`
  - ручной запуск (`workflow_dispatch`)
- Запускает `npm run snapshot`
- Коммитит обновленные JSON в `public/data`

### `deploy-pages.yml`

- Триггеры: push в `main` и ручной запуск
- Собирает Vite-приложение и деплоит на GitHub Pages
- Автоматически выставляет `VITE_BASE_PATH` под custom domain или repo pages

## Настройки репозитория

`Settings -> Secrets and variables -> Actions`:

- Variable: `GH_USERNAME` (опционально, fallback: `github.repository_owner`)
- Secret: `GH_PAT` (опционально, fallback: `github.token`)

## GitHub Pages

1. Включить Pages в `Settings -> Pages`
2. Выбрать источник `GitHub Actions`
3. Для custom domain использовать `public/CNAME`

Если в деплое ошибка `Failed to create deployment (404)`, чаще всего Pages не включен.

## Favicons

Иконки проекта расположены в `public/favicons/` и подключены в `index.html`.

## Риск использования

Использование сервиса на ваш риск. Нет гарантии, что паттерны автоматизации/API не приведут к лимитам или ограничениям GitHub.
