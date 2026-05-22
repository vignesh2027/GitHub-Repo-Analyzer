import {
  Star, GitFork, Eye, Scale, Calendar, Tag, Globe, Lock, Archive,
  GitBranch, Package, ExternalLink
} from 'lucide-react'
import HealthGauge from './HealthGauge'

function MetaRow({ icon: Icon, label, value, href }) {
  if (!value && value !== 0) return null
  const content = (
    <div className="flex items-center gap-2.5 py-1.5 group">
      <Icon size={14} className="text-stone-400 flex-shrink-0" />
      <span className="text-xs text-stone-500 min-w-16 flex-shrink-0">{label}</span>
      <span className="text-xs text-stone-800 font-medium truncate">{value}</span>
    </div>
  )
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
         className="hover:text-forest-600 block">
        {content}
      </a>
    )
  }
  return content
}

function StatCard({ icon: Icon, label, value, color = 'text-stone-800' }) {
  return (
    <div className="flex flex-col items-center p-3 bg-warm-50 rounded-xl border border-warm-200">
      <Icon size={15} className="text-stone-400 mb-1" />
      <span className={`text-lg font-bold ${color}`}>{value?.toLocaleString()}</span>
      <span className="text-xs text-stone-500">{label}</span>
    </div>
  )
}

function fmt(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Sidebar({ data }) {
  const { repo_data, health, branches, releases } = data

  return (
    <aside className="w-64 flex-shrink-0 space-y-4 animate-slide-up">
      {/* Repo card */}
      <div className="card p-5">
        <div className="flex items-start gap-3 mb-4">
          <img
            src={repo_data.owner_avatar}
            alt="owner"
            className="w-10 h-10 rounded-xl border border-warm-200"
          />
          <div className="min-w-0">
            <h2 className="font-bold text-stone-900 text-base leading-tight truncate">{repo_data.name}</h2>
            <p className="text-xs text-stone-500 truncate">{repo_data.full_name}</p>
          </div>
        </div>

        {repo_data.description && (
          <p className="text-xs text-stone-600 leading-relaxed mb-4 border-l-2 border-forest-300 pl-2.5">
            {repo_data.description}
          </p>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatCard icon={Star} label="Stars" value={repo_data.stars} color="text-amber-600" />
          <StatCard icon={GitFork} label="Forks" value={repo_data.forks} />
          <StatCard icon={Eye} label="Watch" value={repo_data.watchers} />
        </div>

        {/* Meta rows */}
        <div className="space-y-0.5 border-t border-warm-200 pt-3">
          <MetaRow icon={Scale} label="License" value={repo_data.license} />
          <MetaRow icon={Tag} label="Language" value={repo_data.language} />
          <MetaRow icon={Calendar} label="Created" value={fmt(repo_data.created_at)} />
          <MetaRow icon={Calendar} label="Updated" value={fmt(repo_data.pushed_at)} />
          {repo_data.homepage && (
            <MetaRow icon={Globe} label="Website" value="Visit →" href={repo_data.homepage} />
          )}
          <MetaRow icon={GitBranch} label="Branch" value={repo_data.default_branch} />
          <MetaRow icon={Package} label="Size" value={`${(repo_data.size_kb / 1024).toFixed(1)} MB`} />
          {repo_data.visibility === 'private' && (
            <MetaRow icon={Lock} label="Visibility" value="Private" />
          )}
          {repo_data.archived && (
            <MetaRow icon={Archive} label="Status" value="Archived" />
          )}
        </div>

        {/* Open in GitHub */}
        <a
          href={repo_data.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium
                     hover:bg-stone-800 transition-colors"
        >
          <ExternalLink size={13} />
          Open on GitHub
        </a>
      </div>

      {/* Health Score */}
      <div className="card p-5">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">Health Score</h3>
        <div className="flex justify-center mb-4">
          <HealthGauge score={health.total} grade={health.grade} />
        </div>
        <div className="space-y-2">
          {Object.entries(health.breakdown).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-stone-500 w-16 capitalize flex-shrink-0">{key}</span>
              <div className="flex-1 h-1.5 bg-warm-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-forest-500 rounded-full transition-all duration-700"
                  style={{
                    width: `${(val / getMaxScore(key)) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-stone-700 w-5 text-right">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Topics */}
      {repo_data.topics?.length > 0 && (
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Topics</h3>
          <div className="flex flex-wrap gap-1.5">
            {repo_data.topics.map(topic => (
              <span key={topic} className="px-2.5 py-1 bg-forest-50 border border-forest-200 text-forest-700 text-xs rounded-full font-medium">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Branches */}
      {branches?.length > 0 && (
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Branches</h3>
          <div className="space-y-1">
            {branches.slice(0, 8).map(b => (
              <div key={b} className="flex items-center gap-2 py-0.5">
                <GitBranch size={11} className="text-stone-400" />
                <span className="text-xs text-stone-700 font-mono truncate">
                  {b}
                </span>
                {b === repo_data.default_branch && (
                  <span className="text-xs bg-forest-100 text-forest-700 px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0">default</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Releases */}
      {releases?.length > 0 && (
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Releases</h3>
          <div className="space-y-2">
            {releases.slice(0, 4).map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <Tag size={11} className="text-stone-400 flex-shrink-0" />
                <span className="text-xs text-stone-700 font-medium truncate">{r.name || r.tag}</span>
                {r.prerelease && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0">pre</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

function getMaxScore(key) {
  const maxes = { readme: 20, activity: 20, license: 10, ci: 15, tests: 15, community: 10, issues: 10 }
  return maxes[key] || 10
}
