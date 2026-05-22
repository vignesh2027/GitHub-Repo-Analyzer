import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar
} from 'recharts'
import { Calendar, TrendingUp, Flame } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getWeekDate(weeksAgo) {
  const d = new Date()
  d.setDate(d.getDate() - weeksAgo * 7)
  return d
}

function CommitHeatmap({ commitActivity }) {
  if (!commitActivity?.length) {
    return <div className="h-32 flex items-center justify-center text-stone-400 text-sm">No activity data</div>
  }

  // commitActivity = array of 52 week objects {week, total, days}
  const weeks = commitActivity.slice(-52)
  const maxCommits = Math.max(...weeks.map(w => w.total || 0), 1)

  function getCellColor(count) {
    if (!count) return '#EDE8DC'
    const intensity = count / maxCommits
    if (intensity < 0.2) return '#DCFCE7'
    if (intensity < 0.4) return '#86EFAC'
    if (intensity < 0.6) return '#4ADE80'
    if (intensity < 0.8) return '#22C55E'
    return '#16A34A'
  }

  // Group by months for labels
  const monthLabels = []
  weeks.forEach((w, i) => {
    const d = w.week ? new Date(w.week * 1000) : getWeekDate(52 - i)
    const month = d.getMonth()
    if (i === 0 || new Date((weeks[i-1]?.week || 0) * 1000).getMonth() !== month) {
      monthLabels.push({ idx: i, label: MONTHS[month] })
    }
  })

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ minWidth: 700 }}>
        {/* Month labels */}
        <div className="flex gap-1 mb-1 ml-4" style={{ paddingLeft: 2 }}>
          {weeks.map((_, i) => {
            const ml = monthLabels.find(m => m.idx === i)
            return (
              <div key={i} className="flex-shrink-0" style={{ width: 14 }}>
                {ml && <span className="text-xs text-stone-400">{ml.label}</span>}
              </div>
            )
          })}
        </div>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
              <div key={i} className="text-xs text-stone-400 leading-3" style={{ height: 14 }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          {weeks.map((week, wi) => {
            const days = week.days || Array(7).fill(0)
            return (
              <div key={wi} className="flex flex-col gap-1 flex-shrink-0">
                {days.map((count, di) => (
                  <div
                    key={di}
                    className="heatmap-cell"
                    style={{
                      width: 14,
                      height: 14,
                      background: getCellColor(count),
                      borderRadius: 3,
                    }}
                    title={`${count} commits`}
                  />
                ))}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-xs text-stone-400">Less</span>
          {['#EDE8DC', '#DCFCE7', '#86EFAC', '#22C55E', '#16A34A'].map(c => (
            <div key={c} className="w-3 h-3 rounded-sm" style={{ background: c }} />
          ))}
          <span className="text-xs text-stone-400">More</span>
        </div>
      </div>
    </div>
  )
}

export default function ActivityTab({ data }) {
  const { commit_activity } = data

  // Build area chart data (last 26 weeks)
  const areaData = (commit_activity || []).slice(-26).map((w, i) => {
    const d = w?.week ? new Date(w.week * 1000) : getWeekDate(26 - i)
    return {
      week: `${MONTHS[d.getMonth()]} ${d.getDate()}`,
      commits: w?.total || 0,
    }
  })

  // Monthly aggregation for bar chart
  const monthlyMap = {}
  ;(commit_activity || []).forEach(w => {
    if (!w?.week) return
    const d = new Date(w.week * 1000)
    const key = `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`
    monthlyMap[key] = (monthlyMap[key] || 0) + (w.total || 0)
  })
  const monthlyData = Object.entries(monthlyMap).map(([month, commits]) => ({ month, commits }))

  const totalCommits = (commit_activity || []).reduce((s, w) => s + (w?.total || 0), 0)
  const maxWeek = Math.max(...(commit_activity || []).map(w => w?.total || 0))
  const activeWeeks = (commit_activity || []).filter(w => (w?.total || 0) > 0).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-stone-900">{totalCommits.toLocaleString()}</p>
          <p className="text-xs text-stone-500 mt-0.5">Total Commits (52w)</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-forest-700">{activeWeeks}</p>
          <p className="text-xs text-stone-500 mt-0.5">Active Weeks</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{maxWeek}</p>
          <p className="text-xs text-stone-500 mt-0.5">Peak Week</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Calendar size={16} className="text-forest-600" />
          <h3 className="text-sm font-semibold text-stone-700">Commit Activity Heatmap (52 weeks)</h3>
        </div>
        <CommitHeatmap commitActivity={commit_activity} />
      </div>

      {/* Area chart */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={16} className="text-forest-600" />
          <h3 className="text-sm font-semibold text-stone-700">Commit Frequency (Last 26 Weeks)</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={areaData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE8DC" />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#78716C' }} interval={3} />
            <YAxis tick={{ fontSize: 10, fill: '#78716C' }} width={30} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #EDE8DC', borderRadius: 10, fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="commits"
              stroke="#16A34A"
              strokeWidth={2.5}
              fill="url(#commitGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#15803D' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly bar chart */}
      {monthlyData.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Flame size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-stone-700">Monthly Commit Volume</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE8DC" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#78716C' }} />
              <YAxis tick={{ fontSize: 10, fill: '#78716C' }} width={35} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #EDE8DC', borderRadius: 10, fontSize: 12 }}
              />
              <Bar dataKey="commits" fill="#16A34A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
