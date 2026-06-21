// Fully client-side GitHub repo analyzer.
// Talks directly to https://api.github.com from the browser — no backend required,
// so the GitHub Pages deployment keeps working indefinitely.
//
// Works with ZERO token (GitHub allows 60 unauthenticated requests/hour, plenty for
// a handful of repo lookups). Users may optionally paste their own personal access
// token in the UI to raise the limit to 5000/hour. We never hardcode a token here:
// GitHub auto-revokes any token committed to a public repo, so a baked-in key would
// stop working within minutes and expose the account.

import axios from 'axios'

const GH = 'https://api.github.com'

function buildHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function parseRepoUrl(raw) {
  const url = (raw || '').trim().replace(/\/+$/, '')
  // Supports https://github.com/owner/repo, github.com/owner/repo, or owner/repo
  const m = url.match(/^(?:https?:\/\/github\.com\/)?([^/]+)\/([^/]+?)(?:\.git)?$/)
  if (!m) throw new Error(`Invalid GitHub URL: ${raw}`)
  return { owner: m[1], repo: m[2] }
}

// --- low level GET with friendly error mapping ---------------------------------
async function ghGet(client, path, params) {
  const url = path.startsWith('http') ? path : `${GH}${path}`
  try {
    const resp = await client.get(url, { params, headers: client.__ghHeaders })
    return { data: resp.data, headers: resp.headers, status: resp.status }
  } catch (e) {
    const status = e?.response?.status
    if (status === 404)
      throw new Error('Repository not found (404). Check the URL (owner/repo) — it must be a public repo.')
    if (status === 403)
      throw new Error(
        'Rate limit exceeded (403). GitHub allows 60 requests/hour without a token. ' +
          'Add a personal access token below to raise the limit to 5000/hour, or try again in a bit.'
      )
    if (status === 401) throw new Error('Unauthorized (401). The GitHub token you entered is invalid.')
    throw new Error(e?.message || 'Request to GitHub failed')
  }
}

// soft GET — returns fallback instead of throwing (for optional/secondary data)
async function ghGetSoft(client, path, params, fallback) {
  try {
    const { data } = await ghGet(client, path, params)
    return data
  } catch {
    return fallback
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// GitHub /stats/* endpoints return 202 (empty) while computing on first request,
// then 200 once ready. Retry a couple of times before giving up.
async function ghGetStats(client, path, fallback) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await client.get(`${GH}${path}`, { headers: client.__ghHeaders })
      if (resp.status === 202 || resp.data == null || (Array.isArray(resp.data) && resp.data.length === 0)) {
        await sleep(1200)
        continue
      }
      return resp.data
    } catch {
      return fallback
    }
  }
  return fallback
}

// Fetch the repo file tree. The recursive tree (?recursive=1) gives nested paths
// but GitHub returns 504 for some repos while building it, so fall back to the
// non-recursive root tree, which is enough for the dashboard's top-level view.
async function getFileTreePaths(client, owner, repo, branch) {
  const recursive = await ghGetSoft(client, `/repos/${owner}/${repo}/git/trees/${branch}`, { recursive: '1' }, null)
  const source = recursive?.tree?.length
    ? recursive
    : await ghGetSoft(client, `/repos/${owner}/${repo}/git/trees/${branch}`, undefined, { tree: [] })
  return (source.tree || [])
    .filter((t) => (t.path.match(/\//g) || []).length < 2)
    .map((t) => ({ path: t.path, type: t.type, size: t.size || 0 }))
    .slice(0, 300)
}

function b64decode(content) {
  try {
    // GitHub base64 content can contain newlines
    const clean = (content || '').replace(/\n/g, '')
    const bin = atob(clean)
    // decode as UTF-8
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return new TextDecoder('utf-8').decode(bytes)
  } catch {
    return ''
  }
}

// --- dependency parsing (ported from backend/analyzer.py) ----------------------
const DEPENDENCY_FILES = {
  'package.json': 'nodejs',
  'requirements.txt': 'python',
  Pipfile: 'python',
  'pyproject.toml': 'python',
  'Cargo.toml': 'rust',
  'go.mod': 'go',
  'pom.xml': 'java',
  'build.gradle': 'java',
  'composer.json': 'php',
  Gemfile: 'ruby',
  'Package.swift': 'swift',
  'pubspec.yaml': 'dart',
  'mix.exs': 'elixir',
}

const CI_FILES = [
  '.github/workflows',
  '.travis.yml',
  'circle.yml',
  '.circleci',
  'Jenkinsfile',
  '.gitlab-ci.yml',
  'azure-pipelines.yml',
  '.buildkite',
]

const TEST_PATTERNS = [
  'test',
  'tests',
  'spec',
  'specs',
  '__tests__',
  '_test.go',
  '_test.py',
  '.test.js',
  '.spec.js',
  '.test.ts',
  '.spec.ts',
]

function detectDependencies(content, fileType) {
  const deps = []
  if (!content) return deps

  if (fileType === 'nodejs') {
    try {
      const data = JSON.parse(content)
      for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
        const obj = data[section] || {}
        for (const [name, version] of Object.entries(obj)) {
          deps.push({ name, version: String(version), type: section })
        }
      }
    } catch {
      /* ignore */
    }
  } else if (fileType === 'python') {
    for (let line of content.split('\n')) {
      line = line.trim()
      if (!line || line.startsWith('#') || line.startsWith('-')) continue
      const m = line.match(/^([A-Za-z0-9_\-.]+)\s*([><=!~^].+)?$/)
      if (m) deps.push({ name: m[1], version: (m[2] || '').trim(), type: 'dependency' })
    }
  } else if (fileType === 'rust') {
    let inDeps = false
    for (const line of content.split('\n')) {
      if (/^\[.*dependencies.*\]/.test(line)) {
        inDeps = true
        continue
      }
      if (line.startsWith('[') && !line.includes('dependencies')) inDeps = false
      if (inDeps) {
        let m = line.match(/^([a-z_\-]+)\s*=\s*"([^"]+)"/)
        if (m) deps.push({ name: m[1], version: m[2], type: 'dependency' })
        m = line.match(/^([a-z_\-]+)\s*=\s*\{.*version\s*=\s*"([^"]+)"/)
        if (m) deps.push({ name: m[1], version: m[2], type: 'dependency' })
      }
    }
  } else if (fileType === 'go') {
    for (const line of content.split('\n')) {
      const m = line.match(/^\s+([a-zA-Z0-9_/.\-]+)\s+(v[0-9][^\s]+)/)
      if (m) deps.push({ name: m[1], version: m[2], type: 'dependency' })
    }
  }
  return deps.slice(0, 100)
}

// --- health score (ported from backend/analyzer.py) ----------------------------
function computeHealthScore({
  repoData,
  hasReadme,
  readmeLength,
  hasLicense,
  hasCi,
  hasTests,
  commitActivity,
  openIssues,
  closedIssues,
}) {
  const scores = {}
  const details = {}

  if (hasReadme && readmeLength > 2000) {
    scores.readme = 20
    details.readme = 'Excellent README'
  } else if (hasReadme && readmeLength > 500) {
    scores.readme = 14
    details.readme = 'Good README'
  } else if (hasReadme) {
    scores.readme = 7
    details.readme = 'Short README'
  } else {
    scores.readme = 0
    details.readme = 'No README'
  }

  scores.license = hasLicense ? 10 : 0
  details.license = hasLicense ? 'Has license' : 'No license'

  scores.ci = hasCi ? 15 : 0
  details.ci = hasCi ? 'CI/CD configured' : 'No CI/CD'

  scores.tests = hasTests ? 15 : 0
  details.tests = hasTests ? 'Tests present' : 'No tests detected'

  const recentWeeks = (commitActivity || []).slice(-12)
  const activeWeeks = recentWeeks.filter((w) => (w && typeof w === 'object' ? w.total || 0 : 0) > 0).length
  if (activeWeeks >= 10) {
    scores.activity = 20
    details.activity = 'Very active'
  } else if (activeWeeks >= 6) {
    scores.activity = 14
    details.activity = 'Moderately active'
  } else if (activeWeeks >= 2) {
    scores.activity = 8
    details.activity = 'Low activity'
  } else {
    scores.activity = 2
    details.activity = 'Inactive'
  }

  const stars = repoData.stargazers_count || 0
  if (stars >= 1000) {
    scores.community = 10
    details.community = 'Popular project'
  } else if (stars >= 100) {
    scores.community = 7
    details.community = 'Growing community'
  } else if (stars >= 10) {
    scores.community = 4
    details.community = 'Small community'
  } else {
    scores.community = 1
    details.community = 'Just starting'
  }

  const totalIssues = openIssues + closedIssues
  if (totalIssues > 0) {
    const rate = closedIssues / totalIssues
    if (rate >= 0.8) {
      scores.issues = 10
      details.issues = 'Excellent issue resolution'
    } else if (rate >= 0.5) {
      scores.issues = 6
      details.issues = 'Good issue resolution'
    } else {
      scores.issues = 3
      details.issues = 'Many open issues'
    }
  } else {
    scores.issues = 5
    details.issues = 'No issues tracked'
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  return {
    total: Math.min(100, total),
    breakdown: scores,
    details,
    grade: total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : 'D',
  }
}

// --- file tree (ported from backend/analyzer.py) -------------------------------
function buildFileTree(flatPaths) {
  const root = []
  const getOrCreate = (list, name, isDir) => {
    for (const n of list) if (n.name === name) return n
    const node = { name, type: isDir ? 'tree' : 'blob', children: isDir ? [] : null }
    list.push(node)
    return node
  }
  for (const item of flatPaths) {
    const parts = item.path.split('/')
    let current = root
    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1
      const isDir = !isLast || item.type === 'tree'
      const node = getOrCreate(current, part, isDir)
      if (!isLast && node.children) current = node.children
    })
  }
  const sortTree = (nodes) => {
    const dirs = nodes.filter((n) => n.type === 'tree').sort((a, b) => a.name.localeCompare(b.name))
    const files = nodes.filter((n) => n.type !== 'tree').sort((a, b) => a.name.localeCompare(b.name))
    for (const d of dirs) if (d.children) d.children = sortTree(d.children)
    return [...dirs, ...files]
  }
  return sortTree(root)
}

// --- issues stats (ported from backend/github_client.py) -----------------------
function linkCount(resp) {
  const link = resp.headers?.link || resp.headers?.Link || ''
  if (link.includes('rel="last"')) {
    const m = link.match(/[?&]page=(\d+)>;\s*rel="last"/)
    if (m) return parseInt(m[1], 10)
  }
  return Array.isArray(resp.data) ? resp.data.length : 0
}

async function getIssuesStats(client, owner, repo) {
  const headers = client.__ghHeaders
  const safe = (p) =>
    client.get(`${GH}/repos/${owner}/${repo}/${p}`, { headers }).catch(() => ({ data: [], headers: {}, status: 0 }))

  const [openResp, closedResp, prsOpen, labelsResp] = await Promise.all([
    client.get(`${GH}/repos/${owner}/${repo}/issues`, { headers, params: { state: 'open', per_page: 1 } }).catch(() => ({ data: [], headers: {} })),
    client.get(`${GH}/repos/${owner}/${repo}/issues`, { headers, params: { state: 'closed', per_page: 30 } }).catch(() => ({ data: [], headers: {} })),
    client.get(`${GH}/repos/${owner}/${repo}/pulls`, { headers, params: { state: 'open', per_page: 1 } }).catch(() => ({ data: [], headers: {} })),
    safe('labels'),
  ])

  const openCount = linkCount(openResp)
  const closedIssues = Array.isArray(closedResp.data) ? closedResp.data : []
  const closedCount = linkCount(closedResp)

  const closeTimes = []
  for (const issue of closedIssues) {
    if (issue.pull_request) continue
    if (issue.closed_at && issue.created_at) {
      const created = new Date(issue.created_at).getTime()
      const closed = new Date(issue.closed_at).getTime()
      closeTimes.push((closed - created) / 3600000)
    }
  }
  const avgCloseHours = closeTimes.length ? closeTimes.reduce((a, b) => a + b, 0) / closeTimes.length : 0

  const labels = Array.isArray(labelsResp.data) ? labelsResp.data : []
  return {
    open_issues: openCount,
    closed_issues: closedCount,
    open_prs: linkCount(prsOpen),
    avg_close_hours: Math.round(avgCloseHours * 10) / 10,
    labels: labels.slice(0, 10).map((l) => l.name || ''),
  }
}

// --- main entry point ----------------------------------------------------------
export async function analyzeRepo(url, token = '') {
  const { owner, repo } = parseRepoUrl(url)
  const client = axios.create({ timeout: 30000 })
  client.__ghHeaders = buildHeaders(token)

  // Core repo data first (this surfaces 404/403/401 with a clear message)
  const { data: repoData } = await ghGet(client, `/repos/${owner}/${repo}`)

  const defaultBranch = repoData.default_branch || 'HEAD'

  const [languages, contributors, commitActivity, topicsData, branches, releases] = await Promise.all([
    ghGetSoft(client, `/repos/${owner}/${repo}/languages`, undefined, {}),
    ghGetSoft(client, `/repos/${owner}/${repo}/contributors`, { per_page: 10, anon: 'false' }, []),
    ghGetStats(client, `/repos/${owner}/${repo}/stats/commit_activity`, []),
    ghGetSoft(client, `/repos/${owner}/${repo}/topics`, undefined, { names: [] }),
    ghGetSoft(client, `/repos/${owner}/${repo}/branches`, { per_page: 10 }, []),
    ghGetSoft(client, `/repos/${owner}/${repo}/releases`, { per_page: 5 }, []),
  ])
  const topics = topicsData?.names || []

  // tree + readme + issues
  const treeData = await getFileTreePaths(client, owner, repo, defaultBranch)

  const readmeData = await ghGetSoft(client, `/repos/${owner}/${repo}/readme`, undefined, null)
  const readmeRaw = readmeData?.content ? b64decode(readmeData.content) : ''

  const issuesStats = await getIssuesStats(client, owner, repo)

  const fileTree = buildFileTree(treeData)

  // dependency files present in tree
  const pathsSet = new Set(treeData.map((t) => t.path))
  const depFilesInRepo = {}
  for (const [depFile, lang] of Object.entries(DEPENDENCY_FILES)) {
    if (pathsSet.has(depFile)) depFilesInRepo[depFile] = lang
  }

  const depEntries = await Promise.all(
    Object.keys(depFilesInRepo).map(async (fname) => {
      const data = await ghGetSoft(client, `/repos/${owner}/${repo}/contents/${fname}`, undefined, null)
      const content = data && !Array.isArray(data) && data.content ? b64decode(data.content) : ''
      return { fname, content }
    })
  )

  const allDeps = depEntries.map(({ fname, content }) => {
    const lang = depFilesInRepo[fname]
    return { file: fname, language: lang, packages: detectDependencies(content, lang) }
  })

  // health inputs
  const flatPaths = treeData.map((t) => t.path)
  const hasCi = flatPaths.some((p) => CI_FILES.some((ci) => p.includes(ci)))
  const hasTests = flatPaths.some((p) => TEST_PATTERNS.some((tp) => p.toLowerCase().includes(tp)))
  const hasLicense = !!repoData.license
  const hasReadme = !!readmeRaw

  const health = computeHealthScore({
    repoData,
    hasReadme,
    readmeLength: readmeRaw.length,
    hasLicense,
    hasCi,
    hasTests,
    commitActivity: commitActivity || [],
    openIssues: issuesStats.open_issues || 0,
    closedIssues: issuesStats.closed_issues || 0,
  })

  const contributorsClean = (Array.isArray(contributors) ? contributors : [])
    .filter((c) => c && typeof c === 'object')
    .map((c) => ({
      login: c.login || '',
      avatar_url: c.avatar_url || '',
      html_url: c.html_url || '',
      contributions: c.contributions || 0,
    }))

  const langTotal = languages && Object.keys(languages).length ? Object.values(languages).reduce((a, b) => a + b, 0) : 1
  const languagesPct = {}
  Object.entries(languages || {})
    .sort((a, b) => b[1] - a[1])
    .forEach(([lang, count]) => {
      languagesPct[lang] = Math.round((count / langTotal) * 10000) / 100
    })

  return {
    owner,
    repo,
    repo_data: {
      name: repoData.name,
      full_name: repoData.full_name,
      description: repoData.description,
      html_url: repoData.html_url,
      homepage: repoData.homepage,
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      watchers: repoData.watchers_count || 0,
      open_issues: repoData.open_issues_count || 0,
      default_branch: repoData.default_branch || 'main',
      created_at: repoData.created_at,
      updated_at: repoData.updated_at,
      pushed_at: repoData.pushed_at,
      size_kb: repoData.size || 0,
      license: repoData.license ? repoData.license.spdx_id : null,
      language: repoData.language,
      visibility: repoData.visibility || 'public',
      archived: repoData.archived || false,
      fork: repoData.fork || false,
      has_issues: repoData.has_issues ?? true,
      has_wiki: repoData.has_wiki || false,
      has_pages: repoData.has_pages || false,
      topics,
      owner_avatar: repoData.owner?.avatar_url || '',
    },
    languages: languagesPct,
    raw_languages: languages || {},
    contributors: contributorsClean,
    commit_activity: commitActivity || [],
    issues: issuesStats,
    file_tree: fileTree,
    dependencies: allDeps,
    readme: readmeRaw,
    health,
    branches: (Array.isArray(branches) ? branches : []).filter((b) => b && typeof b === 'object').map((b) => b.name),
    releases: (Array.isArray(releases) ? releases : [])
      .filter((r) => r && typeof r === 'object')
      .map((r) => ({
        name: r.name || r.tag_name,
        tag: r.tag_name,
        published_at: r.published_at,
        prerelease: r.prerelease || false,
      })),
  }
}
