import type { Metadata } from 'next';
import ResearchGradeClientWrapper from '../components/ResearchGradeClientWrapper';
import ResearchDateDisplay from '../components/ResearchDateDisplay';

export const metadata: Metadata = {
  title: 'Heliosphere Research Visualization — Scientific Accuracy',
  description: 'Research-grade visualization of the heliosphere with real Voyager trajectories, MHD physics, and accurate astronomical data.',
  openGraph: {
    title: 'Heliosphere Research Visualization',
    description: 'Scientifically accurate heliosphere simulation with NASA data',
    images: ['/img/heliosphere-research.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Heliosphere Research Visualization',
    description: 'Scientifically accurate heliosphere simulation with NASA data',
    images: ['/img/heliosphere-research.png'],
  },
};

export default function ResearchPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* 1. Header */}
      <header className="flex-shrink-0 py-4 px-4 text-center border-b border-white/10">
        <h1 className="text-2xl font-bold text-white/90">
          Research-Grade Heliosphere
        </h1>
        <p className="text-sm text-white/70 mt-1">
          NASA JPL Ephemerides • Voyager Mission Data • MHD Physics
        </p>
      </header>

      {/* 2. Text Section (Date) */}
      <div className="flex-shrink-0 py-3 px-4 text-center border-b border-white/10 bg-black" data-section="text">
        <ResearchDateDisplay />
      </div>

      {/* 3. Simulation Section */}
      <section className="flex-1 relative min-h-0">
        <div className="absolute inset-0">
          <ResearchGradeClientWrapper />
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="flex-shrink-0 py-4 px-4 border-t border-white/10 flex justify-between items-center text-xs text-white/40">
        <div>
          <p>Data: NASA/JPL, Voyager, IBEX</p>
          <p>Model: Opher et al. 2020</p>
        </div>
        <div className="text-right">
          <p>Mouse: Rotate • Scroll: Zoom • Drag: Pan</p>
          <p>Space: Play/Pause • ←→: Skip</p>
        </div>
      </footer>

      {/* Scientific disclaimer */}
      <div className="sr-only">
        This visualization represents the current scientific understanding of the heliosphere
        based on data from NASA's Voyager missions, IBEX, and magnetohydrodynamic modeling.
        Some features like the bow shock remain theoretical. Distances are compressed for visibility.
      </div>
    </main>
  );
}
