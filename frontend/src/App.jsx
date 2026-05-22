import { useState } from 'react'
import SearchPage from './components/SearchPage'
import Dashboard from './components/Dashboard'
import { analyzeRepo } from './api/github'

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [repoUrl, setRepoUrl] = useState('')

  const handleAnalyze = async (url, token) => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await analyzeRepo(url, token)
      setData(result)
      setRepoUrl(url)
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || 'Analysis failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setData(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-warm-100">
      {!data ? (
        <SearchPage onAnalyze={handleAnalyze} loading={loading} error={error} />
      ) : (
        <Dashboard data={data} onBack={handleReset} repoUrl={repoUrl} />
      )}
    </div>
  )
}
