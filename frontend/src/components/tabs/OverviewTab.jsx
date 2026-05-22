import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { AlertCircle, GitPullRequest, Clock, Tag } from 'lucide-react'

const LANG_COLORS = [
  '#16A34A','#22C55E','#86EFAC','#065F46','#6EE7B7',
  '#D97706','#F59E0B','#FCD34D','#92400E','#FBBF24',
  '#7C3AED','#8B5CF6','#C4B5FD','#4F46E5','#818CF8',
  '#DC2626','#EF4444','#FCA5A5','#991B1B','#F87171',
  '#0891B2','#06B6D4','#67E8F9','#164E63','#22D3EE',
]

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
  if (percent < 0.04) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {percent > 0.08 ? name : `${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

function StatCard({ label, value, sublabel, icon: Icon, accent = false }) {
  return (
    <div className={`card p-4 flex flex-col gap-1 ${accent ? 'border-forest-200 bg-forest-50' : ''}`}>
      {Icon && <Icon size={16} className="text-stone-400 mb-1" />}
      <span className="text-2xl font-bold text-stone-900">{value}</span>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {sublabel && <span className="text-xs text-stone-400">{sublabel}</span>}
    </div>
  )
}

export default function OverviewTab({ data }) {
  const { repo_data, languages, issues, commit_activity } = data

  const langData = Object.entries(languages || {}).map(([name, pct]) => ({ name, value: pct }))

  const totalCommits = (commit_activity || []).reduce((sum, w) => sum + (w?.total || 0), 0)
  const recentCommits = (commit_activity || []).slice(-4).reduce((sum, w) => sum + (w?.total || 0), 0)

  const totalIssues = (issues?.open_issues || 0) + (issues?.closed_issues || 0)
  const resolutionRate = totalIssues > 0 ? Math.round((issues.closed_issues / totalIssues) * 100) : 0

  const repoAge = repo_data.created_at
    ? Math.floor((Date.now() - new Date(repo_data.created_at)) / (1000 * 60 * 60 * 24 * 365 * 10) / 10 * 10)
    : null

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Stars" value={repo_data.stars?.toLocaleString()} sublabel="all time" />
        <StatCard label="Forks" value={repo_data.forks?.toLocaleString()} sublabel="repositories" />
        <StatCard label="Annual Commits" value={totalCommits.toLocaleString()} sublabel="last 52 weeks" />
        <StatCard label="Issue Resolution" value={`${resolutionRate}%`} sublabel={`${totalIssues} total`} accent />
      </div>

      {/* Language breakdown + Issue stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Language pie */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">Language Breakdown</h3>
          {langData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={langData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {langData.map((_, i) => (
                      <Cell key={i} fill={LANG_COLORS[i % LANG_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val}%`, name]}
                    contentStyle={{ background: '#fff', border: '1px solid #EDE8DC', borderRadius: 12, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {langData.slice(0, 8).map((l, i) => (
                  <div key={l.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: LANG_COLORS[i % LANG_COLORS.length] }} />
                    <span className="text-xs text-stone-700 truncate">{l.name}</span>
                    <span className="text-xs text-stone-400 ml-auto">{l.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-stone-400 text-sm">No language data</div>
          )}
        </div>

        {/* Issues panel */}
        <div className="card p-6 space-y-5">
          <h3 className="text-sm font-semibold text-stone-700">Issues & Pull Requests</h3>

          {/* Open vs Closed donut */}
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Open', value: issues?.open_issues || 0 },
                    { name: 'Closed', value: issues?.closed_issues || 1 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={50}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="#EF4444" />
                  <Cell fill="#16A34A" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-sm text-stone-600">Open Issues</span>
                <span className="ml-auto font-bold text-stone-800">{issues?.open_issues?.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-forest-500" />
                <span className="text-sm text-stone-600">Closed</span>
                <span className="ml-auto font-bold text-stone-800">{issues?.closed_issues?.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-sm text-stone-600">Open PRs</span>
                <span className="ml-auto font-bold text-stone-800">{issues?.open_prs?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-warm-200 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-stone-400" />
              <span className="text-xs text-stone-500">Avg. close time</span>
              <span className="ml-auto text-xs font-semibold text-stone-700">
                {issues?.avg_close_hours > 0
                  ? issues.avg_close_hours < 24
                    ? `${issues.avg_close_hours}h`
                    : `${(issues.avg_close_hours / 24).toFixed(1)}d`
                  : 'N/A'}
              </span>
            </div>
            {issues?.labels?.length > 0 && (
              <div>
                <p className="text-xs text-stone-500 mb-2 flex items-center gap-1"><Tag size={12} /> Labels</p>
                <div className="flex flex-wrap gap-1.5">
                  {issues.labels.slice(0, 8).map(l => (
                    <span key={l} className="px-2 py-0.5 bg-warm-100 border border-warm-300 text-stone-600 text-xs rounded-full">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Health breakdown */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-stone-700 mb-4">Health Score Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(data.health.details).map(([key, detail]) => {
            const score = data.health.breakdown[key]
            const max = { readme: 20, activity: 20, license: 10, ci: 15, tests: 15, community: 10, issues: 10 }[key] || 10
            const pct = (score / max) * 100
            const color = pct >= 75 ? '#16A34A' : pct >= 40 ? '#D97706' : '#DC2626'
            return (
              <div key={key} className="bg-warm-50 rounded-xl p-3 border border-warm-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-stone-600 capitalize">{key}</span>
                  <span className="text-xs font-bold" style={{ color }}>{score}/{max}</span>
                </div>
                <div className="h-1.5 bg-warm-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                </div>
                <p className="text-xs text-stone-500 mt-1.5">{detail}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
