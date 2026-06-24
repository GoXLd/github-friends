import { useEffect, useEffectEvent, useMemo, useState } from 'react'
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
const THEME_STORAGE_KEY = 'gh_friends_theme_mode'
const FOLLOW_BACK_WINDOW_STORAGE_KEY = 'gh_friends_follow_back_days'
const FRIEND_INACTIVE_STORAGE_KEY = 'gh_friends_friend_inactive_days'
const RETENTION_DAYS_STORAGE_KEY = 'gh_friends_retention_days'
const DEFAULT_FOLLOW_BACK_WINDOW_DAYS = 7
const DEFAULT_FRIEND_INACTIVE_DAYS = 60
const DEFAULT_RETENTION_DAYS = 90
const THEME_SYSTEM = 'system'
const THEME_LIGHT = 'light'
const THEME_DARK = 'dark'

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
    themeLabel: 'Theme:',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
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
    confidenceCol: 'Confidence',
    lastContributeCol: 'Last contribute',
    eventTypeCol: 'Event type',
    actionsCol: 'Actions',
    emptyList: 'List is empty.',
    followersOnlyEmpty: 'No followers in this category right now.',
    mutualEmpty: 'No mutual followers data yet.',
    friendsCleanupEmpty: 'No cleanup candidates in Friends yet.',
    deletedFollowerLossesEmpty: 'No deleted accounts in recent losses.',
    eventsEmpty: 'No events for this filter.',
    deletedBadge: 'Deleted',
    openBlockDialog: 'Open block dialog',
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
    settingsFollowBackWindowDays: 'Not Followback threshold (days):',
    settingsFriendInactiveDays: 'Friends inactivity threshold (days):',
    settingsRetentionDays: 'Data/event window (days):',
    settingsThresholdHint: 'These thresholds are local to this browser and affect UI recommendations.',
    settingsExclusions: 'Excluded users:',
    settingsAdd: 'Add',
    settingsRemove: 'Remove',
    settingsExclusionNote: 'Exclusions are applied locally in this browser.',
    settingsExclusionEmpty: 'Exclusions list is empty.',
    settingsInputPlaceholder: '@username',
    repoFixedTitle: 'Fixed repository: GoXLd/github-friends',
    repoLinkLabel: 'Repo',
    repoStarsLabel: 'Stars',
    repoForksLabel: 'Forks',
    heroUpdatedShort: 'Updated',
    heroLoadedShort: 'Loaded',
    heroApiShort: 'API',
    heroResetShort: 'Reset',
    lastUpdate: 'Last update',
    browserLoad: 'Last browser load',
    apiRateLimit: 'GitHub API rate limit',
    apiRateLimitReset: 'reset',
    apiRateLimitUnavailable: 'unavailable',
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
    reasonNoFollowback: (daysWaiting, thresholdDays, daysSuffix) =>
      `No followback for ${daysWaiting.toFixed(1)} ${daysSuffix} (threshold: ${thresholdDays}+ ${daysSuffix})`,
    reasonDeletedSignal:
      'Matched paired unfollow signal and GitHub user check returned 404 for this account.',
    confidenceLow: 'Low',
    confidenceMedium: 'Medium',
    confidenceHigh: 'High',
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
    themeLabel: 'Тема:',
    themeSystem: 'Системная',
    themeLight: 'Светлая',
    themeDark: 'Темная',
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
    confidenceCol: 'Уверенность',
    lastContributeCol: 'Последний вклад',
    eventTypeCol: 'Тип события',
    actionsCol: 'Действия',
    emptyList: 'Список пуст.',
    followersOnlyEmpty: 'Таких подписчиков сейчас нет.',
    mutualEmpty: 'Пока нет данных по взаимным подписчикам.',
    friendsCleanupEmpty: 'Кандидатов на очистку друзей пока нет.',
    deletedFollowerLossesEmpty: 'Удаленных аккаунтов среди последних отписок пока нет.',
    eventsEmpty: 'Событий по фильтру нет.',
    deletedBadge: 'Удаленный',
    openBlockDialog: 'Открыть блокировку',
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
    settingsFollowBackWindowDays: 'Порог невзаимной подписки (дней):',
    settingsFriendInactiveDays: 'Порог неактивности друзей (дней):',
    settingsRetentionDays: 'Окно данных и событий (дней):',
    settingsThresholdHint: 'Эти пороги сохраняются только в этом браузере и влияют на рекомендации в интерфейсе.',
    settingsExclusions: 'Исключения из обработки:',
    settingsAdd: 'Добавить',
    settingsRemove: 'Убрать',
    settingsExclusionNote: 'Исключения применяются локально в этом браузере.',
    settingsExclusionEmpty: 'Список исключений пуст.',
    settingsInputPlaceholder: '@username',
    repoFixedTitle: 'Фиксированный репозиторий: GoXLd/github-friends',
    repoLinkLabel: 'Репозиторий',
    repoStarsLabel: 'Звезды',
    repoForksLabel: 'Форки',
    heroUpdatedShort: 'Обновлено',
    heroLoadedShort: 'Загружено',
    heroApiShort: 'API',
    heroResetShort: 'Сброс',
    lastUpdate: 'Последнее обновление',
    browserLoad: 'Последняя загрузка в браузере',
    apiRateLimit: 'GitHub API лимит',
    apiRateLimitReset: 'сброс',
    apiRateLimitUnavailable: 'нет данных',
    followers: 'Подписчики',
    following: 'Подписки',
    nonReciprocal: 'Невзаимные подписки',
    mutualFollowers: 'Взаимные подписчики',
    unfollowCandidates: 'Кандидаты на отписку',
    nonReciprocalShort: 'Без ответа',
    friendsShort: 'Друзья',
    deletedShort: 'Удаленные',
    goToCandidates: 'Перейти на вкладку кандидатов на отписку',
    tabsAriaLabel: 'Разделы',
    tabNotFollowback: 'Без ответа',
    tabFollowers: 'Подписчики',
    tabCandidates: 'Кандидаты на отписку',
    tabFriends: 'Друзья',
    tabEvents: 'Последние события',
    tabTitleNotFollowback: 'Пользователи, на которых вы подписаны, но они не подписаны на вас в ответ.',
    tabTitleFollowers: 'Пользователи, которые подписаны на вас, но вы не подписаны на них.',
    tabTitleCandidates: 'Сводный список кандидатов на отписку.',
    tabTitleFriends: 'Взаимные подписки: вы подписаны друг на друга.',
    headingNotFollowback: 'Без ответной подписки',
    headingFollowers: 'Подписчики',
    headingCandidates: 'Кандидаты на отписку',
    headingFriends: 'Друзья',
    headingEvents: 'Последние события',
    tooltipNotFollowbackLabel: 'Подсказка по разделу невзаимных подписок',
    tooltipNotFollowbackText:
      'Список пользователей, на которых вы подписаны, но они не подписались в ответ. Используйте для анализа невзаимных подписок.',
    tooltipFollowersLabel: 'Подсказка по разделу подписчиков',
    tooltipFollowersText: 'Пользователи, которые подписаны на вас, но вы не подписаны на них.',
    tooltipCandidatesLabel: 'Подсказка по разделу кандидатов на отписку',
    tooltipCandidatesText:
      'Сводный список для очистки: долгие невзаимные подписки, неактивные друзья и удаленные аккаунты, которые отписались.',
    tooltipFriendsLabel: 'Подсказка по колонке последнего вклада',
    tooltipFriendsText:
      'Это взаимные подписки. Последний вклад берется из последних 100 публичных событий GitHub и учитывает только contribution-события.',
    tooltipEventsLabel: 'Подсказка по логике метки Удаленный',
    tooltipEventsText:
      'Метка «Удаленный» ставится только если пользователь исчез одновременно из followers и following, и API /users/{login} вернул 404. Иначе это может быть блокировка или ограничение.',
    sectionCandidatesNotFollowback: (days) => `Невзаимные подписки (${days}+ дней)`,
    sectionCandidatesFriends: (days) => `Друзья без активности (${days}+ дней)`,
    sectionCandidatesDeleted: 'Отписался от вас и аккаунт удален',
    sectionFriendsCleanup: (days) => `Кандидаты на очистку друзей (неактивность ${days}+ дней)`,
    reasonNoFollowback: (daysWaiting, thresholdDays, daysSuffix) =>
      `Нет ответной подписки ${daysWaiting.toFixed(1)} ${daysSuffix} (порог: ${thresholdDays}+ ${daysSuffix})`,
    reasonDeletedSignal:
      'Совпали парные сигналы отписки, и проверка GitHub /users/{login} вернула 404.',
    confidenceLow: 'Низкая',
    confidenceMedium: 'Средняя',
    confidenceHigh: 'Высокая',
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

function getStoredInteger(storageKey, fallbackValue, allowedValues = null) {
  if (typeof window === 'undefined') {
    return fallbackValue
  }

  const rawValue = window.localStorage.getItem(storageKey)
  const parsed = Number.parseInt(rawValue ?? '', 10)

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallbackValue
  }

  if (Array.isArray(allowedValues) && !allowedValues.includes(parsed)) {
    return fallbackValue
  }

  return parsed
}

function getInitialDefaultPageSize() {
  return getStoredInteger(SETTINGS_STORAGE_KEY, DEFAULT_PAGE_SIZE_FALLBACK, LIMIT_OPTIONS)
}

function getInitialThresholdSetting(storageKey, fallbackValue) {
  return getStoredInteger(storageKey, fallbackValue)
}

function getInitialThemeMode() {
  if (typeof window === 'undefined') {
    return THEME_SYSTEM
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === THEME_LIGHT || stored === THEME_DARK || stored === THEME_SYSTEM ? stored : THEME_SYSTEM
}

function setStoredValue(storageKey, value) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(storageKey, value)
}

function parsePositiveIntegerInput(rawValue, fallbackValue = 1) {
  const parsed = Number.parseInt(rawValue || String(fallbackValue), 10)

  if (!Number.isNaN(parsed) && parsed > 0) {
    return parsed
  }

  return fallbackValue
}

function createLoadError(source, status) {
  return { source, status }
}

function isLoadError(error) {
  return typeof error === 'object' && error !== null && 'source' in error && 'status' in error
}

function applyThemeMode(themeMode) {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  if (themeMode === THEME_LIGHT || themeMode === THEME_DARK) {
    root.dataset.theme = themeMode
    return
  }

  root.removeAttribute('data-theme')
}

if (typeof document !== 'undefined') {
  applyThemeMode(getInitialThemeMode())
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
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
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

function toDaysFromNow(dateString) {
  const timestamp = Date.parse(dateString ?? '')

  if (Number.isNaN(timestamp)) {
    return null
  }

  return Number(((Date.now() - timestamp) / (24 * 60 * 60 * 1000)).toFixed(2))
}

function toTimestamp(value) {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getNonReciprocalConfidenceScore(daysWaiting, thresholdDays) {
  const safeDaysWaiting = Math.max(0, Number(daysWaiting) || 0)
  const safeThreshold = Math.max(1, Number(thresholdDays) || 1)
  const ratio = safeDaysWaiting / safeThreshold
  return clamp(0.45 + Math.min(0.45, Math.max(0, ratio - 1) * 0.18), 0.45, 0.9)
}

function getFriendCleanupConfidenceScore(inactiveDays, thresholdDays, reason) {
  const safeInactiveDays = Math.max(0, Number(inactiveDays) || 0)
  const safeThreshold = Math.max(1, Number(thresholdDays) || 1)
  const ratio = safeInactiveDays / safeThreshold
  const base = reason === 'inactive_contribution_window' ? 0.6 : 0.5
  const growth = reason === 'inactive_contribution_window' ? 0.35 : 0.3
  return clamp(base + Math.min(growth, Math.max(0, ratio - 1) * 0.14), base, 0.95)
}

function getDeletedConfidenceScore() {
  return 0.95
}

function getConfidenceTone(score) {
  if (score >= 0.85) {
    return 'high'
  }

  if (score >= 0.65) {
    return 'medium'
  }

  return 'low'
}

function formatConfidence(score, i18n) {
  if (score === null || score === undefined) {
    return '—'
  }

  const rounded = Math.round(score * 100)
  const tone = getConfidenceTone(score)
  const label =
    tone === 'high' ? i18n.confidenceHigh : tone === 'medium' ? i18n.confidenceMedium : i18n.confidenceLow

  return `${rounded}% (${label})`
}

function formatRateLimitSummary(rateLimit, locale, i18n) {
  if (!rateLimit) {
    return i18n.apiRateLimitUnavailable
  }

  return `${formatCount(rateLimit.remaining, locale)}/${formatCount(rateLimit.limit, locale)} · ${i18n.heroResetShort} ${formatDate(rateLimit.resetAt, locale)}`
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

function AppIcon({ name, className = 'ui-icon' }) {
  const commonProps = {
    className,
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  switch (name) {
    case 'repo':
      return (
        <svg {...commonProps}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5A2.5 2.5 0 0 0 17.5 16H4z" />
          <path d="M6.5 3v13" />
          <path d="M8.5 7H16" />
          <path d="M8.5 11H14" />
        </svg>
      )
    case 'star':
      return (
        <svg {...commonProps}>
          <path d="m12 3 2.7 5.48 6.05.88-4.38 4.27 1.04 6.03L12 16.8l-5.41 2.86 1.04-6.03L3.25 9.36l6.05-.88z" />
        </svg>
      )
    case 'fork':
      return (
        <svg {...commonProps}>
          <path d="M7 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
          <path d="M17 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
          <path d="M17 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
          <path d="M7 8v4a6 6 0 0 0 6 6h2" />
          <path d="M7 8v4a6 6 0 0 1 6-6h2" />
        </svg>
      )
    case 'theme':
      return (
        <svg {...commonProps}>
          <path d="M12 3v2.5" />
          <path d="M12 18.5V21" />
          <path d="m5.64 5.64 1.77 1.77" />
          <path d="m16.59 16.59 1.77 1.77" />
          <path d="M3 12h2.5" />
          <path d="M18.5 12H21" />
          <path d="m5.64 18.36 1.77-1.77" />
          <path d="m16.59 7.41 1.77-1.77" />
          <circle cx="12" cy="12" r="3.5" />
        </svg>
      )
    case 'list':
      return (
        <svg {...commonProps}>
          <path d="M8 6h12" />
          <path d="M8 12h12" />
          <path d="M8 18h12" />
          <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a15 15 0 0 1 0 18" />
          <path d="M12 3a15 15 0 0 0 0 18" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'exclude':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 8.5l7 7" />
          <path d="M15.5 8.5l-7 7" />
        </svg>
      )
    case 'followers':
      return (
        <svg {...commonProps}>
          <path d="M16 21v-1.5A3.5 3.5 0 0 0 12.5 16h-4A3.5 3.5 0 0 0 5 19.5V21" />
          <circle cx="10.5" cy="9" r="3" />
          <path d="M19 21v-1a3 3 0 0 0-2.4-2.94" />
          <path d="M15.5 6.2a3 3 0 0 1 0 5.6" />
        </svg>
      )
    case 'following':
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="8" r="3" />
          <path d="M4.5 20v-1A4.5 4.5 0 0 1 9 14.5h1.5" />
          <path d="M14 10h7" />
          <path d="m18 6 3 4-3 4" />
        </svg>
      )
    case 'nonReciprocal':
      return (
        <svg {...commonProps}>
          <path d="M4 7h11" />
          <path d="m11 4 4 3-4 3" />
          <path d="M20 17H9" />
          <path d="m13 14-4 3 4 3" />
          <path d="m4 4 16 16" />
        </svg>
      )
    case 'mutual':
      return (
        <svg {...commonProps}>
          <path d="M7 7h10" />
          <path d="m13 3 4 4-4 4" />
          <path d="M17 17H7" />
          <path d="m11 13-4 4 4 4" />
        </svg>
      )
    case 'candidates':
      return (
        <svg {...commonProps}>
          <path d="M4 7h16" />
          <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          <path d="M6 7l1 12a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L18 7" />
          <path d="M10 11v5" />
          <path d="M14 11v5" />
        </svg>
      )
    case 'events':
      return (
        <svg {...commonProps}>
          <path d="M3 12h4l2.2-5 3.6 10 2.2-5H21" />
        </svg>
      )
    case 'refresh':
      return (
        <svg {...commonProps}>
          <path d="M20 11a8 8 0 0 0-14.9-3" />
          <path d="M4 4v5h5" />
          <path d="M4 13a8 8 0 0 0 14.9 3" />
          <path d="M20 20v-5h-5" />
        </svg>
      )
    case 'browser':
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18" />
          <path d="M7 7h.01" />
          <path d="M10 7h.01" />
        </svg>
      )
    case 'rate':
      return (
        <svg {...commonProps}>
          <path d="M5 17 9.5 11.5l3 3L19 7" />
          <path d="M19 12V7h-5" />
        </svg>
      )
    default:
      return null
  }
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

function SectionHeading({ title, tooltipLabel, tooltipText }) {
  return (
    <h2 className="heading-with-tip">
      {title}
      <InfoTooltip label={tooltipLabel} text={tooltipText} />
    </h2>
  )
}

function ProfileLink({ login, href }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      @{login}
    </a>
  )
}

function StatusPill({ icon, label, value, title }) {
  return (
    <div className="hero-pill" title={title}>
      <span className="hero-pill-label">
        <AppIcon name={icon} />
        <span>{label}</span>
      </span>
      <span className="hero-pill-value">{value}</span>
    </div>
  )
}

function SettingsField({ icon, label, stacked = false, children }) {
  return (
    <label className={`settings-row ${stacked ? 'settings-row-stack' : ''}`.trim()}>
      <span className="settings-label">
        <AppIcon name={icon} />
        <span>{label}</span>
      </span>
      {children}
    </label>
  )
}

function SettingsSelectField({ icon, label, value, onChange, children }) {
  return (
    <SettingsField icon={icon} label={label} stacked>
      <div className="settings-language-select-wrap">
        <select value={value} onChange={onChange}>
          {children}
        </select>
      </div>
    </SettingsField>
  )
}

function SettingsNumberField({ icon, label, value, onChange }) {
  return (
    <SettingsField icon={icon} label={label}>
      <input
        type="number"
        min={1}
        value={value}
        onChange={onChange}
        className="settings-number-input"
      />
    </SettingsField>
  )
}

function ConfidenceBadge({ score, i18n }) {
  return (
    <span className={`confidence-badge ${getConfidenceTone(score ?? 0)}`}>{formatConfidence(score, i18n)}</span>
  )
}

function NonReciprocalTable({
  users,
  sortField,
  sortOrder,
  onSortTracked,
  onSortWaiting,
  i18n,
  locale,
  showReason = false,
  showConfidence = false,
  thresholdDays = DEFAULT_FOLLOW_BACK_WINDOW_DAYS,
}) {
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
            {showReason && <th>{i18n.reasonCol}</th>}
            {showConfidence && <th>{i18n.confidenceCol}</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.login}>
              <td><ProfileLink login={user.login} href={user.htmlUrl} /></td>
              <td>{formatDays(user.daysWaiting, i18n)}</td>
              <td>{formatDate(user.firstSeenFollowingAt, locale)}</td>
              {showReason && (
                <td>{i18n.reasonNoFollowback(user.daysWaiting ?? 0, thresholdDays, i18n.daysSuffix)}</td>
              )}
              {showConfidence && <td><ConfidenceBadge score={user.confidenceScore} i18n={i18n} /></td>}
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
              <td><ProfileLink login={user.login} href={user.htmlUrl} /></td>
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
              <td><ProfileLink login={user.login} href={user.htmlUrl} /></td>
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
            <th>{i18n.confidenceCol}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={`${user.login}-stale`}>
              <td><ProfileLink login={user.login} href={user.htmlUrl} /></td>
              <td>{formatDate(user.firstSeenMutualAt, locale)}</td>
              <td>{formatDate(user.lastContributionAt, locale)}</td>
              <td>{formatDays(user.inactiveDays, i18n)}</td>
              <td>
                {formatStaleReason(user.reason, i18n)}: {formatDays(user.inactiveDays, i18n)} (threshold:{' '}
                {thresholdDays}+ {i18n.daysSuffix})
              </td>
              <td><ConfidenceBadge score={user.confidenceScore} i18n={i18n} /></td>
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
            <th>{i18n.reasonCol}</th>
            <th>{i18n.confidenceCol}</th>
            <th>{i18n.actionCol}</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td><ProfileLink login={event.login} href={event.htmlUrl} /></td>
              <td>{formatDate(event.happenedAt, locale)}</td>
              <td>
                <span className="event-badge deleted">{i18n.deletedBadge}</span>
              </td>
              <td>{i18n.reasonDeletedSignal}</td>
              <td><ConfidenceBadge score={event.confidenceScore} i18n={i18n} /></td>
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

function EventsList({ events, i18n, locale, onOpenBlockDialog }) {
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
          <div className="event-main">
            <ProfileLink login={event.login} href={event.htmlUrl} />
            {event.type === 'follower_lost' && (
              <div className="event-actions">
                <button
                  type="button"
                  className="event-action-button"
                  onClick={() => onOpenBlockDialog(event.login)}
                >
                  {i18n.openBlockDialog}
                </button>
              </div>
            )}
          </div>
          <time>{formatDate(event.happenedAt, locale)}</time>
        </li>
      ))}
    </ul>
  )
}

function App() {
  const [language, setLanguage] = useState(getInitialLanguage)
  const [themeMode, setThemeMode] = useState(getInitialThemeMode)
  const [reports, setReports] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [lastLoadedAt, setLastLoadedAt] = useState(null)
  const [activeTab, setActiveTab] = useState(TAB_NON_RECIPROCAL)
  const [nonReciprocalSortField, setNonReciprocalSortField] = useState(NON_RECIPROCAL_SORT_WAITING)
  const [nonReciprocalSortOrder, setNonReciprocalSortOrder] = useState('desc')
  const [mutualSortOrder, setMutualSortOrder] = useState('desc')
  const [eventsFilter, setEventsFilter] = useState('all')
  const [defaultPageSize, setDefaultPageSize] = useState(getInitialDefaultPageSize)
  const [followBackWindowDays, setFollowBackWindowDays] = useState(() =>
    getInitialThresholdSetting(FOLLOW_BACK_WINDOW_STORAGE_KEY, DEFAULT_FOLLOW_BACK_WINDOW_DAYS),
  )
  const [friendInactiveDays, setFriendInactiveDays] = useState(() =>
    getInitialThresholdSetting(FRIEND_INACTIVE_STORAGE_KEY, DEFAULT_FRIEND_INACTIVE_DAYS),
  )
  const [retentionDays, setRetentionDays] = useState(() =>
    getInitialThresholdSetting(RETENTION_DAYS_STORAGE_KEY, DEFAULT_RETENTION_DAYS),
  )
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
  const formatLoadError = useEffectEvent((loadError) => {
    if (isLoadError(loadError)) {
      return loadError.source === 'reports'
        ? i18n.failedToLoadReports(loadError.status)
        : i18n.failedToLoadEvents(loadError.status)
    }

    return loadError instanceof Error ? loadError.message : i18n.unknownLoadError
  })

  const filteredNonReciprocalSource = useMemo(() => {
    const list = reports?.nonReciprocalNow ?? []
    return list.filter((user) => !excludedSet.has(normalizeLogin(user.login)))
  }, [reports?.nonReciprocalNow, excludedSet])

  const filteredStaleNonReciprocalSource = useMemo(() => {
    return filteredNonReciprocalSource
      .filter((user) => (user.daysWaiting ?? 0) >= followBackWindowDays)
      .map((user) => ({
        ...user,
        confidenceScore: getNonReciprocalConfidenceScore(user.daysWaiting, followBackWindowDays),
      }))
  }, [filteredNonReciprocalSource, followBackWindowDays])

  const filteredFollowersOnlySource = useMemo(() => {
    const list = reports?.followersNotFollowingNow ?? []
    return list.filter((user) => !excludedSet.has(normalizeLogin(user.login)))
  }, [reports?.followersNotFollowingNow, excludedSet])

  const filteredMutualSource = useMemo(() => {
    const list = reports?.mutualFollowersNow ?? []
    return list.filter((user) => !excludedSet.has(normalizeLogin(user.login)))
  }, [reports?.mutualFollowersNow, excludedSet])

  const filteredStaleFriendSource = useMemo(() => {
    return filteredMutualSource
      .map((user) => {
        const daysInFriendsList = user.daysInFriendsList ?? toDaysFromNow(user.firstSeenMutualAt)
        const inactiveDays =
          user.daysSinceLastContribution !== null && user.daysSinceLastContribution !== undefined
            ? user.daysSinceLastContribution
            : daysInFriendsList

        return {
          ...user,
          inactiveDays,
          reason:
            user.daysSinceLastContribution === null || user.daysSinceLastContribution === undefined
              ? 'no_contribution_data'
              : 'inactive_contribution_window',
          confidenceScore: getFriendCleanupConfidenceScore(
            inactiveDays,
            friendInactiveDays,
            user.daysSinceLastContribution === null || user.daysSinceLastContribution === undefined
              ? 'no_contribution_data'
              : 'inactive_contribution_window',
          ),
        }
      })
      .filter((user) => (user.inactiveDays ?? 0) >= friendInactiveDays)
      .sort((a, b) => (b.inactiveDays ?? 0) - (a.inactiveDays ?? 0))
  }, [filteredMutualSource, friendInactiveDays])

  const filteredEventsSource = useMemo(() => {
    const source = Array.isArray(events) ? events : []
    return source.filter((event) => !excludedSet.has(normalizeLogin(event.login)))
  }, [events, excludedSet])

  const filteredRecentEventsSource = useMemo(() => {
    const cutoffTimestamp = Date.now() - retentionDays * 24 * 60 * 60 * 1000

    return filteredEventsSource.filter((event) => {
      const timestamp = Date.parse(event.happenedAt ?? '')

      if (Number.isNaN(timestamp)) {
        return true
      }

      return timestamp >= cutoffTimestamp
    })
  }, [filteredEventsSource, retentionDays])

  const filteredDeletedFollowerLossSource = useMemo(() => {
    const currentGeneratedAt = reports?.generatedAt

    if (!currentGeneratedAt) {
      return []
    }

    const latestByLogin = new Map()

    for (const event of filteredRecentEventsSource) {
      if (
        event.type !== 'follower_lost' ||
        !event.isDeleted ||
        !event.login ||
        event.happenedAt !== currentGeneratedAt
      ) {
        continue
      }

      const key = normalizeLogin(event.login)

      if (!key || latestByLogin.has(key)) {
        continue
      }

      latestByLogin.set(key, event)
    }

    return [...latestByLogin.values()].map((event) => ({
      ...event,
      confidenceScore: getDeletedConfidenceScore(),
    }))
  }, [filteredRecentEventsSource, reports?.generatedAt])

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
        ? filteredRecentEventsSource
        : filteredRecentEventsSource.filter((event) => event.type === eventsFilter)

    return filtered.slice(0, eventsLimit)
  }, [filteredRecentEventsSource, eventsFilter, eventsLimit])

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
          throw createLoadError('reports', reportsResponse.status)
        }

        if (!eventsResponse.ok) {
          throw createLoadError('events', eventsResponse.status)
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

        setError(formatLoadError(loadError))
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
    setStoredValue(SETTINGS_STORAGE_KEY, String(defaultPageSize))
  }, [defaultPageSize])

  useEffect(() => {
    setStoredValue(THEME_STORAGE_KEY, themeMode)
    applyThemeMode(themeMode)
  }, [themeMode])

  useEffect(() => {
    setStoredValue(FOLLOW_BACK_WINDOW_STORAGE_KEY, String(followBackWindowDays))
  }, [followBackWindowDays])

  useEffect(() => {
    setStoredValue(FRIEND_INACTIVE_STORAGE_KEY, String(friendInactiveDays))
  }, [friendInactiveDays])

  useEffect(() => {
    setStoredValue(RETENTION_DAYS_STORAGE_KEY, String(retentionDays))
  }, [retentionDays])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setStoredValue(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    setStoredValue(EXCLUSIONS_STORAGE_KEY, JSON.stringify(excludedLogins))
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
  const rateLimit = reports?.rateLimit ?? null
  const followersMutual = filteredMutualSource.length
  const followersOnly = filteredFollowersOnlySource.length
  const nonReciprocalCount = filteredNonReciprocalSource.length
  const staleNonReciprocalCount = filteredStaleNonReciprocalSource.length
  const staleFriendsCount = filteredStaleFriendSource.length
  const deletedLossesCount = filteredDeletedFollowerLossSource.length
  const unfollowCandidatesCount = staleNonReciprocalCount + staleFriendsCount + deletedLossesCount
  const heroStatusItems = [
    {
      icon: 'refresh',
      label: i18n.heroUpdatedShort,
      value: formatDate(reports?.generatedAt, locale),
      title: i18n.lastUpdate,
    },
    {
      icon: 'browser',
      label: i18n.heroLoadedShort,
      value: formatDate(lastLoadedAt, locale),
      title: i18n.browserLoad,
    },
    {
      icon: 'rate',
      label: i18n.heroApiShort,
      value: formatRateLimitSummary(rateLimit, locale, i18n),
      title: i18n.apiRateLimit,
    },
  ]
  const repoActions = [
    {
      href: FIXED_REPO_URL,
      className: 'repo-link',
      label: i18n.repoLinkLabel,
      icon: 'repo',
    },
    {
      href: FIXED_REPO_URL,
      className: 'repo-stat-button',
      label: i18n.repoStarsLabel,
      icon: 'star',
      value: formatCount(repoStats.stars, locale),
    },
    {
      href: FIXED_REPO_FORK_URL,
      className: 'repo-stat-button',
      label: i18n.repoForksLabel,
      icon: 'fork',
      value: formatCount(repoStats.forks, locale),
    },
  ]
  const statCards = [
    { label: i18n.followers, value: counts.followers ?? 0, icon: 'followers' },
    { label: i18n.following, value: counts.following ?? 0, icon: 'following' },
    { label: i18n.nonReciprocal, value: nonReciprocalCount, accent: 'accent-blue', icon: 'nonReciprocal' },
    { label: i18n.mutualFollowers, value: followersMutual, accent: 'accent-green', icon: 'mutual' },
    {
      label: i18n.unfollowCandidates,
      value: unfollowCandidatesCount,
      accent: 'accent-red',
      icon: 'candidates',
      button: true,
      title: i18n.goToCandidates,
      onClick: () => setActiveTab(TAB_CANDIDATES),
    },
  ]
  const tabs = [
    {
      id: TAB_CANDIDATES,
      label: i18n.tabCandidates,
      title: i18n.tabTitleCandidates,
      badge: unfollowCandidatesCount,
      icon: 'candidates',
    },
    {
      id: TAB_NON_RECIPROCAL,
      label: i18n.tabNotFollowback,
      title: i18n.tabTitleNotFollowback,
      icon: 'nonReciprocal',
    },
    {
      id: TAB_FOLLOWERS_ONLY,
      label: i18n.tabFollowers,
      title: i18n.tabTitleFollowers,
      badge: followersOnly,
      icon: 'followers',
    },
    {
      id: TAB_MUTUAL,
      label: i18n.tabFriends,
      title: i18n.tabTitleFriends,
      badge: followersMutual,
      icon: 'mutual',
    },
    {
      id: TAB_EVENTS,
      label: i18n.tabEvents,
      icon: 'events',
    },
  ]

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

  const handleOpenBlockDialog = (login) => {
    const normalized = normalizeLogin(login)

    if (!normalized) {
      return
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(normalized).catch(() => {
        // Ignore clipboard permission errors.
      })
    }

    window.open('https://github.com/settings/blocked_users', '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="title-row">
          <h1 className="title-line">{title}</h1>
          <div className="repo-actions" title={i18n.repoFixedTitle}>
            {repoActions.map((action) => (
              <a
                key={`${action.className}-${action.label}`}
                href={action.href}
                target="_blank"
                rel="noreferrer"
                className={action.className}
              >
                <span className="label-with-icon">
                  <AppIcon name={action.icon} />
                  <span>{action.label}</span>
                </span>
                {action.value && <span>{action.value}</span>}
              </a>
            ))}
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
        <div className="hero-status-strip">
          {heroStatusItems.map((item) => (
            <StatusPill
              key={item.label}
              icon={item.icon}
              label={item.label}
              value={item.value}
              title={item.title}
            />
          ))}
        </div>

        {settingsOpen && (
          <section className="settings-panel">
            <SettingsField icon="list" label={i18n.settingsDefaultPageSize}>
              <select value={defaultPageSize} onChange={(event) => setDefaultPageSize(Number(event.target.value))}>
                {LIMIT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </SettingsField>
            <SettingsSelectField
              icon="globe"
              label={i18n.languageLabel}
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="en">{i18n.languageEnglish}</option>
              <option value="ru">{i18n.languageRussian}</option>
            </SettingsSelectField>
            <SettingsSelectField
              icon="theme"
              label={i18n.themeLabel}
              value={themeMode}
              onChange={(event) => setThemeMode(event.target.value)}
            >
              <option value={THEME_SYSTEM}>{i18n.themeSystem}</option>
              <option value={THEME_LIGHT}>{i18n.themeLight}</option>
              <option value={THEME_DARK}>{i18n.themeDark}</option>
            </SettingsSelectField>
            <SettingsNumberField
              icon="nonReciprocal"
              label={i18n.settingsFollowBackWindowDays}
              value={followBackWindowDays}
              onChange={(event) => setFollowBackWindowDays(parsePositiveIntegerInput(event.target.value))}
            />
            <SettingsNumberField
              icon="mutual"
              label={i18n.settingsFriendInactiveDays}
              value={friendInactiveDays}
              onChange={(event) => setFriendInactiveDays(parsePositiveIntegerInput(event.target.value))}
            />
            <SettingsNumberField
              icon="clock"
              label={i18n.settingsRetentionDays}
              value={retentionDays}
              onChange={(event) => setRetentionDays(parsePositiveIntegerInput(event.target.value))}
            />
            <p className="settings-note">{i18n.settingsThresholdHint}</p>
            <div className="settings-divider" />
            <SettingsField icon="exclude" label={i18n.settingsExclusions} stacked>
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
            </SettingsField>
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
            {statCards.map((card) =>
              card.button ? (
                <button
                  key={card.label}
                  type="button"
                  className={`stat-card ${card.accent ?? ''} stat-card-button`}
                  onClick={card.onClick}
                  title={card.title}
                >
                  <p className="stat-label">
                    <AppIcon name={card.icon} />
                    <span>{card.label}</span>
                  </p>
                  <strong>{formatCount(card.value, locale)}</strong>
                </button>
              ) : (
                <article key={card.label} className={`stat-card ${card.accent ?? ''}`.trim()}>
                  <p className="stat-label">
                    <AppIcon name={card.icon} />
                    <span>{card.label}</span>
                  </p>
                  <strong>{formatCount(card.value, locale)}</strong>
                </article>
              ),
            )}
          </section>

          <section className="tabs" role="tablist" aria-label={i18n.tabsAriaLabel}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                title={tab.title}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="label-with-icon">
                  <AppIcon name={tab.icon} />
                  <span>{tab.label}</span>
                </span>
                {typeof tab.badge === 'number' && <span className="tab-badge">{tab.badge}</span>}
              </button>
            ))}
          </section>

          <section key={activeTab} className="panel tab-panel">
            {activeTab === TAB_NON_RECIPROCAL && (
              <>
                <SectionHeading
                  title={i18n.headingNotFollowback}
                  tooltipLabel={i18n.tooltipNotFollowbackLabel}
                  tooltipText={i18n.tooltipNotFollowbackText}
                />
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
                <SectionHeading
                  title={i18n.headingFollowers}
                  tooltipLabel={i18n.tooltipFollowersLabel}
                  tooltipText={i18n.tooltipFollowersText}
                />
                <FollowersOnlyTable users={visibleFollowersOnly} i18n={i18n} />
                <LimitSelector value={followersOnlyLimit} onChange={setFollowersOnlyLimit} i18n={i18n} />
              </>
            )}

            {activeTab === TAB_CANDIDATES && (
              <>
                <SectionHeading
                  title={i18n.headingCandidates}
                  tooltipLabel={i18n.tooltipCandidatesLabel}
                  tooltipText={i18n.tooltipCandidatesText}
                />
                <h3 className="sub-heading">{i18n.sectionCandidatesNotFollowback(followBackWindowDays)}</h3>
                <NonReciprocalTable
                  users={visibleStaleNonReciprocal}
                  sortField={nonReciprocalSortField}
                  sortOrder={nonReciprocalSortOrder}
                  onSortTracked={() => handleNonReciprocalSort(NON_RECIPROCAL_SORT_TRACKED)}
                  onSortWaiting={() => handleNonReciprocalSort(NON_RECIPROCAL_SORT_WAITING)}
                  i18n={i18n}
                  locale={locale}
                  showReason
                  showConfidence
                  thresholdDays={followBackWindowDays}
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
                <SectionHeading
                  title={i18n.headingFriends}
                  tooltipLabel={i18n.tooltipFriendsLabel}
                  tooltipText={i18n.tooltipFriendsText}
                />
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
                <SectionHeading
                  title={i18n.headingEvents}
                  tooltipLabel={i18n.tooltipEventsLabel}
                  tooltipText={i18n.tooltipEventsText}
                />
                <EventsFilter value={eventsFilter} onChange={setEventsFilter} filters={i18n.eventFilters} />
                <EventsList
                  events={visibleEvents}
                  i18n={i18n}
                  locale={locale}
                  onOpenBlockDialog={handleOpenBlockDialog}
                />
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
