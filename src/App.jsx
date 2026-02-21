import { useEffect, useMemo, useState } from 'react'
import './App.css'

const EVENT_LABELS = {
  follower_gained: 'Подписался на вас',
  follower_lost: 'Отписался от вас',
  you_followed: 'Вы подписались',
  you_unfollowed: 'Вы отписались',
}

const TAB_NON_RECIPROCAL = 'non_reciprocal'
const TAB_EVENTS = 'events'
const LIMIT_OPTIONS = [10, 25, 50, 100]

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

function sortByTrackedSince(users, order) {
  const multiplier = order === 'asc' ? 1 : -1

  return [...users].sort((a, b) => {
    const diff = (toTimestamp(a.firstSeenFollowingAt) - toTimestamp(b.firstSeenFollowingAt)) * multiplier

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

function NonReciprocalTable({ users, sortOrder, onSortClick }) {
  if (!users.length) {
    return <p className="empty-text">Все взаимно или список пуст.</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Пользователь</th>
            <th>Ожидание</th>
            <th>
              <button className="th-sort-button" onClick={onSortClick}>
                Слежение с {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
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

function EventsList({ events }) {
  if (!events.length) {
    return <p className="empty-text">Событий пока нет.</p>
  }

  return (
    <ul className="event-list">
      {events.map((event) => (
        <li key={event.id}>
          <span className={`event-tag ${event.type}`}>{EVENT_LABELS[event.type] ?? event.type}</span>
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
  const [trackedSinceSortOrder, setTrackedSinceSortOrder] = useState('desc')
  const [nonReciprocalLimit, setNonReciprocalLimit] = useState(25)
  const [eventsLimit, setEventsLimit] = useState(25)

  const baseUrl = useMemo(() => import.meta.env.BASE_URL, [])

  const visibleNonReciprocal = useMemo(() => {
    const list = reports?.nonReciprocalNow ?? []
    return sortByTrackedSince(list, trackedSinceSortOrder).slice(0, nonReciprocalLimit)
  }, [reports?.nonReciprocalNow, trackedSinceSortOrder, nonReciprocalLimit])

  const visibleEvents = useMemo(
    () => (Array.isArray(events) ? events.slice(0, eventsLimit) : []),
    [events, eventsLimit],
  )

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

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">GitHub Friends Tracker</p>
        <h1>Контроль подписок и отписок</h1>
        <p className="hero-subtitle">
          {reports?.username ? `Профиль: @${reports.username}` : 'Профиль будет показан после первого snapshot'}
        </p>
        <p className="hero-meta">Последнее обновление: {formatDate(reports?.generatedAt)}</p>
        <p className="hero-meta">Последняя загрузка в браузере: {formatDate(lastLoadedAt)}</p>

        <div className="controls-row">
          <button className="refresh-button" onClick={() => setRefreshNonce((prev) => prev + 1)}>
            Обновить данные
          </button>
        </div>
      </header>

      {loading && <p className="state-box">Загружаю данные...</p>}
      {error && <p className="state-box error">{error}</p>}

      {!loading && !error && reports && (
        <>
          <section className="stats-grid">
            <article className="stat-card">
              <p>Followers</p>
              <strong>{reports.counts.followers}</strong>
            </article>
            <article className="stat-card">
              <p>Following</p>
              <strong>{reports.counts.following}</strong>
            </article>
            <article className="stat-card alert">
              <p>Невзаимные сейчас</p>
              <strong>{reports.counts.nonReciprocalNow}</strong>
            </article>
            <article className="stat-card danger">
              <p>7+ дней без ответа</p>
              <strong>{reports.counts.staleCandidates}</strong>
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
                  sortOrder={trackedSinceSortOrder}
                  onSortClick={() => setTrackedSinceSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                />
                <LimitSelector value={nonReciprocalLimit} onChange={setNonReciprocalLimit} />
              </>
            )}

            {activeTab === TAB_EVENTS && (
              <>
                <h2>Последние события</h2>
                <EventsList events={visibleEvents} />
                <LimitSelector value={eventsLimit} onChange={setEventsLimit} />
              </>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default App
