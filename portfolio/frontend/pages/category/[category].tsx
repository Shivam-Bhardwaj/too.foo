import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { ProjectScanner } from '../../lib/project_scanner'
import path from 'path'

type Project = {
  id: string
  name: string
  description: string
  category: string
  language: string
  visibility: string
  featured: boolean
  tags: string[]
}

type CategoryPageProps = {
  projects: Project[]
  category: string
}

export default function CategoryPage({ projects, category }: CategoryPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Head>
        <title>{category} - GitHub Portfolio</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Portfolio
        </Link>

        <h1 className="text-4xl font-bold mb-2 capitalize">{category} Projects</h1>
        <p className="text-gray-400 mb-8">{projects.length} projects</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/project/${project.id}`}>
              <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-blue-400">{project.name}</h3>
                  <span className="px-2 py-1 bg-gray-700 rounded text-sm text-gray-300">
                    {project.language}
                  </span>
                </div>
                <p className="text-gray-400 mb-4 line-clamp-2">{project.description}</p>
                {project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-xl">No projects found in this category.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const category = params?.category as string
    
    if (!category) {
      return { notFound: true }
    }
    
    const projectsDir = path.join(process.cwd(), '..', '..', 'projects')
    const scanner = new ProjectScanner(projectsDir)
    const allProjects = scanner.scan()
    
    const categoryProjects = scanner.getByCategory(allProjects, category)
    const publicProjects = scanner.getByVisibility(categoryProjects, 'public')
    
    return {
      props: {
        projects: publicProjects,
        category
      }
    }
  } catch (error) {
    console.error('Error:', error)
    return { notFound: true }
  }
}

