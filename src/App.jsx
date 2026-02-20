import { useEffect, useMemo, useState } from 'react'
import './App.css'

const EVENT_LABELS = {
  follower_gained: 'Подписался на вас',
  follower_lost: 'Отписался от вас',
  you_followed: 'Вы подписались',
  you_unfollowed: 'Вы отписались',
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

function UserRows({ users, emptyText }) {
  if (!users?.length) {
    return <p className="empty-text">{emptyText}</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Пользователь</th>
            <th>Ожидание</th>
            <th>Слежение с</th>
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

function App() {
  const [reports, setReports] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const baseUrl = useMemo(() => import.meta.env.BASE_URL, [])

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const [reportsResponse, eventsResponse] = await Promise.all([
          fetch(`${baseUrl}data/reports.json`, { cache: 'no-store' }),
          fetch(`${baseUrl}data/events.json`, { cache: 'no-store' }),
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
  }, [baseUrl])

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">GitHub Friends Tracker</p>
        <h1>Контроль подписок и отписок</h1>
        <p className="hero-subtitle">
          {reports?.username ? `Профиль: @${reports.username}` : 'Профиль будет показан после первого snapshot'}
        </p>
        <p className="hero-meta">Последнее обновление: {formatDate(reports?.generatedAt)}</p>
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

          <section className="panel">
            <h2>Кандидаты на отписку ({reports.followBackWindowDays}+ дней)</h2>
            <UserRows users={reports.staleCandidates} emptyText="Пока нет кандидатов на чистку." />
          </section>

          <section className="panel">
            <h2>Невзаимные подписки сейчас</h2>
            <UserRows users={reports.nonReciprocalNow} emptyText="Все взаимно или список пуст." />
          </section>

          <section className="panel">
            <h2>Последние события</h2>
            {!events.length && <p className="empty-text">Событий пока нет.</p>}
            {!!events.length && (
              <ul className="event-list">
                {events.slice(0, 100).map((event) => (
                  <li key={event.id}>
                    <span className={`event-tag ${event.type}`}>{EVENT_LABELS[event.type] ?? event.type}</span>
                    <a href={event.htmlUrl} target="_blank" rel="noreferrer">
                      @{event.login}
                    </a>
                    <time>{formatDate(event.happenedAt)}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default App
