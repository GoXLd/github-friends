import fs from 'node:fs/promises'
import path from 'node:path'

const API_BASE = 'https://api.github.com'
const DATA_DIR = path.resolve(process.cwd(), 'public/data')
const SNAPSHOT_DIR = path.join(DATA_DIR, 'snapshots')

const configuredUsername =
  process.env.GH_USERNAME ?? process.env.GITHUB_USERNAME ?? process.env.GITHUB_REPOSITORY_OWNER
const token = process.env.GITHUB_TOKEN
const followBackWindowDays = Number.parseInt(process.env.FOLLOW_BACK_WINDOW_DAYS ?? '7', 10)

const activityRefreshHoursParsed = Number.parseInt(process.env.ACTIVITY_REFRESH_HOURS ?? '24', 10)
const activityRefreshHours = Number.isNaN(activityRefreshHoursParsed)
  ? 24
  : Math.max(1, activityRefreshHoursParsed)

if (!token) {
  throw new Error('GITHUB_TOKEN is required')
}

const now = new Date()
const nowIso = now.toISOString()
const snapshotId = nowIso.replaceAll(':', '-').replaceAll('.', '-')

const latestPath = path.join(DATA_DIR, 'latest.json')
const eventsPath = path.join(DATA_DIR, 'events.json')
const trackerPath = path.join(DATA_DIR, 'follow-tracker.json')
const reportsPath = path.join(DATA_DIR, 'reports.json')
const ignorePath = path.join(DATA_DIR, 'ignore.json')
const activityCachePath = path.join(DATA_DIR, 'activity-cache.json')

await fs.mkdir(SNAPSHOT_DIR, { recursive: true })

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'github-friends-snapshot',
}

const contributionEventTypes = new Set([
  'PushEvent',
  'PullRequestEvent',
  'PullRequestReviewEvent',
  'PullRequestReviewCommentEvent',
  'IssueCommentEvent',
  'IssuesEvent',
  'CommitCommentEvent',
  'CreateEvent',
])

async function resolveUsername() {
  if (configuredUsername) {
    return configuredUsername
  }

  const response = await fetch(`${API_BASE}/user`, { headers })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Unable to resolve username from token (${response.status}): ${body}`)
  }

  const payload = await response.json()

  if (!payload?.login) {
    throw new Error('Unable to resolve username from token: login field is missing')
  }

  return payload.login
}

const username = await resolveUsername()

async function fetchPagedUsers(resource) {
  const users = []
  let page = 1

  while (true) {
    const url = `${API_BASE}/users/${username}/${resource}?per_page=100&page=${page}`
    const response = await fetch(url, { headers })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`GitHub API error (${response.status}) for ${resource} page ${page}: ${body}`)
    }

    const pageUsers = await response.json()

    if (!Array.isArray(pageUsers)) {
      throw new Error(`Unexpected API response for ${resource} page ${page}`)
    }

    users.push(
      ...pageUsers.map((user) => ({
        id: user.id,
        login: user.login,
        htmlUrl: user.html_url,
      })),
    )

    if (pageUsers.length < 100) {
      break
    }

    page += 1
  }

  return users.sort((a, b) => a.login.localeCompare(b.login, 'en', { sensitivity: 'base' }))
}

async function readJson(filePath, fallback) {
  try {
    const text = await fs.readFile(filePath, 'utf8')
    return JSON.parse(text)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallback
    }

    throw error
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function toLookup(users) {
  return new Map(users.map((user) => [user.login.toLowerCase(), user]))
}

function buildDelta(previousUsers = [], currentUsers = []) {
  const previous = toLookup(previousUsers)
  const current = toLookup(currentUsers)

  const added = []
  const removed = []

  for (const [key, user] of current) {
    if (!previous.has(key)) {
      added.push(user)
    }
  }

  for (const [key, user] of previous) {
    if (!current.has(key)) {
      removed.push(user)
    }
  }

  return {
    added: added.sort((a, b) => a.login.localeCompare(b.login, 'en', { sensitivity: 'base' })),
    removed: removed.sort((a, b) => a.login.localeCompare(b.login, 'en', { sensitivity: 'base' })),
  }
}

function toDays(dateString) {
  const timestamp = Date.parse(dateString)

  if (Number.isNaN(timestamp)) {
    return null
  }

  const elapsed = now.getTime() - timestamp
  return Number((elapsed / (24 * 60 * 60 * 1000)).toFixed(2))
}

function normalizeIgnoreLogins(rawIgnore) {
  if (Array.isArray(rawIgnore)) {
    return rawIgnore
  }

  if (rawIgnore && Array.isArray(rawIgnore.logins)) {
    return rawIgnore.logins
  }

  return []
}

function eventId(type, login, happenedAt) {
  return `${type}:${login.toLowerCase()}:${happenedAt}`
}

function isFreshCache(entry, refreshWindowMs) {
  const fetchedAt = entry?.lastFetchedAt

  if (!fetchedAt) {
    return false
  }

  const fetchedTimestamp = Date.parse(fetchedAt)

  if (Number.isNaN(fetchedTimestamp)) {
    return false
  }

  return now.getTime() - fetchedTimestamp < refreshWindowMs
}

async function fetchLatestPublicContribution(login) {
  try {
    const response = await fetch(`${API_BASE}/users/${login}/events/public?per_page=100`, { headers })

    if (!response.ok) {
      return null
    }

    const payload = await response.json()

    if (!Array.isArray(payload) || payload.length === 0) {
      return {
        lastContributionAt: null,
        lastContributionType: null,
      }
    }

    const contributionEvent = payload.find((event) => contributionEventTypes.has(event.type))

    if (!contributionEvent) {
      return {
        lastContributionAt: null,
        lastContributionType: null,
      }
    }

    return {
      lastContributionAt: contributionEvent.created_at ?? null,
      lastContributionType: contributionEvent.type ?? null,
    }
  } catch {
    return null
  }
}

async function resolveDisappearedAccountStatuses(users) {
  if (!users.length) {
    return new Map()
  }

  const checks = await mapWithConcurrency(users, 6, async (user) => {
    const login = user.login
    const key = login.toLowerCase()

    try {
      const response = await fetch(`${API_BASE}/users/${encodeURIComponent(login)}`, { headers })

      if (response.status === 404) {
        return [key, 'deleted']
      }

      if (response.ok) {
        return [key, 'active']
      }

      return [key, 'unknown']
    } catch {
      return [key, 'unknown']
    }
  })

  return new Map(checks)
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (true) {
      const index = cursor
      cursor += 1

      if (index >= items.length) {
        return
      }

      results[index] = await mapper(items[index], index)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)

  return results
}

const [followers, following, previousLatest, previousEvents, previousTracker, rawIgnore, previousActivityCache] =
  await Promise.all([
    fetchPagedUsers('followers'),
    fetchPagedUsers('following'),
    readJson(latestPath, null),
    readJson(eventsPath, []),
    readJson(trackerPath, { updatedAt: null, users: {} }),
    readJson(ignorePath, { logins: [] }),
    readJson(activityCachePath, { updatedAt: null, users: {} }),
  ])

const followerLookup = toLookup(followers)
const followingLookup = toLookup(following)
const latestSnapshot = {
  snapshotId,
  generatedAt: nowIso,
  username,
  followers,
  following,
  counts: {
    followers: followers.length,
    following: following.length,
  },
}

const followerDelta = buildDelta(previousLatest?.followers, followers)
const followingDelta = buildDelta(previousLatest?.following, following)

const removedFollowingLogins = new Set(followingDelta.removed.map((user) => user.login.toLowerCase()))
const removedFromBothSides = followerDelta.removed.filter((user) => removedFollowingLogins.has(user.login.toLowerCase()))
const disappearedAccountStatuses = await resolveDisappearedAccountStatuses(removedFromBothSides)

const newEvents = [
  ...followerDelta.added.map((user) => ({
    id: eventId('follower_gained', user.login, nowIso),
    type: 'follower_gained',
    login: user.login,
    htmlUrl: user.htmlUrl,
    happenedAt: nowIso,
  })),
  ...followerDelta.removed.map((user) => ({
    id: eventId('follower_lost', user.login, nowIso),
    type: 'follower_lost',
    login: user.login,
    htmlUrl: user.htmlUrl,
    happenedAt: nowIso,
    accountStatus: disappearedAccountStatuses.get(user.login.toLowerCase()) ?? null,
    isDeleted: disappearedAccountStatuses.get(user.login.toLowerCase()) === 'deleted',
  })),
  ...followingDelta.added.map((user) => ({
    id: eventId('you_followed', user.login, nowIso),
    type: 'you_followed',
    login: user.login,
    htmlUrl: user.htmlUrl,
    happenedAt: nowIso,
  })),
  ...followingDelta.removed.map((user) => ({
    id: eventId('you_unfollowed', user.login, nowIso),
    type: 'you_unfollowed',
    login: user.login,
    htmlUrl: user.htmlUrl,
    happenedAt: nowIso,
    accountStatus: disappearedAccountStatuses.get(user.login.toLowerCase()) ?? null,
    isDeleted: disappearedAccountStatuses.get(user.login.toLowerCase()) === 'deleted',
  })),
]

const uniqueEvents = new Map()

for (const event of [...newEvents, ...(Array.isArray(previousEvents) ? previousEvents : [])]) {
  uniqueEvents.set(event.id, event)
}

const events = [...uniqueEvents.values()].sort((a, b) => b.happenedAt.localeCompare(a.happenedAt))

const tracker = previousTracker && typeof previousTracker === 'object' && previousTracker.users
  ? previousTracker
  : { updatedAt: null, users: {} }

for (const entry of Object.values(tracker.users)) {
  entry.isFollowingNow = false
  entry.isFollowerNow = false
  entry.lastCheckedAt = nowIso
}

for (const user of following) {
  const key = user.login.toLowerCase()
  const existing = tracker.users[key] ?? {
    login: user.login,
    githubId: user.id,
    htmlUrl: user.htmlUrl,
    firstSeenFollowingAt: nowIso,
    followedBackAt: null,
    firstSeenNonReciprocalAt: nowIso,
  }

  const followsBack = followerLookup.has(key)

  existing.login = user.login
  existing.githubId = user.id
  existing.htmlUrl = user.htmlUrl
  existing.isFollowingNow = true
  existing.isFollowerNow = followsBack
  existing.lastSeenFollowingAt = nowIso
  existing.lastCheckedAt = nowIso

  if (followsBack && !existing.followedBackAt) {
    existing.followedBackAt = nowIso
  }

  if (followsBack) {
    existing.firstSeenNonReciprocalAt = null
  } else if (!existing.firstSeenNonReciprocalAt) {
    existing.firstSeenNonReciprocalAt = nowIso
  }

  tracker.users[key] = existing
}

for (const [key, entry] of Object.entries(tracker.users)) {
  if (!entry.isFollowingNow) {
    const stillFollower = followerLookup.has(key)
    entry.isFollowerNow = stillFollower
    entry.lastCheckedAt = nowIso
  }
}

tracker.updatedAt = nowIso

const ignoreLogins = normalizeIgnoreLogins(rawIgnore)
const ignoredSet = new Set(ignoreLogins.map((login) => String(login).toLowerCase()))

const nonReciprocalNow = Object.values(tracker.users)
  .filter((entry) => entry.isFollowingNow && !entry.isFollowerNow)
  .map((entry) => {
    const from = entry.firstSeenNonReciprocalAt ?? entry.firstSeenFollowingAt
    const daysWaiting = toDays(from)

    return {
      login: entry.login,
      htmlUrl: entry.htmlUrl,
      firstSeenFollowingAt: entry.firstSeenFollowingAt,
      firstSeenNonReciprocalAt: entry.firstSeenNonReciprocalAt,
      daysWaiting,
      ignored: ignoredSet.has(entry.login.toLowerCase()),
    }
  })
  .sort((a, b) => (b.daysWaiting ?? 0) - (a.daysWaiting ?? 0))

const staleCandidates = nonReciprocalNow.filter(
  (entry) => !entry.ignored && (entry.daysWaiting ?? 0) >= followBackWindowDays,
)

const followersNotFollowingNow = followers
  .filter((user) => !followingLookup.has(user.login.toLowerCase()))
  .map((user) => ({
    login: user.login,
    htmlUrl: user.htmlUrl,
    githubId: user.id,
  }))
  .sort((a, b) => a.login.localeCompare(b.login, 'en', { sensitivity: 'base' }))

const activityCache = previousActivityCache && typeof previousActivityCache === 'object' && previousActivityCache.users
  ? previousActivityCache
  : { updatedAt: null, users: {} }

const refreshWindowMs = activityRefreshHours * 60 * 60 * 1000

const mutualFollowersBase = followers.filter((user) => followingLookup.has(user.login.toLowerCase()))

const mutualFollowersNow = await mapWithConcurrency(mutualFollowersBase, 8, async (user) => {
  const key = user.login.toLowerCase()
  const cached = activityCache.users?.[key]

  let lastContributionAt = cached?.lastContributionAt ?? null
  let lastContributionType = cached?.lastContributionType ?? null

  if (!isFreshCache(cached, refreshWindowMs)) {
    const fetched = await fetchLatestPublicContribution(user.login)

    if (fetched) {
      lastContributionAt = fetched.lastContributionAt
      lastContributionType = fetched.lastContributionType
    }
  }

  activityCache.users[key] = {
    login: user.login,
    htmlUrl: user.htmlUrl,
    githubId: user.id,
    lastContributionAt,
    lastContributionType,
    lastFetchedAt: nowIso,
  }

  return {
    login: user.login,
    htmlUrl: user.htmlUrl,
    githubId: user.id,
    lastContributionAt,
    lastContributionType,
    daysSinceLastContribution: toDays(lastContributionAt),
  }
})

mutualFollowersNow.sort((a, b) => {
  const aTs = Date.parse(a.lastContributionAt ?? '')
  const bTs = Date.parse(b.lastContributionAt ?? '')

  const aSafe = Number.isNaN(aTs) ? -1 : aTs
  const bSafe = Number.isNaN(bTs) ? -1 : bTs

  if (aSafe !== bSafe) {
    return bSafe - aSafe
  }

  return a.login.localeCompare(b.login, 'en', { sensitivity: 'base' })
})

activityCache.updatedAt = nowIso

const reports = {
  generatedAt: nowIso,
  username,
  followBackWindowDays,
  counts: {
    followers: followers.length,
    following: following.length,
    followerGainedSinceLast: followerDelta.added.length,
    followerLostSinceLast: followerDelta.removed.length,
    followingAddedSinceLast: followingDelta.added.length,
    followingRemovedSinceLast: followingDelta.removed.length,
    nonReciprocalNow: nonReciprocalNow.length,
    followersNotFollowingNow: followersNotFollowingNow.length,
    mutualFollowersNow: mutualFollowersNow.length,
    deletedAccountsSinceLast: [...disappearedAccountStatuses.values()].filter((status) => status === 'deleted').length,
    staleCandidates: staleCandidates.length,
    ignored: ignoreLogins.length,
  },
  staleCandidates,
  nonReciprocalNow,
  followersNotFollowingNow,
  mutualFollowersNow,
  recentFollowerLosses: events.filter((event) => event.type === 'follower_lost').slice(0, 50),
}

await Promise.all([
  writeJson(path.join(SNAPSHOT_DIR, `${snapshotId}.json`), latestSnapshot),
  writeJson(latestPath, latestSnapshot),
  writeJson(eventsPath, events),
  writeJson(trackerPath, tracker),
  writeJson(reportsPath, reports),
  writeJson(ignorePath, { logins: ignoreLogins }),
  writeJson(activityCachePath, activityCache),
])

const summary = {
  generatedAt: nowIso,
  followers: followers.length,
  following: following.length,
  mutualFollowers: mutualFollowersNow.length,
  newEvents: newEvents.length,
  staleCandidates: staleCandidates.length,
}

console.log(JSON.stringify(summary, null, 2))
