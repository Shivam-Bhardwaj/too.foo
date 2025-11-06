import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { ProjectScanner } from '../lib/project_scanner'
import path from 'path'
import { useState, useEffect } from 'react'

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
  thumbnail?: string
  created?: string
  updated?: string
}

type HomeProps = {
  projects: Project[]
  categories: string[]
  featured: Project[]
}

export default function Home({ projects, categories, featured }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = !selectedCategory || project.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      <Head>
        <title>Research Lab - Innovation Hub</title>
        <meta name="description" content="State-of-the-art research lab portfolio" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      {/* Advanced Navigation */}
      <nav className="border-b border-indigo-800/30 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 shadow-2xl shadow-indigo-900/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
              <span className="text-3xl">🔬</span>
              Research Lab
            </Link>
            <div className="hidden md:flex gap-6 items-center">
              <Link href="/" className="hover:text-indigo-400 transition-colors font-medium">Home</Link>
              <Link href="#projects" className="hover:text-indigo-400 transition-colors font-medium">Projects</Link>
              <Link href="#publications" className="hover:text-indigo-400 transition-colors font-medium">Publications</Link>
              <Link href="#team" className="hover:text-indigo-400 transition-colors font-medium">Team</Link>
              <Link href="/admin" className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        {/* Hero Section with Animation */}
        <section className="text-center mb-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-7xl md:text-8xl font-black mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
              Research Lab
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-4 max-w-4xl mx-auto font-light">
              State-of-the-Art Innovation Hub
            </p>
            <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
              Pioneering research in AI, Robotics, and cutting-edge technology. 
              Explore our latest breakthroughs, experiments, and discoveries.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a href="#projects" className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg shadow-indigo-900/50 font-semibold text-lg">
                Explore Projects
              </a>
              <a href="#about" className="px-8 py-4 bg-slate-800/50 border-2 border-indigo-800/50 rounded-xl hover:bg-slate-800 hover:border-indigo-600 transition-all font-semibold text-lg backdrop-blur-sm">
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Real-time Stats Dashboard */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
          <StatCard 
            value={projects.length} 
            label="Active Projects" 
            icon="🚀"
            gradient="from-indigo-500 to-purple-500"
          />
          <StatCard 
            value={categories.length} 
            label="Research Areas" 
            icon="🔬"
            gradient="from-purple-500 to-pink-500"
          />
          <StatCard 
            value={featured.length} 
            label="Featured Works" 
            icon="⭐"
            gradient="from-pink-500 to-cyan-500"
          />
          <StatCard 
            value="24/7" 
            label="Lab Status" 
            icon="💻"
            gradient="from-cyan-500 to-indigo-500"
          />
        </section>

        {/* Advanced Search and Filter */}
        <section id="projects" className="mb-12">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-indigo-800/30 rounded-2xl p-6 mb-8 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search projects, technologies, research areas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-800/50 border-2 border-indigo-800/30 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-white placeholder-gray-500 text-lg transition-all"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">🔍</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-4 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-slate-800/50 border border-indigo-800/30'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-4 rounded-xl transition-all ${viewMode === 'list' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-slate-800/50 border border-indigo-800/30'}`}
                >
                  List
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-5 py-2 rounded-lg transition-all font-medium ${
                  selectedCategory === null
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-900/50'
                    : 'bg-slate-800/50 border border-indigo-800/30 hover:bg-slate-800 hover:border-indigo-600'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2 rounded-lg transition-all font-medium capitalize ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-900/50'
                      : 'bg-slate-800/50 border border-indigo-800/30 hover:bg-slate-800 hover:border-indigo-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Projects - Showcase */}
        {featured.length > 0 && searchQuery === '' && selectedCategory === null && (
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-5xl font-bold flex items-center gap-4">
                <span className="text-5xl">⭐</span>
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Featured Research
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.map((project) => (
                <ProjectCard key={project.id} project={project} featured viewMode={viewMode} />
              ))}
            </div>
          </section>
        )}

        {/* All Projects */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-5xl font-bold">
              {selectedCategory ? (
                <span className="capitalize">{selectedCategory} Research</span>
              ) : (
                'All Projects'
              )}
              {searchQuery && (
                <span className="text-2xl text-gray-400 ml-4">for "{searchQuery}"</span>
              )}
              <span className="text-2xl text-indigo-400 ml-4">({filteredProjects.length})</span>
            </h2>
          </div>
          {filteredProjects.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
              : 'space-y-6'
            }>
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-indigo-800/30">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-2xl text-gray-400 mb-2">No projects found</p>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </section>

        {/* Lab Status Section */}
        <section id="about" className="mt-32 mb-20">
          <div className="bg-gradient-to-br from-slate-900/80 via-indigo-900/30 to-purple-900/30 backdrop-blur-xl border-2 border-indigo-800/30 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              About Our Lab
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed mb-6">
              We are a cutting-edge research laboratory dedicated to pushing the boundaries of technology. 
              Our work spans artificial intelligence, robotics, machine learning, and emerging technologies. 
              We collaborate with industry leaders and academic institutions worldwide to bring innovative 
              solutions to real-world challenges.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-slate-800/50 rounded-xl p-6 border border-indigo-800/30">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="text-xl font-bold mb-2">Mission</h3>
                <p className="text-gray-400">Advancing technology through innovative research</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-indigo-800/30">
                <div className="text-3xl mb-3">🌟</div>
                <h3 className="text-xl font-bold mb-2">Vision</h3>
                <p className="text-gray-400">Leading the future of intelligent systems</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-indigo-800/30">
                <div className="text-3xl mb-3">🤝</div>
                <h3 className="text-xl font-bold mb-2">Collaboration</h3>
                <p className="text-gray-400">Working with global partners</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Advanced Footer */}
      <footer className="border-t border-indigo-800/30 bg-slate-950/80 backdrop-blur-xl mt-32">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Research Lab
              </h3>
              <p className="text-gray-400">State-of-the-art innovation hub</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Research</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-indigo-400">AI & ML</Link></li>
                <li><Link href="#" className="hover:text-indigo-400">Robotics</Link></li>
                <li><Link href="#" className="hover:text-indigo-400">Publications</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-indigo-400">Open Source</Link></li>
                <li><Link href="#" className="hover:text-indigo-400">Datasets</Link></li>
                <li><Link href="#" className="hover:text-indigo-400">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-indigo-400">GitHub</Link></li>
                <li><Link href="#" className="hover:text-indigo-400">Twitter</Link></li>
                <li><Link href="#" className="hover:text-indigo-400">Email</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-indigo-800/30 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Research Lab. Built with Next.js & Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function StatCard({ value, label, icon, gradient }: { value: string | number; label: string; icon: string; gradient: string }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 transform hover:scale-105 transition-all shadow-xl`}>
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-4xl font-black mb-2">{value}</div>
      <div className="text-sm font-medium opacity-90">{label}</div>
    </div>
  )
}

function ProjectCard({ project, featured = false, viewMode = 'grid' }: { project: Project; featured?: boolean; viewMode?: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <Link href={`/project/${project.id}`}>
        <div className={`group bg-slate-900/50 backdrop-blur-xl border-2 border-indigo-800/30 rounded-xl p-6 hover:border-indigo-500 transition-all cursor-pointer transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-900/30 flex items-center gap-6 ${featured ? 'ring-2 ring-yellow-500/50' : ''}`}>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                {project.name}
              </h3>
              {featured && <span className="text-2xl">⭐</span>}
              <span className={`px-3 py-1 rounded-lg text-sm capitalize ${featured ? 'bg-gradient-to-r from-indigo-900 to-purple-900' : 'bg-slate-800'}`}>
                {project.category}
              </span>
            </div>
            <p className="text-gray-300 mb-3">{project.description}</p>
            <div className="flex flex-wrap gap-2">
              {project.tags.slice(0, 5).map((tag) => (
                <span key={tag} className="px-2 py-1 bg-slate-800/50 rounded text-xs text-gray-400">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-2">{project.language || 'N/A'}</div>
            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold"
                onClick={(e) => e.stopPropagation()}
              >
                Live →
              </a>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/project/${project.id}`}>
      <div className={`group relative bg-slate-900/50 backdrop-blur-xl border-2 border-indigo-800/30 rounded-2xl p-6 hover:border-indigo-500 transition-all cursor-pointer transform hover:scale-105 hover:shadow-2xl hover:shadow-indigo-900/30 ${featured ? 'ring-2 ring-yellow-500/50' : ''}`}>
        {featured && (
          <div className="absolute top-4 right-4 text-3xl animate-pulse">⭐</div>
        )}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-2xl font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors flex-1">
            {project.name}
          </h3>
          <span className={`px-3 py-1 rounded-lg text-sm capitalize ml-2 ${featured ? 'bg-gradient-to-r from-indigo-900 to-purple-900' : 'bg-slate-800'}`}>
            {project.category}
          </span>
        </div>
        <p className="text-gray-300 mb-6 line-clamp-3 min-h-[4.5rem]">{project.description}</p>
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 bg-slate-800 rounded-lg text-sm text-gray-300">
            {project.language || 'N/A'}
          </span>
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              Live Demo <span>→</span>
            </a>
          )}
        </div>
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {project.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-slate-800/50 rounded text-xs text-gray-400"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 4 && (
              <span className="px-2 py-1 bg-slate-800/50 rounded text-xs text-gray-500">
                +{project.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const projectsDir = path.join(process.cwd(), '..', '..', 'projects')
    const scanner = new ProjectScanner(projectsDir)
    const allProjects = scanner.scan()
    
    const publicProjects = scanner.getByVisibility(allProjects, 'public')
    const categories = [...new Set(allProjects.map(p => p.category))].sort()
    const featured = scanner.getFeatured(publicProjects)
    
    return {
      props: {
        projects: publicProjects,
        categories,
        featured
      }
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      props: {
        projects: [],
        categories: [],
        featured: []
      }
    }
  }
}
