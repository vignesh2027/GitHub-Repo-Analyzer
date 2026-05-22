import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts'
import { Users, Award, Github } from 'lucide-react'

const COLORS = ['#16A34A','#22C55E','#4ADE80','#86EFAC','#BBF7D0','#65A30D','#84CC16','#A3E635','#BEF264','#D9F99D']

const medals = ['🥇', '🥈', '🥉']

export default function ContributorsTab({ data }) {
  const { contributors } = data

  if (!contributors?.length) {
    return (
      <div className="card p-10 text-center text-stone-400 animate-fade-in">
        <Users size={40} className="mx-auto mb-3 opacity-30" />
        <p>No contributor data available</p>
      </div>
    )
  }

  const chartData = contributors.map(c => ({
    name: c.login,
    commits: c.contributions,
  }))

  const maxCommits = Math.max(...contributors.map(c => c.contributions))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-stone-900">{contributors.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Top Contributors</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-forest-700">{contributors[0]?.contributions?.toLocaleString()}</p>
          <p className="text-xs text-stone-500 mt-0.5">Most Commits</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {Math.round(contributors.reduce((s, c) => s + c.contributions, 0) / contributors.length).toLocaleString()}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">Avg. Commits</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Award size={16} className="text-forest-600" />
          <h3 className="text-sm font-semibold text-stone-700">Commits by Contributor</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE8DC" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#78716C' }}
              angle={-35}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={{ fontSize: 10, fill: '#78716C' }} width={45} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #EDE8DC', borderRadius: 10, fontSize: 12 }}
            />
            <Bar dataKey="commits" radius={[6, 6, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Contributor cards */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users size={16} className="text-forest-600" />
          <h3 className="text-sm font-semibold text-stone-700">Top Contributors</h3>
        </div>
        <div className="space-y-3">
          {contributors.map((c, i) => {
            const pct = (c.contributions / maxCommits) * 100
            return (
              <a
                key={c.login}
                href={c.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-warm-50 transition-colors group"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={c.avatar_url}
                    alt={c.login}
                    className="w-10 h-10 rounded-full border-2 border-warm-200 group-hover:border-forest-300 transition-colors"
                  />
                  {i < 3 && (
                    <span className="absolute -top-1 -right-1 text-sm">{medals[i]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-stone-800">{c.login}</span>
                    <span className="text-xs text-stone-400">#{i + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-warm-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-stone-600 flex-shrink-0">
                      {c.contributions.toLocaleString()} commits
                    </span>
                  </div>
                </div>
                <Github size={14} className="text-stone-300 group-hover:text-forest-500 transition-colors flex-shrink-0" />
              </a>
            )
          })}
        </div>
      </div>

      {/* Contribution share */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-stone-700 mb-4">Contribution Share</h3>
        <div className="flex h-6 rounded-full overflow-hidden border border-warm-200">
          {contributors.map((c, i) => {
            const total = contributors.reduce((s, x) => s + x.contributions, 0)
            const pct = (c.contributions / total) * 100
            if (pct < 1) return null
            return (
              <div
                key={c.login}
                title={`${c.login}: ${pct.toFixed(1)}%`}
                className="h-full transition-all"
                style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
              />
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {contributors.map((c, i) => {
            const total = contributors.reduce((s, x) => s + x.contributions, 0)
            const pct = ((c.contributions / total) * 100).toFixed(1)
            return (
              <div key={c.login} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-stone-600">{c.login}</span>
                <span className="text-xs text-stone-400">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
