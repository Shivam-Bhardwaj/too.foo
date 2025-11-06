import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { ProjectScanner } from '../../lib/project_scanner'
import path from 'path'
import ReactMarkdown from 'react-markdown'

type Project = {
  id: string
  name: string
  description: string
  category: string
  language: string
  visibility: string
  featured: boolean
  tags: string[]
  live_url?: string
  github_url?: string
  readme?: string
  structure?: string[]
}

type ProjectPageProps = {
  project: Project
}

export default function ProjectPage({ project }: ProjectPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <Head>
        <title>{project.name} - Portfolio</title>
        <meta name="description" content={project.description} />
      </Head>

      {/* Navigation */}
      <nav className="border-b border-purple-800/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Portfolio
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <Link href="/" className="text-purple-400 hover:text-purple-300 mb-8 inline-block flex items-center gap-2">
          <span>←</span> Back to Portfolio
        </Link>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-800/50 rounded-xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 pb-8 border-b border-purple-800/50">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {project.name}
                </h1>
                {project.featured && <span className="text-2xl">⭐</span>}
              </div>
              <p className="text-xl md:text-2xl text-gray-300 mb-6">{project.description}</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg text-sm text-purple-200 capitalize">
                  {project.category}
                </span>
                <span className="px-4 py-2 bg-slate-700 rounded-lg text-sm text-gray-300">
                  {project.language || 'N/A'}
                </span>
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-700/50 rounded text-sm text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 font-semibold"
              >
                🌐 Live Demo
              </a>
            )}
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-slate-700 border border-purple-800 rounded-lg hover:bg-slate-600 transition-all font-semibold"
              >
                📦 GitHub
              </a>
            )}
          </div>

          {project.structure && project.structure.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>📁</span> Project Structure
              </h2>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm border border-purple-800/50">
                {project.structure.map((item, i) => (
                  <div key={i} className="text-gray-400 py-1">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.readme && (
            <div className="markdown-content">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>📄</span> Documentation
              </h2>
              <div className="prose prose-invert max-w-none bg-slate-900 rounded-lg p-6 md:p-8 border border-purple-800/50">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-4 mt-6 text-purple-400" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold mb-3 mt-6 text-purple-400" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-bold mb-2 mt-4 text-purple-300" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-gray-300 leading-relaxed" {...props} />,
                    code: ({node, ...props}) => <code className="bg-slate-800 px-2 py-1 rounded text-purple-300" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto my-4" {...props} />,
                    a: ({node, ...props}) => <a className="text-purple-400 hover:text-purple-300 underline" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 text-gray-300" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 text-gray-300" {...props} />,
                    li: ({node, ...props}) => <li className="mb-2" {...props} />,
                  }}
                >
                  {project.readme}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const id = params?.id as string
    
    if (!id) {
      return { notFound: true }
    }
    
    const projectsDir = path.join(process.cwd(), '..', '..', 'projects')
    const scanner = new ProjectScanner(projectsDir)
    const allProjects = scanner.scan()
    
    const project = allProjects.find(p => p.id === id)
    
    if (!project) {
      return { notFound: true }
    }
    
    return {
      props: {
        project
      }
    }
  } catch (error) {
    console.error('Error:', error)
    return { notFound: true }
  }
}
