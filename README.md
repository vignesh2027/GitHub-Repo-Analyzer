<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Inter&weight=800&size=40&duration=3000&pause=1000&color=16A34A&center=true&vCenter=true&width=600&lines=RepoLens;GitHub+Repo+Analyzer;Repository+Intelligence" alt="RepoLens" />

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-GitHub_Pages-16A34A?style=for-the-badge&logoColor=white)](https://vignesh2027.github.io/GitHub-Repo-Analyzer/)
[![Backend API](https://img.shields.io/badge/⚡_Backend-FastAPI-009688?style=for-the-badge)](https://github.com/vignesh2027/GitHub-Repo-Analyzer)
[![Stars](https://img.shields.io/github/stars/vignesh2027/GitHub-Repo-Analyzer?style=for-the-badge&color=16A34A)](https://github.com/vignesh2027/GitHub-Repo-Analyzer/stargazers)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br/>

> **Paste any GitHub URL. Get deep intelligence in seconds.**

<img src="https://raw.githubusercontent.com/vignesh2027/GitHub-Repo-Analyzer/main/docs/demo.gif" alt="RepoLens Demo" width="800" style="border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);" />

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏥 **Health Score** | 0–100 score across 7 quality dimensions with grade (A/B/C/D) |
| 🥧 **Language Breakdown** | Interactive pie chart with % breakdown of every language |
| 🗂️ **File Tree Viewer** | Collapsible tree with file-type icons (top 2 levels) |
| 📦 **Dependency Detection** | Auto-parse `package.json`, `requirements.txt`, `Cargo.toml`, `go.mod` |
| 👥 **Contributor Graph** | Top 10 devs with bar chart, avatar grid, contribution share |
| 🔥 **Commit Heatmap** | GitHub-style 52-week grid + area chart + monthly bar chart |
| 🐛 **Issues & PRs** | Open/closed ratio, avg close time, label cloud |
| 📖 **README Renderer** | Full GitHub-flavored markdown with image proxying |
| 📤 **Share Card** | Export a beautiful PNG summary card |
| ⚡ **Smart Caching** | File-based response cache — no redundant API calls |

---

## 🖥️ Screenshots

<div align="center">
<table>
<tr>
<td><img src="docs/screenshot-search.png" width="380" alt="Search Page" /><br/><sub><b>Search Page</b></sub></td>
<td><img src="docs/screenshot-overview.png" width="380" alt="Overview Tab" /><br/><sub><b>Overview Tab</b></sub></td>
</tr>
<tr>
<td><img src="docs/screenshot-activity.png" width="380" alt="Activity Heatmap" /><br/><sub><b>Activity Heatmap</b></sub></td>
<td><img src="docs/screenshot-contributors.png" width="380" alt="Contributors" /><br/><sub><b>Contributors</b></sub></td>
</tr>
</table>
</div>

---

## 🚀 Quick Start

### 1. Clone & Set Up Backend

```bash
git clone https://github.com/vignesh2027/GitHub-Repo-Analyzer.git
cd GitHub-Repo-Analyzer

# Backend
cd backend
cp .env.example .env
# Edit .env → add your GITHUB_TOKEN
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### 3. With Docker Compose

```bash
cp .env.example .env
# Edit .env → add GITHUB_TOKEN
docker compose up --build
```

---

## 🏗️ Architecture

```
GitHub-Repo-Analyzer/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── github_client.py     # GitHub REST API + caching
│   ├── analyzer.py          # Health score, dependency detection
│   └── api/routes.py        # All API endpoints
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── SearchPage.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── HealthGauge.jsx
    │   │   └── tabs/        # 5 tab views
    │   └── api/github.js
    └── vite.config.js
```

**Stack:**
- **Backend:** Python 3.12 · FastAPI · httpx (async) · file cache
- **Frontend:** React 18 · Vite · Tailwind CSS · Recharts · react-markdown
- **API:** GitHub REST API v3 (single source of truth)

---

## ⚙️ Configuration

### Backend `.env`

```env
GITHUB_TOKEN=ghp_yourTokenHere
```

### Frontend `VITE_API_URL`

Set this in your GitHub Actions secret or `.env.local`:

```env
VITE_API_URL=https://your-backend.railway.app
```

---

## 📊 Health Score Breakdown

| Dimension | Max | How it's calculated |
|---|---|---|
| README | 20 | Presence + length |
| Activity | 20 | Active weeks in last 12 |
| Tests | 15 | Test files/dirs present |
| CI/CD | 15 | `.github/workflows` etc. |
| License | 10 | License file present |
| Community | 10 | Star count tiers |
| Issues | 10 | Closed/total ratio |

---

## 🌐 Deploy

### Backend → Railway

1. Connect repo to [Railway](https://railway.app)
2. Point to `/backend` directory
3. Set `GITHUB_TOKEN` env var

### Frontend → GitHub Pages

Auto-deployed on push to `main` via `.github/workflows/deploy.yml`.

Set `VITE_API_URL` secret in repo settings → the frontend will call your deployed backend.

---

## 📜 License

MIT © [Vignesh](https://github.com/vignesh2027)

---

<div align="center">

Made with ❤️ and the GitHub REST API

**[⭐ Star this repo](https://github.com/vignesh2027/GitHub-Repo-Analyzer) · [🐛 Report Bug](https://github.com/vignesh2027/GitHub-Repo-Analyzer/issues) · [🌐 Live Demo](https://vignesh2027.github.io/GitHub-Repo-Analyzer/)**

</div>
