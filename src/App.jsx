import { useEffect, useMemo, useState } from 'react'
import './App.css'

const EVENT_LABELS = {
  follower_gained: 'Подписался на вас',
  follower_lost: 'Отписался от вас',
  you_followed: 'Вы подписались',
  you_unfollowed: 'Вы отписались',
}

const EVENT_FILTERS = [
  { id: 'all', label: 'Все события' },
  { id: 'follower_lost', label: 'Отписался от вас' },
  { id: 'follower_gained', label: 'Подписался на вас' },
  { id: 'you_followed', label: 'Вы подписались' },
]

const TAB_NON_RECIPROCAL = 'non_reciprocal'
const TAB_FOLLOWERS_ONLY = 'followers_only'
const TAB_MUTUAL = 'mutual'
const TAB_EVENTS = 'events'

const NON_RECIPROCAL_SORT_TRACKED = 'tracked_since'
const NON_RECIPROCAL_SORT_WAITING = 'waiting'

const LIMIT_OPTIONS = [10, 25, 50, 100, 500]
const DEFAULT_PAGE_SIZE_FALLBACK = 100
const SETTINGS_STORAGE_KEY = 'gh_friends_default_page_size'

const FIXED_REPO_OWNER = 'GoXLd'
const FIXED_REPO_NAME = 'github-friends'
const FIXED_REPO_URL = `https://github.com/${FIXED_REPO_OWNER}/${FIXED_REPO_NAME}`
const FIXED_REPO_API_URL = `https://api.github.com/repos/${FIXED_REPO_OWNER}/${FIXED_REPO_NAME}`
const FIXED_REPO_FORK_URL = `${FIXED_REPO_URL}/fork`

function formatCount(value) {
  if (typeof value !== 'number') {
    return '...'
  }

  return new Intl.NumberFormat('ru-RU').format(value)
}

function getInitialDefaultPageSize() {
  if (typeof window === 'undefined') {
    return DEFAULT_PAGE_SIZE_FALLBACK
  }

  const rawValue = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
  const parsed = Number.parseInt(rawValue ?? '', 10)

  if (!Number.isNaN(parsed) && LIMIT_OPTIONS.includes(parsed)) {
    return parsed
  }

  return DEFAULT_PAGE_SIZE_FALLBACK
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDays(value) {
  if (value === null || value === undefined) {
    return '—'
  }

  return `${value.toFixed(1)} дн.`
}

function toTimestamp(value) {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function sortNonReciprocal(users, field, order) {
  const multiplier = order === 'asc' ? 1 : -1

  return [...users].sort((a, b) => {
    let primary = 0

    if (field === NON_RECIPROCAL_SORT_WAITING) {
      const aValue = a.daysWaiting ?? -1
      const bValue = b.daysWaiting ?? -1
      primary = (aValue - bValue) * multiplier
    } else {
      primary = (toTimestamp(a.firstSeenFollowingAt) - toTimestamp(b.firstSeenFollowingAt)) * multiplier
    }

    if (primary !== 0) {
      return primary
    }

    return a.login.localeCompare(b.login, 'en', { sensitivity: 'base' })
  })
}

function sortMutualByDays(users, order) {
  const multiplier = order === 'asc' ? 1 : -1

  return [...users].sort((a, b) => {
    const aValue = a.daysSinceLastContribution ?? -1
    const bValue = b.daysSinceLastContribution ?? -1
    const diff = (aValue - bValue) * multiplier

    if (diff !== 0) {
      return diff
    }

    return a.login.localeCompare(b.login, 'en', { sensitivity: 'base' })
  })
}

function LimitSelector({ value, onChange }) {
  return (
    <div className="limit-row">
      <label className="limit-control">
        Показывать записей:
        <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
          {LIMIT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

function SortHeaderButton({ label, active, order, onClick }) {
  return (
    <button className={`th-sort-button ${active ? 'active' : ''}`} onClick={onClick}>
      {label} {active ? (order === 'desc' ? '↓' : '↑') : '↕'}
    </button>
  )
}

function NonReciprocalTable({ users, sortField, sortOrder, onSortTracked, onSortWaiting }) {
  if (!users.length) {
    return <p className="empty-text">Список пуст.</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Пользователь</th>
            <th>
              <SortHeaderButton
                label="Ожидание"
                active={sortField === NON_RECIPROCAL_SORT_WAITING}
                order={sortOrder}
                onClick={onSortWaiting}
              />
            </th>
            <th>
              <SortHeaderButton
                label="Слежение с"
                active={sortField === NON_RECIPROCAL_SORT_TRACKED}
                order={sortOrder}
                onClick={onSortTracked}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.login}>
              <td>
                <a href={user.htmlUrl} target="_blank" rel="noreferrer">
                  @{user.login}
                </a>
              </td>
              <td>{formatDays(user.daysWaiting)}</td>
              <td>{formatDate(user.firstSeenFollowingAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FollowersOnlyTable({ users }) {
  if (!users.length) {
    return <p className="empty-text">Таких подписчиков сейчас нет.</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Пользователь</th>
            <th>Профиль</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.login}>
              <td>@{user.login}</td>
              <td>
                <a href={user.htmlUrl} target="_blank" rel="noreferrer">
                  {user.htmlUrl}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MutualFollowersTable({ users, sortOrder, onSortDays }) {
  if (!users.length) {
    return <p className="empty-text">Пока нет данных по взаимным подписчикам.</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Пользователь</th>
            <th>Last contribute</th>
            <th>Тип события</th>
            <th>
              <SortHeaderButton label="Сколько дней назад" active order={sortOrder} onClick={onSortDays} />
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.login}>
              <td>
                <a href={user.htmlUrl} target="_blank" rel="noreferrer">
                  @{user.login}
                </a>
              </td>
              <td>{formatDate(user.lastContributionAt)}</td>
              <td>{user.lastContributionType ?? '—'}</td>
              <td>{formatDays(user.daysSinceLastContribution)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EventsFilter({ value, onChange }) {
  return (
    <div className="event-filters">
      {EVENT_FILTERS.map((filter) => (
        <button
          key={filter.id}
          className={`event-filter-button filter-${filter.id} ${value === filter.id ? 'active' : ''}`}
          onClick={() => onChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

function EventsList({ events }) {
  if (!events.length) {
    return <p className="empty-text">Событий по фильтру нет.</p>
  }

  return (
    <ul className="event-list">
      {events.map((event) => (
        <li key={event.id}>
          <div className="event-tags">
            <span className={`event-tag ${event.type}`}>{EVENT_LABELS[event.type] ?? event.type}</span>
            {event.isDeleted && <span className="event-badge deleted">Удаленный</span>}
          </div>
          <a href={event.htmlUrl} target="_blank" rel="noreferrer">
            @{event.login}
          </a>
          <time>{formatDate(event.happenedAt)}</time>
        </li>
      ))}
    </ul>
  )
}

function App() {
  const [reports, setReports] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [lastLoadedAt, setLastLoadedAt] = useState(null)
  const [activeTab, setActiveTab] = useState(TAB_NON_RECIPROCAL)
  const [nonReciprocalSortField, setNonReciprocalSortField] = useState(NON_RECIPROCAL_SORT_TRACKED)
  const [nonReciprocalSortOrder, setNonReciprocalSortOrder] = useState('desc')
  const [mutualSortOrder, setMutualSortOrder] = useState('desc')
  const [eventsFilter, setEventsFilter] = useState('all')
  const [defaultPageSize, setDefaultPageSize] = useState(getInitialDefaultPageSize)
  const [nonReciprocalLimit, setNonReciprocalLimit] = useState(defaultPageSize)
  const [followersOnlyLimit, setFollowersOnlyLimit] = useState(defaultPageSize)
  const [mutualLimit, setMutualLimit] = useState(defaultPageSize)
  const [eventsLimit, setEventsLimit] = useState(defaultPageSize)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [repoStats, setRepoStats] = useState({ stars: null, forks: null })

  const baseUrl = useMemo(() => import.meta.env.BASE_URL, [])

  const visibleNonReciprocal = useMemo(() => {
    const list = reports?.nonReciprocalNow ?? []
    return sortNonReciprocal(list, nonReciprocalSortField, nonReciprocalSortOrder).slice(0, nonReciprocalLimit)
  }, [reports?.nonReciprocalNow, nonReciprocalSortField, nonReciprocalSortOrder, nonReciprocalLimit])

  const visibleFollowersOnly = useMemo(() => {
    const list = reports?.followersNotFollowingNow ?? []
    return list.slice(0, followersOnlyLimit)
  }, [reports?.followersNotFollowingNow, followersOnlyLimit])

  const visibleMutualFollowers = useMemo(() => {
    const list = reports?.mutualFollowersNow ?? []
    return sortMutualByDays(list, mutualSortOrder).slice(0, mutualLimit)
  }, [reports?.mutualFollowersNow, mutualSortOrder, mutualLimit])

  const visibleEvents = useMemo(() => {
    const source = Array.isArray(events) ? events : []
    const filtered = eventsFilter === 'all' ? source : source.filter((event) => event.type === eventsFilter)

    return filtered.slice(0, eventsLimit)
  }, [events, eventsFilter, eventsLimit])

  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshNonce((prev) => prev + 1)
    }, 5 * 60 * 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const cacheKey = `${Date.now()}-${refreshNonce}`
        const [reportsResponse, eventsResponse] = await Promise.all([
          fetch(`${baseUrl}data/reports.json?v=${cacheKey}`, { cache: 'no-store' }),
          fetch(`${baseUrl}data/events.json?v=${cacheKey}`, { cache: 'no-store' }),
        ])

        if (!reportsResponse.ok) {
          throw new Error(`Не удалось загрузить reports.json (${reportsResponse.status})`)
        }

        if (!eventsResponse.ok) {
          throw new Error(`Не удалось загрузить events.json (${eventsResponse.status})`)
        }

        const [reportsJson, eventsJson] = await Promise.all([
          reportsResponse.json(),
          eventsResponse.json(),
        ])

        if (!active) {
          return
        }

        setReports(reportsJson)
        setEvents(Array.isArray(eventsJson) ? eventsJson : [])
        setLastLoadedAt(new Date().toISOString())
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Неизвестная ошибка загрузки данных')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [baseUrl, refreshNonce])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(SETTINGS_STORAGE_KEY, String(defaultPageSize))
  }, [defaultPageSize])

  useEffect(() => {
    setNonReciprocalLimit(defaultPageSize)
    setFollowersOnlyLimit(defaultPageSize)
    setMutualLimit(defaultPageSize)
    setEventsLimit(defaultPageSize)
  }, [defaultPageSize])

  useEffect(() => {
    let active = true

    async function loadRepoStats() {
      try {
        const response = await fetch(FIXED_REPO_API_URL, { cache: 'force-cache' })

        if (!response.ok) {
          return
        }

        const payload = await response.json()

        if (!active) {
          return
        }

        setRepoStats({
          stars: payload?.stargazers_count ?? null,
          forks: payload?.forks_count ?? null,
        })
      } catch {
        // Silent fallback to placeholders if API is unavailable.
      }
    }

    loadRepoStats()

    return () => {
      active = false
    }
  }, [])

  const counts = reports?.counts ?? {}
  const title = reports?.username ? `GitHub Friends Tracker - @${reports.username}` : 'GitHub Friends Tracker'
  const followersMutual = counts.mutualFollowersNow ?? 0
  const followersOnly = counts.followersNotFollowingNow ?? 0

  const handleNonReciprocalSort = (field) => {
    setNonReciprocalSortField((prevField) => {
      if (prevField === field) {
        setNonReciprocalSortOrder((prevOrder) => (prevOrder === 'desc' ? 'asc' : 'desc'))
        return prevField
      }

      setNonReciprocalSortOrder('desc')
      return field
    })
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="title-row">
          <h1 className="title-line">{title}</h1>
          <div className="repo-actions" title="Фиксированный репозиторий: GoXLd/github-friends">
            <a href={FIXED_REPO_URL} target="_blank" rel="noreferrer" className="repo-link">
              Repo
            </a>
            <a href={FIXED_REPO_URL} target="_blank" rel="noreferrer" className="repo-stat-button">
              Stars <span>{formatCount(repoStats.stars)}</span>
            </a>
            <a href={FIXED_REPO_FORK_URL} target="_blank" rel="noreferrer" className="repo-stat-button">
              Forks <span>{formatCount(repoStats.forks)}</span>
            </a>
            <button
              type="button"
              className={`settings-toggle ${settingsOpen ? 'active' : ''}`}
              aria-label="Открыть настройки страницы"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((prev) => !prev)}
            >
              ⚙
            </button>
          </div>
        </div>
        <p className="hero-meta">Последнее обновление: {formatDate(reports?.generatedAt)}</p>
        <p className="hero-meta">Последняя загрузка в браузере: {formatDate(lastLoadedAt)}</p>

        {settingsOpen && (
          <section className="settings-panel">
            <label className="settings-row">
              Показывать записей (по умолчанию):
              <select
                value={defaultPageSize}
                onChange={(event) => setDefaultPageSize(Number(event.target.value))}
              >
                {LIMIT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </section>
        )}
      </header>

      {loading && <p className="state-box">Загружаю данные...</p>}
      {error && <p className="state-box error">{error}</p>}

      {!loading && !error && reports && (
        <>
          <section className="stats-grid">
            <article className="stat-card">
              <p>Followers</p>
              <strong>{counts.followers ?? 0}</strong>
              <small className="stat-details">Взаимные: {followersMutual}</small>
              <small className="stat-details">Подписчики: {followersOnly}</small>
            </article>
            <article className="stat-card">
              <p>Following</p>
              <strong>{counts.following ?? 0}</strong>
            </article>
            <article className="stat-card accent-blue">
              <p>Невзаимные подписки</p>
              <strong>{counts.nonReciprocalNow ?? 0}</strong>
            </article>
            <article className="stat-card accent-green">
              <p>Взаимные подписчики</p>
              <strong>{followersMutual}</strong>
            </article>
            <article className="stat-card accent-red">
              <p>7+ дней без ответа</p>
              <strong>{counts.staleCandidates ?? 0}</strong>
            </article>
          </section>

          <section className="tabs" role="tablist" aria-label="Sections">
            <button
              role="tab"
              aria-selected={activeTab === TAB_NON_RECIPROCAL}
              className={`tab-button ${activeTab === TAB_NON_RECIPROCAL ? 'active' : ''}`}
              onClick={() => setActiveTab(TAB_NON_RECIPROCAL)}
            >
              Невзаимные подписки сейчас
            </button>
            <button
              role="tab"
              aria-selected={activeTab === TAB_FOLLOWERS_ONLY}
              className={`tab-button ${activeTab === TAB_FOLLOWERS_ONLY ? 'active' : ''}`}
              onClick={() => setActiveTab(TAB_FOLLOWERS_ONLY)}
            >
              Подписаны на вас, но вы не подписаны
            </button>
            <button
              role="tab"
              aria-selected={activeTab === TAB_MUTUAL}
              className={`tab-button ${activeTab === TAB_MUTUAL ? 'active' : ''}`}
              onClick={() => setActiveTab(TAB_MUTUAL)}
            >
              Взаимные подписчики: last contribute
            </button>
            <button
              role="tab"
              aria-selected={activeTab === TAB_EVENTS}
              className={`tab-button ${activeTab === TAB_EVENTS ? 'active' : ''}`}
              onClick={() => setActiveTab(TAB_EVENTS)}
            >
              Последние события
            </button>
          </section>

          <section key={activeTab} className="panel tab-panel">
            {activeTab === TAB_NON_RECIPROCAL && (
              <>
                <h2>Невзаимные подписки сейчас</h2>
                <NonReciprocalTable
                  users={visibleNonReciprocal}
                  sortField={nonReciprocalSortField}
                  sortOrder={nonReciprocalSortOrder}
                  onSortTracked={() => handleNonReciprocalSort(NON_RECIPROCAL_SORT_TRACKED)}
                  onSortWaiting={() => handleNonReciprocalSort(NON_RECIPROCAL_SORT_WAITING)}
                />
                <LimitSelector value={nonReciprocalLimit} onChange={setNonReciprocalLimit} />
              </>
            )}

            {activeTab === TAB_FOLLOWERS_ONLY && (
              <>
                <h2>Подписаны на вас, но вы не подписаны</h2>
                <FollowersOnlyTable users={visibleFollowersOnly} />
                <LimitSelector value={followersOnlyLimit} onChange={setFollowersOnlyLimit} />
              </>
            )}

            {activeTab === TAB_MUTUAL && (
              <>
                <h2 className="heading-with-tip">
                  Взаимные подписчики: last contribute
                  <span
                    className="info-tip"
                    title="Проверяется до 100 последних публичных событий пользователя через /users/{login}/events/public и берутся только contribution-события. Обычно покрывает около 90 дней, но зависит от активности."
                    aria-label="Подсказка по диапазону last contribute"
                  >
                    i
                  </span>
                </h2>
                <MutualFollowersTable
                  users={visibleMutualFollowers}
                  sortOrder={mutualSortOrder}
                  onSortDays={() => setMutualSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                />
                <LimitSelector value={mutualLimit} onChange={setMutualLimit} />
              </>
            )}

            {activeTab === TAB_EVENTS && (
              <>
                <h2 className="heading-with-tip">
                  Последние события
                  <span
                    className="info-tip"
                    title="Метка «Удаленный» ставится только если пользователь исчез одновременно из followers и following, и API /users/{login} вернул 404. Иначе это может быть блокировка или ограничение."
                    aria-label="Подсказка по логике метки Удаленный"
                  >
                    i
                  </span>
                </h2>
                <EventsFilter value={eventsFilter} onChange={setEventsFilter} />
                <EventsList events={visibleEvents} />
                <LimitSelector value={eventsLimit} onChange={setEventsLimit} />
              </>
            )}
          </section>
        </>
      )}

      <footer className="risk-disclaimer">
        <p className="risk-title">Этический/технический риск бана</p>
        <p>
          Использование этого скрипта вы выполняете полностью на свой риск. Нет гарантий, что действия с API или
          массовый анализ подписок не приведут к ограничениям, блокировкам или иным санкциям со стороны GitHub.
        </p>
        <p>
          Полное снятие ответственности: автор сервиса не несет ответственности за последствия использования. Если ваш
          аккаунт будет ограничен или заблокирован, с вопросами и претензиями к автору обращаться не нужно.
        </p>
      </footer>
    </main>
  )
}

export default App
