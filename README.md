# GitHub Friends

React + GitHub Actions сервис для отслеживания `followers` / `following` с хранением истории в JSON.

## Что делает

- Каждые несколько часов получает список `followers` и `following` через GitHub API.
- Сохраняет снапшот в `public/data/snapshots/`.
- Считает события:
  - `follower_gained`
  - `follower_lost`
  - `you_followed`
  - `you_unfollowed`
- Строит отчеты:
  - текущие невзаимные подписки
  - кандидаты на отписку (кто не подписался взаимно в течение `N` дней)

## Структура данных

- `public/data/latest.json`: последний снапшот
- `public/data/events.json`: история событий
- `public/data/follow-tracker.json`: трекинг взаимности по пользователям
- `public/data/reports.json`: готовый отчет для UI
- `public/data/ignore.json`: логины, которые нужно игнорировать
- `public/data/activity-cache.json`: кэш активности взаимных подписчиков

## Локальный запуск

```bash
npm install
npm run dev
```

## Локальный snapshot

```bash
GH_USERNAME=<your_login> \
GITHUB_TOKEN=<github_pat> \
FOLLOW_BACK_WINDOW_DAYS=7 \
ACTIVITY_REFRESH_HOURS=24 \
npm run snapshot
```

## GitHub Actions

### 1) Секреты репозитория

Добавьте в `Settings -> Secrets and variables -> Actions`:

- `Variables`: `GH_USERNAME` - ваш GitHub логин (если не задан, берется `repository_owner`)
- `Secrets`: `GH_PAT` - PAT токен (опционально, если нужен более высокий лимит API)

Если `GH_PAT` не задан, workflow использует встроенный `github.token` (подходит для публичных данных, но с ограничениями).

`last contribute` для взаимных подписчиков определяется по последнему публичному contribution-event (например `PushEvent`, `PullRequestEvent`) и обновляется с кэшем (`ACTIVITY_REFRESH_HOURS`).

### 2) Workflows

- `update-follow-data.yml`
  - `schedule` каждые 6 часов
  - обновляет JSON в `public/data`
  - коммитит изменения обратно в репозиторий
- `deploy-pages.yml`
  - собирает React приложение
  - деплоит в GitHub Pages

## Настройка GitHub Pages

1. В `Settings -> Pages` выберите `Source: GitHub Actions`.
2. Убедитесь, что default branch называется `main` (или поменяйте в workflow).
3. При наличии `public/CNAME` base path ставится автоматически в `/`.
4. Если нужен ручной override, задайте `Variable: VITE_BASE_PATH` (например `/` или `/repo-name/`).

Если в workflow `deploy-pages` ошибка `Failed to create deployment (status: 404)`, это почти всегда означает, что Pages еще не включен для репозитория в `Settings -> Pages`.

## Ignore list

Файл `public/data/ignore.json`:

```json
{
  "logins": ["example-user"]
}
```

Игнорируемые логины не попадают в список кандидатов на отписку.
