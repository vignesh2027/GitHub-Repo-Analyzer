import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

export async function analyzeRepo(url, token = '') {
  const response = await axios.post(`${API_BASE}/api/analyze`, { url, token }, {
    timeout: 60000,
  })
  return response.data
}
