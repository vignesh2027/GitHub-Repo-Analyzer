import { useState, useRef } from 'react'
import { ArrowLeft, Share2, Download, Github, Layers, Activity, Users, Package, BookOpen, Search, Twitter, Linkedin, Copy, Check } from 'lucide-react'
import { toPng } from 'html-to-image'
import clsx from 'clsx'
import Sidebar from './Sidebar'
import OverviewTab from './tabs/OverviewTab'
import CodeTab from './tabs/CodeTab'
import ActivityTab from './tabs/ActivityTab'
import ContributorsTab from './tabs/ContributorsTab'
import ReadmeTab from './tabs/ReadmeTab'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Layers },
  { id: 'code', label: 'Code', icon: Github },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'contributors', label: 'Contributors', icon: Users },
  { id: 'dependencies', label: 'Dependencies', icon: Package },
  { id: 'readme', label: 'README', icon: BookOpen },
]

function ShareCard({ data, cardRef }) {
  const { repo_data, health, languages } = data
  const topLang = Object.entries(languages || {})[0]

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-2xl p-6 border-2 border-warm-200 shadow-xl"
      style={{ width: 480, fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <img src={repo_data.owner_avatar} alt="owner" className="w-12 h-12 rounded-xl border border-warm-200" />
        <div>
          <h2 className="text-lg font-bold text-stone-900">{repo_data.full_name}</h2>
          {repo_data.description && (
            <p className="text-sm text-stone-500 mt-0.5 line-clamp-2">{repo_data.description}</p>
          )}
        </div>
        <div className="ml-auto flex flex-col items-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: '#16A34A' }}
          >
            {health.total}
          </div>
          <span className="text-xs text-stone-500 mt-1">Health</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: '⭐ Stars', value: repo_data.stars?.toLocaleString() },
          { label: '🍴 Forks', value: repo_data.forks?.toLocaleString() },
          { label: '🔍 Issues', value: repo_data.open_issues?.toLocaleString() },
          { label: '📝 Lang', value: repo_data.language || '—' },
        ].map(s => (
          <div key={s.label} className="bg-warm-50 rounded-lg p-2.5 text-center border border-warm-200">
            <p className="text-xs text-stone-500">{s.label}</p>
            <p className="text-sm font-bold text-stone-800 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Health breakdown */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {Object.entries(health.details).slice(0, 6).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 bg-warm-50 rounded-lg px-2.5 py-1.5">
            <div className={`w-2 h-2 rounded-full ${health.breakdown[k] > 0 ? 'bg-forest-500' : 'bg-red-400'}`} />
            <span className="text-xs text-stone-600 capitalize">{k}</span>
            <span className="ml-auto text-xs font-semibold text-stone-700">{v}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-warm-100 pt-3 flex items-center justify-between">
        <span className="text-xs text-stone-400">Analyzed by RepoLens</span>
        <span className="text-xs font-semibold text-forest-600">vignesh2027.github.io/GitHub-Repo-Analyzer</span>
      </div>
    </div>
  )
}

export default function Dashboard({ data, onBack, repoUrl }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showShare, setShowShare] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareCardRef = useRef(null)

  const shareText = `Just analyzed ${data.repo_data.full_name} with RepoLens 🔍\n\n⭐ ${data.repo_data.stars?.toLocaleString()} stars | 🏥 Health Score: ${data.health.total}/100 (Grade ${data.health.grade}) | 💻 ${data.repo_data.language}\n\nCheck out any GitHub repo instantly 👇`
  const shareUrl = 'https://vignesh2027.github.io/GitHub-Repo-Analyzer'

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
  }
  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')
  }
  const copyLink = async () => {
    await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = async () => {
    if (!shareCardRef.current) return
    setExporting(true)
    try {
      const png = await toPng(shareCardRef.current, { pixelRatio: 2 })
      const a = document.createElement('a')
      a.download = `${data.repo_data.name}-analysis.png`
      a.href = png
      a.click()
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      setExporting(false)
    }
  }

  const { repo_data } = data

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-warm-50/80 backdrop-blur-sm border-b border-warm-200 sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-warm-200 transition-colors text-stone-600 flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <img src={repo_data.owner_avatar} className="w-7 h-7 rounded-lg flex-shrink-0" alt="" />
            <span className="font-semibold text-stone-800 truncate text-sm">{repo_data.full_name}</span>
            {repo_data.archived && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full flex-shrink-0">Archived</span>
            )}
          </div>

          {/* Stats pills */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            <span className="stat-pill">⭐ {repo_data.stars?.toLocaleString()}</span>
            <span className="stat-pill">🍴 {repo_data.forks?.toLocaleString()}</span>
            {repo_data.language && <span className="stat-pill">💻 {repo_data.language}</span>}
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowShare(!showShare)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-forest-700 border border-forest-300
                         rounded-xl hover:bg-forest-50 transition-colors"
            >
              <Share2 size={14} />
              Share
            </button>
            <button
              onClick={onBack}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 border border-warm-300
                         rounded-xl hover:bg-warm-200 transition-colors"
            >
              <Search size={14} />
              New Analysis
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 pb-0">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={clsx(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all flex-shrink-0 border-b-2',
                  activeTab === id
                    ? 'text-forest-700 border-forest-600 bg-white'
                    : 'text-stone-500 border-transparent hover:text-stone-700 hover:bg-warm-100'
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Share modal */}
      {showShare && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShare(false)}>
          <div className="bg-warm-50 rounded-2xl p-6 shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-stone-800 mb-4">Share This Analysis</h3>
            <ShareCard data={data} cardRef={shareCardRef} />

            {/* Social share buttons */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <button onClick={shareToTwitter}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1DA1F2] text-white text-sm font-semibold hover:bg-[#1a8cd8] transition-colors">
                <Twitter size={15} /> Twitter
              </button>
              <button onClick={shareToLinkedIn}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0A66C2] text-white text-sm font-semibold hover:bg-[#0958a8] transition-colors">
                <Linkedin size={15} /> LinkedIn
              </button>
              <button onClick={copyLink}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-semibold hover:bg-stone-700 transition-colors">
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="mt-3 w-full btn-primary flex items-center justify-center gap-2"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {exporting ? 'Exporting...' : 'Download PNG Card'}
            </button>

            {/* Badge code */}
            <div className="mt-3 p-3 bg-stone-900 rounded-xl">
              <p className="text-xs text-stone-400 mb-1.5 font-medium">Add RepoLens badge to your README:</p>
              <code className="text-xs text-forest-400 break-all">
                {`[![Analyzed by RepoLens](https://img.shields.io/badge/RepoLens-Analyzed-16A34A?style=flat&logo=github)](${shareUrl})`}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 md:px-6 py-6">
        <div className="flex gap-5 items-start">
          {/* Sidebar */}
          <div className="hidden lg:block">
            <Sidebar data={data} />
          </div>

          {/* Tab content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'overview' && <OverviewTab data={data} />}
            {activeTab === 'code' && <CodeTab data={data} />}
            {activeTab === 'activity' && <ActivityTab data={data} />}
            {activeTab === 'contributors' && <ContributorsTab data={data} />}
            {activeTab === 'dependencies' && <CodeTab data={data} />}
            {activeTab === 'readme' && <ReadmeTab data={data} />}
          </div>
        </div>
      </div>
    </div>
  )
}
