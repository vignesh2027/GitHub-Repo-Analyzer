import { useState } from 'react'
import { Search, Github, Zap, BarChart2, GitBranch, Shield, Eye, ChevronRight, Sparkles } from 'lucide-react'

const FEATURED = [
  'https://github.com/facebook/react',
  'https://github.com/microsoft/vscode',
  'https://github.com/vercel/next.js',
  'https://github.com/tensorflow/tensorflow',
  'https://github.com/torvalds/linux',
]

const FEATURES = [
  { icon: BarChart2, title: 'Language Breakdown', desc: 'Visual pie chart of every language used' },
  { icon: GitBranch, title: 'Commit Heatmap', desc: 'GitHub-style 52-week activity grid' },
  { icon: Shield, title: 'Health Score', desc: '10-point repo quality assessment' },
  { icon: Eye, title: 'Dependency Graph', desc: 'Auto-detect packages across all ecosystems' },
  { icon: Zap, title: 'Contributor Stats', desc: 'Top 10 devs by commit count' },
  { icon: Sparkles, title: 'Smart README', desc: 'Beautifully rendered documentation' },
]

export default function SearchPage({ onAnalyze, loading, error }) {
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!url.trim()) return
    onAnalyze(url.trim(), token.trim())
  }

  const useFeatured = (repo) => {
    setUrl(repo)
    onAnalyze(repo, token.trim())
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-warm-200 bg-warm-50/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center">
              <Github className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <span className="font-bold text-stone-900 text-lg tracking-tight">RepoLens</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <div className="w-2 h-2 rounded-full bg-forest-500 animate-pulse-slow" />
            Powered by GitHub API
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-2xl text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-forest-50 border border-forest-200 text-forest-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Sparkles size={14} />
            GitHub Repository Intelligence
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-stone-900 leading-tight mb-4">
            Understand any{' '}
            <span className="gradient-text">GitHub repo</span>
            <br />in seconds
          </h1>
          <p className="text-lg text-stone-500 mb-10 max-w-lg mx-auto">
            Paste a repo URL and get an instant visual breakdown — health score, commit history,
            language stats, contributors, dependencies, and more.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div className="relative group">
              <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-forest-600 transition-colors" size={20} />
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                className="w-full pl-11 pr-4 py-4 text-base bg-white border-2 border-warm-300 rounded-2xl
                           focus:outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-100
                           placeholder-stone-400 text-stone-900 transition-all duration-200 shadow-sm"
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Token toggle */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="text-sm text-stone-500 hover:text-forest-600 transition-colors flex items-center gap-1"
              >
                <Shield size={13} />
                {showToken ? 'Hide' : 'Add'} GitHub Token (optional, for private repos)
              </button>
            </div>
            {showToken && (
              <input
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="ghp_xxxx (optional — increases rate limits)"
                className="w-full px-4 py-3 text-sm bg-white border border-warm-300 rounded-xl
                           focus:outline-none focus:border-forest-400 placeholder-stone-400 text-stone-900"
              />
            )}

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing repository...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Analyze Repository
                </>
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in">
              {error}
            </div>
          )}

          {/* Featured repos */}
          <div className="mt-8">
            <p className="text-sm text-stone-400 mb-3 font-medium">Try a popular repo:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {FEATURED.map(repo => (
                <button
                  key={repo}
                  onClick={() => useFeatured(repo)}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm bg-white border border-warm-300 rounded-full text-stone-600
                             hover:border-forest-400 hover:text-forest-700 hover:bg-forest-50 transition-all duration-150
                             disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Github size={12} />
                  {repo.replace('https://github.com/', '')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="w-full max-w-4xl mt-20 grid grid-cols-2 md:grid-cols-3 gap-4 px-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-5 hover:border-forest-200 transition-all duration-200 group">
              <div className="w-9 h-9 rounded-xl bg-forest-50 border border-forest-100 flex items-center justify-center mb-3
                              group-hover:bg-forest-100 transition-colors">
                <Icon className="text-forest-600" size={18} />
              </div>
              <p className="font-semibold text-stone-800 text-sm mb-1">{title}</p>
              <p className="text-stone-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-stone-400 border-t border-warm-200">
        Built with GitHub REST API · Data cached for 10 min · No data stored
      </footer>
    </div>
  )
}
