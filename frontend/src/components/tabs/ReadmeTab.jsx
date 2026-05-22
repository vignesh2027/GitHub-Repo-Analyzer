import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { BookOpen, ExternalLink } from 'lucide-react'

export default function ReadmeTab({ data }) {
  const { readme, repo_data } = data

  if (!readme) {
    return (
      <div className="card p-16 text-center animate-fade-in">
        <BookOpen size={48} className="mx-auto mb-4 text-stone-200" />
        <h3 className="text-lg font-semibold text-stone-500 mb-2">No README found</h3>
        <p className="text-sm text-stone-400">This repository doesn't have a README.md file.</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="card overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-warm-200 bg-warm-50">
          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-forest-600" />
            <span className="text-sm font-semibold text-stone-700">README.md</span>
            <span className="text-xs text-stone-400">{(readme.length / 1000).toFixed(1)}k chars</span>
          </div>
          <a
            href={`${repo_data.html_url}/blob/${repo_data.default_branch}/README.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-forest-600 hover:text-forest-800 flex items-center gap-1 transition-colors"
          >
            View on GitHub <ExternalLink size={11} />
          </a>
        </div>

        {/* README content */}
        <div className="px-8 py-8 max-w-none overflow-x-auto">
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                img({ src, alt, ...props }) {
                  // Fix relative image URLs
                  let imgSrc = src || ''
                  if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:')) {
                    imgSrc = `https://raw.githubusercontent.com/${repo_data.full_name}/${repo_data.default_branch}/${imgSrc}`
                  }
                  return <img src={imgSrc} alt={alt} className="max-w-full rounded-lg my-3" loading="lazy" />
                },
                a({ href, children, ...props }) {
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                      {children}
                    </a>
                  )
                },
              }}
            >
              {readme}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
