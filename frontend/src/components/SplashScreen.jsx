import { useEffect, useState } from 'react'

const FEATURES = [
  '🏥 Health Score — 7-dimension quality analysis',
  '🥧 Language Breakdown — visual pie chart',
  '🔥 Commit Heatmap — 52-week activity grid',
  '👥 Contributor Graph — top developers',
  '📦 Dependency Detection — all ecosystems',
  '📖 README Renderer — beautiful docs',
]

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0)
  // phase 0: logo in (0-2s)
  // phase 1: tagline (2-4s)
  // phase 2: features cycle (4-10s)
  // phase 3: fade out (10-12s)
  // phase 4: done

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 2000),
      setTimeout(() => setPhase(2), 4000),
      setTimeout(() => setPhase(3), 10000),
      setTimeout(() => { setPhase(4); onDone() }, 12000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  const [featureIdx, setFeatureIdx] = useState(0)
  useEffect(() => {
    if (phase !== 2) return
    const iv = setInterval(() => setFeatureIdx(i => (i + 1) % FEATURES.length), 1000)
    return () => clearInterval(iv)
  }, [phase])

  if (phase === 4) return null

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #F5F0E8 0%, #FAFAF5 50%, #F0FDF4 100%)',
        opacity: phase === 3 ? 0 : 1,
        transition: phase === 3 ? 'opacity 2s ease-out' : 'none',
        pointerEvents: phase === 3 ? 'none' : 'auto',
      }}
    >
      {/* Animated background rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] rounded-full border border-forest-100 animate-ping"
             style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[400px] h-[400px] rounded-full border border-forest-200 animate-ping"
             style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[800px] h-[800px] rounded-full border border-forest-50 animate-ping"
             style={{ animationDuration: '4s', animationDelay: '1s' }} />
      </div>

      {/* Logo */}
      <div
        className="relative flex flex-col items-center"
        style={{
          opacity: phase >= 0 ? 1 : 0,
          transform: phase >= 0 ? 'scale(1)' : 'scale(0.5)',
          transition: 'opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        {/* Logo mark */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-forest-600 flex items-center justify-center shadow-2xl"
               style={{ boxShadow: '0 20px 60px rgba(22,163,74,0.4)' }}>
            {/* GitHub-style octocat silhouette as SVG */}
            <svg width="52" height="52" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
          {/* Search indicator dot */}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full border-2 border-forest-600
                          flex items-center justify-center shadow-lg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
        </div>

        {/* App name */}
        <h1 className="text-5xl font-extrabold text-stone-900 tracking-tight mb-2">
          Repo<span className="text-forest-600">Lens</span>
        </h1>

        {/* Tagline */}
        <div style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.6s ease-out 0.1s, transform 0.6s ease-out 0.1s',
        }}>
          <p className="text-lg text-stone-500 font-medium text-center">
            GitHub Repository Intelligence Dashboard
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-forest-500 animate-pulse" />
            <span className="text-sm text-forest-600 font-semibold">Powered by GitHub API</span>
          </div>
        </div>

        {/* Features cycling */}
        <div
          className="mt-8 h-10 flex items-center justify-center"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transition: 'opacity 0.5s ease-out',
          }}
        >
          <div key={featureIdx}
               className="px-5 py-2 bg-white border border-forest-200 rounded-full text-sm font-medium text-stone-700 shadow-sm"
               style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {FEATURES[featureIdx]}
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="mt-8 w-48 h-1 bg-warm-200 rounded-full overflow-hidden"
          style={{ opacity: phase >= 1 ? 1 : 0 }}
        >
          <div
            className="h-full bg-forest-500 rounded-full"
            style={{
              width: phase === 3 ? '100%' : phase === 2 ? '80%' : phase === 1 ? '30%' : '0%',
              transition: 'width 2s ease-out',
            }}
          />
        </div>
        <p className="mt-2 text-xs text-stone-400">Loading intelligence engine...</p>
      </div>
    </div>
  )
}
