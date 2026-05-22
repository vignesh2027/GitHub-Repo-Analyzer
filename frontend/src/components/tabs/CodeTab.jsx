import { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Search } from 'lucide-react'
import clsx from 'clsx'

const FILE_ICONS = {
  js: '🟨', jsx: '⚛️', ts: '🔷', tsx: '⚛️',
  py: '🐍', rs: '🦀', go: '🐹', java: '☕', rb: '💎',
  md: '📝', json: '📋', toml: '⚙️', yaml: '⚙️', yml: '⚙️',
  html: '🌐', css: '🎨', scss: '🎨', svg: '🖼️', png: '🖼️', jpg: '🖼️',
  sh: '⚡', dockerfile: '🐳', lock: '🔒', env: '🔑',
  default: '📄',
}

function getIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return FILE_ICONS[ext] || FILE_ICONS.default
}

function TreeNode({ node, depth = 0 }) {
  const [open, setOpen] = useState(depth < 1)
  const isDir = node.type === 'tree'

  return (
    <div>
      <div
        className={clsx(
          'flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer group text-sm',
          'hover:bg-warm-100 transition-colors',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => isDir && setOpen(!open)}
      >
        {isDir ? (
          <>
            <span className="text-stone-400 flex-shrink-0">
              {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
            <span className="flex-shrink-0">
              {open ? <FolderOpen size={14} className="text-amber-500" /> : <Folder size={14} className="text-amber-400" />}
            </span>
          </>
        ) : (
          <>
            <span className="w-3.5 flex-shrink-0" />
            <span className="text-base leading-none flex-shrink-0">{getIcon(node.name)}</span>
          </>
        )}
        <span className={clsx('truncate', isDir ? 'text-stone-800 font-medium' : 'text-stone-600')}>
          {node.name}
        </span>
      </div>

      {isDir && open && node.children?.length > 0 && (
        <div>
          {node.children.map((child, i) => (
            <TreeNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

const LANG_COLOR = {
  nodejs: '#F59E0B',
  python: '#3B82F6',
  rust: '#EA580C',
  go: '#06B6D4',
  java: '#EF4444',
  php: '#7C3AED',
  ruby: '#DC2626',
  dart: '#06B6D4',
  elixir: '#7C3AED',
  dotnet: '#6366F1',
}

export default function CodeTab({ data }) {
  const { file_tree, dependencies } = data
  const [search, setSearch] = useState('')
  const [activeDepFile, setActiveDepFile] = useState(0)

  const filteredTree = search
    ? filterTree(file_tree || [], search.toLowerCase())
    : file_tree || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* File Tree */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-stone-700">File Structure</h3>
            <span className="text-xs text-stone-400">(top 2 levels)</span>
          </div>
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter files..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-warm-50 border border-warm-200 rounded-lg
                         focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-100"
            />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {filteredTree.length > 0 ? (
              filteredTree.map((node, i) => <TreeNode key={i} node={node} />)
            ) : (
              <p className="text-xs text-stone-400 text-center py-8">No files found</p>
            )}
          </div>
        </div>

        {/* Dependencies */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-3">Detected Dependencies</h3>
          {dependencies?.length > 0 ? (
            <>
              {/* Tab selector */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {dependencies.map((dep, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveDepFile(i)}
                    className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium transition-all',
                      activeDepFile === i
                        ? 'bg-forest-600 text-white'
                        : 'bg-warm-100 text-stone-600 hover:bg-warm-200'
                    )}
                  >
                    <span className="mr-1">{langEmoji(dep.language)}</span>
                    {dep.file}
                    <span className="ml-1 opacity-60">({dep.packages?.length || 0})</span>
                  </button>
                ))}
              </div>

              {/* Package list */}
              {dependencies[activeDepFile] && (
                <div className="max-h-72 overflow-y-auto space-y-1.5">
                  {dependencies[activeDepFile].packages?.length > 0 ? (
                    dependencies[activeDepFile].packages.map((pkg, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warm-50 border border-warm-200 group hover:border-forest-200 transition-colors">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: LANG_COLOR[dependencies[activeDepFile].language] || '#16A34A' }}
                        />
                        <span className="text-xs font-mono text-stone-800 flex-1 truncate">{pkg.name}</span>
                        <span className="text-xs text-stone-400 font-mono truncate max-w-28">{pkg.version}</span>
                        {pkg.type === 'devDependencies' && (
                          <span className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded flex-shrink-0">dev</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-stone-400 text-center py-6">No packages parsed</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-stone-400">
              <File size={32} className="opacity-20 mb-2" />
              <p className="text-sm">No dependency files detected</p>
              <p className="text-xs mt-1">Supports package.json, requirements.txt, Cargo.toml, go.mod</p>
            </div>
          )}
        </div>
      </div>

      {/* Dependency summary */}
      {dependencies?.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">Dependency Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {dependencies.map((dep, i) => (
              <div key={i} className="bg-warm-50 rounded-xl p-4 border border-warm-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{langEmoji(dep.language)}</span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ background: LANG_COLOR[dep.language] || '#16A34A' }}
                  >
                    {dep.language}
                  </span>
                </div>
                <p className="text-2xl font-bold text-stone-900">{dep.packages?.length || 0}</p>
                <p className="text-xs text-stone-500 mt-0.5">packages in {dep.file}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function langEmoji(lang) {
  const map = { nodejs: '📦', python: '🐍', rust: '🦀', go: '🐹', java: '☕', php: '🐘', ruby: '💎', dart: '🎯' }
  return map[lang] || '📦'
}

function filterTree(nodes, q) {
  return nodes.reduce((acc, node) => {
    if (node.name.toLowerCase().includes(q)) {
      acc.push(node)
    } else if (node.children) {
      const filtered = filterTree(node.children, q)
      if (filtered.length) acc.push({ ...node, children: filtered })
    }
    return acc
  }, [])
}
