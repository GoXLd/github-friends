import { useEffect, useMemo, useState } from 'react'
import './App.css'

const TAB_NON_RECIPROCAL = 'non_reciprocal'
const TAB_CANDIDATES = 'candidates'
const TAB_FOLLOWERS_ONLY = 'followers_only'
const TAB_MUTUAL = 'mutual'
const TAB_EVENTS = 'events'

const NON_RECIPROCAL_SORT_TRACKED = 'tracked_since'
const NON_RECIPROCAL_SORT_WAITING = 'waiting'

const LIMIT_OPTIONS = [10, 25, 50, 100, 500]
const DEFAULT_PAGE_SIZE_FALLBACK = 100
const SETTINGS_STORAGE_KEY = 'gh_friends_default_page_size'
const EXCLUSIONS_STORAGE_KEY = 'gh_friends_excluded_logins'
const LANGUAGE_STORAGE_KEY = 'gh_friends_language'

const FIXED_REPO_OWNER = 'GoXLd'
const FIXED_REPO_NAME = 'github-friends'
const FIXED_REPO_URL = `https://github.com/${FIXED_REPO_OWNER}/${FIXED_REPO_NAME}`
const FIXED_REPO_API_URL = `https://api.github.com/repos/${FIXED_REPO_OWNER}/${FIXED_REPO_NAME}`
const FIXED_REPO_FORK_URL = `${FIXED_REPO_URL}/fork`

const I18N = {
  en: {
    locale: 'en-US',
    languageLabel: 'Language:',
    languageEnglish: 'English',
    languageRussian: 'Russian',
    showRecords: 'Show records:',
    sortWaiting: 'Waiting',
    sortTrackedSince: 'Following since',
    sortDaysAgo: 'Days ago',
    userCol: 'User',
    profileCol: 'Profile',
    eventCol: 'Event',
    statusCol: 'Status',
    actionCol: 'Action',
    inFriendsSinceCol: 'In Friends since',
    inactiveDaysCol: 'Inactive (days)',
    reasonCol: 'Reason',
    lastContributeCol: 'Last contribute',
    eventTypeCol: 'Event type',
    emptyList: 'List is empty.',
    followersOnlyEmpty: 'No followers in this category right now.',
    mutualEmpty: 'No mutual followers data yet.',
    friendsCleanupEmpty: 'No cleanup candidates in Friends yet.',
    deletedFollowerLossesEmpty: 'No deleted accounts in recent losses.',
    eventsEmpty: 'No events for this filter.',
    deletedBadge: 'Deleted',
    deletedAction: 'Remove from watchlist at the next check',
    staleReasonNoContributionData: 'no activity data',
    staleReasonInactiveContributionWindow: 'no recent activity',
    staleReasonDefault: 'inactive',
    loading: 'Loading data...',
    unknownLoadError: 'Unknown data loading error',
    failedToLoadReports: (status) => `Failed to load reports.json (${status})`,
    failedToLoadEvents: (status) => `Failed to load events.json (${status})`,
    settingsAriaLabel: 'Open page settings',
    settingsDefaultPageSize: 'Default records shown:',
    settingsExclusions: 'Excluded users:',
    settingsAdd: 'Add',
    settingsRemove: 'Remove',
    settingsExclusionNote: 'Exclusions are applied locally in this browser.',
    settingsExclusionEmpty: 'Exclusions list is empty.',
    settingsInputPlaceholder: '@username',
    lastUpdate: 'Last update',
    browserLoad: 'Last browser load',
    followers: 'Followers',
    following: 'Following',
    nonReciprocal: 'Not Followback',
    mutualFollowers: 'Mutual followers',
    unfollowCandidates: 'Unfollow candidates',
    nonReciprocalShort: 'Not Followback',
    friendsShort: 'Friends',
    deletedShort: 'Deleted',
    goToCandidates: 'Go to unfollow candidates',
    tabsAriaLabel: 'Sections',
    tabNotFollowback: 'Not Followback',
    tabFollowers: 'Followers',
    tabCandidates: 'Unfollow candidates',
    tabFriends: 'Friends',
    tabEvents: 'Recent events',
    tabTitleNotFollowback: 'Users you follow, but they do not follow back.',
    tabTitleFollowers: 'Users who follow you, but you do not follow them.',
    tabTitleCandidates: 'Combined list of unfollow candidates.',
    tabTitleFriends: 'Mutual follows: both sides follow each other.',
    headingNotFollowback: 'Not Followback',
    headingFollowers: 'Followers',
    headingCandidates: 'Unfollow candidates',
    headingFriends: 'Friends',
    headingEvents: 'Recent events',
    tooltipNotFollowbackLabel: 'Help for Not Followback section',
    tooltipNotFollowbackText:
      'Users you follow, but they do not follow back. Use this list to review one-sided follows.',
    tooltipFollowersLabel: 'Help for Followers section',
    tooltipFollowersText: 'Users who follow you, but you do not follow them.',
    tooltipCandidatesLabel: 'Help for Unfollow candidates section',
    tooltipCandidatesText:
      'Combined cleanup list: long Not Followback, inactive Friends, and deleted accounts that unfollowed you.',
    tooltipFriendsLabel: 'Help for Friends last contribute range',
    tooltipFriendsText:
      'Mutual follows only. Last contribute is based on the latest 100 public events (contribution events only).',
    tooltipEventsLabel: 'Help for Deleted badge logic',
    tooltipEventsText:
      'Deleted badge is set only when account disappeared from both followers and following, and /users/{login} returned 404. Otherwise it may be a block or restriction.',
    sectionCandidatesNotFollowback: (days) => `Not Followback (${days}+ days)`,
    sectionCandidatesFriends: (days) => `Friends inactive (${days}+ days)`,
    sectionCandidatesDeleted: 'Unfollowed you and account is deleted',
    sectionFriendsCleanup: (days) => `Friends cleanup candidates (inactivity ${days}+ days)`,
    riskTitle: 'Ethical/technical risk of account restrictions',
    riskTextOne:
      'Use this script at your own risk. There is no guarantee that API calls or mass follow analysis will not trigger GitHub limits or restrictions.',
    riskTextTwo:
      'No liability: the author is not responsible for outcomes. If your account is limited or blocked, do not contact the author with claims.',
    eventLabels: {
      follower_gained: 'Followed you',
      follower_lost: 'Unfollowed you',
      you_followed: 'You followed',
      you_unfollowed: 'You unfollowed',
    },
    eventFilters: [
      { id: 'all', label: 'All events' },
      { id: 'follower_lost', label: 'Unfollowed you' },
      { id: 'follower_gained', label: 'Followed you' },
      { id: 'you_followed', label: 'You followed' },
      { id: 'you_unfollowed', label: 'You unfollowed' },
    ],
    daysSuffix: 'd',
  },
  ru: {
    locale: 'ru-RU',
    languageLabel: 'Язык:',
    languageEnglish: 'Английский',
    languageRussian: 'Русский',
    showRecords: 'Показывать записей:',
    sortWaiting: 'Ожидание',
    sortTrackedSince: 'Слежение с',
    sortDaysAgo: 'Сколько дней назад',
    userCol: 'Пользователь',
    profileCol: 'Профиль',
    eventCol: 'Событие',
    statusCol: 'Статус',
    actionCol: 'Действие',
    inFriendsSinceCol: 'В списке с',
    inactiveDaysCol: 'Неактивен (дней)',
    reasonCol: 'Причина',
    lastContributeCol: 'Last contribute',
    eventTypeCol: 'Тип события',
    emptyList: 'Список пуст.',
    followersOnlyEmpty: 'Таких подписчиков сейчас нет.',
    mutualEmpty: 'Пока нет данных по взаимным подписчикам.',
    friendsCleanupEmpty: 'Кандидатов на очистку друзей пока нет.',
    deletedFollowerLossesEmpty: 'Удаленных аккаунтов среди последних отписок пока нет.',
    eventsEmpty: 'Событий по фильтру нет.',
    deletedBadge: 'Удаленный',
    deletedAction: 'Убрать из наблюдения на следующей проверке',
    staleReasonNoContributionData: 'нет данных активности',
    staleReasonInactiveContributionWindow: 'нет активности',
    staleReasonDefault: 'неактивен',
    loading: 'Загружаю данные...',
    unknownLoadError: 'Неизвестная ошибка загрузки данных',
    failedToLoadReports: (status) => `Не удалось загрузить reports.json (${status})`,
    failedToLoadEvents: (status) => `Не удалось загрузить events.json (${status})`,
    settingsAriaLabel: 'Открыть настройки страницы',
    settingsDefaultPageSize: 'Показывать записей (по умолчанию):',
    settingsExclusions: 'Исключения из обработки:',
    settingsAdd: 'Добавить',
    settingsRemove: 'Убрать',
    settingsExclusionNote: 'Исключения применяются локально в этом браузере.',
    settingsExclusionEmpty: 'Список исключений пуст.',
    settingsInputPlaceholder: '@username',
    lastUpdate: 'Последнее обновление',
    browserLoad: 'Последняя загрузка в браузере',
    followers: 'Followers',
    following: 'Following',
    nonReciprocal: 'Невзаимные подписки',
    mutualFollowers: 'Взаимные подписчики',
    unfollowCandidates: 'Кандидаты на отписку',
    nonReciprocalShort: 'Not Followback',
    friendsShort: 'Friends',
    deletedShort: 'Удаленные',
    goToCandidates: 'Перейти на вкладку кандидатов на отписку',
    tabsAriaLabel: 'Sections',
    tabNotFollowback: 'Not Followback',
    tabFollowers: 'Followers',
    tabCandidates: 'Кандидаты на отписку',
    tabFriends: 'Friends',
    tabEvents: 'Последние события',
    tabTitleNotFollowback: 'Users you follow, but they do not follow back.',
    tabTitleFollowers: 'Users who follow you, but you do not follow them.',
    tabTitleCandidates: 'Сводный список кандидатов на отписку.',
    tabTitleFriends: 'Mutual follows (friends): both sides follow each other.',
    headingNotFollowback: 'Not Followback',
    headingFollowers: 'Followers',
    headingCandidates: 'Кандидаты на отписку',
    headingFriends: 'Friends',
    headingEvents: 'Последние события',
    tooltipNotFollowbackLabel: 'Подсказка по разделу Not Followback',
    tooltipNotFollowbackText:
      'Список пользователей, на которых вы подписаны, но они не подписались в ответ. Используйте для анализа невзаимных подписок.',
    tooltipFollowersLabel: 'Подсказка по разделу Followers',
    tooltipFollowersText: 'Пользователи, которые подписаны на вас, но вы не подписаны на них.',
    tooltipCandidatesLabel: 'Подсказка по разделу кандидатов на отписку',
    tooltipCandidatesText:
      'Сводный список для очистки: долгий Not Followback, неактивные Friends и удаленные аккаунты, которые отписались.',
    tooltipFriendsLabel: 'Подсказка по диапазону last contribute',
    tooltipFriendsText:
      'Это взаимные подписки: вы подписаны друг на друга. Last contribute берется из последних 100 публичных событий (только contribution-события).',
    tooltipEventsLabel: 'Подсказка по логике метки Удаленный',
    tooltipEventsText:
      'Метка «Удаленный» ставится только если пользователь исчез одновременно из followers и following, и API /users/{login} вернул 404. Иначе это может быть блокировка или ограничение.',
    sectionCandidatesNotFollowback: (days) => `Not Followback (${days}+ дней)`,
    sectionCandidatesFriends: (days) => `Friends без активности (${days}+ дней)`,
    sectionCandidatesDeleted: 'Отписался от вас и аккаунт удален',
    sectionFriendsCleanup: (days) => `Кандидаты на очистку Friends (неактивность ${days}+ дней)`,
    riskTitle: 'Этический/технический риск бана',
    riskTextOne:
      'Использование этого скрипта вы выполняете полностью на свой риск. Нет гарантий, что действия с API или массовый анализ подписок не приведут к ограничениям или блокировкам.',
    riskTextTwo:
      'Полное снятие ответственности: автор сервиса не несет ответственности за последствия использования.',
    eventLabels: {
      follower_gained: 'Подписался на вас',
      follower_lost: 'Отписался от вас',
      you_followed: 'Вы подписались',
      you_unfollowed: 'Вы отписались',
    },
    eventFilters: [
      { id: 'all', label: 'Все события' },
      { id: 'follower_lost', label: 'Отписался от вас' },
      { id: 'follower_gained', label: 'Подписался на вас' },
      { id: 'you_followed', label: 'Вы подписались' },
      { id: 'you_unfollowed', label: 'Вы отписались' },
    ],
    daysSuffix: 'дн.',
  },
}

function formatCount(value, locale) {
  if (typeof value !== 'number') {
    return '...'
  }

  return new Intl.NumberFormat(locale).format(value)
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

function normalizeLogin(rawLogin) {
  return String(rawLogin ?? '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
}

function isValidLogin(login) {
  return /^[a-z\d](?:[a-z\d-]{0,38})$/i.test(login)
}

function getInitialExcludedLogins() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(EXCLUSIONS_STORAGE_KEY)
    const parsed = JSON.parse(rawValue ?? '[]')

    if (!Array.isArray(parsed)) {
      return []
    }

    const unique = [...new Set(parsed.map((value) => normalizeLogin(value)).filter(Boolean))]
    return unique
  } catch {
    return []
  }
}

function getInitialLanguage() {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return stored === 'ru' || stored === 'en' ? stored : 'en'
}

function formatDate(value, locale) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatStaleReason(reason, i18n) {
  if (reason === 'no_contribution_data') {
    return i18n.staleReasonNoContributionData
  }

  if (reason === 'inactive_contribution_window') {
    return i18n.staleReasonInactiveContributionWindow
  }

  return i18n.staleReasonDefault
}

function formatDays(value, i18n) {
  if (value === null || value === undefined) {
    return '—'
  }

  return `${value.toFixed(1)} ${i18n.daysSuffix}`
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

function LimitSelector({ value, onChange, i18n }) {
  return (
    <div className="limit-row">
      <label className="limit-control">
        {i18n.showRecords}
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

function InfoTooltip({ text, label }) {
  return (
    <span className="info-tip-wrap">
      <button type="button" className="info-tip-btn" aria-label={label}>
        i
      </button>
      <span className="info-tip-bubble" role="tooltip">
        {text}
      </span>
    </span>
  )
}

function NonReciprocalTable({ users, sortField, sortOrder, onSortTracked, onSortWaiting, i18n, locale }) {
  if (!users.length) {
    return <p className="empty-text">{i18n.emptyList}</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{i18n.userCol}</th>
            <th>
              <SortHeaderButton
                label={i18n.sortWaiting}
                active={sortField === NON_RECIPROCAL_SORT_WAITING}
                order={sortOrder}
                onClick={onSortWaiting}
              />
            </th>
            <th>
              <SortHeaderButton
                label={i18n.sortTrackedSince}
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
              <td>{formatDays(user.daysWaiting, i18n)}</td>
              <td>{formatDate(user.firstSeenFollowingAt, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FollowersOnlyTable({ users, i18n }) {
  if (!users.length) {
    return <p className="empty-text">{i18n.followersOnlyEmpty}</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{i18n.userCol}</th>
            <th>{i18n.profileCol}</th>
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

function MutualFollowersTable({ users, sortOrder, onSortDays, i18n, locale }) {
  if (!users.length) {
    return <p className="empty-text">{i18n.mutualEmpty}</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{i18n.userCol}</th>
            <th>{i18n.lastContributeCol}</th>
            <th>{i18n.eventTypeCol}</th>
            <th>
              <SortHeaderButton label={i18n.sortDaysAgo} active order={sortOrder} onClick={onSortDays} />
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
              <td>{formatDate(user.lastContributionAt, locale)}</td>
              <td>{user.lastContributionType ?? '—'}</td>
              <td>{formatDays(user.daysSinceLastContribution, i18n)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FriendsCleanupTable({ users, thresholdDays, i18n, locale }) {
  if (!users.length) {
    return <p className="empty-text">{i18n.friendsCleanupEmpty}</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{i18n.userCol}</th>
            <th>{i18n.inFriendsSinceCol}</th>
            <th>{i18n.lastContributeCol}</th>
            <th>{i18n.inactiveDaysCol}</th>
            <th>{i18n.reasonCol}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={`${user.login}-stale`}>
              <td>
                <a href={user.htmlUrl} target="_blank" rel="noreferrer">
                  @{user.login}
                </a>
              </td>
              <td>{formatDate(user.firstSeenMutualAt, locale)}</td>
              <td>{formatDate(user.lastContributionAt, locale)}</td>
              <td>{formatDays(user.inactiveDays, i18n)}</td>
              <td>
                {formatStaleReason(user.reason, i18n)} ({thresholdDays}+ {i18n.daysSuffix})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DeletedFollowerLossesTable({ events, i18n, locale }) {
  if (!events.length) {
    return <p className="empty-text">{i18n.deletedFollowerLossesEmpty}</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{i18n.userCol}</th>
            <th>{i18n.eventCol}</th>
            <th>{i18n.statusCol}</th>
            <th>{i18n.actionCol}</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>
                <a href={event.htmlUrl} target="_blank" rel="noreferrer">
                  @{event.login}
                </a>
              </td>
              <td>{formatDate(event.happenedAt, locale)}</td>
              <td>
                <span className="event-badge deleted">{i18n.deletedBadge}</span>
              </td>
              <td>{i18n.deletedAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EventsFilter({ value, onChange, filters }) {
  return (
    <div className="event-filters">
      {filters.map((filter) => (
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

function EventsList({ events, i18n, locale }) {
  if (!events.length) {
    return <p className="empty-text">{i18n.eventsEmpty}</p>
  }

  return (
    <ul className="event-list">
      {events.map((event) => (
        <li key={event.id}>
          <div className="event-tags">
            <span className={`event-tag ${event.type}`}>{i18n.eventLabels[event.type] ?? event.type}</span>
            {event.isDeleted && <span className="event-badge deleted">{i18n.deletedBadge}</span>}
          </div>
          <a href={event.htmlUrl} target="_blank" rel="noreferrer">
            @{event.login}
          </a>
          <time>{formatDate(event.happenedAt, locale)}</time>
        </li>
      ))}
    </ul>
  )
}

function App() {
  const [language, setLanguage] = useState(getInitialLanguage)
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
  const [excludedLogins, setExcludedLogins] = useState(getInitialExcludedLogins)
  const [excludedInput, setExcludedInput] = useState('')
  const [nonReciprocalLimit, setNonReciprocalLimit] = useState(defaultPageSize)
  const [candidateLimit, setCandidateLimit] = useState(defaultPageSize)
  const [followersOnlyLimit, setFollowersOnlyLimit] = useState(defaultPageSize)
  const [mutualLimit, setMutualLimit] = useState(defaultPageSize)
  const [eventsLimit, setEventsLimit] = useState(defaultPageSize)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [repoStats, setRepoStats] = useState({ stars: null, forks: null })

  const baseUrl = useMemo(() => import.meta.env.BASE_URL, [])
  const i18n = I18N[language] ?? I18N.en
  const locale = i18n.locale
  const excludedSet = useMemo(() => new Set(excludedLogins.map((login) => normalizeLogin(login))), [excludedLogins])

  const filteredNonReciprocalSource = useMemo(() => {
    const list = reports?.nonReciprocalNow ?? []
    return list.filter((user) => !excludedSet.has(normalizeLogin(user.login)))
  }, [reports?.nonReciprocalNow, excludedSet])

  const filteredStaleNonReciprocalSource = useMemo(() => {
    const list = reports?.staleCandidates ?? []
    return list.filter((user) => !excludedSet.has(normalizeLogin(user.login)))
  }, [reports?.staleCandidates, excludedSet])

  const filteredFollowersOnlySource = useMemo(() => {
    const list = reports?.followersNotFollowingNow ?? []
    return list.filter((user) => !excludedSet.has(normalizeLogin(user.login)))
  }, [reports?.followersNotFollowingNow, excludedSet])

  const filteredMutualSource = useMemo(() => {
    const list = reports?.mutualFollowersNow ?? []
    return list.filter((user) => !excludedSet.has(normalizeLogin(user.login)))
  }, [reports?.mutualFollowersNow, excludedSet])

  const filteredStaleFriendSource = useMemo(() => {
    const list = reports?.staleFriendCandidates ?? []
    return list.filter((user) => !excludedSet.has(normalizeLogin(user.login)))
  }, [reports?.staleFriendCandidates, excludedSet])

  const filteredEventsSource = useMemo(() => {
    const source = Array.isArray(events) ? events : []
    return source.filter((event) => !excludedSet.has(normalizeLogin(event.login)))
  }, [events, excludedSet])

  const filteredDeletedFollowerLossSource = useMemo(() => {
    const latestByLogin = new Map()

    for (const event of filteredEventsSource) {
      if (event.type !== 'follower_lost' || !event.isDeleted || !event.login) {
        continue
      }

      const key = normalizeLogin(event.login)

      if (!key || latestByLogin.has(key)) {
        continue
      }

      latestByLogin.set(key, event)
    }

    return [...latestByLogin.values()]
  }, [filteredEventsSource])

  const visibleNonReciprocal = useMemo(() => {
    return sortNonReciprocal(filteredNonReciprocalSource, nonReciprocalSortField, nonReciprocalSortOrder).slice(
      0,
      nonReciprocalLimit,
    )
  }, [filteredNonReciprocalSource, nonReciprocalSortField, nonReciprocalSortOrder, nonReciprocalLimit])

  const visibleStaleNonReciprocal = useMemo(() => {
    return sortNonReciprocal(filteredStaleNonReciprocalSource, nonReciprocalSortField, nonReciprocalSortOrder).slice(
      0,
      candidateLimit,
    )
  }, [filteredStaleNonReciprocalSource, nonReciprocalSortField, nonReciprocalSortOrder, candidateLimit])

  const visibleFollowersOnly = useMemo(() => {
    return filteredFollowersOnlySource.slice(0, followersOnlyLimit)
  }, [filteredFollowersOnlySource, followersOnlyLimit])

  const visibleMutualFollowers = useMemo(() => {
    return sortMutualByDays(filteredMutualSource, mutualSortOrder).slice(0, mutualLimit)
  }, [filteredMutualSource, mutualSortOrder, mutualLimit])

  const visibleStaleFriends = useMemo(() => {
    return filteredStaleFriendSource.slice(0, mutualLimit)
  }, [filteredStaleFriendSource, mutualLimit])

  const visibleCandidateStaleFriends = useMemo(() => {
    return filteredStaleFriendSource.slice(0, candidateLimit)
  }, [filteredStaleFriendSource, candidateLimit])

  const visibleDeletedFollowerLosses = useMemo(() => {
    return filteredDeletedFollowerLossSource.slice(0, candidateLimit)
  }, [filteredDeletedFollowerLossSource, candidateLimit])

  const visibleEvents = useMemo(() => {
    const filtered =
      eventsFilter === 'all'
        ? filteredEventsSource
        : filteredEventsSource.filter((event) => event.type === eventsFilter)

    return filtered.slice(0, eventsLimit)
  }, [filteredEventsSource, eventsFilter, eventsLimit])

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
          throw new Error(i18n.failedToLoadReports(reportsResponse.status))
        }

        if (!eventsResponse.ok) {
          throw new Error(i18n.failedToLoadEvents(eventsResponse.status))
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

        setError(loadError instanceof Error ? loadError.message : i18n.unknownLoadError)
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
  }, [baseUrl, refreshNonce, i18n])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(SETTINGS_STORAGE_KEY, String(defaultPageSize))
  }, [defaultPageSize])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(EXCLUSIONS_STORAGE_KEY, JSON.stringify(excludedLogins))
  }, [excludedLogins])

  useEffect(() => {
    setNonReciprocalLimit(defaultPageSize)
    setCandidateLimit(defaultPageSize)
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
  const followBackWindowDays = reports?.followBackWindowDays ?? 7
  const followersMutual = filteredMutualSource.length
  const followersOnly = filteredFollowersOnlySource.length
  const nonReciprocalCount = filteredNonReciprocalSource.length
  const friendInactiveDays = reports?.friendInactiveDays ?? 60
  const staleNonReciprocalCount = filteredStaleNonReciprocalSource.length
  const staleFriendsCount = filteredStaleFriendSource.length
  const deletedLossesCount = filteredDeletedFollowerLossSource.length
  const unfollowCandidatesCount = staleNonReciprocalCount + staleFriendsCount + deletedLossesCount

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

  const handleAddExcludedLogin = () => {
    const normalized = normalizeLogin(excludedInput)

    if (!isValidLogin(normalized)) {
      return
    }

    setExcludedLogins((prev) => {
      if (prev.includes(normalized)) {
        return prev
      }

      return [...prev, normalized].sort()
    })
    setExcludedInput('')
  }

  const handleRemoveExcludedLogin = (login) => {
    const normalized = normalizeLogin(login)
    setExcludedLogins((prev) => prev.filter((item) => item !== normalized))
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="title-row">
          <h1 className="title-line">{title}</h1>
          <div className="repo-actions" title="Fixed repository: GoXLd/github-friends">
            <a href={FIXED_REPO_URL} target="_blank" rel="noreferrer" className="repo-link">
              Repo
            </a>
            <a href={FIXED_REPO_URL} target="_blank" rel="noreferrer" className="repo-stat-button">
              Stars <span>{formatCount(repoStats.stars, locale)}</span>
            </a>
            <a href={FIXED_REPO_FORK_URL} target="_blank" rel="noreferrer" className="repo-stat-button">
              Forks <span>{formatCount(repoStats.forks, locale)}</span>
            </a>
            <button
              type="button"
              className={`settings-toggle ${settingsOpen ? 'active' : ''}`}
              aria-label={i18n.settingsAriaLabel}
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((prev) => !prev)}
            >
              <svg className="settings-icon" viewBox="0 0 24 24" aria-hidden="true">
                <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 21v-7" />
                  <path d="M4 10V3" />
                  <path d="M12 21v-9" />
                  <path d="M12 8V3" />
                  <path d="M20 21v-3" />
                  <path d="M20 14V3" />
                  <path d="M1 14h6" />
                  <path d="M9 8h6" />
                  <path d="M17 18h6" />
                </g>
              </svg>
            </button>
          </div>
        </div>
        <p className="hero-meta hero-meta-inline">
          {i18n.lastUpdate}: {formatDate(reports?.generatedAt, locale)} · {i18n.browserLoad}:{' '}
          {formatDate(lastLoadedAt, locale)}
        </p>

        {settingsOpen && (
          <section className="settings-panel">
            <label className="settings-row">
              {i18n.settingsDefaultPageSize}
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
            <label className="settings-row settings-row-stack">
              {i18n.languageLabel}
              <div className="settings-language-select-wrap">
                <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                  <option value="en">{i18n.languageEnglish}</option>
                  <option value="ru">{i18n.languageRussian}</option>
                </select>
              </div>
            </label>
            <div className="settings-divider" />
            <label className="settings-row settings-row-stack">
              {i18n.settingsExclusions}
              <div className="settings-inline">
                <input
                  type="text"
                  value={excludedInput}
                  onChange={(event) => setExcludedInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleAddExcludedLogin()
                    }
                  }}
                  placeholder={i18n.settingsInputPlaceholder}
                  className="settings-input"
                />
                <button type="button" className="settings-add-button" onClick={handleAddExcludedLogin}>
                  {i18n.settingsAdd}
                </button>
              </div>
            </label>
            <p className="settings-note">{i18n.settingsExclusionNote}</p>
            {!excludedLogins.length && <p className="settings-empty">{i18n.settingsExclusionEmpty}</p>}
            {!!excludedLogins.length && (
              <ul className="excluded-list">
                {excludedLogins.map((login) => (
                  <li key={login}>
                    <span>@{login}</span>
                    <button type="button" onClick={() => handleRemoveExcludedLogin(login)}>
                      {i18n.settingsRemove}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </header>

      {loading && <p className="state-box">{i18n.loading}</p>}
      {error && <p className="state-box error">{error}</p>}

      {!loading && !error && reports && (
        <>
          <section className="stats-grid">
            <article className="stat-card">
              <p>{i18n.followers}</p>
              <strong>{counts.followers ?? 0}</strong>
            </article>
            <article className="stat-card">
              <p>{i18n.following}</p>
              <strong>{counts.following ?? 0}</strong>
            </article>
            <article className="stat-card accent-blue">
              <p>{i18n.nonReciprocal}</p>
              <strong>{nonReciprocalCount}</strong>
            </article>
            <article className="stat-card accent-green">
              <p>{i18n.mutualFollowers}</p>
              <strong>{followersMutual}</strong>
            </article>
            <button
              type="button"
              className="stat-card accent-red stat-card-button"
              onClick={() => setActiveTab(TAB_CANDIDATES)}
              title={i18n.goToCandidates}
            >
              <p>{i18n.unfollowCandidates}</p>
              <strong>{unfollowCandidatesCount}</strong>
            </button>
          </section>

          <section className="tabs" role="tablist" aria-label={i18n.tabsAriaLabel}>
            <button
              role="tab"
              aria-selected={activeTab === TAB_CANDIDATES}
              className={`tab-button ${activeTab === TAB_CANDIDATES ? 'active' : ''}`}
              title={i18n.tabTitleCandidates}
              onClick={() => setActiveTab(TAB_CANDIDATES)}
            >
              <span>{i18n.tabCandidates}</span>
              <span className="tab-badge">{unfollowCandidatesCount}</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === TAB_NON_RECIPROCAL}
              className={`tab-button ${activeTab === TAB_NON_RECIPROCAL ? 'active' : ''}`}
              title={i18n.tabTitleNotFollowback}
              onClick={() => setActiveTab(TAB_NON_RECIPROCAL)}
            >
              {i18n.tabNotFollowback}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === TAB_FOLLOWERS_ONLY}
              className={`tab-button ${activeTab === TAB_FOLLOWERS_ONLY ? 'active' : ''}`}
              title={i18n.tabTitleFollowers}
              onClick={() => setActiveTab(TAB_FOLLOWERS_ONLY)}
            >
              <span>{i18n.tabFollowers}</span>
              <span className="tab-badge">{followersOnly}</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === TAB_MUTUAL}
              className={`tab-button ${activeTab === TAB_MUTUAL ? 'active' : ''}`}
              title={i18n.tabTitleFriends}
              onClick={() => setActiveTab(TAB_MUTUAL)}
            >
              <span>{i18n.tabFriends}</span>
              <span className="tab-badge">{followersMutual}</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === TAB_EVENTS}
              className={`tab-button ${activeTab === TAB_EVENTS ? 'active' : ''}`}
              onClick={() => setActiveTab(TAB_EVENTS)}
            >
              {i18n.tabEvents}
            </button>
          </section>

          <section key={activeTab} className="panel tab-panel">
            {activeTab === TAB_NON_RECIPROCAL && (
              <>
                <h2 className="heading-with-tip">
                  {i18n.headingNotFollowback}
                  <InfoTooltip
                    label={i18n.tooltipNotFollowbackLabel}
                    text={i18n.tooltipNotFollowbackText}
                  />
                </h2>
                <NonReciprocalTable
                  users={visibleNonReciprocal}
                  sortField={nonReciprocalSortField}
                  sortOrder={nonReciprocalSortOrder}
                  onSortTracked={() => handleNonReciprocalSort(NON_RECIPROCAL_SORT_TRACKED)}
                  onSortWaiting={() => handleNonReciprocalSort(NON_RECIPROCAL_SORT_WAITING)}
                  i18n={i18n}
                  locale={locale}
                />
                <LimitSelector value={nonReciprocalLimit} onChange={setNonReciprocalLimit} i18n={i18n} />
              </>
            )}

            {activeTab === TAB_FOLLOWERS_ONLY && (
              <>
                <h2 className="heading-with-tip">
                  {i18n.headingFollowers}
                  <InfoTooltip
                    label={i18n.tooltipFollowersLabel}
                    text={i18n.tooltipFollowersText}
                  />
                </h2>
                <FollowersOnlyTable users={visibleFollowersOnly} i18n={i18n} />
                <LimitSelector value={followersOnlyLimit} onChange={setFollowersOnlyLimit} i18n={i18n} />
              </>
            )}

            {activeTab === TAB_CANDIDATES && (
              <>
                <h2 className="heading-with-tip">
                  {i18n.headingCandidates}
                  <InfoTooltip
                    label={i18n.tooltipCandidatesLabel}
                    text={i18n.tooltipCandidatesText}
                  />
                </h2>
                <h3 className="sub-heading">{i18n.sectionCandidatesNotFollowback(followBackWindowDays)}</h3>
                <NonReciprocalTable
                  users={visibleStaleNonReciprocal}
                  sortField={nonReciprocalSortField}
                  sortOrder={nonReciprocalSortOrder}
                  onSortTracked={() => handleNonReciprocalSort(NON_RECIPROCAL_SORT_TRACKED)}
                  onSortWaiting={() => handleNonReciprocalSort(NON_RECIPROCAL_SORT_WAITING)}
                  i18n={i18n}
                  locale={locale}
                />
                <h3 className="sub-heading">{i18n.sectionCandidatesFriends(friendInactiveDays)}</h3>
                <FriendsCleanupTable
                  users={visibleCandidateStaleFriends}
                  thresholdDays={friendInactiveDays}
                  i18n={i18n}
                  locale={locale}
                />
                <h3 className="sub-heading">{i18n.sectionCandidatesDeleted}</h3>
                <DeletedFollowerLossesTable events={visibleDeletedFollowerLosses} i18n={i18n} locale={locale} />
                <LimitSelector value={candidateLimit} onChange={setCandidateLimit} i18n={i18n} />
              </>
            )}

            {activeTab === TAB_MUTUAL && (
              <>
                <h2 className="heading-with-tip">
                  {i18n.headingFriends}
                  <InfoTooltip
                    label={i18n.tooltipFriendsLabel}
                    text={i18n.tooltipFriendsText}
                  />
                </h2>
                <MutualFollowersTable
                  users={visibleMutualFollowers}
                  sortOrder={mutualSortOrder}
                  onSortDays={() => setMutualSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                  i18n={i18n}
                  locale={locale}
                />
                <h3 className="sub-heading">{i18n.sectionFriendsCleanup(friendInactiveDays)}</h3>
                <FriendsCleanupTable
                  users={visibleStaleFriends}
                  thresholdDays={friendInactiveDays}
                  i18n={i18n}
                  locale={locale}
                />
                <LimitSelector value={mutualLimit} onChange={setMutualLimit} i18n={i18n} />
              </>
            )}

            {activeTab === TAB_EVENTS && (
              <>
                <h2 className="heading-with-tip">
                  {i18n.headingEvents}
                  <InfoTooltip
                    label={i18n.tooltipEventsLabel}
                    text={i18n.tooltipEventsText}
                  />
                </h2>
                <EventsFilter value={eventsFilter} onChange={setEventsFilter} filters={i18n.eventFilters} />
                <EventsList events={visibleEvents} i18n={i18n} locale={locale} />
                <LimitSelector value={eventsLimit} onChange={setEventsLimit} i18n={i18n} />
              </>
            )}
          </section>
        </>
      )}

      <footer className="risk-disclaimer">
        <p className="risk-title">{i18n.riskTitle}</p>
        <p>{i18n.riskTextOne}</p>
        <p>{i18n.riskTextTwo}</p>
      </footer>
    </main>
  )
}

export default App
